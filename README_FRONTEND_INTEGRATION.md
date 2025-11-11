# 🚀 Frontend Integration Guide - Quick Start

## 📚 Documentation Files Created

I've created comprehensive documentation for integrating your React frontend with the Smart Traffic IoT backend. Here are the files:

### 1. **FRONTEND_API_GUIDE.md** (Complete Reference)
   - Detailed API documentation
   - All endpoints with examples
   - Request/Response formats
   - Authentication flow
   - Error handling
   - CORS configuration
   - React integration examples

### 2. **API_QUICK_REFERENCE.md** (Quick Lookup)
   - Quick endpoint reference
   - HTTP methods and URLs
   - Request/Response samples
   - Common issues and solutions
   - Status codes

### 3. **REACT_INTEGRATION_TEMPLATE.md** (Ready-to-Use Code)
   - Complete React project structure
   - Copy-paste ready components
   - Axios setup with interceptors
   - Auth context and hooks
   - Protected routes
   - Login/Register pages

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Server Configuration
```
Base URL: http://localhost:5000/api
Port: 5000
CORS Enabled: Yes (for http://localhost:5173)
```

### Step 2: Key Endpoints

**Authentication:**
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Get User: `GET /api/auth/me`
- Logout: `POST /api/auth/logout`

**Dashboard:**
- Stats: `GET /api/dashboard/stats`
- Traffic: `GET /api/dashboard/traffic-status`
- Events: `GET /api/dashboard/events`

### Step 3: Authentication Flow

```javascript
// 1. Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { accessToken, refreshToken, user } = (await response.json()).data;

// 2. Store tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// 3. Make authenticated requests
const dashboardResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 🔑 Key Information

### Response Format
**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### User Roles
- `owner` - Full system access
- `admin` - Administrative access
- `operator` - Traffic control
- `viewer` - Read-only (default)

### Token Information
- **Type**: JWT Bearer Token
- **Header**: `Authorization: Bearer <token>`
- **Expiry**: 7 days
- **Storage**: localStorage or sessionStorage

---

## 📦 React Setup (Copy-Paste Ready)

### 1. Install Dependencies
```bash
npm install axios react-router-dom
```

### 2. Create .env
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Copy Files from REACT_INTEGRATION_TEMPLATE.md
- Axios instance with interceptors
- Auth service
- Auth context
- Protected routes
- Login/Register pages

### 4. Wrap App with AuthProvider
```javascript
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your routes */}
    </AuthProvider>
  );
}
```

---

## 🎯 Common Use Cases

### Login User
```javascript
import { useAuth } from './context/AuthContext';

const { login } = useAuth();
await login('user@example.com', 'password123');
```

### Get Current User
```javascript
const { user, isAuthenticated } = useAuth();
console.log(user); // { id, name, email, role }
```

### Protected Route
```javascript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Role-Based Access
```javascript
const { isOwner, isAdmin, isOperator } = useAuth();

{isOwner && <AdminPanel />}
{isOperator && <ControlPanel />}
```

### Fetch Dashboard Data
```javascript
import { dashboardService } from './services/dashboardService';

const stats = await dashboardService.getStats();
const traffic = await dashboardService.getTrafficStatus();
const events = await dashboardService.getEvents(10);
```

---

## 🔧 Troubleshooting

### Issue: 401 Unauthorized
**Cause**: Token missing or invalid
**Solution**: 
- Check if token is stored in localStorage
- Verify Authorization header format: `Bearer <token>`
- Check if token has expired (use refresh token)

### Issue: CORS Error
**Cause**: Frontend origin not allowed
**Solution**:
- Verify CLIENT_URL in backend .env: `http://localhost:5173`
- Check if credentials are included in requests
- Restart backend server after .env changes

### Issue: Token Refresh Not Working
**Cause**: Refresh token expired or invalid
**Solution**:
- Check axios interceptor is set up correctly
- Verify refresh token is stored
- Logout and login again if refresh token expired

