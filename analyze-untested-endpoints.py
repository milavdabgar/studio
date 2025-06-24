#!/usr/bin/env python3
"""
Analyze untested API endpoints for Playwright E2E testing
This script identifies which API endpoints lack comprehensive E2E test coverage
"""

import os
import re
import glob
from collections import defaultdict

def find_api_routes():
    """Find all API route files and extract endpoints"""
    api_files = glob.glob("src/app/api/**/route.ts", recursive=True)
    print(f"🔍 Found {len(api_files)} API route files")
    
    endpoints = {}
    
    for file_path in api_files:
        # Extract endpoint path from file path
        endpoint = file_path.replace("src/app/api", "").replace("/route.ts", "")
        # Replace dynamic segments with :id pattern
        endpoint = re.sub(r'\[[^\]]+\]', ':id', endpoint)
        endpoint = f"/api{endpoint}" if endpoint else "/api"
        
        # Extract HTTP methods from file content
        try:
            with open(file_path, 'r') as f:
                content = f.read()
                methods = re.findall(r'export async function (GET|POST|PUT|DELETE|PATCH)', content)
                if methods:
                    endpoints[endpoint] = methods
        except Exception as e:
            print(f"⚠️  Error reading {file_path}: {e}")
    
    return endpoints

def check_in_memory_usage():
    """Check which endpoints use in-memory storage"""
    in_memory_endpoints = set()
    api_files = glob.glob("src/app/api/**/route.ts", recursive=True)
    
    for file_path in api_files:
        try:
            with open(file_path, 'r') as f:
                content = f.read()
                if "__API_" in content and "_STORE__" in content:
                    endpoint = file_path.replace("src/app/api", "").replace("/route.ts", "")
                    endpoint = re.sub(r'\[[^\]]+\]', ':id', endpoint)
                    endpoint = f"/api{endpoint}" if endpoint else "/api"
                    in_memory_endpoints.add(endpoint)
        except Exception as e:
            print(f"⚠️  Error reading {file_path}: {e}")
    
    return in_memory_endpoints

def find_tested_endpoints():
    """Find API endpoints referenced in E2E tests"""
    e2e_files = glob.glob("e2e/*.spec.ts")
    tested_endpoints = set()
    
    print(f"\n🧪 Checking {len(e2e_files)} E2E test files...")
    
    for test_file in e2e_files:
        try:
            with open(test_file, 'r') as f:
                content = f.read()
                # Find API endpoint references
                api_refs = re.findall(r'/api/[^\'"\s]*', content)
                if api_refs:
                    print(f"\n📁 {test_file}:")
                    for ref in sorted(set(api_refs)):
                        print(f"    {ref}")
                        tested_endpoints.add(ref)
        except Exception as e:
            print(f"⚠️  Error reading {test_file}: {e}")
    
    return tested_endpoints

def analyze_coverage(endpoints, tested_endpoints, in_memory_endpoints):
    """Analyze test coverage and identify gaps"""
    
    untested = []
    untested_in_memory = []
    
    for endpoint, methods in endpoints.items():
        is_tested = False
        
        # Check if endpoint is tested (exact match or pattern match)
        for tested in tested_endpoints:
            # Simple pattern matching
            if (tested in endpoint or endpoint in tested or 
                endpoint.replace(':id', '') in tested or
                tested.replace('/', '').replace('-', '') in endpoint.replace('/', '').replace('-', '')):
                is_tested = True
                break
        
        if not is_tested:
            methods_str = ', '.join(methods)
            endpoint_info = f"{endpoint} [{methods_str}]"
            
            if endpoint in in_memory_endpoints:
                untested_in_memory.append(endpoint_info)
            else:
                untested.append(endpoint_info)
    
    return untested, untested_in_memory

def main():
    print("🔍 Analyzing API Endpoints and Test Coverage")
    print("=" * 50)
    
    # Find all API endpoints
    endpoints = find_api_routes()
    
    # Check for in-memory storage usage
    in_memory_endpoints = check_in_memory_usage()
    
    # Display all endpoints
    print(f"\n📋 All API Endpoints ({len(endpoints)} total):")
    print("=" * 30)
    for endpoint in sorted(endpoints.keys()):
        methods = ', '.join(endpoints[endpoint])
        in_memory_flag = " (IN-MEMORY)" if endpoint in in_memory_endpoints else ""
        print(f"  {endpoint} [{methods}]{in_memory_flag}")
    
    # Find tested endpoints
    tested_endpoints = find_tested_endpoints()
    
    # Analyze coverage
    untested, untested_in_memory = analyze_coverage(endpoints, tested_endpoints, in_memory_endpoints)
    
    print(f"\n🔥 HIGH PRIORITY - In-Memory Storage Endpoints Needing E2E Tests:")
    print("=" * 65)
    if untested_in_memory:
        for endpoint in sorted(untested_in_memory):
            print(f"  {endpoint}")
    else:
        print("  ✅ All in-memory endpoints appear to be tested!")
    
    print(f"\n⚠️  MEDIUM PRIORITY - Other Untested Endpoints:")
    print("=" * 45)
    if untested:
        for endpoint in sorted(untested):
            print(f"  {endpoint}")
    else:
        print("  ✅ All other endpoints appear to be tested!")
    
    total_untested = len(untested) + len(untested_in_memory)
    coverage_pct = ((len(endpoints) - total_untested) * 100 // len(endpoints)) if endpoints else 100
    
    print(f"\n📈 Summary:")
    print("=" * 15)
    print(f"  Total API endpoints: {len(endpoints)}")
    print(f"  In-memory endpoints: {len(in_memory_endpoints)}")
    print(f"  Tested endpoints: {len(endpoints) - total_untested}")
    print(f"  Untested endpoints: {total_untested}")
    print(f"  Coverage: {coverage_pct}%")
    
    if total_untested > 0:
        print(f"\n💡 Recommendations:")
        print("=" * 20)
        print("  1. Focus on HIGH PRIORITY in-memory endpoints first")
        print("  2. Create comprehensive E2E tests covering:")
        print("     - CRUD operations")
        print("     - Error handling and validation")
        print("     - Authentication and authorization")
        print("     - Data integrity and business logic")
        print("  3. Ensure tests pass before starting MongoDB migration")
        
        if untested_in_memory:
            print(f"\n🎯 Next Steps - Create E2E tests for these {len(untested_in_memory)} in-memory endpoints:")
            for endpoint in sorted(untested_in_memory)[:5]:  # Show first 5
                print(f"     - {endpoint}")
            if len(untested_in_memory) > 5:
                print(f"     ... and {len(untested_in_memory) - 5} more")

if __name__ == "__main__":
    main()
