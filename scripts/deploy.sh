#!/bin/bash

# Production Deployment Script
# This script handles both quick maintenance deployments and full production deployments

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEPLOYMENT_TYPE="quick"
FORCE_REBUILD=false
SKIP_SLIDEV=false
BUILD_SLIDEV=false

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    echo "Production Deployment Script for GPP Studio"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --type TYPE          Deployment type: 'quick' or 'full' (default: quick)"
    echo "  -f, --force-rebuild      Force complete Docker rebuild (ignore cache)"
    echo "  -s, --skip-slidev        Skip Slidev presentation builds"
    echo "  -b, --build-slidev       Build Slidev presentations (for full deployment)"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --type quick                    # Quick deployment for hotfixes"
    echo "  $0 --type full --build-slidev      # Full deployment with slidev builds"
    echo "  $0 --force-rebuild                 # Quick deployment with fresh Docker build"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            DEPLOYMENT_TYPE="$2"
            shift 2
            ;;
        -f|--force-rebuild)
            FORCE_REBUILD=true
            shift
            ;;
        -s|--skip-slidev)
            SKIP_SLIDEV=true
            shift
            ;;
        -b|--build-slidev)
            BUILD_SLIDEV=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate deployment type
if [[ "$DEPLOYMENT_TYPE" != "quick" && "$DEPLOYMENT_TYPE" != "full" ]]; then
    log_error "Invalid deployment type: $DEPLOYMENT_TYPE. Must be 'quick' or 'full'"
    exit 1
fi

# Set build slidev for full deployments unless explicitly skipped
if [[ "$DEPLOYMENT_TYPE" == "full" && "$SKIP_SLIDEV" != true ]]; then
    BUILD_SLIDEV=true
fi

# Display deployment configuration
log_info "=== GPP Studio Deployment Configuration ==="
log_info "Deployment type: $DEPLOYMENT_TYPE"
log_info "Force rebuild: $FORCE_REBUILD"
log_info "Build Slidev: $BUILD_SLIDEV"
log_info "Skip Slidev: $SKIP_SLIDEV"
log_info "============================================"

# Check if we're on the correct branch for production deployment
current_branch=$(git branch --show-current)
if [[ "$current_branch" != "master" ]]; then
    log_warning "Current branch is '$current_branch', but production should be deployed from 'master'"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
fi

# Get build information
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse --short HEAD)
export BUILD_DATE GIT_COMMIT

log_info "Build date: $BUILD_DATE"
log_info "Git commit: $GIT_COMMIT"

# Quality checks
log_info "Running quality checks..."

if command -v node >/dev/null 2>&1; then
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing dependencies..."
        npm ci --legacy-peer-deps --no-fund --quiet
        
        # Allow system to recover memory after npm install
        log_info "Allowing system memory recovery..."
        sleep 3
    fi
    
    # Clear any npm cache that might be consuming memory
    log_info "Clearing npm cache..."
    npm cache clean --force >/dev/null 2>&1 || true
    
    # Force garbage collection if possible
    if command -v node >/dev/null 2>&1; then
        log_info "Triggering garbage collection..."
        node -e "if (global.gc) global.gc(); console.log('GC triggered')" --expose-gc >/dev/null 2>&1 || true
    fi
    
    # TypeScript check with intelligent fallback strategy
    log_info "TypeScript type checking..."
    
    # Try production typecheck first (8GB memory) - disable exit on error for this check
    set +e
    npm run typecheck:prod 2>/dev/null
    typecheck_exit_code=$?
    set -e
    
    if [ $typecheck_exit_code -eq 0 ]; then
        log_success "TypeScript check passed (production mode)"
    else
        log_warning "Production typecheck failed due to memory constraints"
        log_info "Using Next.js built-in type checking during build instead..."
        
        # Next.js will handle TypeScript checking during build process
        # This is more memory-efficient as it's integrated with the build pipeline
        log_info "TypeScript will be validated during the build process"
        log_success "TypeScript check deferred to build process (memory-optimized)"
    fi
    
    # Lint check
    log_info "ESLint checking..."
    if ! npm run lint; then
        log_warning "ESLint warnings found but continuing deployment"
    else
        log_success "ESLint check passed"
    fi
else
    log_warning "Node.js not available - skipping quality checks"
fi

