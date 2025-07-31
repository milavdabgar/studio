# Database Seeding Scripts

This directory contains scripts for seeding the database with test and development data.

## 📋 Available Scripts

### 🎯 **Primary Scripts (Use These)**

#### `seed-database.ts` - **Main Development Seeding**
```bash
# Seed development database with complete data
MONGODB_URI=mongodb://localhost:27017/gpp-next-dev npx tsx scripts/seed-database.ts
```
- **Purpose**: Complete development environment setup
- **Data**: Users, roles, departments, programs, batches, courses, buildings, rooms, committees
- **Coverage**: All entities needed for full app functionality
- **Environment**: Development only

#### `seed-after-deploy.sh` - **Production Seeding**
```bash
# Seed production database via Docker
./scripts/seed-after-deploy.sh
```
- **Purpose**: Production deployment seeding
- **Environment**: Production Docker containers
- **Usage**: Run after deployment to populate production data

### 🚫 **Deprecated Scripts (Will Be Removed)**

- `comprehensive-seed.ts` - Duplicate of seed-database.ts
- `seed-additional-data.ts` - Merged into seed-database.ts  
- `../seed-test-data.js` - Legacy JS version
- `../seed-test-users.js` - Legacy in-memory version

## 🔄 **Usage Patterns**

### Development Setup
```bash
# 1. Start local MongoDB
sudo systemctl start mongod

# 2. Seed development database
MONGODB_URI=mongodb://localhost:27017/gpp-next-dev npx tsx scripts/seed-database.ts

# 3. Start development server
npm run dev
```

### Testing Setup  
```bash
# Use seeded development data for E2E tests
npx playwright test
```

### Production Deployment
```bash
# Deploy with Docker Compose
docker-compose up -d

# Seed production data
./scripts/seed-after-deploy.sh
```

## 📊 **Seeded Data Overview**

| Entity | Count | Purpose |
|--------|-------|---------|
| Roles | 5 | Authentication & authorization |
| Users | 2-4 | Test accounts for all roles |
| Departments | 3 | Academic structure |
| Programs | 2 | Diploma programs |
| Batches | 2 | Student cohorts |
| Courses | 2 | Academic courses |
| Buildings | 2 | Campus infrastructure |
| Rooms | 3 | Physical spaces |
| Committees | 2 | Administrative structure |

## 🔐 **Test User Accounts**

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@gppalanpur.ac.in | Admin@123 | System administration |
| Faculty | faculty@gppalanpur.ac.in | Faculty@123 | Faculty features & resume |
| Student | 086260306003@gppalanpur.ac.in | 086260306003 | Student features & resume |

## 🧹 **Cleanup Plan**

The following files will be removed in the next cleanup:
- `../seed-test-data.js`
- `../seed-test-users.js` 
- `scripts/comprehensive-seed.ts`
- `scripts/seed-additional-data.ts`

**Only `seed-database.ts` and `seed-after-deploy.sh` will remain.**