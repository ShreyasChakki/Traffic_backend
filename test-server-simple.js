/**
 * Simple test server WITHOUT MongoDB
 * For immediate testing of authentication logic
 */
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (for testing only)
const users = [];
const refreshTokens = [];

// JWT Secret
const JWT_SECRET = 'test-secret-key-12345';

// Health check
app.get('/api/test/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running (In-Memory Mode - No MongoDB)' 
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    if (users.find(u => u.email === email.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'viewer',
      createdAt: new Date()
    };

    users.push(user);

    // Generate tokens
    const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = Math.random().toString(36).substring(7);
    
    refreshTokens.push({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = Math.random().toString(36).substring(7);
    
    refreshTokens.push({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Get permissions
app.get('/api/auth/permissions', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const permissions = {
      admin: {
        viewDashboard: true,
        viewMap: true,
        viewAnalytics: true,
        modifySignals: true,
        overrideSignals: true,
        manageEmergencies: true,
        manageUsers: true,
        viewSettings: true,
        modifySettings: true
      },
      operator: {
        viewDashboard: true,
        viewMap: true,
        viewAnalytics: true,
        modifySignals: true,
        overrideSignals: false,
        manageEmergencies: true,
        manageUsers: false,
        viewSettings: true,
        modifySettings: false
      },
      viewer: {
        viewDashboard: true,
        viewMap: true,
        viewAnalytics: true,
        modifySignals: false,
        overrideSignals: false,
        manageEmergencies: false,
        manageUsers: false,
        viewSettings: false,
        modifySettings: false
      }
    };

    res.json({
      success: true,
      data: {
        role: user.role,
        permissions: permissions[user.role] || permissions.viewer
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Refresh token
app.post('/api/auth/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    const tokenData = refreshTokens.find(t => t.token === refreshToken);
    if (!tokenData || tokenData.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    const user = users.find(u => u.id === tokenData.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new tokens
    const newAccessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const newRefreshToken = Math.random().toString(36).substring(7);
    
    // Remove old refresh token
    const index = refreshTokens.indexOf(tokenData);
    refreshTokens.splice(index, 1);
    
    // Add new refresh token
    refreshTokens.push({
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update profile
app.put('/api/auth/profile', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, avatar } = req.body;
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  try {
    const { refreshToken } = req.body;
    const index = refreshTokens.findIndex(t => t.token === refreshToken);
    if (index > -1) {
      refreshTokens.splice(index, 1);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mock dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    jwt.verify(token, JWT_SECRET);

    res.json({
      success: true,
      data: {
        totalIntersections: 10,
        activeIntersections: 8,
        trafficFlow: 245,
        avgWaitTime: 28,
        activeAlerts: 2
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   Smart Traffic IoT - Test Server (No DB)     ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  console.log('✅ Server running on port', PORT);
  console.log('📡 API: http://localhost:' + PORT);
  console.log('💾 Mode: In-Memory (No MongoDB required)');
  console.log('\n🧪 Ready for testing!\n');
  console.log('📝 Registered users:', users.length);
  console.log('🔑 Active tokens:', refreshTokens.length);
  console.log('\n' + '─'.repeat(50));
});
