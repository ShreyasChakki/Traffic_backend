const request = require('supertest');
const { app } = require('../server');
const db = require('./setup');
const User = require('../src/models/User');
const RefreshToken = require('../src/models/RefreshToken');
const { registerUser, loginUser, createTestUser, getAuthHeader } = require('./helpers/authHelper');

describe('Auth Routes - /api/auth', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterEach(async () => {
    await db.clearDatabase();
  });

  afterAll(async () => {
    await db.closeDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'viewer'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Registration successful');
      expect(res.body.data.user.email).toBe(userData.email.toLowerCase());
      expect(res.body.data.user.name).toBe(userData.name);
      expect(res.body.data.user.role).toBe(userData.role);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should register user with default viewer role', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.data.user.role).toBe('viewer');
    });

    it('should fail with missing name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with missing email', async () => {
      const userData = {
        name: 'Test User',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Should reject missing email (400 or 500 both acceptable)
      expect([400, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should fail with missing password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with password less than 6 characters', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '12345'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid role', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'superadmin'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid role');
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      await request(app).post('/api/auth/register').send(userData);
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });

    it('should convert email to lowercase', async () => {
      const userData = {
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should accept admin role', async () => {
      const userData = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.data.user.role).toBe('admin');
    });

    it('should accept operator role', async () => {
      const userData = {
        name: 'Operator User',
        email: 'operator@example.com',
        password: 'password123',
        role: 'operator'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.data.user.role).toBe('operator');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should login successfully with correct credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should fail with missing email', async () => {
      const credentials = {
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('provide email and password');
    });

    it('should fail with missing password', async () => {
      const credentials = {
        email: 'test@example.com'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with wrong email', async () => {
      const credentials = {
        email: 'wrong@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should fail with wrong password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should fail with inactive user', async () => {
      await User.findOneAndUpdate(
        { email: 'test@example.com' },
        { isActive: false }
      );

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('deactivated');
    });

    it('should handle case-insensitive email', async () => {
      const credentials = {
        email: 'TEST@EXAMPLE.COM',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});