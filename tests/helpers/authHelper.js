const request = require('supertest');
const User = require('../../src/models/User');

/**
 * Create a test user and return user object
 */
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'viewer',
    ...userData,
  };

  const user = await User.create(defaultUser);
  return user;
};

/**
 * Register a user and return tokens
 */
const registerUser = async (app, userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'viewer',
    ...userData,
  };

  const response = await request(app)
    .post('/api/auth/register')
    .send(defaultUser);

  return {
    user: response.body.data.user,
    accessToken: response.body.data.accessToken,
    refreshToken: response.body.data.refreshToken,
    response,
  };
};

/**
 * Login a user and return tokens
 */
const loginUser = async (app, credentials = {}) => {
  const defaultCredentials = {
    email: 'test@example.com',
    password: 'password123',
    ...credentials,
  };

  const response = await request(app)
    .post('/api/auth/login')
    .send(defaultCredentials);

  return {
    user: response.body.data?.user,
    accessToken: response.body.data?.accessToken,
    refreshToken: response.body.data?.refreshToken,
    response,
  };
};

/**
 * Get authorization header with Bearer token
 */
const getAuthHeader = (token) => {
  return { Authorization: `Bearer ${token}` };
};

/**
 * Create users with different roles
 */
const createUsersWithRoles = async () => {
  const admin = await createTestUser({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  });

  const operator = await createTestUser({
    name: 'Operator User',
    email: 'operator@example.com',
    password: 'operator123',
    role: 'operator',
  });

  const viewer = await createTestUser({
    name: 'Viewer User',
    email: 'viewer@example.com',
    password: 'viewer123',
    role: 'viewer',
  });

  return { admin, operator, viewer };
};

/**
 * Login users with different roles and return tokens
 */
const loginUsersWithRoles = async (app) => {
  const adminLogin = await loginUser(app, {
    email: 'admin@example.com',
    password: 'admin123',
  });

  const operatorLogin = await loginUser(app, {
    email: 'operator@example.com',
    password: 'operator123',
  });

  const viewerLogin = await loginUser(app, {
    email: 'viewer@example.com',
    password: 'viewer123',
  });

  return {
    admin: adminLogin,
    operator: operatorLogin,
    viewer: viewerLogin,
  };
};

module.exports = {
  createTestUser,
  registerUser,
  loginUser,
  getAuthHeader,
  createUsersWithRoles,
  loginUsersWithRoles,
};
