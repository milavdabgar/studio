#!/bin/bash

# Manual API Testing Script for MongoDB Migration
# This tests the critical endpoints that need migration

echo "🚀 MongoDB Migration - API Endpoint Testing"
echo "==========================================="
echo ""

BASE_URL="http://localhost:3000"

# Function to test an API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4

    echo "🧪 Testing: $description"
    echo "   $method $endpoint"

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi

    # Extract HTTP status
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    body=$(echo "$response" | grep -v "HTTP_STATUS:")

    if [ "$http_status" = "200" ] || [ "$http_status" = "201" ]; then
        echo "   ✅ Status: $http_status"
        # Count items if it's an array response
        if echo "$body" | jq -e 'type == "array"' > /dev/null 2>&1; then
            count=$(echo "$body" | jq 'length')
            echo "   📊 Items returned: $count"
        fi
    else
        echo "   ❌ Status: $http_status"
        echo "   📝 Response: $body"
    fi
    echo ""
}

# Check if server is running
echo "🔍 Checking if dev server is running..."
if ! curl -s "$BASE_URL" > /dev/null; then
    echo "❌ Dev server not running at $BASE_URL"
    echo "📋 Please start it with: npm run dev"
    exit 1
fi
echo "✅ Dev server is running"
echo ""

# Test critical endpoints that still use in-memory storage
echo "📋 TESTING IN-MEMORY STORAGE ENDPOINTS"
echo "======================================"

# Students API (Priority 1)
echo "🎓 STUDENTS API"
test_endpoint "GET" "/api/students" "Get all students"

# Faculty API (Priority 1)  
echo "👨‍🏫 FACULTY API"
test_endpoint "GET" "/api/faculty" "Get all faculty"

# Courses API (Priority 1)
echo "📚 COURSES API" 
test_endpoint "GET" "/api/courses" "Get all courses"

# Programs API (Priority 2)
echo "🎯 PROGRAMS API"
test_endpoint "GET" "/api/programs" "Get all programs"

# Batches API (Priority 2)
echo "📋 BATCHES API"
test_endpoint "GET" "/api/batches" "Get all batches"

# Enrollments API (Priority 2)
echo "📝 ENROLLMENTS API"
test_endpoint "GET" "/api/enrollments" "Get all enrollments"

# Test MongoDB endpoints (already migrated)
echo ""
echo "📋 TESTING MONGODB ENDPOINTS (ALREADY MIGRATED)"
echo "=============================================="

# Users API (Already using MongoDB)
echo "👤 USERS API"
test_endpoint "GET" "/api/users" "Get all users"

# Roles API (Already using MongoDB)
echo "🔑 ROLES API"
test_endpoint "GET" "/api/roles" "Get all roles"

echo ""
echo "📊 TESTING SUMMARY"
echo "=================="
echo "✅ Tested critical endpoints that need MongoDB migration"
echo "✅ Validated current API functionality"
echo "🎯 Focus areas for migration:"
echo "   1. Students API (high priority)"
echo "   2. Faculty API (high priority)" 
echo "   3. Courses API (high priority)"
echo "   4. Programs/Batches/Enrollments (medium priority)"
echo ""
echo "📝 Next steps:"
echo "   1. Create MongoDB models for these entities"
echo "   2. Write migration scripts to move data"
echo "   3. Update API endpoints to use MongoDB"
echo "   4. Test each migration with this script"
