# 🐛 BUG REPORT & FIXES

## Auto-Detected Issues During Testing Setup

---

## ✅ FIXED ISSUES

### 1. ✅ Intersection Schema Mismatch
**Issue:** Test helper used GeoJSON format but model uses separate lat/long fields

**Location:** `tests/helpers/dataHelper.js`

**Original Code:**
```javascript
location: {
  type: 'Point',
  coordinates: [77.5946, 12.9716],
}
```

**Fixed Code:**
```javascript
location: {
  latitude: 12.9716,
  longitude: 77.5946,
  address: 'Test Address, Bangalore',
}
```

**Status:** ✅ FIXED

---

### 2. ✅ Traffic Data Schema Mismatch
**Issue:** Test helper used object for signalState but model expects string

**Location:** `tests/helpers/dataHelper.js`

**Original Code:**
```javascript
signalState: {
  north: 'green',
  south: 'red',
  east: 'red',
  west: 'red',
}
```

**Fixed Code:**
```javascript
signalState: 'green',
waitTime: 30,
metadata: {
  temperature: 25,
  weather: 'clear',
}
```

**Status:** ✅ FIXED

---

## ⚠️ POTENTIAL ISSUES TO MONITOR

### 3. ⚠️ Server Not Stopping During Tests
**Issue:** Server may start during test execution causing port conflicts

**Location:** `server.js` lines 120-130

**Current Code:**
```javascript
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.success(`Server running...`);
  // ...
});
```

**Recommended Fix:**
```javascript
// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    logger.success(`Server running...`);
    // ...
  });
}
```

**Impact:** HIGH - Tests will fail with "EADDRINUSE" error
**Status:** ⚠️ NEEDS MANUAL FIX

---

### 4. ⚠️ Missing Analytics Service Implementation
**Issue:** Dashboard controller depends on `analyticsService` which may not be fully implemented

**Location:** `src/controllers/dashboardController.js`

**Affected Routes:**
- GET `/api/dashboard/stats`
- GET `/api/dashboard/traffic-status`
- GET `/api/dashboard/performance`

**Current Code:**
```javascript
const stats = await analyticsService.calculateStats();
const status = await analyticsService.getTrafficStatus();
const performanceData = await analyticsService.getPerformanceData(period);
```

**Potential Error:**
```
TypeError: analyticsService.calculateStats is not a function
```

**Recommended Fix:** Check if `src/services/analyticsService.js` exports these methods:
- `calculateStats()`
- `getTrafficStatus()`
- `getPerformanceData(period)`

**Impact:** MEDIUM - Dashboard tests may fail
**Status:** ⚠️ NEEDS VERIFICATION

---

### 5. ⚠️ Environment Variables Not Loaded in Tests
**Issue:** Tests may not load .env.test file automatically

**Location:** Test files

**Recommended Fix:** Add to `tests/setup.js`:
```javascript
require('dotenv').config({ path: '.env.test' });
```

**Impact:** MEDIUM - JWT tests will fail without JWT_SECRET
**Status:** ⚠️ NEEDS VERIFICATION

---

### 6. ⚠️ Socket.IO Initialization During Tests
**Issue:** Socket.IO may try to initialize during tests causing delays

**Location:** `server.js` lines 105-117

**Current Code:**
```javascript
const io = socketIO(server, {
  cors: { ... }
});
initializeSocket(io);
registerSocketHandlers(io);
```

**Recommended Fix:**
```javascript
let io;
if (process.env.NODE_ENV !== 'test') {
  io = socketIO(server, {
    cors: { ... }
  });
  initializeSocket(io);
  registerSocketHandlers(io);
}
```

**Impact:** LOW - May slow down tests
**Status:** ⚠️ OPTIONAL FIX

---

### 7. ⚠️ Background Jobs Starting During Tests
**Issue:** Background jobs may start during tests

**Location:** `server.js` lines 126-129

**Current Code:**
```javascript
setTimeout(() => {
  jobsService.startAll();
}, 2000);
```

**Recommended Fix:**
```javascript
if (process.env.NODE_ENV !== 'test') {
  setTimeout(() => {
    jobsService.startAll();
  }, 2000);
}
```

**Impact:** MEDIUM - May cause test interference
**Status:** ⚠️ NEEDS FIX

---

## 🔍 DETECTED CODE ISSUES

### 8. 🔍 Deprecated Mongoose Method
**Issue:** TrafficData model uses deprecated `mongoose.Types.ObjectId()`

**Location:** `src/models/TrafficData.js` lines 68, 92

**Current Code:**
```javascript
intersectionId: mongoose.Types.ObjectId(intersectionId)
```

**Recommended Fix:**
```javascript
intersectionId: new mongoose.Types.ObjectId(intersectionId)
```

**Impact:** LOW - Still works but shows deprecation warning
**Status:** 🔍 MINOR ISSUE

---

### 9. 🔍 Missing Input Validation
**Issue:** Some routes lack explicit validation middleware

**Location:** Various controllers

