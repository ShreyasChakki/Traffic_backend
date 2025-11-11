const asyncHandler = require('../middleware/asyncHandler');
const { ErrorResponse } = require('../middleware/errorHandler');
const User = require('../models/User');

/**
 * @desc    Get all users (Owner only)
 * @route   GET /api/admin/users
 * @access  Private/Owner
 */
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users: users,
      total: users.length
    }
  });
});

/**
 * @desc    Create admin or operator user (Owner only)
 * @route   POST /api/admin/users
 * @access  Private/Owner
 */
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return next(new ErrorResponse('Please provide name, email, password, and role', 400));
  }

  // Validate password length
  if (password.length < 8) {
    return next(new ErrorResponse('Password must be at least 8 characters', 400));
  }

  // Validate role - only admin, operator, and viewer can be created via API
  if (!['admin', 'operator', 'viewer'].includes(role)) {
    return next(new ErrorResponse('Role must be admin, operator, or viewer', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new ErrorResponse('User with this email already exists', 409));
  }

  // Create user with specified role
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    }
  });
});

/**
 * @desc    Change user role (Owner only)
 * @route   PATCH /api/admin/users/:userId/role
 * @access  Private/Owner
 */
exports.changeUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  const userId = req.params.userId;

  // Validate role
  if (!role) {
    return next(new ErrorResponse('Please provide a role', 400));
  }

  // Validate role value - cannot assign owner via API
  if (!['admin', 'operator', 'viewer'].includes(role)) {
    return next(new ErrorResponse('Role must be admin, operator, or viewer', 400));
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Prevent changing owner role
  if (user.role === 'owner') {
    return next(new ErrorResponse('Cannot change the role of an owner', 400));
  }

  // Prevent demoting/deleting last owner (additional safety check)
  if (role !== 'owner') {
    const ownerCount = await User.countDocuments({ role: 'owner', isActive: true });
    if (ownerCount <= 1 && user.role === 'owner') {
      return next(new ErrorResponse('Cannot demote the last owner', 403));
    }
  }

  // Update role
  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Role updated successfully',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    }
  });
});

/**
 * @desc    Delete/Deactivate user (Owner only)
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Owner
 */
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Prevent deleting owner
  if (user.role === 'owner') {
    return next(new ErrorResponse('Cannot delete an owner account', 403));
  }

  // Prevent deleting yourself
  if (user._id.toString() === req.user._id.toString()) {
    return next(new ErrorResponse('Cannot delete your own account', 403));
  }

  // Hard delete - permanently remove from database
  await User.findByIdAndDelete(userId);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
    data: {
      deletedUserId: userId
    }
  });
});

/**
 * @desc    Get user by ID (Owner only)
 * @route   GET /api/admin/users/:id
 * @access  Private/Owner
 */
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'User retrieved successfully',
    data: {
      user: user
    }
  });
});

/**
 * @desc    Reactivate user (Owner only)
 * @route   PATCH /api/admin/users/:id/activate
 * @access  Private/Owner
 */
exports.activateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  user.isActive = req.body.isActive !== undefined ? req.body.isActive : true;
  await user.save();

  res.status(200).json({
    success: true,
    message: user.isActive ? 'User activated successfully' : 'User deactivated successfully',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    }
  });
});
