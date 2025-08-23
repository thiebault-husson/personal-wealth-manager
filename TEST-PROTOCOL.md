# 🧪 Comprehensive Test Protocol

This document outlines the comprehensive test protocol for the Personal Wealth Manager API to verify all implemented functionalities work as expected.

## 📋 Prerequisites

1. **Server Running**: Ensure the API server is running on `http://localhost:3001`
   ```bash
   npm run dev
   ```

2. **ChromaDB Running**: Ensure ChromaDB is running on `http://localhost:8000`
   ```bash
   npm run chromadb
   ```

3. **Environment**: Ensure `.env` file is properly configured

## 🚀 Quick Test Options

### Option 1: Automated JavaScript Test (Recommended)
```bash
npm run test-api
```

### Option 2: Shell Script Test
```bash
npm run test-api-shell
```

### Option 3: Manual Testing (See sections below)

## 🔍 Manual Test Protocol

### 1. Health Check Tests

#### Test 1.1: Health Endpoint
```bash
curl -s http://localhost:3001/health | jq .
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Personal Wealth Manager API is running",
  "timestamp": "2024-08-23T...",
  "version": "1.0.0",
  "users_count": 0
}
```

#### Test 1.2: API Info Endpoint
```bash
curl -s http://localhost:3001/ | jq .
```

**Expected Response:**
```json
{
  "name": "Personal Wealth Manager API",
  "description": "AI-powered personal financial advisor with RAG capabilities",
  "endpoints": {
    "health": "/health",
    "users": "/users",
    "accounts": "/accounts",
    "query": "/query (coming soon)"
  }
}
```

### 2. User Management Tests

#### Test 2.1: Create User
```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Test User",
    "email": "john.test@example.com",
    "filing_status": "single",
    "residency_state": "New York",
    "residency_city": "New York City",
    "age": 35,
    "dependents": 0,
    "risk_tolerance": "medium",
    "goals": [
      "Save for retirement by maximizing 401k contributions",
      "Build emergency fund with 6 months expenses",
      "Optimize tax strategy for high-income bracket"
    ]
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "full_name": "John Test User",
    "email": "john.test@example.com",
    "filing_status": "single",
    "residency_state": "New York",
    "residency_city": "New York City",
    "age": 35,
    "dependents": 0,
    "risk_tolerance": "medium",
    "goals": ["...", "...", "..."]
  },
  "message": "User created successfully"
}
```

**Save the user ID from response for subsequent tests.**

#### Test 2.2: Get User by ID
```bash
curl -s http://localhost:3001/users/{USER_ID} | jq .
```

#### Test 2.3: Test User Validation - Invalid Email
```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Invalid User",
    "email": "invalid-email",
    "filing_status": "single",
    "residency_state": "California",
    "residency_city": "San Francisco",
    "age": 30,
    "dependents": 0,
    "risk_tolerance": "medium",
    "goals": ["goal1", "goal2", "goal3"]
  }' | jq .
```

**Expected:** Status 422 with validation error.

#### Test 2.4: Test Duplicate Email Prevention
Re-run Test 2.1 with the same email.

**Expected:** Status 409 with duplicate email error.

### 3. Account Management Tests

#### Test 3.1: Create 401k Account
```bash
curl -X POST http://localhost:3001/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "{USER_ID}",
    "account_type": "401k",
    "provider": "Fidelity",
    "balance": 125000.50
  }' | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "account-uuid-here",
    "user_id": "{USER_ID}",
    "account_type": "401k",
    "provider": "Fidelity",
    "balance": 125000.50,
    "currency": "USD"
  },
  "message": "Account created successfully"
}
```

**Save the account ID for subsequent tests.**

#### Test 3.2: Create Brokerage Account
```bash
curl -X POST http://localhost:3001/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "{USER_ID}",
    "account_type": "brokerage",
    "provider": "Charles Schwab",
    "balance": 75000.25
  }' | jq .
```

#### Test 3.3: Create Roth IRA Account
```bash
curl -X POST http://localhost:3001/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "{USER_ID}",
    "account_type": "roth_ira",
    "provider": "Vanguard",
    "balance": 45000.00
  }' | jq .
```

#### Test 3.4: Get Account by ID
```bash
curl -s http://localhost:3001/accounts/{ACCOUNT_ID} | jq .
```

#### Test 3.5: Get All Accounts for User
```bash
curl -s http://localhost:3001/accounts/user/{USER_ID} | jq .
```

**Expected:** Array of all accounts created for the user.

#### Test 3.6: Update Account Balance
```bash
curl -X PUT http://localhost:3001/accounts/{ACCOUNT_ID}/balance \
  -H "Content-Type: application/json" \
  -d '{"balance": 150000.75}' | jq .
```

#### Test 3.7: Verify Balance Update
Re-run Test 3.4 to verify the balance was updated.

