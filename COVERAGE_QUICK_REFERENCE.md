# 📊 Coverage Tools & Commands - Quick Reference

## 🚀 Quick Start Commands

```bash
# Get quick coverage summary
npm run coverage:summary

# Generate Jest coverage with HTML report
npm run test:coverage:open

# Run Playwright tests and view report  
npm run test:e2e:open

# Run both Jest and Playwright with reports
npm run coverage:reports
```

## 📁 Coverage File Locations

- **Jest HTML Report**: `coverage/index.html` (detailed line-by-line coverage)
- **Playwright Report**: `playwright-report/index.html` (E2E test results)
- **Coverage JSON**: `coverage/coverage-final.json` (machine-readable)
- **LCOV Report**: `coverage/lcov-report/` (for IDE integration)

## 📈 Current Status Summary

| Metric | Current | Target | Status |
|--------|---------|--------|---------|
| Jest Coverage | 82.8% | 90% | 🟡 Good |
| API Endpoints | 19% | 85% | 🔴 Critical |
| E2E Coverage | 16% | 80% | 🔴 Critical |
| Migration Risk | 7/7 | ≤2/7 | 🔴 High Risk |

## 🎯 Priority Actions

1. **Write API Endpoint Tests** - Only 23/118 endpoints tested
2. **Add E2E Tests** - Critical user flows need coverage  
3. **Test Before Migrate** - Current risk too high for safe migration
4. **Use Coverage Tools** - Track progress with HTML reports

## 💡 Coverage Analysis Features

### Jest Coverage Report Shows:
- ✅ Line-by-line coverage highlighting
- ✅ Branch coverage analysis  
- ✅ Function coverage metrics
- ✅ Uncovered code identification

### Playwright Report Shows:
- ✅ Test execution results
- ✅ Failed test details with traces
- ✅ Performance metrics
- ✅ Screenshots of failures

### Coverage Summary Script Shows:
- ✅ Risk assessment score
- ✅ Endpoint coverage gaps
- ✅ MongoDB migration status
- ✅ Actionable recommendations

---

**🔄 Recommendation**: Run `npm run coverage:summary` weekly to track progress toward safe migration readiness.
