const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../server');
const User = require('../src/models/User');

let mongoServer;
let ownerToken, adminToken, operatorToken, viewerToken;
let ownerId, adminId, operatorId, viewerId;

/**
 * RBAC System Tests
 * Tests complete Role-Based Access Control implementation
 */

describe('RBAC System Tests', () => {
  
  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
  });

  describe('1. User Registration - Force Viewer Role', () => {
    
    test('Should create user with viewer role by default', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('viewer');
    });

    test('Should ignore role sent by client and force viewer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker User',
          email: 'hacker@example.com',
          password: 'password123',
          role: 'owner' // Trying to hack the system
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('viewer'); // Should be viewer, not owner
    });

    test('Should ignore admin role sent by client', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another Hacker',
          email: 'hacker2@example.com',
          password: 'password123',
          role: 'admin'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('viewer');
    });
  });

  describe('2. JWT Token Contains Role', () => {
    
    test('JWT should contain user role in payload', async () => {
      // Create a user
      const user = await User.create({
        name: 'Test User',
        email: 'jwt@example.com',
        password: 'password123',
        role: 'admin'
      });

      // Login
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jwt@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();

      // Decode token (in real app, verify signature)
      const tokenParts = res.body.data.token.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      
      expect(payload.id).toBeDefined();
      expect(payload.email).toBe('jwt@example.com');
      expect(payload.role).toBe('admin');
    });
  });

  describe('3. Setup Test Users for Authorization Tests', () => {
    
    beforeEach(async () => {
      // Create owner
      const owner = await User.create({
        name: 'Owner User',
        email: 'owner@test.com',
        password: 'password123',
        role: 'owner'
      });
      ownerId = owner._id;

      // Create admin
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      });
      adminId = admin._id;

      // Create operator
      const operator = await User.create({
        name: 'Operator User',
        email: 'operator@test.com',
        password: 'password123',
        role: 'operator'
      });
      operatorId = operator._id;

      // Create viewer
      const viewer = await User.create({
        name: 'Viewer User',
        email: 'viewer@test.com',
        password: 'password123',
        role: 'viewer'
      });
      viewerId = viewer._id;

      // Get tokens
      const ownerRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'owner@test.com', password: 'password123' });
      ownerToken = ownerRes.body.data.token;

      const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });
      adminToken = adminRes.body.data.token;

      const operatorRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'operator@test.com', password: 'password123' });
      operatorToken = operatorRes.body.data.token;

      const viewerRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'viewer@test.com', password: 'password123' });
      viewerToken = viewerRes.body.data.token;
    });

    describe('4. Owner-Only Endpoints - Create Admin/Operator', () => {
      
      test('Owner can create admin user', async () => {
        const res = await request(app)
          .post('/api/admin/users')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            name: 'New Admin',
            email: 'newadmin@test.com',
            password: 'password123',
            role: 'admin'
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.role).toBe('admin');
      });

      test('Owner can create operator user', async () => {
        const res = await request(app)
          .post('/api/admin/users')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            name: 'New Operator',
            email: 'newoperator@test.com',
            password: 'password123',
            role: 'operator'
          });

        expect(res.status).toBe(201);
        expect(res.body.data.role).toBe('operator');
      });

      test('Owner cannot create owner via API', async () => {
        const res = await request(app)
          .post('/api/admin/users')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            name: 'New Owner',
            email: 'newowner@test.com',
            password: 'password123',
            role: 'owner'
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      test('Admin cannot create users', async () => {
        const res = await request(app)
          .post('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Unauthorized Admin',
            email: 'unauthorized@test.com',
            password: 'password123',
            role: 'admin'
          });

        expect(res.status).toBe(403);
      });

      test('Operator cannot create users', async () => {
        const res = await request(app)
          .post('/api/admin/users')
          .set('Authorization', `Bearer ${operatorToken}`)
          .send({
            name: 'Unauthorized Operator',
            email: 'unauthorized@test.com',
            password: 'password123',
            role: 'admin'
          });

        expect(res.status).toBe(403);
      });

      test('Viewer cannot create users', async () => {
        const res = await request(app)
          .post('/api/admin/users')
          .set('Authorization', `Bearer ${viewerToken}`)
          .send({
            name: 'Unauthorized Viewer',
            email: 'unauthorized@test.com',
            password: 'password123',
            role: 'admin'
          });

        expect(res.status).toBe(403);
      });

      test('Unauthenticated user cannot create users', async () => {
        const res = await request(app)
          .post('/api/admin/users')
          .send({
            name: 'Unauthorized',
            email: 'unauthorized@test.com',
            password: 'password123',
            role: 'admin'
          });

        expect(res.status).toBe(401);
      });
    });

    describe('5. Owner-Only Endpoints - Change User Role', () => {
      
      test('Owner can change viewer to admin', async () => {
        const res = await request(app)
          .patch(`/api/admin/users/${viewerId}/role`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({ role: 'admin' });

        expect(res.status).toBe(200);
        expect(res.body.data.role).toBe('admin');
      });

      test('Owner can change admin to operator', async () => {
        const res = await request(app)
          .patch(`/api/admin/users/${adminId}/role`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({ role: 'operator' });

        expect(res.status).toBe(200);
        expect(res.body.data.role).toBe('operator');
      });

      test('Owner cannot change owner role', async () => {
        const res = await request(app)
          .patch(`/api/admin/users/${ownerId}/role`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({ role: 'viewer' });

        expect(res.status).toBe(403);
      });

      test('Owner cannot assign owner role via API', async () => {
        const res = await request(app)
          .patch(`/api/admin/users/${viewerId}/role`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({ role: 'owner' });

        expect(res.status).toBe(400);
      });

      test('Admin cannot change roles', async () => {
        const res = await request(app)
          .patch(`/api/admin/users/${viewerId}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'admin' });

        expect(res.status).toBe(403);
      });

      test('Operator cannot change roles', async () => {
        const res = await request(app)
          .patch(`/api/admin/users/${viewerId}/role`)
          .set('Authorization', `Bearer ${operatorToken}`)
          .send({ role: 'admin' });

        expect(res.status).toBe(403);
      });

      test('Viewer cannot change roles', async () => {
        const res = await request(app)
          .patch(`/api/admin/users/${viewerId}/role`)
          .set('Authorization', `Bearer ${viewerToken}`)
          .send({ role: 'admin' });

        expect(res.status).toBe(403);
      });
    });

    describe('6. Owner-Only Endpoints - Get All Users', () => {
      
      test('Owner can get all users', async () => {
        const res = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBeGreaterThanOrEqual(4);
      });

      test('Admin cannot get all users', async () => {
        const res = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(403);
      });

      test('Operator cannot get all users', async () => {
        const res = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${operatorToken}`);

        expect(res.status).toBe(403);
      });

      test('Viewer cannot get all users', async () => {
        const res = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${viewerToken}`);

        expect(res.status).toBe(403);
      });
    });

    describe('7. Authorization Middleware - requireRole', () => {
      
      test('Returns 401 when no token provided', async () => {
        const res = await request(app)
          .get('/api/admin/users');

        expect(res.status).toBe(401);
      });

      test('Returns 403 when role not allowed', async () => {
        const res = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${viewerToken}`);

        expect(res.status).toBe(403);
      });

      test('Returns 401 with invalid token', async () => {
        const res = await request(app)
          .get('/api/admin/users')
          .set('Authorization', 'Bearer invalid_token_here');

        expect(res.status).toBe(401);
      });
    });

    describe('8. Prevent Owner Deletion/Demotion', () => {
      
      test('Cannot delete owner account', async () => {
        const res = await request(app)
          .delete(`/api/admin/users/${ownerId}`)
          .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.status).toBe(403);
      });

      test('Can delete non-owner accounts', async () => {
        const res = await request(app)
          .delete(`/api/admin/users/${viewerId}`)
          .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.status).toBe(200);
        
        // Verify user is deactivated
        const user = await User.findById(viewerId);
        expect(user.isActive).toBe(false);
      });
    });
  });

  describe('9. Complete RBAC Flow Test', () => {
    
    test('Complete user lifecycle with RBAC', async () => {
      // 1. Self-register as viewer
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@test.com',
          password: 'password123'
        });
      
      expect(registerRes.body.data.user.role).toBe('viewer');
      const newUserToken = registerRes.body.data.token;

      // 2. Viewer cannot access admin routes
      const adminAccessRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${newUserToken}`);
      
      expect(adminAccessRes.status).toBe(403);

      // 3. Create owner
      const owner = await User.create({
        name: 'Owner',
        email: 'owner@test.com',
        password: 'password123',
        role: 'owner'
      });

      const ownerLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'owner@test.com', password: 'password123' });
      
      const ownerToken = ownerLoginRes.body.data.token;

      // 4. Owner promotes viewer to admin
      const newUser = await User.findOne({ email: 'newuser@test.com' });
      const promoteRes = await request(app)
        .patch(`/api/admin/users/${newUser._id}/role`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ role: 'admin' });
      
      expect(promoteRes.status).toBe(200);
      expect(promoteRes.body.data.role).toBe('admin');

      // 5. Admin still cannot access owner-only routes
      const newAdminLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'newuser@test.com', password: 'password123' });
      
      const newAdminToken = newAdminLoginRes.body.data.token;

      const createUserRes = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${newAdminToken}`)
        .send({
          name: 'Test',
          email: 'test@test.com',
          password: 'password123',
          role: 'operator'
        });
      
      expect(createUserRes.status).toBe(403);
    });
  });
});