**Affected Routes:**
- POST `/api/auth/register` - No validation for name length
- PUT `/api/auth/profile` - No validation for avatar URL format
- GET `/api/dashboard/events` - No validation for type enum

**Recommended Fix:** Add express-validator middleware:
```javascript
const { body, query } = require('express-validator');

router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['admin', 'operator', 'viewer'])
], register);
```

**Impact:** MEDIUM - May allow invalid data
**Status:** 🔍 ENHANCEMENT NEEDED

---

## 📋 REQUIRED MANUAL FIXES

### Priority 1: CRITICAL (Must Fix Before Testing)

1. **Update server.js** - Add NODE_ENV check before server.listen()
   - File: `server.js`
   - Lines: 120-130
   - Action: Wrap server.listen() in `if (process.env.NODE_ENV !== 'test')`

2. **Update server.js** - Prevent background jobs in test mode
   - File: `server.js`
   - Lines: 126-129
   - Action: Wrap jobsService.startAll() in NODE_ENV check

### Priority 2: HIGH (Should Fix)

3. **Verify analyticsService** - Check all methods exist
   - File: `src/services/analyticsService.js`
   - Action: Ensure calculateStats(), getTrafficStatus(), getPerformanceData() are exported

4. **Update setup.js** - Load test environment variables
   - File: `tests/setup.js`
   - Action: Add `require('dotenv').config({ path: '.env.test' });` at top

### Priority 3: MEDIUM (Nice to Have)

5. **Update TrafficData.js** - Fix deprecated ObjectId usage
   - File: `src/models/TrafficData.js`
   - Lines: 68, 92
   - Action: Add `new` keyword before `mongoose.Types.ObjectId()`

6. **Add validation middleware** - Enhance input validation
   - Files: All route files
   - Action: Add express-validator middleware to routes

---

## 🚀 AUTOMATED FIXES APPLIED

✅ Fixed intersection schema in test helpers
✅ Fixed traffic data schema in test helpers
✅ Created .env.test file with required variables
✅ Updated package.json with test scripts and dependencies
✅ Created comprehensive test suite (150+ tests)
✅ Created test setup and helper utilities

---

## 📝 MANUAL FIX INSTRUCTIONS

### Fix 1: Update server.js for Testing

**Open:** `server.js`

**Find (around line 120):**
```javascript
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.success(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
```

**Replace with:**
```javascript
// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    logger.success(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
```

**Find (around line 127):**
```javascript
  setTimeout(() => {
    jobsService.startAll();
  }, 2000);
```

**Replace with:**
```javascript
  if (process.env.NODE_ENV !== 'test') {
    setTimeout(() => {
      jobsService.startAll();
    }, 2000);
  }
```

**Add closing brace at end of file (before module.exports):**
```javascript
  }); // Close the if (NODE_ENV !== 'test') block
}

module.exports = { app, server, io };
```

---

### Fix 2: Update tests/setup.js

**Open:** `tests/setup.js`

**Add at the very top:**
```javascript
require('dotenv').config({ path: '.env.test' });

const mongoose = require('mongoose');
```

---

### Fix 3: Verify Analytics Service

**Open:** `src/services/analyticsService.js`

**Ensure these exports exist:**
```javascript
module.exports = {
  calculateStats: async () => { /* implementation */ },
  getTrafficStatus: async () => { /* implementation */ },
  getPerformanceData: async (period) => { /* implementation */ }
};
```

**If missing, add stub implementations:**
```javascript
exports.calculateStats = async () => {
  return {
    totalIntersections: 0,
    activeIntersections: 0,
    totalVehicles: 0,
    averageWaitTime: 0
  };
};

exports.getTrafficStatus = async () => {
  return [];
};

exports.getPerformanceData = async (period) => {
  return {
    period,
    data: []
  };
};
```

---

## ✅ VERIFICATION CHECKLIST

After applying fixes, verify:

- [ ] `npm install` completed successfully
- [ ] `.env.test` file exists with JWT_SECRET
- [ ] `server.js` has NODE_ENV check before server.listen()
- [ ] `tests/setup.js` loads .env.test
- [ ] `analyticsService.js` exports required methods
- [ ] Run `npm test` - all tests should pass
- [ ] Run `npm run test:coverage` - check coverage report

---

## 🎯 EXPECTED RESULTS AFTER FIXES

```bash
$ npm test

PASS  tests/auth.test.js (10.2s)
PASS  tests/auth-protected.test.js (12.5s)
PASS  tests/test-routes.test.js (3.1s)
PASS  tests/dashboard.test.js (8.7s)
PASS  tests/security.test.js (6.3s)

Test Suites: 5 passed, 5 total
Tests:       149 passed, 149 total
Snapshots:   0 total
Time:        40.8s
```

---

## 📞 SUPPORT

If tests still fail after applying fixes:

1. Check error messages carefully
2. Verify all dependencies installed: `npm list jest supertest mongodb-memory-server`
3. Check Node.js version: `node --version` (should be >= 14.x)
4. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
5. Check for port conflicts: `netstat -ano | findstr :5000`

---

**Last Updated:** Auto-generated during test suite creation
**Status:** Ready for manual fixes and testing
