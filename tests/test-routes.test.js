const request = require('supertest');
const { app } = require('../server');
const db = require('./setup');

describe('Test Routes - /api/test', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.closeDatabase();
  });

  describe('GET /api/test/health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/api/test/health')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('API is running');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.environment).toBeDefined();
    });

    it('should have correct response structure', async () => {
      const res = await request(app)
        .get('/api/test/health')
        .expect(200);

      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('environment');
    });

    it('should return valid ISO timestamp', async () => {
      const res = await request(app)
        .get('/api/test/health')
        .expect(200);

      const timestamp = new Date(res.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('GET /api/test/db', () => {
    it('should return database connection status', async () => {
      const res = await request(app)
        .get('/api/test/db')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.database).toBeDefined();
      expect(res.body.database.status).toBeDefined();
    });

    it('should show connected status', async () => {
      const res = await request(app)
        .get('/api/test/db')
        .expect(200);

      expect(res.body.database.status).toBe('connected');
    });

    it('should have database name and host', async () => {
      const res = await request(app)
        .get('/api/test/db')
        .expect(200);

      expect(res.body.database).toHaveProperty('name');
      expect(res.body.database).toHaveProperty('host');
    });
  });
});

describe('Root Route', () => {
  it('should return API information', async () => {
    const res = await request(app)
      .get('/')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Smart Traffic IoT API');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.endpoints).toBeDefined();
  });

  it('should list available endpoints', async () => {
    const res = await request(app)
      .get('/')
      .expect(200);

    expect(res.body.endpoints.health).toBe('/api/test/health');
    expect(res.body.endpoints.auth).toBe('/api/auth');
    expect(res.body.endpoints.dashboard).toBe('/api/dashboard');
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app)
      .get('/api/unknown-route')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Route not found');
  });

  it('should return 404 for POST to unknown route', async () => {
    const res = await request(app)
      .post('/api/does-not-exist')
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  it('should return 404 for PUT to unknown route', async () => {
    const res = await request(app)
      .put('/api/invalid')
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  it('should return 404 for DELETE to unknown route', async () => {
    const res = await request(app)
      .delete('/api/nonexistent')
      .expect(404);

    expect(res.body.success).toBe(false);
  });
});
