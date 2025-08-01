# GPP Studio Deployment Guide

This document outlines the improved deployment workflow for GPP Studio, supporting both development and production deployments.

## 🏗️ Deployment Workflow Overview

### Development Workflow (dev branch)
- **Branch**: `dev`
- **Purpose**: Feature development and testing
- **CI/CD**: Automated quality checks, tests, and build verification
- **Duration**: ~5-10 minutes

### Production Workflow (master branch)
- **Branch**: `master` (production-ready code)
- **Purpose**: Weekly late-night deployments with full feature set
- **Duration**: ~30-45 minutes (includes Slidev builds)
- **Schedule**: Weekly, typically late night to minimize disruption

## 📋 Available Deployment Methods

### 1. Full Production Deployment (Recommended)
**Workflow**: `.github/workflows/production-deploy.yml`
**Trigger**: Push to `master` branch or manual dispatch
**Features**:
- ✅ Fresh Docker builds (no cache issues)
- ✅ Slidev presentation builds (~87 presentations)
- ✅ Quality checks on deployment server
- ✅ Health checks and verification
- ✅ Detailed deployment logging

```bash
# Manual trigger with options
# GitHub Actions UI -> production-deploy.yml -> Run workflow
# Options:
# - Force rebuild: Clear all Docker cache
# - Skip slidev: Deploy without presentation builds
```

### 2. Quick Maintenance Deployment
**Workflow**: `.github/workflows/deploy.yml`
**Trigger**: Manual dispatch only
**Features**:
- ✅ Fast deployment for urgent fixes
- ✅ Uses Docker cache for speed
- ⚠️ No Slidev builds
- ⚠️ Limited quality checks

### 3. Local Deployment Script
**Script**: `./scripts/deploy.sh`
**Usage**: Local or server-side deployment management

```bash
# Quick deployment (default)
./scripts/deploy.sh

# Full deployment with Slidev builds
./scripts/deploy.sh --type full --build-slidev

# Force rebuild (ignore Docker cache)
./scripts/deploy.sh --force-rebuild

# Show all options
./scripts/deploy.sh --help
```

## 🔧 Key Improvements

### 1. Fixed Docker Caching Issues
- **Problem**: Cached Docker builds causing stale deployments
- **Solution**: 
  - Production builds use `--no-cache --pull` flags
  - Separate docker-compose files for different deployment types
  - Build arguments with commit hashes for proper versioning

### 2. Branch-Based Deployment Strategy
- **dev branch**: Development and testing with CI/CD checks
- **master branch**: Production-ready code for weekly deployments
- **Quality gates**: TypeScript, linting, tests, and build verification

### 3. Slidev Integration
- **Location**: Built on deployment server (not GitHub Actions)
- **Scope**: ~87 presentations across MPMC, Java, and Cyber Security
- **Storage**: `public/slidev-builds/` directory
- **Timeout**: 5-minute timeout per presentation to prevent hanging

### 4. Enhanced Monitoring
- **Health endpoint**: `/api/health` for deployment verification
- **Service checks**: App and database connectivity
- **Build metadata**: Commit hash, build date, version tracking
- **Docker health checks**: Container-level health monitoring

## 🚀 Deployment Process

### For Weekly Production Deployments

1. **Develop on `dev` branch**
   ```bash
   git checkout dev
   git add .
   git commit -m "feat: new feature"
   git push origin dev
   ```

2. **CI checks run automatically**
   - TypeScript type checking
   - ESLint code quality
   - Test suite execution
   - Build verification
   - Bundle size analysis

3. **Merge to master when ready**
   ```bash
   git checkout master
   git merge dev
   git push origin master
   ```

4. **Automatic production deployment**
   - Triggers `production-deploy.yml` workflow
   - Full deployment with Slidev builds
   - ~30-45 minutes total duration

### For Emergency Hotfixes

1. **Use quick deployment workflow**
   - GitHub Actions UI → `deploy.yml` → Run workflow
   - Provide reason for emergency deployment
   - ~10-15 minutes duration

## 📊 Deployment Configuration Files

### Docker Compose Files
- `docker-compose.yml`: Development and quick deployments
- `docker-compose.production.yml`: Full production deployments with health checks

### GitHub Workflows
- `dev-ci.yml`: Development branch CI/CD checks
- `production-deploy.yml`: Full production deployment
- `deploy.yml`: Quick maintenance deployment

### Scripts
- `scripts/deploy.sh`: Local deployment management
- Health check endpoint at `/api/health`

## 🔍 Monitoring and Verification

### Health Check Endpoint
```bash
curl https://gppalanpur.ac.in/api/health
```

Response includes:
- Service status (app, database)
- Build information (commit, date)
- System uptime
- Response time

### Docker Health Checks
- Application: HTTP health check every 30s
- MongoDB: Database ping every 30s
- Automatic restart on failure

### Deployment Verification
- Service startup confirmation
- Container status checks
- Log analysis for errors
- Slidev build success tracking

## ⚠️ Important Notes

1. **GitHub Actions Timeout**: 15-minute limit requires server-side heavy tasks
2. **Weekly Schedule**: Designed for late-night deployments to minimize disruption
3. **Cache Management**: Production deployments always use fresh builds
4. **Slidev Builds**: Can be skipped for faster deployment if needed
5. **Node.js Version**: Slidev requires Node.js 20+ (current server has v18.19.1)
6. **Rollback**: Use quick deployment with previous master commit if needed

### Server Requirements
- **Node.js**: Version 20 or higher for Slidev builds
- **Docker**: For containerized deployment
- **Git**: For code updates

## 🆘 Troubleshooting

### Common Issues

1. **Stale Docker Cache**
   - Solution: Use `--force-rebuild` option or production deployment

2. **Slidev Build Failures (Node.js Version)**
   - Problem: Server has Node.js v18, Slidev requires v20+
   - Solution: Update Node.js on server or use `--skip-slidev`
   - Command: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`

3. **Slidev Build Timeout**
   - Solution: Use `--skip-slidev` option for faster deployment

4. **Database Connection Issues**
   - Check: Health endpoint shows database status
   - Solution: Restart MongoDB container

5. **Build Size Issues**
   - Monitor: CI checks bundle size automatically
   - Limit: 1GB maximum build size

### Emergency Procedures

1. **Service Down**: Use quick deployment with last known good commit
2. **Build Failure**: Check logs in GitHub Actions or server deployment logs
3. **Database Issues**: MongoDB container restart usually resolves connectivity

## 📈 Performance Metrics

- **Development CI**: 5-10 minutes
- **Quick Deployment**: 10-15 minutes  
- **Full Production Deployment**: 30-45 minutes
- **Slidev Builds**: ~5-10 minutes for 21 presentations
- **Docker Build**: ~8-10 minutes (includes texlive-full)

This deployment strategy ensures reliable, efficient, and comprehensive deployments while maintaining flexibility for emergency situations.