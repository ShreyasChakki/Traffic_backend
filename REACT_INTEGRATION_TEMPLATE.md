# React Frontend Integration Template

## 📁 Project Structure
```
src/
├── api/
│   └── axios.js              # Axios instance with interceptors
├── services/
│   ├── authService.js        # Authentication API calls
│   └── dashboardService.js   # Dashboard API calls
├── context/
│   └── AuthContext.jsx       # Authentication context
├── hooks/
│   ├── useAuth.js            # Auth hook
│   └── useDashboard.js       # Dashboard hook
├── components/
│   ├── ProtectedRoute.jsx    # Route protection
│   └── RoleBasedRoute.jsx    # Role-based protection
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   └── Profile.jsx
└── utils/
    └── constants.js          # API constants
```

## 📝 File Templates

### 1. Environment Variables (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 2. Constants (src/utils/constants.js)
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
};

export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
};
```

### 3. Axios Instance (src/api/axios.js)
```javascript
import axios from 'axios';
import { API_BASE_URL, TOKEN_KEYS } from '../utils/constants';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### 4. Auth Service (src/services/authService.js)
```javascript
import axios from '../api/axios';
import { TOKEN_KEYS } from '../utils/constants';

export const authService = {
  register: async (name, email, password, role = 'viewer') => {
    const response = await axios.post('/auth/register', {
      name,
      email,
      password,
      role,
    });

    const { accessToken, refreshToken, user } = response.data.data;
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);

    return { user, accessToken, refreshToken };
  },

  login: async (email, password) => {
    const response = await axios.post('/auth/login', {
      email,
      password,
    });

    const { accessToken, refreshToken, user } = response.data.data;
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);

    return { user, accessToken, refreshToken };
  },

  logout: async () => {
    const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);

    try {
      await axios.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    }
  },

  logoutAll: async () => {
    await axios.post('/auth/logout-all');
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  },

  getCurrentUser: async () => {
    const response = await axios.get('/auth/me');
    return response.data.data.user;
  },

  getUserPermissions: async () => {
    const response = await axios.get('/auth/permissions');
    return response.data.data.permissions;
  },

  updateProfile: async (name, avatar) => {
    const response = await axios.put('/auth/profile', {
      name,
      avatar,
    });
    return response.data.data.user;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await axios.put('/auth/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await axios.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (resetToken, newPassword) => {
    const response = await axios.post('/auth/reset-password', {
      resetToken,
      newPassword,
    });
    return response.data;
  },
};
```

### 5. Dashboard Service (src/services/dashboardService.js)
```javascript
import axios from '../api/axios';

export const dashboardService = {
  getStats: async () => {
    const response = await axios.get('/dashboard/stats');
    return response.data.data;
  },

  getTrafficStatus: async () => {
    const response = await axios.get('/dashboard/traffic-status');
    return response.data.data;
  },

  getEvents: async (limit = 10) => {
    const response = await axios.get(`/dashboard/events?limit=${limit}`);
    return response.data.data;
  },

  getUnreadCount: async () => {
    const response = await axios.get('/dashboard/events/unread-count');
    return response.data.data;
  },

  markEventAsRead: async (eventId) => {
    const response = await axios.put(`/dashboard/events/${eventId}/read`);
    return response.data;
  },

  markAllEventsAsRead: async () => {
    const response = await axios.put('/dashboard/events/read-all');
    return response.data;
  },

  getPerformance: async () => {
    const response = await axios.get('/dashboard/performance');
    return response.data.data;
  },
};
```

### 6. Auth Context (src/context/AuthContext.jsx)
```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import { USER_ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const { user } = await authService.login(email, password);
      setUser(user);
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (name, email, password, role) => {
    try {
      setError(null);
      const { user } = await authService.register(name, email, password, role);
      setUser(user);
      return user;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await authService.logoutAll();
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (name, avatar) => {
    try {
      const updatedUser = await authService.updateProfile(name, avatar);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      // Logout after password change
      await logout();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Password change failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    logoutAll,
    updateProfile,
    changePassword,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user,
    isOwner: user?.role === USER_ROLES.OWNER,
    isAdmin: [USER_ROLES.OWNER, USER_ROLES.ADMIN].includes(user?.role),
    isOperator: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.OPERATOR].includes(user?.role),
    isViewer: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 7. Protected Route (src/components/ProtectedRoute.jsx)
```javascript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
```

### 8. Role-Based Route (src/components/RoleBasedRoute.jsx)
```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
```

### 9. Login Page (src/pages/Login.jsx)
```javascript
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link
              to="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
```

### 10. Register Page (src/pages/Register.jsx)
```javascript
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password (min 6 characters)"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
```

### 11. Dashboard Hook (src/hooks/useDashboard.js)
```javascript
import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';

export const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [trafficStatus, setTrafficStatus] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, trafficData, eventsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getTrafficStatus(),
        dashboardService.getEvents(10),
      ]);

      setStats(statsData);
      setTrafficStatus(trafficData);
      setEvents(eventsData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const markEventAsRead = async (eventId) => {
    try {
      await dashboardService.markEventAsRead(eventId);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, read: true } : event
        )
      );
    } catch (err) {
      console.error('Failed to mark event as read:', err);
    }
  };

  const markAllEventsAsRead = async () => {
    try {
      await dashboardService.markAllEventsAsRead();
      setEvents((prev) => prev.map((event) => ({ ...event, read: true })));
    } catch (err) {
      console.error('Failed to mark all events as read:', err);
    }
  };

  return {
    stats,
    trafficStatus,
    events,
    loading,
    error,
    refresh: fetchDashboardData,
    markEventAsRead,
    markAllEventsAsRead,
  };
};
```

### 12. App Router Setup (src/App.jsx)
```javascript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleBasedRoute } from './components/RoleBasedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { USER_ROLES } from './utils/constants';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <RoleBasedRoute allowedRoles={[USER_ROLES.OWNER]}>
                <AdminPanel />
              </RoleBasedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<div>404 - Not Found</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

## 🚀 Installation Steps

1. **Install dependencies:**
```bash
npm install axios react-router-dom
```

2. **Create .env file:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

3. **Copy all template files to your project**

4. **Wrap your app with AuthProvider in main.jsx:**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

5. **Start your development server:**
```bash
npm run dev
```

## ✅ Testing Checklist

- [ ] User can register
- [ ] User can login
- [ ] Token is stored in localStorage
- [ ] Protected routes redirect to login
- [ ] Token is sent in Authorization header
- [ ] Token refresh works on 401
- [ ] User can logout
- [ ] User data persists on page reload
- [ ] Role-based access control works
- [ ] Error messages display correctly

## 🎯 Next Steps

1. Add loading states and spinners
2. Implement toast notifications
3. Add form validation
4. Create admin panel
5. Add Socket.IO for real-time updates
6. Implement dark mode
7. Add unit tests
8. Add error boundaries

---

**Ready to use!** Copy these templates into your React project and start building! 🚀
