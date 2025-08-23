#!/bin/bash

# Comprehensive API Test Protocol - Shell Script Version
# Tests all implemented functionalities using curl

set -e

BASE_URL="http://localhost:3001"
USER_ID=""
ACCOUNT_IDS=()

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if server is running
check_server() {
    log_info "Checking if server is running..."
    
    if curl -s "$BASE_URL/health" > /dev/null; then
        log_success "Server is running"
        return 0
    else
        log_error "Server is not running. Please start it with: npm run dev"
        return 1
    fi
}

# Test health endpoint
test_health() {
    log_info "Testing health endpoint..."
    
    response=$(curl -s "$BASE_URL/health")
    
    if echo "$response" | grep -q '"status":"ok"'; then
        log_success "Health endpoint working"
        echo "   Response: $response"
    else
        log_error "Health endpoint failed"
        echo "   Response: $response"
        return 1
    fi
}

# Test API info
test_api_info() {
    log_info "Testing API info endpoint..."
    
    response=$(curl -s "$BASE_URL/")
    
    if echo "$response" | grep -q '"name":"Personal Wealth Manager API"'; then
        log_success "API info endpoint working"
    else
        log_error "API info endpoint failed"
        echo "   Response: $response"
        return 1
    fi
}

# Test user creation
test_create_user() {
    log_info "Testing user creation..."
    
    user_data='{
        "full_name": "Test User",
        "email": "test.user@example.com",
        "filing_status": "single",
        "residency_state": "California",
        "residency_city": "San Francisco",
        "age": 30,
        "dependents": 0,
        "risk_tolerance": "medium",
        "goals": [
            "Save for retirement",
            "Build emergency fund", 
            "Buy a house"
        ]
    }'
    
    response=$(curl -s -X POST "$BASE_URL/users" \
        -H "Content-Type: application/json" \
        -d "$user_data")
    
    if echo "$response" | grep -q '"success":true'; then
        USER_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        log_success "User created successfully"
        log_info "User ID: $USER_ID"
    else
        log_error "User creation failed"
        echo "   Response: $response"
        return 1
    fi
}

# Test get user
test_get_user() {
    log_info "Testing get user..."
    
    if [ -z "$USER_ID" ]; then
        log_error "No user ID available"
        return 1
    fi
    
    response=$(curl -s "$BASE_URL/users/$USER_ID")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Get user successful"
    else
        log_error "Get user failed"
        echo "   Response: $response"
        return 1
    fi
}

# Test account creation
test_create_accounts() {
    log_info "Testing account creation..."
    
    if [ -z "$USER_ID" ]; then
        log_error "No user ID available"
        return 1
    fi
    
    # Create 401k account
    account_data='{
        "user_id": "'$USER_ID'",
        "account_type": "401k",
        "provider": "Fidelity",
        "balance": 50000
    }'
    
    response=$(curl -s -X POST "$BASE_URL/accounts" \
        -H "Content-Type: application/json" \
        -d "$account_data")
    
    if echo "$response" | grep -q '"success":true'; then
        account_id=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        ACCOUNT_IDS+=("$account_id")
        log_success "401k account created"
        log_info "Account ID: $account_id"
    else
        log_error "401k account creation failed"
        echo "   Response: $response"
        return 1
    fi
    
    # Create brokerage account
    account_data='{
        "user_id": "'$USER_ID'",
        "account_type": "brokerage",
        "provider": "Charles Schwab",
        "balance": 25000
    }'
    
    response=$(curl -s -X POST "$BASE_URL/accounts" \
        -H "Content-Type: application/json" \
        -d "$account_data")
    
    if echo "$response" | grep -q '"success":true'; then
        account_id=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        ACCOUNT_IDS+=("$account_id")
        log_success "Brokerage account created"
        log_info "Account ID: $account_id"
    else
        log_error "Brokerage account creation failed"
        echo "   Response: $response"
        return 1
    fi
}