### Issue: 403 Forbidden
**Cause**: Insufficient permissions
**Solution**:
- Check user role matches required role
- Verify role-based route configuration
- Check if user account is active

---

## 📖 Documentation Structure

```
FRONTEND_API_GUIDE.md
├── Server Configuration
├── API Endpoints (Complete List)
├── Request/Response Formats
├── Authentication Details
├── User Roles & Permissions
├── Error Handling
├── CORS Configuration
├── Example API Calls
└── React Integration Examples

API_QUICK_REFERENCE.md
├── Quick Endpoint Reference
├── HTTP Methods & URLs
├── Request/Response Samples
├── Status Codes
└── Common Issues

REACT_INTEGRATION_TEMPLATE.md
├── Project Structure
├── File Templates (Copy-Paste Ready)
│   ├── Axios Instance
│   ├── Auth Service
│   ├── Dashboard Service
│   ├── Auth Context
│   ├── Protected Routes
│   ├── Login/Register Pages
│   └── Custom Hooks
├── Installation Steps
└── Testing Checklist
```

---

## 🎨 Example: Complete Login Flow

### Backend (Already Done ✅)
```javascript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "role": "..." },
    "accessToken": "eyJhbGc...",
    "refreshToken": "a1b2c3..."
  }
}
```

### Frontend (Your Task)
```javascript
// 1. Create login function
const login = async (email, password) => {
  const response = await axios.post('/auth/login', { email, password });
  const { accessToken, refreshToken, user } = response.data.data;
  
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  
  return user;
};

// 2. Use in component
const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const user = await login(email, password);
    navigate('/dashboard');
  } catch (error) {
    setError(error.response?.data?.error || 'Login failed');
  }
};
```

---

## ✅ Integration Checklist

### Backend (Already Complete ✅)
- [x] API endpoints implemented
- [x] JWT authentication working
- [x] CORS configured
- [x] Error handling in place
- [x] Rate limiting enabled
- [x] Security middleware active

### Frontend (Your Tasks)
- [ ] Install axios and react-router-dom
- [ ] Create axios instance with interceptors
- [ ] Set up auth service
- [ ] Create auth context
- [ ] Build login/register pages
- [ ] Implement protected routes
- [ ] Add role-based access control
- [ ] Test authentication flow
- [ ] Handle errors gracefully
- [ ] Add loading states

---

## 🚀 Next Steps

1. **Read FRONTEND_API_GUIDE.md** for complete understanding
2. **Use API_QUICK_REFERENCE.md** for quick lookups
3. **Copy code from REACT_INTEGRATION_TEMPLATE.md** to start building
4. **Test each feature** as you implement it
5. **Refer back to docs** when you encounter issues

---

## 📞 Need Help?

### Common Questions

**Q: What's the server URL?**
A: `http://localhost:5000/api`

**Q: How do I send authenticated requests?**
A: Add header: `Authorization: Bearer <accessToken>`

**Q: Where do I store tokens?**
A: localStorage or sessionStorage (see security considerations in full guide)

**Q: How do I handle token refresh?**
A: Use axios interceptor (template provided in REACT_INTEGRATION_TEMPLATE.md)

**Q: What are the available user roles?**
A: owner, admin, operator, viewer

**Q: How do I test the API?**
A: Use Postman, Thunder Client, or curl (examples in API_QUICK_REFERENCE.md)

---

## 🎉 You're All Set!

Everything you need to integrate your React frontend with the backend is documented in these files. Start with the Quick Reference, use the templates, and refer to the complete guide when needed.

**Happy Coding! 🚀**

---

**Files Created:**
1. ✅ FRONTEND_API_GUIDE.md - Complete API documentation
2. ✅ API_QUICK_REFERENCE.md - Quick lookup guide
3. ✅ REACT_INTEGRATION_TEMPLATE.md - Ready-to-use React code
4. ✅ README_FRONTEND_INTEGRATION.md - This file (overview)

**Last Updated**: November 11, 2025
**Backend Version**: 2.0.0
**Documentation Version**: 1.0.0