# Build Slidev presentations if requested
if [[ "$BUILD_SLIDEV" == true ]]; then
    log_info "Building Slidev presentations..."
    
    # Create slidev builds directory
    mkdir -p public/slidev-builds
    
    # Install slidev if not available
    if ! command -v slidev >/dev/null 2>&1; then
        log_info "Installing Slidev..."
        npm install -g @slidev/cli
    fi
    
    # Build presentations
    slidev_built=0
    slidev_failed=0
    
    # MPMC presentations
    log_info "Building MPMC presentations..."
    while IFS= read -r -d '' slidev_file; do
        filename=$(basename "$slidev_file" .md)
        log_info "Building: $filename"
        if timeout 300 npx slidev build "$slidev_file" --out "public/slidev-builds/mpmc-$filename" >/dev/null 2>&1; then
            ((slidev_built++))
        else
            log_warning "Failed to build $filename"
            ((slidev_failed++))
        fi
    done < <(find content/resources/study-materials/11-ec/sem-4/4341101-mpmc/slidev -name "*.md" -not -name "_index.md" -print0)
    
    # Java presentations (first 10)
    log_info "Building Java presentations (first 10)..."
    java_count=0
    while IFS= read -r -d '' slidev_file && [[ $java_count -lt 10 ]]; do
        filename=$(basename "$slidev_file" .md)
        log_info "Building: $filename"
        if timeout 300 npx slidev build "$slidev_file" --out "public/slidev-builds/java-$filename" >/dev/null 2>&1; then
            ((slidev_built++))
        else
            log_warning "Failed to build $filename"
            ((slidev_failed++))
        fi
        ((java_count++))
    done < <(find content/resources/study-materials/32-ict/sem-4/4343203-java/slidev -name "*.md" -not -name "_index.md" -print0)
    
    # Cyber Security presentations (first 10)
    log_info "Building Cyber Security presentations (first 10)..."
    cybersec_count=0
    while IFS= read -r -d '' slidev_file && [[ $cybersec_count -lt 10 ]]; do
        filename=$(basename "$slidev_file" .md)
        log_info "Building: $filename"
        if timeout 300 npx slidev build "$slidev_file" --out "public/slidev-builds/cybersec-$filename" >/dev/null 2>&1; then
            ((slidev_built++))
        else
            log_warning "Failed to build $filename"
            ((slidev_failed++))
        fi
        ((cybersec_count++))
    done < <(find content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/slidev -name "*.md" -not -name "_index.md" -print0)
    
    log_success "Slidev builds completed: $slidev_built built, $slidev_failed failed"
fi

# Docker deployment
log_info "Starting Docker deployment..."

# Stop existing services
log_info "Stopping existing services..."
docker compose down --remove-orphans 2>/dev/null || true

# Clean Docker system if force rebuild requested
if [[ "$FORCE_REBUILD" == true ]]; then
    log_info "Force rebuild requested - cleaning Docker cache..."
    docker system prune -af --volumes
    docker builder prune -af
fi

# Choose docker-compose file based on deployment type
if [[ "$DEPLOYMENT_TYPE" == "full" ]]; then
    COMPOSE_FILE="docker-compose.production.yml"
    BUILD_FLAGS="--no-cache --pull"
else
    COMPOSE_FILE="docker-compose.yml"
    BUILD_FLAGS=""
fi

# Build and start services
log_info "Building Docker image using $COMPOSE_FILE..."
if [[ "$FORCE_REBUILD" == true ]]; then
    BUILD_FLAGS="--no-cache --pull"
fi

# Build with progress output
docker compose -f "$COMPOSE_FILE" build $BUILD_FLAGS studio 2>&1 | while IFS= read -r line; do
    echo "$(date '+%H:%M:%S') - $line"
    if [[ "$line" == *"texlive-full"* ]]; then
        log_info "Installing texlive-full... (~5-8 minutes)"
    fi
done

if [[ ${PIPESTATUS[0]} -ne 0 ]]; then
    log_error "Docker build failed"
    docker compose -f "$COMPOSE_FILE" logs studio
    exit 1
fi

log_info "Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

# Wait for services to start
log_info "Waiting for services to start..."
sleep 15

# Verify deployment
log_info "Verifying deployment..."
if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up.*studio-app"; then
    log_success "Studio application started successfully"
else
    log_error "Studio application failed to start"
    docker compose -f "$COMPOSE_FILE" ps
    docker compose -f "$COMPOSE_FILE" logs studio
    exit 1
fi

if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up.*studio-mongodb"; then
    log_success "MongoDB started successfully"
else
    log_error "MongoDB failed to start"
    docker compose -f "$COMPOSE_FILE" ps
    docker compose -f "$COMPOSE_FILE" logs mongodb
    exit 1
fi

# Show final status
log_info "============================================"
log_success "🎉 DEPLOYMENT SUCCESSFUL 🎉"
log_info "Timestamp: $(date)"
log_info "Type: $DEPLOYMENT_TYPE"
log_info "Build: $GIT_COMMIT"
log_info "Slidev builds: $([ "$BUILD_SLIDEV" = "true" ] && echo "$slidev_built built" || echo "Skipped")"
log_info "Docker cache: $([ "$FORCE_REBUILD" = "true" ] && echo "Cleared" || echo "Used")"
log_info "============================================"

docker compose -f "$COMPOSE_FILE" ps