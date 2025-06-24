#!/bin/bash

# API Audit Script - Discover all your API endpoints
echo "🔍 API Endpoint Audit for MongoDB Migration"
echo "=========================================="

echo "📊 SUMMARY:"
total_routes=$(find src/app/api -name "route.ts" | wc -l | tr -d ' ')
echo "Total API routes found: $total_routes"

total_tests=$(find src -name "*.test.*" | grep -E "(api|lib)" | wc -l | tr -d ' ')
echo "Total test files: $total_tests"

coverage_gap=$((total_routes - total_tests))
echo "Test coverage gap: $coverage_gap endpoints potentially untested"

echo ""
echo "📋 API ENDPOINTS BY CATEGORY:"
echo ""

# Core Academic Entities
echo "🎓 CORE ACADEMIC:"
find src/app/api -name "route.ts" | grep -E "(students|faculty|programs|batches|courses)" | sort

echo ""
echo "👥 USER MANAGEMENT:"
find src/app/api -name "route.ts" | grep -E "(users|roles|permissions|auth)" | sort

echo ""
echo "🏢 INFRASTRUCTURE:"
find src/app/api -name "route.ts" | grep -E "(buildings|rooms|institutes|departments)" | sort

echo ""
echo "📊 ACADEMICS & ASSESSMENT:"
find src/app/api -name "route.ts" | grep -E "(assessments|results|attendance|timetables|curriculum)" | sort

echo ""
echo "🚀 PROJECTS & EVENTS:"
find src/app/api -name "route.ts" | grep -E "(projects|project-)" | sort

echo ""
echo "📈 REPORTS & ANALYTICS:"
find src/app/api -name "route.ts" | grep -E "(reports|analytics|feedback)" | sort

echo ""
echo "💬 COMMUNICATION:"
find src/app/api -name "route.ts" | grep -E "(notifications|newsletters)" | sort

echo ""
echo "🔧 ADMIN & UTILITIES:"
find src/app/api -name "route.ts" | grep -E "(download|pdf|import|export|search)" | sort

echo ""
echo "⚠️  PRIORITY TESTING RECOMMENDATIONS:"
echo "1. START WITH: users, students, faculty, programs, courses (your core entities)"
echo "2. THEN: authentication, roles, permissions (security critical)" 
echo "3. NEXT: assessments, results, attendance (academic workflows)"
echo "4. FINALLY: reports, projects, infrastructure (less critical)"

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Run: npm test -- --coverage to see current test coverage"
echo "2. Focus on testing the CORE ACADEMIC endpoints first"
echo "3. Use the existing test files as templates for new tests"
echo "4. Write Playwright tests for complete user workflows"
