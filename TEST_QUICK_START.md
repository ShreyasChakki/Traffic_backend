# 🚀 QUICK START - Backend Testing

## Step 1: Install Test Dependencies

```bash
npm install --save-dev jest supertest mongodb-memory-server
```

## Step 2: Create Test Environment File

Create `.env.test` in project root:

```env
NODE_ENV=test
JWT_SECRET=test-secret-key-for-testing-only-do-not-use-in-production
JWT_EXPIRE=1h
PORT=5001
```

## Step 3: Update server.js (CRITICAL)

Add this condition before `server.listen()` to prevent server from starting during tests:

```javascript
// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    logger.success(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    // ... rest of server start logic
  });
}
```

## Step 4: Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with verbose output
npm run test:verbose
```

## Expected Output

```
PASS  tests/auth.test.js
PASS  tests/auth-protected.test.js
PASS  tests/test-routes.test.js
PASS  tests/dashboard.test.js
PASS  tests/security.test.js

Test Suites: 5 passed, 5 total
Tests:       149 passed, 149 total
Time:        XX.XXXs
```

## Troubleshooting

### Issue: "Cannot find module '../server'"
**Fix:** Make sure server.js exports `{ app, server, io }`

### Issue: "JWT_SECRET is not defined"
**Fix:** Create `.env.test` file with JWT_SECRET

### Issue: "Tests timeout"
**Fix:** Increase timeout in package.json jest config (already set to 30000ms)

### Issue: "Port already in use"
**Fix:** Make sure server.js has the NODE_ENV check to prevent starting in test mode

### Issue: "MongoDB connection error"
**Fix:** Tests use in-memory MongoDB, no real DB needed

## Test Coverage Goals

- **Routes:** 100% (22/22 routes)
- **Controllers:** >85%
- **Middleware:** >90%
- **Models:** >80%

## Next Steps After Tests Pass

1. ✅ Review test coverage report
2. ✅ Add more edge case tests if needed
3. ✅ Integrate into CI/CD pipeline
4. ✅ Set up pre-commit hooks to run tests
5. ✅ Monitor test execution time
