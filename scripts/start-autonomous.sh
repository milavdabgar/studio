#!/bin/bash

# 🤖 Start 24/7 Autonomous Development System
# This script starts the complete autonomous development environment

set -e

echo "🤖 Starting Autonomous Development System..."
echo "════════════════════════════════════════"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo -e "${BLUE}🔍 Checking requirements...${NC}"
    
    local missing_tools=()
    
    if ! command -v claude &> /dev/null; then
        missing_tools+=("claude")
    fi
    
    if ! command -v gh &> /dev/null; then
        missing_tools+=("gh")
    fi
    
    if ! command -v node &> /dev/null; then
        missing_tools+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required tools: ${missing_tools[*]}${NC}"
        echo -e "${YELLOW}Please install them before running autonomous development${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements satisfied${NC}"
}

# Make scripts executable
setup_permissions() {
    echo -e "${BLUE}🔧 Setting up permissions...${NC}"
    chmod +x scripts/autonomous-daemon.js
    chmod +x scripts/autonomous-dashboard.js
    chmod +x scripts/autonomous-monitor.js
    echo -e "${GREEN}✅ Permissions set${NC}"
}

# Create necessary directories
setup_directories() {
    echo -e "${BLUE}📁 Creating directories...${NC}"
    mkdir -p .autonomous/tasks
    mkdir -p .autonomous/logs
    mkdir -p .autonomous/metrics
    echo -e "${GREEN}✅ Directories created${NC}"
}

# Initialize configuration if it doesn't exist
setup_config() {
    if [ ! -f autonomous-config.json ]; then
        echo -e "${YELLOW}⚙️  Configuration file not found, using defaults${NC}"
    else
        echo -e "${GREEN}✅ Configuration loaded${NC}"
    fi
}

# Check git status
check_git() {
    echo -e "${BLUE}🔍 Checking git status...${NC}"
    
    if ! git status &> /dev/null; then
        echo -e "${RED}❌ Not in a git repository${NC}"
        exit 1
    fi
    
    # Check if we're on main/master branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "master" ] && [ "$current_branch" != "main" ]; then
        echo -e "${YELLOW}⚠️  Currently on branch: $current_branch${NC}"
        echo -e "${YELLOW}   Autonomous development works best from master/main${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Git repository ready${NC}"
}

# Show system status
show_status() {
    echo -e "${BLUE}📊 System Status${NC}"
    echo "────────────────"
    echo "Repository: $(pwd)"
    echo "Branch: $(git branch --show-current)"
    echo "Last commit: $(git log -1 --format='%h - %s (%cr)')"
    echo "Uncommitted changes: $(git status --porcelain | wc -l | tr -d ' ')"
    echo ""
}

# Start autonomous daemon
start_daemon() {
    echo -e "${BLUE}🚀 Starting autonomous daemon...${NC}"
    
    # Check if daemon is already running
    if pgrep -f "autonomous-daemon.js" > /dev/null; then
        echo -e "${YELLOW}⚠️  Daemon already running${NC}"
        echo "Use 'pkill -f autonomous-daemon.js' to stop it"
        return 0
    fi
    
    # Start daemon in background
    nohup node scripts/autonomous-daemon.js start > .autonomous/logs/daemon.log 2>&1 &
    daemon_pid=$!
    
    # Wait a moment to check if it started successfully
    sleep 2
    
    if kill -0 $daemon_pid 2>/dev/null; then
        echo -e "${GREEN}✅ Daemon started successfully (PID: $daemon_pid)${NC}"
        echo "📝 Logs: .autonomous/logs/daemon.log"
    else
        echo -e "${RED}❌ Failed to start daemon${NC}"
        echo "Check logs: .autonomous/logs/daemon.log"
        exit 1
    fi
}

# Start dashboard
start_dashboard() {
    echo -e "${BLUE}📊 Starting monitoring dashboard...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the dashboard${NC}"
    echo ""
    
    # Start dashboard (this will run in foreground)
    node scripts/autonomous-dashboard.js start
}

# Main execution
main() {
    # Parse command line arguments
    MODE="full"
    DAEMON_ONLY=false
    DASHBOARD_ONLY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --daemon-only)
                DAEMON_ONLY=true
                shift
                ;;
            --dashboard-only)
                DASHBOARD_ONLY=true
                shift
                ;;
            --supervised)
                MODE="supervised"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Run setup checks
    check_requirements
    setup_permissions
    setup_directories
    setup_config
    check_git
    show_status
    
    if [ "$DASHBOARD_ONLY" = true ]; then
        start_dashboard
    elif [ "$DAEMON_ONLY" = true ]; then
        start_daemon
        echo -e "${GREEN}🎉 Autonomous daemon is now running 24/7!${NC}"
        echo -e "${BLUE}Use './scripts/autonomous-dashboard.js' to monitor progress${NC}"
    else
        # Start both daemon and dashboard
        start_daemon
        echo ""
        echo -e "${GREEN}🎉 Autonomous Development System is fully operational!${NC}"
        echo ""
        echo -e "${YELLOW}The daemon is running 24/7 in the background${NC}"
        echo -e "${YELLOW}Starting monitoring dashboard...${NC}"
        echo ""
        start_dashboard
    fi
}

show_help() {
    echo "🤖 Autonomous Development System"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --daemon-only      Start only the daemon (background)"
    echo "  --dashboard-only   Start only the monitoring dashboard"
    echo "  --supervised       Run in supervised mode (requires approvals)"
    echo "  --help, -h         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                     # Start complete system (daemon + dashboard)"
    echo "  $0 --daemon-only       # Start daemon in background"
    echo "  $0 --dashboard-only    # Monitor existing daemon"
    echo ""
    echo "The autonomous system will:"
    echo "  • 🧠 Plan features automatically"
    echo "  • 🐛 Hunt and fix bugs continuously"
    echo "  • 🔧 Improve code quality"
    echo "  • 📊 Monitor system health"
    echo "  • 🔀 Create PRs autonomously"
    echo "  • 📈 Track development metrics"
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}👋 Stopping autonomous system...${NC}"; exit 0' INT TERM

# Run main function
main "$@"