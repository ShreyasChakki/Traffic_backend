const request = require('supertest');
const { app } = require('../server');
const db = require('./setup');
const { registerUser, createTestUser, getAuthHeader } = require('./helpers/authHelper');
const RefreshToken = require('../src/models/RefreshToken');

describe('Protected Auth Routes', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterEach(async () => {
    await db.clearDatabase();
  });

  afterAll(async () => {
    await db.closeDatabase();
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const { refreshToken } = await registerUser(app);

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should fail with missing refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('required');
    });

    it('should fail with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should fail with expired refresh token', async () => {
      const user = await createTestUser();
      const expiredToken = new RefreshToken({
        token: 'expired-token',
        userId: user._id,
        expiresAt: new Date(Date.now() - 1000),
        createdByIp: '127.0.0.1'
      });
      await expiredToken.save();

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'expired-token' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user successfully', async () => {
      const { accessToken, user } = await registerUser(app);

      const res = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(user.id);
      expect(res.body.data.user.email).toBe(user.email);
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeader('invalid-token'))
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/permissions', () => {
    it('should get admin permissions', async () => {
      const { accessToken } = await registerUser(app, {
        email: 'admin@example.com',
        role: 'admin'
      });

      const res = await request(app)
        .get('/api/auth/permissions')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('admin');
      expect(res.body.data.permissions.manageUsers).toBe(true);
      expect(res.body.data.permissions.modifySettings).toBe(true);
    });

    it('should get operator permissions', async () => {
      const { accessToken } = await registerUser(app, {
        email: 'operator@example.com',
        role: 'operator'
      });

      const res = await request(app)
        .get('/api/auth/permissions')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.data.role).toBe('operator');
      expect(res.body.data.permissions.modifySignals).toBe(true);
      expect(res.body.data.permissions.manageUsers).toBe(false);
    });

    it('should get viewer permissions', async () => {
      const { accessToken } = await registerUser(app);

      const res = await request(app)
        .get('/api/auth/permissions')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.data.role).toBe('viewer');
      expect(res.body.data.permissions.viewDashboard).toBe(true);
      expect(res.body.data.permissions.modifySignals).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update profile successfully', async () => {
      const { accessToken } = await registerUser(app);

      const updates = {
        name: 'Updated Name',
        avatar: 'https://example.com/avatar.jpg'
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .set(getAuthHeader(accessToken))
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe(updates.name);
      expect(res.body.data.user.avatar).toBe(updates.avatar);
    });

    it('should update only name', async () => {
      const { accessToken } = await registerUser(app);

      const res = await request(app)
        .put('/api/auth/profile')
        .set(getAuthHeader(accessToken))
        .send({ name: 'New Name' })
        .expect(200);

      expect(res.body.data.user.name).toBe('New Name');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'New Name' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/password', () => {
    it('should change password successfully', async () => {
      const { accessToken } = await registerUser(app, {
        password: 'oldpassword123'
      });

      const res = await request(app)
        .put('/api/auth/password')
        .set(getAuthHeader(accessToken))
        .send({
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('changed successfully');
    });

    it('should fail with wrong current password', async () => {
      const { accessToken } = await registerUser(app);

      const res = await request(app)
        .put('/api/auth/password')
        .set(getAuthHeader(accessToken))
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('incorrect');
    });

    it('should fail with missing current password', async () => {
      const { accessToken } = await registerUser(app);

      const res = await request(app)
        .put('/api/auth/password')
        .set(getAuthHeader(accessToken))
        .send({ newPassword: 'newpassword123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with missing new password', async () => {
      const { accessToken } = await registerUser(app);

      const res = await request(app)
        .put('/api/auth/password')
        .set(getAuthHeader(accessToken))
        .send({ currentPassword: 'password123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const { accessToken, refreshToken } = await registerUser(app);

      const res = await request(app)
        .post('/api/auth/logout')
        .set(getAuthHeader(accessToken))
        .send({ refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Logged out');
    });

    it('should logout without refresh token', async () => {
      const { accessToken } = await registerUser(app);

      const res = await request(app)
        .post('/api/auth/logout')
        .set(getAuthHeader(accessToken))
        .send({})
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout-all', () => {
    it('should logout from all devices', async () => {
      const { accessToken } = await registerUser(app);

      const res = await request(app)
        .post('/api/auth/logout-all')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Logged out');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/auth/logout-all')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should generate reset token', async () => {
      await createTestUser({ email: 'test@example.com' });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.resetToken).toBeDefined();
    });

    it('should not reveal if user does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should fail without email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      await createTestUser({ email: 'test@example.com' });
      
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      const resetToken = forgotRes.body.data.resetToken;

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken,
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('reset successful');
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken: 'invalid-token',
          newPassword: 'newpassword123'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid or expired');
    });

    it('should fail without reset token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ newPassword: 'newpassword123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail without new password', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ resetToken: 'some-token' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