#### Test 3.8: Test Account Validation - Invalid User ID
```bash
curl -X POST http://localhost:3001/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "invalid-uuid",
    "account_type": "401k",
    "provider": "Test Provider",
    "balance": 1000
  }' | jq .
```

**Expected:** Status 422 with validation error.

#### Test 3.9: Test Account Validation - Non-existent User
```bash
curl -X POST http://localhost:3001/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000000",
    "account_type": "401k",
    "provider": "Test Provider",
    "balance": 1000
  }' | jq .
```

**Expected:** Status 404 with "User not found" error.

### 4. Error Handling Tests

#### Test 4.1: Non-existent User
```bash
curl -s http://localhost:3001/users/00000000-0000-0000-0000-000000000000 | jq .
```

**Expected:** Status 404 with error message.

#### Test 4.2: Non-existent Account
```bash
curl -s http://localhost:3001/accounts/00000000-0000-0000-0000-000000000000 | jq .
```

**Expected:** Status 404 with error message.

#### Test 4.3: Invalid JSON
```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d 'invalid-json' | jq .
```

**Expected:** Status 400 or 422 with JSON parsing error.

#### Test 4.4: Health Check with ChromaDB Down
1. Stop ChromaDB: `docker stop $(docker ps -q --filter ancestor=chromadb/chroma:latest)`
2. Test health endpoint: `curl -s http://localhost:3001/health | jq .`

**Expected:** Status 503 with "degraded" status.

3. Restart ChromaDB: `npm run chromadb &`

### 5. Data Persistence Tests

#### Test 5.1: Server Restart Persistence
1. Create user and accounts (Tests 2.1 and 3.1-3.3)
2. Restart server: Stop with Ctrl+C, then `npm run dev`
3. Verify data persists: Re-run Tests 2.2 and 3.5

**Expected:** All data should persist after server restart.

#### Test 5.2: ChromaDB Restart Persistence
1. Create user and accounts
2. Stop ChromaDB: `docker stop $(docker ps -q --filter ancestor=chromadb/chroma:latest)`
3. Start ChromaDB: `npm run chromadb &`
4. Wait 5 seconds for initialization
5. Verify data persists

**Expected:** All data should persist after ChromaDB restart.

### 6. Performance Tests

#### Test 6.1: Multiple Users
Create 10 users with different emails and verify all can be retrieved.

#### Test 6.2: Multiple Accounts per User
Create 5 different account types for one user and verify all can be retrieved.

#### Test 6.3: Large Balance Numbers
Test with very large balance numbers (e.g., 999999999.99) to verify number handling.

## 🧹 Cleanup

### Delete Test Accounts
```bash
curl -X DELETE http://localhost:3001/accounts/{ACCOUNT_ID}
```

**Note:** There's currently no DELETE endpoint for users, so test users will remain in the database.

## 📊 Expected Test Results

### Success Criteria
- ✅ All health endpoints return 200 status
- ✅ User creation, retrieval, and validation work correctly
- ✅ Account CRUD operations work correctly
- ✅ Data persists across server/database restarts
- ✅ Error handling returns appropriate status codes
- ✅ Validation prevents invalid data entry

### Performance Criteria
- ✅ Health check responds within 100ms
- ✅ User operations complete within 500ms
- ✅ Account operations complete within 500ms
- ✅ Database queries handle pagination correctly

## 🚨 Troubleshooting

### Common Issues

1. **Server not responding**
   - Check if server is running: `ps aux | grep tsx`
   - Check port 3001: `lsof -i :3001`
   - Restart server: `npm run dev`

2. **ChromaDB connection errors**
   - Check if ChromaDB is running: `docker ps`
   - Check port 8000: `lsof -i :8000`
   - Restart ChromaDB: `npm run chromadb`

3. **Test failures**
   - Check server logs for error messages
   - Verify .env file configuration
   - Ensure all dependencies are installed: `npm install`

4. **Permission errors with shell script**
   - Make script executable: `chmod +x test-api.sh`

## 📝 Test Report Template

```
# Test Report - [Date]

## Environment
- Node.js Version: 
- Server Status: Running/Not Running
- ChromaDB Status: Running/Not Running
- Test Method: Automated/Manual

## Results Summary
- Total Tests: X
- Passed: X
- Failed: X
- Success Rate: X%

## Failed Tests
1. Test Name: [Description of failure]
2. ...

## Performance Metrics
- Average response time: Xms
- Health check time: Xms
- Database operations: Xms

## Recommendations
- [Any issues found]
- [Suggested improvements]
```

---

## 🎯 Next Steps After Testing

1. **If all tests pass**: Proceed with Position Management API
2. **If tests fail**: Review error logs and fix issues
3. **Performance issues**: Consider optimization strategies
4. **Add missing features**: Based on test results

**Happy Testing! 🧪✨**
