const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUserPermissions } = require('../middleware/permissions');
const {
  register,
  login,
  refreshToken,
  getMe,
  logout,
  logoutAll,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/authControllerV2');

/**
 * Public routes
 */
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

/**
 * Protected routes (require authentication)
 */
router.get('/me', protect, getMe);
router.get('/permissions', protect, getUserPermissions);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);

module.exports = router;
