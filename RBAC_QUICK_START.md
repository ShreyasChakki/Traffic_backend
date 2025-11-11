# RBAC System - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Environment Configuration
Your `.env` file has been configured with:
```env
OWNER_EMAIL=owner@smarttraffic.com
OWNER_DEFAULT_PASSWORD=Owner@123456
```

### 2. Start the Server
```bash
npm start
```

You should see:
```
✅ Owner account created: owner@smarttraffic.com
⚠️  Default password: Owner@123456
⚠️  PLEASE CHANGE THE PASSWORD IMMEDIATELY!
```

### 3. Login as Owner
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@smarttraffic.com",
    "password": "Owner@123456"
  }'
```

Save the token from the response.

### 4. Test the System

#### Option A: Automated Tests
```bash
npm test tests/rbac.test.js
```

#### Option B: Manual Test Script
```bash
node test-rbac-manual.js
```

## 📋 Common Tasks

### Create an Admin User
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

### Create an Operator User
```bash
curl -X POST http://localhost:5000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN" \
  -d '{
    "name": "Operator User",
    "email": "operator@example.com",
    "password": "password123",
    "role": "operator"
  }'
```

### Change User Role
```bash
curl -X PATCH http://localhost:5000/api/admin/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN" \
  -d '{
    "role": "admin"
  }'
```

### Get All Users
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN"
```

## 🔒 Security Features

✅ **Self-registration always creates viewers**
- Users who register themselves are ALWAYS created as `viewer`
- Backend ignores any `role` field sent during registration

✅ **Only owner can manage users**
- Creating admin/operator accounts requires owner role
- Changing user roles requires owner role
- Deleting users requires owner role

✅ **JWT contains role**
- Every JWT token includes the user's role
- Role is verified on every protected request
- Cannot be tampered with (cryptographically signed)

✅ **Owner protection**
- Cannot create owner via API (only via bootstrap)
- Cannot delete owner accounts
- Cannot demote last owner

## 🧪 Testing

### Run All RBAC Tests
```bash
npm test tests/rbac.test.js
```

### Test Coverage
- ✅ Forced viewer role on registration
- ✅ JWT contains role
- ✅ Owner-only endpoints
- ✅ Authorization (401/403 responses)
- ✅ Role change validation
- ✅ Owner protection
- ✅ Complete RBAC flow

## 📚 Full Documentation

See `RBAC_IMPLEMENTATION.md` for complete documentation including:
- Detailed API reference
- Authorization matrix
- Frontend integration guide
- Security guarantees
- Troubleshooting

## 🎯 Role Hierarchy

1. **owner** - Full system access
   - ✅ Create/manage all users
   - ✅ Change user roles
   - ✅ Delete users
   - ✅ All admin/operator/viewer permissions

2. **admin** - Administrative access
   - ❌ Cannot manage users
   - ✅ Other admin features (to be defined)

3. **operator** - Operational access
   - ❌ Cannot manage users
   - ✅ Operational features (to be defined)

4. **viewer** - Read-only access
   - ❌ Cannot manage users
   - ✅ View-only access

## ⚠️ Important Notes

1. **Change the default owner password immediately** after first login
2. **Never hardcode the owner password** in production
3. **Frontend role checks are for UX only** - backend always validates
4. **Owner email cannot be changed** - set it carefully

## 🐛 Troubleshooting

### Owner account not created
- Check `OWNER_EMAIL` is set in `.env`
- Check server logs for errors
- Verify database connection

### 403 Forbidden errors
- Verify you're using the correct token
- Check token hasn't expired
- Ensure user has the required role

### Cannot create owner via API
- This is by design for security
- Owner can only be created via bootstrap
- Use `OWNER_EMAIL` in `.env`

## ✅ Verification Checklist

- [ ] Server starts successfully
- [ ] Owner account created on startup
- [ ] Can login as owner
- [ ] Owner can create admin users
- [ ] Owner can create operator users
- [ ] Cannot create owner via API
- [ ] Viewer cannot access admin endpoints
- [ ] Admin cannot create users
- [ ] Self-registration creates viewer only
- [ ] JWT contains role
- [ ] All tests pass

## 🎉 You're Ready!

Your RBAC system is now fully configured and ready to use. The backend enforces all authorization rules, and you can safely build your frontend knowing that security is handled server-side.
