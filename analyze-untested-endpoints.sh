#!/bin/bash

# Analyze untested API endpoints for Playwright E2E testing
# This script will identify which API endpoints lack comprehensive E2E test coverage

echo "🔍 Analyzing API Endpoints and Test Coverage"
echo "============================================="

# Find all API route files
echo -e "\n📁 Finding all API route files..."
api_routes=$(find src/app/api -name "route.ts" | sort)
total_routes=$(echo "$api_routes" | wc -l)
echo "Found $total_routes API route files"

# Extract unique endpoint patterns
echo -e "\n🎯 Extracting API endpoint patterns..."
declare -A endpoints

while IFS= read -r file; do
  # Extract the endpoint path from the file path
  endpoint=$(echo "$file" | sed 's|src/app/api||' | sed 's|/route.ts||' | sed 's|\[.*\]|:id|g')
  if [ "$endpoint" = "" ]; then
    endpoint="/"
  fi
  
  # Extract HTTP methods from the file
  methods=$(grep -o "export async function \(GET\|POST\|PUT\|DELETE\|PATCH\)" "$file" 2>/dev/null | sed 's/export async function //' | tr '\n' ',' | sed 's/,$//')
  
  if [ -n "$methods" ]; then
    endpoints["/api$endpoint"]="$methods"
  fi
done <<< "$api_routes"

echo "Found ${#endpoints[@]} unique API endpoints"

# Display all endpoints
echo -e "\n📋 All API Endpoints:"
echo "======================"
for endpoint in $(printf '%s\n' "${!endpoints[@]}" | sort); do
  echo "  $endpoint [${endpoints[$endpoint]}]"
done

# Check for existing E2E test coverage
echo -e "\n🧪 Checking existing E2E test coverage..."
e2e_files=$(find e2e -name "*.spec.ts" | sort)

# Look for API endpoints referenced in E2E tests
echo -e "\n📊 API Endpoint References in E2E Tests:"
echo "=========================================="

declare -A tested_endpoints
for test_file in $e2e_files; do
  if grep -q "/api/" "$test_file" 2>/dev/null; then
    echo -e "\n📁 $test_file:"
    api_refs=$(grep -o "/api/[^'\"]*" "$test_file" 2>/dev/null | sort -u)
    while IFS= read -r ref; do
      if [ -n "$ref" ]; then
        echo "    $ref"
        tested_endpoints["$ref"]=1
      fi
    done <<< "$api_refs"
  fi
done

# Identify untested endpoints
echo -e "\n❌ Untested API Endpoints (Priority for E2E Testing):"
echo "====================================================="

untested_count=0
critical_untested=""
in_memory_untested=""

for endpoint in $(printf '%s\n' "${!endpoints[@]}" | sort); do
  is_tested=0
  
  # Check if this endpoint or a pattern match is tested
  for tested in "${!tested_endpoints[@]}"; do
    # Simple pattern matching - if the base path matches
    base_endpoint=$(echo "$endpoint" | sed 's|/:[^/]*||g')
    base_tested=$(echo "$tested" | sed 's|/[^/]*$||g')
    
    if [[ "$tested" == "$endpoint"* ]] || [[ "$endpoint" == "$tested"* ]] || [[ "$base_endpoint" == "$base_tested" ]]; then
      is_tested=1
      break
    fi
  done
  
  if [ $is_tested -eq 0 ]; then
    methods="${endpoints[$endpoint]}"
    echo "  $endpoint [$methods]"
    
    # Check if it's using in-memory storage (higher priority)
    if find src/app/api -path "*$(echo $endpoint | sed 's|/api||')*" -name "route.ts" -exec grep -l "__API_.*_STORE__" {} \; | head -1 > /dev/null 2>&1; then
      in_memory_untested="$in_memory_untested\n  $endpoint [$methods] (IN-MEMORY)"
    else
      critical_untested="$critical_untested\n  $endpoint [$methods]"
    fi
    
    ((untested_count++))
  fi
done

echo -e "\n🔥 HIGH PRIORITY - In-Memory Storage Endpoints (Migration Risk):"
echo "=================================================================="
if [ -n "$in_memory_untested" ]; then
  echo -e "$in_memory_untested"
else
  echo "  ✅ All in-memory endpoints appear to be tested!"
fi

echo -e "\n⚠️  MEDIUM PRIORITY - Other Untested Endpoints:"
echo "==============================================="
if [ -n "$critical_untested" ]; then
  echo -e "$critical_untested"
else
  echo "  ✅ All other endpoints appear to be tested!"
fi

echo -e "\n📈 Summary:"
echo "==========="
echo "  Total API endpoints: ${#endpoints[@]}"
echo "  Tested endpoints: $((${#endpoints[@]} - untested_count))"
echo "  Untested endpoints: $untested_count"
echo "  Coverage: $(( (${#endpoints[@]} - untested_count) * 100 / ${#endpoints[@]} ))%"

if [ $untested_count -gt 0 ]; then
    echo -e "\n💡 Recommendation:"
    echo "=================="
    echo "  Focus on creating comprehensive E2E tests for the HIGH PRIORITY"
    echo "  in-memory storage endpoints first, as these are most critical"
    echo "  for the MongoDB migration."
    echo ""
    echo "  Create E2E tests that cover:"
    echo "  - CRUD operations for each endpoint"
    echo "  - Error handling and validation"
    echo "  - Data integrity and business logic"
    echo "  - Authentication and authorization"
fi
