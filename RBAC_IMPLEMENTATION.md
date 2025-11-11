# Complete RBAC System Implementation

## Overview
This document describes the complete Role-Based Access Control (RBAC) system implemented for the Smart Traffic IoT Backend.

## Roles

The system supports 4 roles with hierarchical permissions:

1. **owner** - Full system access, can manage all users and roles
2. **admin** - Administrative access (cannot manage users)
3. **operator** - Operational access
4. **viewer** - Read-only access

## Key Security Features

### ✅ 1. Forced Viewer Role on Registration
- **Location**: `src/controllers/authController.js`
- **Behavior**: All self-registered users are ALWAYS created as `viewer`
- **Security**: Backend ignores any `role` field sent by client during registration
- **Code**:
```javascript
// Create user - ALWAYS force role to 'viewer' for self-registration
const user = await User.create({
  name,
  email,
  password,
  role: 'viewer' // Hardcoded, ignores client input
});
```

### ✅ 2. JWT Contains Role
- **Location**: `src/models/User.js`
- **Behavior**: JWT token includes `id`, `email`, and `role`
- **Code**:
```javascript
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};
```

### ✅ 3. Owner Bootstrap
- **Location**: `src/utils/bootstrapOwner.js`
- **Behavior**: Automatically creates/ensures owner account on server startup
- **Configuration**: Set `OWNER_EMAIL` in `.env` file
- **Process**:
  1. If user with `OWNER_EMAIL` exists → ensure role is `owner`
  2. If user doesn't exist → create new owner with default password
  3. Default password: `OWNER_DEFAULT_PASSWORD` (default: `Owner@123456`)

### ✅ 4. Authorization Middleware
- **Location**: `src/middleware/auth.js`
- **Middleware**: `requireRole(...roles)`
- **Behavior**:
  - Returns `401` if user not logged in
  - Returns `403` if logged in but role not allowed
- **Usage**:
```javascript
router.post('/users', requireRole('owner'), createUser);
```

## API Endpoints

### Public Endpoints

#### Register (Always Creates Viewer)
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "user": {
      "role": "viewer",  // Always viewer
      ...
    },
    "token": "jwt_token_here"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "Owner@123456"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": {
      "role": "owner",
      ...
    },
    "token": "jwt_token_with_role"
  }
}
```

### Owner-Only Endpoints

#### Create Admin/Operator User
```http
POST /api/admin/users
Authorization: Bearer {owner_token}
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin"  // Must be 'admin' or 'operator'
}

Response: 201 Created
{
  "success": true,
  "data": {
    "role": "admin",
    ...
  }
}
```

**Validation**:
- ✅ Role must be `admin` or `operator`
- ❌ Cannot create `owner` via API
- ❌ Cannot create `viewer` (use public registration)

#### Change User Role
```http
PATCH /api/admin/users/:id/role
Authorization: Bearer {owner_token}
Content-Type: application/json

{
  "role": "admin"  // Must be 'admin', 'operator', or 'viewer'
}

Response: 200 OK
{
  "success": true,
  "data": {
    "role": "admin",
    ...
  }
}
```

**Validation**:
- ✅ Can change to `admin`, `operator`, or `viewer`
- ❌ Cannot assign `owner` role via API
- ❌ Cannot change existing owner's role
- ❌ Cannot demote last owner

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer {owner_token}

Response: 200 OK
{
  "success": true,
  "count": 10,
  "data": [...]
}
```

#### Get User by ID
```http
GET /api/admin/users/:id
Authorization: Bearer {owner_token}

Response: 200 OK
{
  "success": true,
  "data": {...}
}
```

#### Delete/Deactivate User
```http
DELETE /api/admin/users/:id
Authorization: Bearer {owner_token}

Response: 200 OK
{
  "success": true,
  "message": "User deactivated successfully"
}
```

**Protection**:
- ❌ Cannot delete owner accounts
- ❌ Cannot delete last owner
- ✅ Soft delete (sets `isActive: false`)

#### Activate User
```http
PATCH /api/admin/users/:id/activate
Authorization: Bearer {owner_token}

Response: 200 OK
{
  "success": true,
  "data": {...}
}
```

## Authorization Matrix

| Endpoint | Owner | Admin | Operator | Viewer | Public |
|----------|-------|-------|----------|--------|--------|
| POST /api/auth/register | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /api/auth/login | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /api/admin/users | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /api/admin/users | ✅ | ❌ | ❌ | ❌ | ❌ |
| PATCH /api/admin/users/:id/role | ✅ | ❌ | ❌ | ❌ | ❌ |
| DELETE /api/admin/users/:id | ✅ | ❌ | ❌ | ❌ | ❌ |

