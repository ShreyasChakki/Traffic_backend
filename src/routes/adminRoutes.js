const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/auth');
const {
  getAllUsers,
  createUser,
  changeUserRole,
  deleteUser,
  getUserById,
  activateUser
} = require('../controllers/adminController');

/**
 * All routes in this file require OWNER role
 * Using requireRole middleware for strict authorization
 */

// Get all users
router.get('/users', requireRole('owner'), getAllUsers);

// Create admin/operator user
router.post('/users', requireRole('owner'), createUser);

// Get user by ID
router.get('/users/:id', requireRole('owner'), getUserById);

// Change user role
router.patch('/users/:userId/role', requireRole('owner'), changeUserRole);

// Activate user
router.patch('/users/:id/activate', requireRole('owner'), activateUser);

// Delete/Deactivate user
router.delete('/users/:id', requireRole('owner'), deleteUser);

module.exports = router;
