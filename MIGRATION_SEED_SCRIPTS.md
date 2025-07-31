# 🗂️ Seed Scripts Migration Guide

We've cleaned up the confusing seed scripts! Here's what changed and how to migrate.

## 🔄 **What Was Removed**

| ❌ Old Script | ✅ New Alternative | Migration |
|---------------|-------------------|-----------|
| `seed-test-data.js` | `npm run seed:dev` | Use the new command |
| `seed-test-users.js` | `npm run seed:dev` | Included in main seed |
| `scripts/comprehensive-seed.ts` | `scripts/seed-database.ts` | Already the default |
| `scripts/seed-additional-data.ts` | `scripts/seed-database.ts` | Data merged in |

## ✅ **What to Use Now**

### 🎯 **For Development**
```bash
# Seed development database (recommended)
npm run seed:dev

# Or manually with custom DB
MONGODB_URI=mongodb://localhost:27017/your-db npx tsx scripts/seed-database.ts
```

### 🚀 **For Production** 
```bash
# Via Docker (after deployment)
./scripts/seed-after-deploy.sh

# Or directly
npm run seed:database
```

## 📋 **What's Included in the New Seed**

- ✅ **5 Roles**: Admin, Faculty, Student, HOD, Super Admin
- ✅ **Test Users**: Pre-configured accounts for all roles
- ✅ **Faculty Profile**: Dr. Faculty User with resume data
- ✅ **Student Profile**: Test student with resume data  
- ✅ **Academic Data**: Departments, programs, batches, courses
- ✅ **Infrastructure**: Buildings, rooms, committees
- ✅ **Complete Setup**: Everything needed for E2E tests

## 🔐 **Test Accounts Available**

| Role | Email | Password | Features |
|------|-------|----------|----------|
| Admin | admin@gppalanpur.ac.in | Admin@123 | Full system access |
| Faculty | faculty@gppalanpur.ac.in | Faculty@123 | **Resume generation** ✅ |
| Student | 086260306003@gppalanpur.ac.in | 086260306003 | Resume generation |

## 📂 **New File Structure**

```
scripts/
├── README.md              # 📖 Documentation
├── seed-database.ts       # 🎯 Main seeding script
└── seed-after-deploy.sh   # 🚀 Production deployment

# ❌ Removed files:
# seed-test-data.js
# seed-test-users.js  
# scripts/comprehensive-seed.ts
# scripts/seed-additional-data.ts
```

## 💡 **Quick Migration**

If you were using any old commands, just replace them:

```bash
# OLD - Don't use these anymore ❌
node seed-test-data.js
node seed-test-users.js
npx tsx scripts/comprehensive-seed.ts

# NEW - Use this instead ✅ 
npm run seed:dev
```

## 🎉 **Benefits of the New System**

- ✅ **One Command**: Single command for complete setup
- ✅ **No Confusion**: Only 2 scripts total (dev + production)
- ✅ **Complete Data**: Everything needed for all features
- ✅ **Well Tested**: Powers our passing E2E tests
- ✅ **Documented**: Clear usage instructions

---

**Happy seeding! 🌱**