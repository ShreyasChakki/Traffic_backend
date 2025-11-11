# API Quick Reference - Smart Traffic IoT

## 🔗 Base URL
```
http://localhost:5000/api
```

## 🔐 Authentication Endpoints

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "viewer"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <accessToken>
```

### Logout
```http
POST /auth/logout
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "New Name",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Change Password
```http
PUT /auth/password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "resetToken": "reset-token-from-email",
  "newPassword": "NewPass789"
}
```

## 📊 Dashboard Endpoints (All Protected)

### Get Dashboard Stats
```http
GET /dashboard/stats
Authorization: Bearer <accessToken>
```

### Get Traffic Status
```http
GET /dashboard/traffic-status
Authorization: Bearer <accessToken>
```

### Get Recent Events
```http
GET /dashboard/events?limit=10
Authorization: Bearer <accessToken>
```

### Get Unread Events Count
```http
GET /dashboard/events/unread-count
Authorization: Bearer <accessToken>
```

### Mark Event as Read
```http
PUT /dashboard/events/:id/read
Authorization: Bearer <accessToken>
```

### Mark All Events as Read
```http
PUT /dashboard/events/read-all
Authorization: Bearer <accessToken>
```

### Get Performance Data
```http
GET /dashboard/performance
Authorization: Bearer <accessToken>
```

## 👥 Admin Endpoints (Owner Only)

### Get All Users
```http
GET /admin/users
Authorization: Bearer <accessToken>
```

### Create User
```http
POST /admin/users
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "role": "operator"
}
```

### Get User by ID
```http
GET /admin/users/:id
Authorization: Bearer <accessToken>
```

### Change User Role
```http
PATCH /admin/users/:id/role
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "role": "admin"
}
```

### Activate/Deactivate User
```http
PATCH /admin/users/:id/activate
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "isActive": true
}
```

### Delete User
```http
DELETE /admin/users/:id
Authorization: Bearer <accessToken>
```

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

## 🎭 User Roles
- `owner` - Full system access
- `admin` - Administrative access
- `operator` - Traffic control access
- `viewer` - Read-only access (default)

## 🔑 Token Information
- **Type**: JWT Bearer Token
- **Header Format**: `Authorization: Bearer <token>`
- **Access Token Expiry**: 7 days
- **Refresh Token Expiry**: 7 days
- **Storage**: localStorage or sessionStorage

## ⚠️ HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Server Error

## 🚀 Quick Start (JavaScript)

### Setup
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('accessToken');
```

### Login
```javascript
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
localStorage.setItem('accessToken', data.data.accessToken);
```

### Authenticated Request
```javascript
const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

## 🔄 Token Refresh Flow
1. Access token expires (401 error)
2. Call `/auth/refresh` with refresh token
3. Get new access + refresh tokens
4. Retry original request with new access token
5. If refresh fails, redirect to login

## 🌐 CORS Configuration
- **Allowed Origin**: `http://localhost:5173`
- **Credentials**: Enabled
- **Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS

## 📦 Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Applies to**: All `/api/*` endpoints

## 🔒 Security Features
- Helmet.js security headers
- MongoDB injection protection
- Rate limiting
- Password hashing (bcrypt)
- JWT token authentication
- CORS protection
- Request body size limits (10MB)

## 🧪 Test Endpoint
```http
GET /test/health
```
Response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2025-11-11T06:30:00.000Z"
}
```

## 📌 Important Notes
1. Always include `Authorization` header for protected routes
2. Store tokens securely (avoid XSS vulnerabilities)
3. Handle token refresh automatically
4. Clear tokens on logout
5. Validate user role before showing UI elements
6. Handle 401/403 errors gracefully
7. Use HTTPS in production
8. Never commit tokens to version control

## 🐛 Common Issues

### 401 Unauthorized
- Token missing or invalid
- Token expired (use refresh token)
- Wrong Authorization header format

### 403 Forbidden
- Insufficient permissions
- User role doesn't match required role

### 429 Too Many Requests
- Rate limit exceeded
- Wait before retrying

### CORS Error
- Check CLIENT_URL in backend .env
- Ensure credentials are included in request
