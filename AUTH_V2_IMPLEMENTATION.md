# Authentication V2 - Implementation Guide

Step-by-step guide to implement the enhanced authentication system.

---

## 📦 What's New in V2

### ✨ New Features
- ✅ Refresh token system
- ✅ Token rotation on refresh
- ✅ Logout from single device
- ✅ Logout from all devices
- ✅ Forgot password flow
- ✅ Reset password with token
- ✅ Role-based permissions (matching frontend)
- ✅ Permission checking endpoint
- ✅ Enhanced security
- ✅ Better error handling
- ✅ Standardized response format

### 🔄 Changes from V1
- Access tokens remain same (JWT)
- Added refresh tokens (database-stored)
- Enhanced User model with reset password fields
- New RefreshToken model
- Permission middleware
- Improved auth controller
- Better route organization

---

## ✅ Implementation Checklist

### Phase 1: Basic Setup ✅

- [x] Create backend folder
- [x] Install dependencies
- [x] Create .env file
- [x] Setup MongoDB connection

**Already completed in your project!**

---

### Phase 2: Models ✅

- [x] User model with roles
- [x] RefreshToken model
- [x] Password hashing
- [x] Reset password fields

**Files Created:**
- `src/models/User.js` (updated with reset fields)
- `src/models/RefreshToken.js` (new)

---

### Phase 3: Authentication ✅

- [x] Register endpoint
- [x] Login endpoint
- [x] Token generation
- [x] Token verification
- [x] Refresh token endpoint
- [x] Forgot password endpoint
- [x] Reset password endpoint

**Files Created:**
- `src/controllers/authControllerV2.js`

---

### Phase 4: Authorization ✅

- [x] Auth middleware (existing)
- [x] Role middleware
- [x] Permission checking
- [x] Permission endpoint

**Files Created:**
- `src/middleware/permissions.js`

---

### Phase 5: Routes & App Structure ✅

- [x] Enhanced auth routes
- [x] app.js structure
- [x] serverV2.js with Socket.IO

**Files Created:**
- `app.js`
- `serverV2.js`
- `src/routes/authRoutesV2.js`

---

### Phase 6: Testing 🔄

- [ ] Test registration
- [ ] Test login
- [ ] Test refresh token
- [ ] Test protected routes
- [ ] Test role permissions
- [ ] Test forgot/reset password
- [ ] Test logout flows
- [ ] Connect to frontend

**Testing Guide:** See `AUTH_V2_TESTING.md`

---

## 🚀 How to Use

### Option 1: Use New System (Recommended)

1. **Update package.json scripts:**
```json
{
  "scripts": {
    "start": "node serverV2.js",
    "dev": "nodemon serverV2.js",
    "seed": "node src/utils/seeder.js"
  }
}
```

2. **Start server:**
```bash
npm run dev
```

3. **Test endpoints:**
```bash
# Use new auth routes
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/me
GET  /api/auth/permissions
```

---

### Option 2: Gradual Migration

Keep both systems running:

1. **Rename old files:**
```bash
mv server.js serverV1.js
mv src/routes/authRoutes.js src/routes/authRoutesV1.js
mv src/controllers/authController.js src/controllers/authControllerV1.js
```

2. **Use new files:**
```bash
mv serverV2.js server.js
mv src/routes/authRoutesV2.js src/routes/authRoutes.js
mv src/controllers/authControllerV2.js src/controllers/authController.js
```

3. **Update app.js imports if needed**

---

## 📁 File Structure

```
TrafficBackend/
├── app.js                          # Express app (NEW)
├── server.js                       # Server entry (use serverV2.js)
├── serverV2.js                     # New server with Socket.IO
│
├── src/
│   ├── models/
│   │   ├── User.js                 # Updated with reset fields
│   │   ├── RefreshToken.js         # NEW
│   │   ├── Intersection.js
│   │   ├── TrafficData.js
│   │   └── Event.js
│   │
│   ├── controllers/
│   │   ├── authController.js       # Old (keep for reference)
│   │   ├── authControllerV2.js     # NEW - Enhanced
│   │   └── dashboardController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js           # Old (keep for reference)
│   │   ├── authRoutesV2.js         # NEW - Enhanced
│   │   ├── dashboardRoutes.js
│   │   └── testRoutes.js
│   │
│   ├── middleware/
│   │   ├── auth.js                 # Existing (still used)
│   │   ├── permissions.js          # NEW - Role permissions
│   │   ├── errorHandler.js
│   │   └── asyncHandler.js
│   │
│   ├── services/
│   │   ├── analyticsService.js
│   │   ├── trafficSimulator.js
│   │   ├── jobs.js
│   │   └── ...
│   │
│   └── utils/
│       ├── validators.js
│       ├── cache.js
│       └── ...
│
└── docs/
    ├── AUTH_V2_TESTING.md          # NEW - Testing guide
    ├── AUTH_V2_IMPLEMENTATION.md   # NEW - This file
    ├── DASHBOARD_API.md
    └── ...
```

---

## 🔧 Configuration

### Environment Variables

No changes needed! Same `.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart_traffic
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

## 🔑 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

---

## 🎯 Key Differences from V1

### V1 (Old System)
```javascript
// Login returns only access token
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": { user }
}

