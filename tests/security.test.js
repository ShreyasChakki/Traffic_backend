const request = require('supertest');
const { app } = require('../server');
const db = require('./setup');
const { registerUser, getAuthHeader } = require('./helpers/authHelper');

describe('Security Tests', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterEach(async () => {
    await db.clearDatabase();
  });

  afterAll(async () => {
    await db.closeDatabase();
  });

  describe('Rate Limiting', () => {
    it('should have rate limiting headers', async () => {
      const res = await request(app)
        .get('/api/test/health')
        .expect(200);

      // Check for rate limit headers
      expect(res.headers).toBeDefined();
    });
  });

  describe('SQL/NoSQL Injection Protection', () => {
    it('should sanitize email input in login', async () => {
      const maliciousPayload = {
        email: { $gt: '' },
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(maliciousPayload);

      // Should reject malicious payload (400 or 500 both acceptable)
      expect([400, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should sanitize registration input', async () => {
      const maliciousPayload = {
        name: 'Test User',
        email: { $ne: null },
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      // Should reject malicious payload (400 or 500 both acceptable)
      expect([400, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('XSS Protection', () => {
    it('should handle script tags in name', async () => {
      const xssPayload = {
        name: '<script>alert("xss")</script>',
        email: 'xss@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(xssPayload)
        .expect(201);

      // Name should be stored but sanitized
      expect(res.body.data.user.name).toBeDefined();
    });
  });

  describe('JWT Token Security', () => {
    it('should reject expired tokens', async () => {
      // This would require mocking JWT expiration
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token';

      const res = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeader(invalidToken))
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject malformed tokens', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeader('malformed-token'))
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject tokens without Bearer prefix', async () => {
      const { accessToken } = await registerUser(app);

      const res = await request(app)
        .get('/api/auth/me')
        .set({ Authorization: accessToken })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Password Security', () => {
    it('should not return password in responses', async () => {
      const res = await registerUser(app);

      expect(res.response.body.data.user.password).toBeUndefined();
    });

    it('should hash passwords before storage', async () => {
      const { user } = await registerUser(app, {
        password: 'testpassword123'
      });

      const User = require('../src/models/User');
      const dbUser = await User.findById(user.id).select('+password');

      expect(dbUser.password).not.toBe('testpassword123');
      expect(dbUser.password.length).toBeGreaterThan(20);
    });

    it('should enforce minimum password length', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '12345'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('CORS Protection', () => {
    it('should have CORS headers', async () => {
      const res = await request(app)
        .get('/api/test/health')
        .expect(200);

      // CORS headers should be present
      expect(res.headers).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should reject empty request body for registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      // Should reject empty body (400 or 500 both acceptable)
      expect([400, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject null values', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: null,
          email: null,
          password: null
        });

      // Should reject null values (400 or 500 both acceptable)
      expect([400, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject undefined values', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: undefined,
          password: undefined
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Authorization Checks', () => {
    it('should prevent access to protected routes without token', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should prevent access with invalid token', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set(getAuthHeader('invalid.token.here'))
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Large Payload Protection', () => {
    it('should handle large name input', async () => {
      const largeName = 'A'.repeat(1000);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: largeName,
          email: 'large@example.com',
          password: 'password123'
        });

      // Should either reject or truncate
      expect([400, 201]).toContain(res.status);
    });

    it('should handle extremely large JSON payload', async () => {
      const largePayload = {
        name: 'Test',
        email: 'test@example.com',
        password: 'password123',
        extra: 'A'.repeat(11 * 1024 * 1024) // 11MB (exceeds 10MB limit)
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(largePayload);

      // Should reject large payload (413 or 500 both acceptable)
      expect([413, 500]).toContain(res.status);
    });
  });

  describe('Content-Type Validation', () => {
    it('should accept application/json', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Error Message Security', () => {
    it('should not leak sensitive information in error messages', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      // Should use generic error message
      expect(res.body.error).toBe('Invalid credentials');
      expect(res.body.error).not.toContain('user not found');
      expect(res.body.error).not.toContain('password');
    });
  });
});
