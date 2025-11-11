# Quick Start - Authentication V2

Get started with the enhanced authentication system in 5 minutes!

---

## 🚀 Quick Setup

### 1. Start Server with V2 Authentication

```bash
# Development mode with auto-reload
npm run dev:v2

# Or production mode
npm start:v2
```

**Expected Output:**
```
✅ MongoDB Connected
🚀 Server running in development mode on port 5000
✅ Socket.IO initialized successfully
🚦 Traffic simulator started
✅ All background jobs started
```

---

### 2. Register Your First User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@test.com",
    "password": "Admin123",
    "role": "admin"
  }'
```

**Save the tokens from response!**

---

### 3. Test Authentication

```bash
# Set your access token (from registration response)
$ACCESS_TOKEN="your_access_token_here"

# Get your user info
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:5000/api/auth/me

# Check your permissions
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:5000/api/auth/permissions
```

---

### 4. Access Dashboard

```bash
# Get dashboard stats
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:5000/api/dashboard/stats

# Get traffic status
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:5000/api/dashboard/traffic-status
```

---

## 🎯 What You Get

### ✅ Enhanced Authentication
- Register with role selection
- Login with email/password
- Refresh token system
- Forgot/reset password
- Logout from single or all devices

### ✅ Role-Based Permissions
- **Admin:** Full access
- **Operator:** Limited access (no override, no user management)
- **Viewer:** Read-only access

### ✅ Secure Token Management
- Access tokens (JWT)
- Refresh tokens (database-stored)
- Automatic token rotation
- Token revocation on logout

---

## 📋 Quick Test Commands

### Register Different Roles

```bash
# Admin
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"Admin123","role":"admin"}'

# Operator
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Operator","email":"operator@test.com","password":"Operator123","role":"operator"}'

# Viewer
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Viewer","email":"viewer@test.com","password":"Viewer123","role":"viewer"}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123"}'
```

### Refresh Token

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your_refresh_token_here"}'
```

### Update Profile

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'
```

### Change Password

```bash
curl -X PUT http://localhost:5000/api/auth/password \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Admin123","newPassword":"NewAdmin123"}'
```

### Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your_refresh_token_here"}'
```

---

## 🔑 Role Permissions Quick Reference

| Permission | Admin | Operator | Viewer |
|------------|-------|----------|--------|
| View Dashboard | ✅ | ✅ | ✅ |
| View Map | ✅ | ✅ | ✅ |
| View Analytics | ✅ | ✅ | ✅ |
| Modify Signals | ✅ | ✅ | ❌ |
| Override Signals | ✅ | ❌ | ❌ |
| Manage Emergencies | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| View Settings | ✅ | ✅ | ❌ |
| Modify Settings | ✅ | ❌ | ❌ |

---

## 📁 Key Files

```
app.js                          # Express app configuration
serverV2.js                     # Server with Socket.IO
src/
  models/
    RefreshToken.js             # Refresh token model
  controllers/
    authControllerV2.js         # Enhanced auth controller
  routes/
    authRoutesV2.js             # Enhanced auth routes
  middleware/
    permissions.js              # Role permissions
```

---

## 🔧 Configuration

Uses same `.env` file - no changes needed!

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart_traffic
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

## 📚 Documentation

- **AUTH_V2_TESTING.md** - Complete testing guide
- **AUTH_V2_IMPLEMENTATION.md** - Implementation details
- **QUICK_REFERENCE.md** - API quick reference

---

## ✅ Verify Everything Works

```bash
# 1. Health check
curl http://localhost:5000/api/test/health

# 2. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test123","role":"admin"}'

# 3. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123"}'

# 4. Get user (use token from login)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/me

# 5. Check permissions
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/permissions
```

**All should return success responses!**

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check MongoDB is running
mongod

# Check port is available
netstat -ano | findstr :5000
```

### Can't register user
```bash
# Check MongoDB connection
curl http://localhost:5000/api/test/db

# Check request format
# Email must be valid
# Password must be 6+ characters
```

### Token not working
```bash
# Check token format
# Should be: Bearer YOUR_TOKEN

# Check token hasn't expired
# Default: 7 days

# Use refresh token to get new one
```

---

## 🎓 Next Steps

1. ✅ Test all endpoints (see AUTH_V2_TESTING.md)
2. ✅ Integrate with frontend
3. ✅ Test Socket.IO with authentication
4. ✅ Implement email service for password reset
5. ✅ Deploy to production

---

## 🚀 Ready to Go!

Your enhanced authentication system is ready. Start testing with the commands above or check the complete testing guide in `AUTH_V2_TESTING.md`.

**Happy coding! 🎉**