## Setup Instructions

### 1. Environment Configuration

Update your `.env` file:

```env
# RBAC Configuration
OWNER_EMAIL=owner@example.com
OWNER_DEFAULT_PASSWORD=Owner@123456
```

### 2. Start Server

The owner account will be automatically created on server startup:

```bash
npm start
```

Console output:
```
✅ Owner account created: owner@example.com
⚠️  Default password: Owner@123456
⚠️  PLEASE CHANGE THE PASSWORD IMMEDIATELY!
```

### 3. Login as Owner

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "Owner@123456"
  }'
```

### 4. Create Admin/Operator Users

```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123",
    "role": "admin"
  }'
```

## Security Guarantees

### ✅ Frontend Cannot Assign Roles
- Registration endpoint ignores `role` field
- Only owner can assign roles via `/api/admin/users`

### ✅ Backend Enforces All Authorization
- `requireRole` middleware validates JWT and role
- Returns `401` for unauthenticated requests
- Returns `403` for unauthorized roles

### ✅ Owner Protection
- Cannot create owner via API
- Cannot delete owner accounts
- Cannot demote last owner
- Owner only created via bootstrap script

### ✅ JWT Security
- Token contains `id`, `email`, and `role`
- Role verified on every protected request
- Cannot be tampered with (signed with JWT_SECRET)

## Testing

Run comprehensive RBAC tests:

```bash
npm test tests/rbac.test.js
```

Tests cover:
1. ✅ Forced viewer role on registration
2. ✅ JWT contains role
3. ✅ Owner-only endpoints
4. ✅ Authorization middleware (401/403)
5. ✅ Role change validation
6. ✅ Owner protection
7. ✅ Complete RBAC flow

## Files Modified/Created

### Modified Files
- `src/models/User.js` - Added `owner` role, JWT includes role
- `src/controllers/authController.js` - Force viewer role on registration
- `src/middleware/auth.js` - Added `requireRole` middleware
- `server.js` - Integrated admin routes and bootstrap
- `.env.example` - Added RBAC configuration

### New Files
- `src/controllers/adminController.js` - Owner-only user management
- `src/routes/adminRoutes.js` - Admin API routes
- `src/utils/bootstrapOwner.js` - Owner bootstrap script
- `tests/rbac.test.js` - Comprehensive RBAC tests
- `RBAC_IMPLEMENTATION.md` - This documentation

## Frontend Integration

### 1. Store JWT Token
```javascript
// After login/register
localStorage.setItem('token', response.data.token);
```

### 2. Include Token in Requests
```javascript
const token = localStorage.getItem('token');
fetch('/api/admin/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 3. Decode Token to Get Role (Client-Side Display Only)
```javascript
// IMPORTANT: This is for UI display only, NOT for authorization
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
const userRole = payload.role; // 'owner', 'admin', 'operator', 'viewer'

// Show/hide UI elements based on role
if (userRole === 'owner') {
  // Show admin panel
}
```

### 4. Handle Authorization Errors
```javascript
fetch('/api/admin/users', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => {
  if (res.status === 401) {
    // Not logged in - redirect to login
    window.location.href = '/login';
  }
  if (res.status === 403) {
    // Logged in but not authorized
    alert('You do not have permission to access this resource');
  }
  return res.json();
});
```

## Important Notes

⚠️ **Never trust client-side role checks for security**
- Frontend role checks are for UX only (show/hide UI elements)
- Backend always validates role on every request
- Even if user manipulates frontend, backend will reject unauthorized requests

⚠️ **Change default owner password immediately**
- Default password is `Owner@123456`
- Change it after first login via `/api/auth/password` endpoint

⚠️ **Owner email is permanent**
- Set `OWNER_EMAIL` carefully in production
- This email will always have owner privileges

## Troubleshooting

### Owner account not created
- Check `OWNER_EMAIL` is set in `.env`
- Check server logs for bootstrap errors
- Verify database connection

### 403 Forbidden errors
- Verify user has correct role
- Check JWT token is valid and not expired
- Ensure `Authorization` header is set correctly

### Cannot create owner via API
- This is by design for security
- Owner can only be created via bootstrap script
- Use `OWNER_EMAIL` environment variable

## Summary

✅ **Complete RBAC system implemented**
- 4 roles: owner, admin, operator, viewer
- Viewer self-registration enforced
- Owner-only user management
- JWT contains role
- Backend enforces all authorization
- Owner bootstrap on startup
- Comprehensive tests included
- Production-ready security
