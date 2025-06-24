#!/bin/bash

# Coverage Analysis Script for MongoDB Migration Project
# This script provides a comprehensive analysis of test coverage for API endpoints

echo "📊 COVERAGE ANALYSIS FOR MONGODB MIGRATION"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_colored() {
    printf "${1}${2}${NC}\n"
}

print_colored $BLUE "🧪 Running Jest Tests with Coverage..."
npm test -- --coverage --silent > /tmp/jest_output.txt 2>&1

# Extract coverage percentages from Jest output
JEST_COVERAGE=$(tail -10 /tmp/jest_output.txt | grep "All files" | awk '{print $3}' | sed 's/%//')

if [ ! -z "$JEST_COVERAGE" ]; then
    print_colored $GREEN "✅ Jest Tests Complete - Coverage: ${JEST_COVERAGE}%"
else
    print_colored $RED "❌ Jest Tests Failed or Coverage Not Found"
    JEST_COVERAGE="0"
fi

echo ""
print_colored $BLUE "🎭 Running Playwright Tests..."
npx playwright test --quiet > /tmp/playwright_output.txt 2>&1

# Check Playwright results
PLAYWRIGHT_RESULTS=$(tail -5 /tmp/playwright_output.txt | grep -E "(passed|failed|skipped)")
if [ ! -z "$PLAYWRIGHT_RESULTS" ]; then
    print_colored $GREEN "✅ Playwright Tests Complete"
    echo "$PLAYWRIGHT_RESULTS"
else
    print_colored $RED "❌ Playwright Tests Failed"
fi

echo ""
print_colored $BLUE "📋 COVERAGE SUMMARY"
echo "==================="

# API Endpoints Analysis
echo ""
print_colored $YELLOW "🔍 API Endpoints Coverage Analysis:"

# Count total API endpoints
TOTAL_ENDPOINTS=$(find src/app/api -name "route.ts" | wc -l | tr -d ' ')

# Count tested endpoints (Jest test files)
TESTED_ENDPOINTS=$(find src/lib/api -name "*.test.ts" | wc -l | tr -d ' ')

# Count E2E tested endpoints (rough estimate based on Playwright test files)
E2E_ENDPOINTS=$(find e2e -name "*.spec.ts" | wc -l | tr -d ' ')

echo "• Total API Endpoints: $TOTAL_ENDPOINTS"
echo "• Unit Tested (Jest): $TESTED_ENDPOINTS"
echo "• E2E Tested (Playwright): $E2E_ENDPOINTS"

# Calculate coverage percentages
if [ "$TOTAL_ENDPOINTS" -gt 0 ]; then
    UNIT_COVERAGE=$((TESTED_ENDPOINTS * 100 / TOTAL_ENDPOINTS))
    E2E_COVERAGE=$((E2E_ENDPOINTS * 100 / TOTAL_ENDPOINTS))
else
    UNIT_COVERAGE=0
    E2E_COVERAGE=0
fi

echo "• Unit Test Coverage: ${UNIT_COVERAGE}%"
echo "• E2E Test Coverage: ${E2E_COVERAGE}%"

echo ""
print_colored $YELLOW "📊 Code Coverage (Jest):"
echo "• Statement Coverage: ${JEST_COVERAGE}%"

# MongoDB Migration Status
echo ""
print_colored $YELLOW "🗄️ MongoDB Migration Status:"

# Check for in-memory stores
IN_MEMORY_STORES=$(grep -r "global\.__API_.*_STORE__" src/app/api --include="*.ts" | wc -l | tr -d ' ')
MONGODB_FILES=$(grep -r "connectDB\|mongoose\|mongodb" src/app/api --include="*.ts" | wc -l | tr -d ' ')

echo "• Endpoints using in-memory stores: $IN_MEMORY_STORES"
echo "• Endpoints using MongoDB: $MONGODB_FILES"

if [ "$IN_MEMORY_STORES" -gt "$MONGODB_FILES" ]; then
    print_colored $RED "⚠️  More endpoints use in-memory storage than MongoDB"
else
    print_colored $GREEN "✅ More endpoints use MongoDB than in-memory storage"
fi

# Risk Assessment
echo ""
print_colored $YELLOW "⚠️ MIGRATION RISK ASSESSMENT:"

RISK_SCORE=0

if [ "$UNIT_COVERAGE" -lt 80 ]; then
    print_colored $RED "🔴 HIGH RISK: Unit test coverage below 80%"
    RISK_SCORE=$((RISK_SCORE + 3))
else
    print_colored $GREEN "🟢 LOW RISK: Good unit test coverage"
fi

if [ "$E2E_COVERAGE" -lt 70 ]; then
    print_colored $RED "🔴 HIGH RISK: E2E test coverage below 70%"
    RISK_SCORE=$((RISK_SCORE + 2))
else
    print_colored $GREEN "🟢 LOW RISK: Good E2E test coverage"
fi

if [ "$IN_MEMORY_STORES" -gt 50 ]; then
    print_colored $RED "🔴 HIGH RISK: Many endpoints still use in-memory storage"
    RISK_SCORE=$((RISK_SCORE + 2))
else
    print_colored $YELLOW "🟡 MEDIUM RISK: Some endpoints use in-memory storage"
    RISK_SCORE=$((RISK_SCORE + 1))
fi

echo ""
print_colored $BLUE "Overall Risk Score: $RISK_SCORE/7"

if [ "$RISK_SCORE" -le 2 ]; then
    print_colored $GREEN "🟢 LOW RISK - Safe to proceed with migration"
elif [ "$RISK_SCORE" -le 4 ]; then
    print_colored $YELLOW "🟡 MEDIUM RISK - Increase test coverage before migration"
else
    print_colored $RED "🔴 HIGH RISK - Write comprehensive tests before any migration"
fi

# Recommendations
echo ""
print_colored $YELLOW "💡 RECOMMENDATIONS:"

if [ "$UNIT_COVERAGE" -lt 80 ]; then
    echo "1. 📝 Write more unit tests to reach 80%+ coverage"
fi

if [ "$E2E_COVERAGE" -lt 70 ]; then
    echo "2. 🎭 Add more Playwright E2E tests for critical user flows"
fi

if [ "$IN_MEMORY_STORES" -gt 20 ]; then
    echo "3. 🗄️ Plan incremental MongoDB migration for remaining endpoints"
fi

echo "4. 📊 Review detailed coverage reports:"
echo "   • Jest: coverage/index.html"
echo "   • Playwright: playwright-report/index.html"

# Open reports if in interactive mode
if [ -t 0 ]; then
    echo ""
    read -p "📱 Open coverage reports in browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "coverage/index.html" ]; then
            print_colored $GREEN "🌐 Opening Jest coverage report..."
            open coverage/index.html
        fi
        if [ -f "playwright-report/index.html" ]; then
            print_colored $GREEN "🌐 Opening Playwright report..."
            open playwright-report/index.html
        fi
    fi
fi

echo ""
print_colored $BLUE "📋 Coverage analysis complete!"