# Test get accounts
test_get_accounts() {
    log_info "Testing get accounts..."
    
    if [ -z "$USER_ID" ]; then
        log_error "No user ID available"
        return 1
    fi
    
    # Get accounts by user ID
    response=$(curl -s "$BASE_URL/accounts/user/$USER_ID")
    
    if echo "$response" | grep -q '"success":true'; then
        count=$(echo "$response" | grep -o '"count":[0-9]*' | cut -d':' -f2)
        log_success "Retrieved $count accounts for user"
    else
        log_error "Get user accounts failed"
        echo "   Response: $response"
        return 1
    fi
    
    # Get individual account
    if [ ${#ACCOUNT_IDS[@]} -gt 0 ]; then
        account_id="${ACCOUNT_IDS[0]}"
        response=$(curl -s "$BASE_URL/accounts/$account_id")
        
        if echo "$response" | grep -q '"success":true'; then
            log_success "Retrieved individual account"
        else
            log_error "Get individual account failed"
            echo "   Response: $response"
            return 1
        fi
    fi
}

# Test account balance update
test_update_balance() {
    log_info "Testing account balance update..."
    
    if [ ${#ACCOUNT_IDS[@]} -eq 0 ]; then
        log_error "No accounts available"
        return 1
    fi
    
    account_id="${ACCOUNT_IDS[0]}"
    balance_data='{"balance": 75000}'
    
    response=$(curl -s -X PUT "$BASE_URL/accounts/$account_id/balance" \
        -H "Content-Type: application/json" \
        -d "$balance_data")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Account balance updated"
    else
        log_error "Account balance update failed"
        echo "   Response: $response"
        return 1
    fi
}

# Test validation errors
test_validation() {
    log_info "Testing validation errors..."
    
    # Test invalid email
    invalid_user='{
        "full_name": "Invalid User",
        "email": "invalid-email",
        "filing_status": "single",
        "residency_state": "California",
        "residency_city": "San Francisco",
        "age": 30,
        "dependents": 0,
        "risk_tolerance": "medium",
        "goals": ["goal1", "goal2", "goal3"]
    }'
    
    response=$(curl -s -X POST "$BASE_URL/users" \
        -H "Content-Type: application/json" \
        -d "$invalid_user")
    
    if echo "$response" | grep -q '"success":false'; then
        log_success "Email validation working"
    else
        log_error "Email validation failed"
        echo "   Response: $response"
        return 1
    fi
}

# Test error handling
test_error_handling() {
    log_info "Testing error handling..."
    
    # Test non-existent user
    response=$(curl -s "$BASE_URL/users/00000000-0000-0000-0000-000000000000")
    
    if echo "$response" | grep -q '"success":false'; then
        log_success "Non-existent user handling working"
    else
        log_error "Non-existent user handling failed"
        echo "   Response: $response"
        return 1
    fi
    
    # Test non-existent account
    response=$(curl -s "$BASE_URL/accounts/00000000-0000-0000-0000-000000000000")
    
    if echo "$response" | grep -q '"success":false'; then
        log_success "Non-existent account handling working"
    else
        log_error "Non-existent account handling failed"
        echo "   Response: $response"
        return 1
    fi
}

# Cleanup
cleanup() {
    log_info "Cleaning up test data..."
    
    # Delete test accounts
    deleted_count=0
    for account_id in "${ACCOUNT_IDS[@]}"; do
        response=$(curl -s -X DELETE "$BASE_URL/accounts/$account_id")
        if echo "$response" | grep -q '"success":true'; then
            ((deleted_count++))
        fi
    done
    
    log_success "Cleaned up $deleted_count/${#ACCOUNT_IDS[@]} test accounts"
    
    if [ -n "$USER_ID" ]; then
        log_warning "Test user $USER_ID remains in database (no DELETE endpoint)"
    fi
}

# Main test runner
main() {
    echo "🚀 Starting Comprehensive API Test Protocol"
    echo "================================================"
    
    # Check prerequisites
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi
    
    if ! check_server; then
        exit 1
    fi
    
    # Run tests
    passed=0
    failed=0
    
    tests=(
        "test_health:Health Endpoint"
        "test_api_info:API Info"
        "test_create_user:User Creation"
        "test_get_user:Get User"
        "test_create_accounts:Account Creation"
        "test_get_accounts:Get Accounts"
        "test_update_balance:Update Balance"
        "test_validation:Validation"
        "test_error_handling:Error Handling"
    )
    
    for test in "${tests[@]}"; do
        IFS=':' read -r test_func test_name <<< "$test"
        
        echo
        log_info "Running: $test_name"
        
        if $test_func; then
            ((passed++))
        else
            ((failed++))
        fi
    done
    
    # Cleanup
    echo
    cleanup
    
    # Results
    echo
    echo "================================================"
    echo "📊 Test Results Summary"
    echo "================================================"
    log_success "Passed: $passed"
    
    if [ $failed -gt 0 ]; then
        log_error "Failed: $failed"
    else
        echo -e "${GREEN}Failed: $failed${NC}"
    fi
    
    success_rate=$(( (passed * 100) / (passed + failed) ))
    echo "📈 Success Rate: $success_rate%"
    
    if [ $failed -eq 0 ]; then
        echo
        log_success "🎉 All tests passed! API is working correctly."
        exit 0
    else
        echo
        log_error "⚠️  Some tests failed. Please review the output above."
        exit 1
    fi
}

# Run main function
main "$@"
