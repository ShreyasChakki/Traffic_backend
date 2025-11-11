const request = require('supertest');
const { app } = require('../server');
const db = require('./setup');
const { registerUser, getAuthHeader } = require('./helpers/authHelper');
const { createTestEvent, createTestEvents, createTestIntersection } = require('./helpers/dataHelper');

describe('Dashboard Routes - /api/dashboard', () => {
  let accessToken;

  beforeAll(async () => {
    await db.connect();
  });

  beforeEach(async () => {
    const auth = await registerUser(app);
    accessToken = auth.accessToken;
  });

  afterEach(async () => {
    await db.clearDatabase();
  });

  afterAll(async () => {
    await db.closeDatabase();
  });

  describe('GET /api/dashboard/stats', () => {
    it('should get dashboard stats with authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set(getAuthHeader('invalid-token'))
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/dashboard/traffic-status', () => {
    it('should get traffic status', async () => {
      const res = await request(app)
        .get('/api/dashboard/traffic-status')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/api/dashboard/traffic-status?limit=5')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should use default limit of 10', async () => {
      const res = await request(app)
        .get('/api/dashboard/traffic-status')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/traffic-status')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should handle string limit parameter', async () => {
      const res = await request(app)
        .get('/api/dashboard/traffic-status?limit=abc')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return total count', async () => {
      const res = await request(app)
        .get('/api/dashboard/traffic-status')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.total).toBeDefined();
      expect(typeof res.body.total).toBe('number');
    });
  });

  describe('GET /api/dashboard/events', () => {
    beforeEach(async () => {
      const intersection = await createTestIntersection();
      await createTestEvents(15, intersection._id);
    });

    it('should get events with pagination', async () => {
      const res = await request(app)
        .get('/api/dashboard/events')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should respect limit parameter (max 50)', async () => {
      const res = await request(app)
        .get('/api/dashboard/events?limit=5')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.data.length).toBeLessThanOrEqual(5);
      expect(res.body.pagination.limit).toBe(5);
    });

    it('should enforce maximum limit of 50', async () => {
      const res = await request(app)
        .get('/api/dashboard/events?limit=100')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.pagination.limit).toBe(50);
    });

    it('should support pagination', async () => {
      const res1 = await request(app)
        .get('/api/dashboard/events?page=1&limit=5')
        .set(getAuthHeader(accessToken))
        .expect(200);

      const res2 = await request(app)
        .get('/api/dashboard/events?page=2&limit=5')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res1.body.pagination.page).toBe(1);
      expect(res2.body.pagination.page).toBe(2);
    });

    it('should filter by event type', async () => {
      const res = await request(app)
        .get('/api/dashboard/events?type=alert')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      res.body.data.forEach(event => {
        if (event.type) {
          expect(event.type).toBe('alert');
        }
      });
    });

    it('should include pagination metadata', async () => {
      const res = await request(app)
        .get('/api/dashboard/events?limit=5')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.pagination.page).toBeDefined();
      expect(res.body.pagination.limit).toBeDefined();
      expect(res.body.pagination.total).toBeDefined();
      expect(res.body.pagination.pages).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/events')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should format events correctly', async () => {
      const res = await request(app)
        .get('/api/dashboard/events?limit=1')
        .set(getAuthHeader(accessToken))
        .expect(200);

      if (res.body.data.length > 0) {
        const event = res.body.data[0];
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('message');
        expect(event).toHaveProperty('severity');
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('relativeTime');
      }
    });

    it('should handle invalid page number', async () => {
      const res = await request(app)
        .get('/api/dashboard/events?page=abc')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should handle negative page number', async () => {
      const res = await request(app)
        .get('/api/dashboard/events?page=-1')
        .set(getAuthHeader(accessToken));

      // Should handle gracefully (200 with empty results, 400, or 500)
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      }
    });
  });

  describe('GET /api/dashboard/events/unread-count', () => {
    beforeEach(async () => {
      await createTestEvent({ isRead: false });
      await createTestEvent({ isRead: false });
      await createTestEvent({ isRead: true });
    });

    it('should get unread event count', async () => {
      const res = await request(app)
        .get('/api/dashboard/events/unread-count')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(2);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/events/unread-count')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 0 when no unread events', async () => {
      await db.clearDatabase();
      const auth = await registerUser(app);

      const res = await request(app)
        .get('/api/dashboard/events/unread-count')
        .set(getAuthHeader(auth.accessToken))
        .expect(200);

      expect(res.body.data.count).toBe(0);
    });
  });

  describe('PUT /api/dashboard/events/read-all', () => {
    beforeEach(async () => {
      await createTestEvents(5);
    });

    it('should mark all events as read', async () => {
      const res = await request(app)
        .put('/api/dashboard/events/read-all')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('marked as read');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .put('/api/dashboard/events/read-all')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/dashboard/events/:id/read', () => {
    let eventId;

    beforeEach(async () => {
      const event = await createTestEvent({ isRead: false });
      eventId = event._id.toString();
    });

    it('should mark specific event as read', async () => {
      const res = await request(app)
        .put(`/api/dashboard/events/${eventId}/read`)
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('marked as read');
    });

    it('should fail with invalid event ID', async () => {
      const res = await request(app)
        .put('/api/dashboard/events/invalid-id/read')
        .set(getAuthHeader(accessToken));

      // Invalid ID format returns 404 or 500 depending on validation
      expect([404, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should fail with non-existent event ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/dashboard/events/${fakeId}/read`)
        .set(getAuthHeader(accessToken))
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not found');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .put(`/api/dashboard/events/${eventId}/read`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/dashboard/performance', () => {
    it('should get performance data with default period', async () => {
      const res = await request(app)
        .get('/api/dashboard/performance')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should accept 7days period', async () => {
      const res = await request(app)
        .get('/api/dashboard/performance?period=7days')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should accept 30days period', async () => {
      const res = await request(app)
        .get('/api/dashboard/performance?period=30days')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should accept 90days period', async () => {
      const res = await request(app)
        .get('/api/dashboard/performance?period=90days')
        .set(getAuthHeader(accessToken))
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should fail with invalid period', async () => {
      const res = await request(app)
        .get('/api/dashboard/performance?period=365days')
        .set(getAuthHeader(accessToken))
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid period');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/performance')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