// No refresh token
// No forgot/reset password
// Basic role checking
```

### V2 (New System)
```javascript
// Login returns both tokens
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4e5f6..."
  }
}

// Has refresh token endpoint
// Has forgot/reset password
// Detailed permission system
// Logout from all devices
```

---

## 🔐 Security Improvements

### Token Management
- ✅ Refresh tokens stored in database
- ✅ Token rotation on refresh
- ✅ Automatic cleanup of expired tokens
- ✅ Revoke tokens on password change
- ✅ Revoke all tokens on logout-all

### Password Security
- ✅ Forgot password flow
- ✅ Reset token with expiration (10 minutes)
- ✅ Hashed reset tokens
- ✅ Force re-login after password change

### Permission System
- ✅ Granular permissions per role
- ✅ Frontend-backend permission sync
- ✅ Easy to extend
- ✅ Permission checking middleware

---

## 📊 Database Schema

### RefreshToken Collection
```javascript
{
  _id: ObjectId,
  token: String (unique, indexed),
  userId: ObjectId (indexed),
  expiresAt: Date (indexed),
  createdByIp: String,
  revokedAt: Date,
  revokedByIp: String,
  replacedByToken: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### User Collection (Updated)
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (admin/operator/viewer),
  avatar: String,
  isActive: Boolean,
  lastLogin: Date,
  resetPasswordToken: String,      // NEW
  resetPasswordExpire: Date,       // NEW
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing Strategy

### 1. Unit Tests (Manual for now)
- Test each endpoint individually
- Verify response format
- Check error handling

### 2. Integration Tests
- Test complete flows (register → login → access)
- Test token refresh flow
- Test password reset flow

### 3. Security Tests
- Test with expired tokens
- Test with invalid tokens
- Test role-based access
- Test permission checking

### 4. Frontend Integration
- Connect React/Vue frontend
- Test authentication flow
- Verify permissions work
- Test token refresh in frontend

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to strong random string
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Set up email service for password reset
- [ ] Remove resetToken from forgot-password response
- [ ] Enable HTTPS
- [ ] Set up rate limiting for auth endpoints
- [ ] Configure session timeouts
- [ ] Set up monitoring and logging
- [ ] Test all endpoints in production environment
- [ ] Document API for frontend team
- [ ] Create admin user in production DB

---

## 📝 Frontend Integration Guide

### 1. Store Tokens
```javascript
// After login/register
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
localStorage.setItem('user', JSON.stringify(data.user));
```

### 2. API Interceptor
```javascript
// Add token to all requests
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Handle Token Expiry
```javascript
// Refresh token on 401
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      try {
        const { data } = await axios.post('/api/auth/refresh', {
          refreshToken
        });
        
        // Update tokens
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        
        // Retry original request
        error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return axios(error.config);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### 4. Check Permissions
```javascript
// Fetch user permissions
const { data } = await axios.get('/api/auth/permissions');
const permissions = data.data.permissions;

// Check permission
if (permissions.modifySignals) {
  // Show modify button
}

if (permissions.overrideSignals) {
  // Show override button
}
```

### 5. Logout
```javascript
// Single device logout
await axios.post('/api/auth/logout', {
  refreshToken: localStorage.getItem('refreshToken')
});

// All devices logout
await axios.post('/api/auth/logout-all');

// Clear local storage
localStorage.clear();
```

---

## 🎓 Best Practices

### Token Management
1. Store tokens securely (httpOnly cookies in production)
2. Implement automatic token refresh
3. Handle token expiry gracefully
4. Clear tokens on logout

### Error Handling
1. Show user-friendly error messages
2. Log errors for debugging
3. Handle network errors
4. Validate input before sending

### Security
1. Use HTTPS in production
2. Implement CSRF protection
3. Rate limit auth endpoints
4. Monitor for suspicious activity
5. Implement account lockout after failed attempts

### User Experience
1. Show loading states
2. Provide clear feedback
3. Remember user preferences
4. Implement "remember me" feature
5. Auto-logout on inactivity

---

## 🐛 Common Issues & Solutions

### Issue: Tokens not working
**Solution:** Check token format, expiration, and JWT_SECRET matches.

### Issue: Refresh token invalid
**Solution:** Token may be revoked or expired. Login again.

### Issue: Permissions not matching
**Solution:** Verify PERMISSIONS object in `permissions.js` matches frontend.

### Issue: Password reset not working
**Solution:** Check reset token hasn't expired (10 minutes). Generate new one.

### Issue: Can't logout from all devices
**Solution:** Ensure refresh tokens are being created and stored properly.

---

## 📞 Support

For issues or questions:
1. Check `AUTH_V2_TESTING.md` for testing examples
2. Review error messages carefully
3. Check server logs
4. Verify MongoDB connection
5. Test with Postman/cURL first

---

## ✅ Success Criteria

System is ready when:
- ✅ All test cases pass
- ✅ Tokens refresh correctly
- ✅ Permissions match frontend
- ✅ Password reset works
- ✅ Logout flows work
- ✅ No security vulnerabilities
- ✅ Frontend integration successful
- ✅ Documentation complete

---

**Ready to implement! Follow the testing guide to verify everything works.**
