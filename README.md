# Smart Traffic IoT - Backend

Backend server for Smart Traffic IoT Web Application built with Node.js, Express, MongoDB, and Socket.IO.

## Features

- 🔐 JWT Authentication
- 👥 Role-based Access Control (Admin, Operator, Viewer)
- 🔄 Real-time Updates with Socket.IO
- 📊 Dashboard API with Analytics
- 🚦 Traffic Data Simulation
- 📈 Performance Metrics
- 🔔 Event Notifications
- 💾 In-memory Caching
- 🛡️ Security Best Practices (Helmet, CORS, Rate Limiting)
- 📊 MongoDB Database
- ✅ Input Validation
- 🚀 Production Ready

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env` file and update values
   - Set `MONGODB_URI` to your MongoDB connection string
   - Change `JWT_SECRET` to a secure random string

3. Start MongoDB (if running locally):
```bash
mongod
```

4. Run the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

5. Seed database (optional):
```bash
npm run seed
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `PUT /api/auth/password` - Change password (protected)

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/traffic-status` - Traffic status
- `GET /api/dashboard/events` - Recent events
- `GET /api/dashboard/performance` - Performance data

### Health Check
- `GET /api/test/health` - API health status

For complete API documentation, see [DASHBOARD_API.md](DASHBOARD_API.md)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/smart_traffic |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRE | JWT expiration time | 7d |
| NODE_ENV | Environment mode | development |
| CLIENT_URL | Frontend URL for CORS | http://localhost:5173 |

## Project Structure

```
/backend
  /src
    /config       - Database, socket, constants
    /models       - MongoDB schemas
    /controllers  - Business logic
    /routes       - API endpoints
    /middleware   - Auth, error handling
    /services     - External services
    /utils        - Helpers, validators
    /socket       - Socket.IO handlers
  /tests          - Unit tests
  server.js       - Entry point
  .env            - Environment variables
```

## Socket.IO Events

### Client → Server
- `join-dashboard` - Join dashboard room
- `leave-dashboard` - Leave room
- `join-map` - Join map updates
- `disconnect` - Clean up

### Server → Client
- `connected` - Connection confirmation
- `stats-update` - Dashboard statistics update
- `traffic-status-update` - Traffic status update
- `traffic-update` - Real-time traffic data
- `new-event` - New system event
- `congestion-alert` - Congestion alert
- `signal-changed` - Signal state changed

For complete Socket.IO documentation, see [SOCKET_DOCUMENTATION.md](SOCKET_DOCUMENTATION.md)

## Security Features

- Helmet.js security headers
- CORS configuration
- Rate limiting (100 requests/15min)
- XSS protection
- NoSQL injection prevention
- Password hashing (bcrypt)
- JWT authentication

## Testing

Test the API using the health check endpoint:
```bash
curl http://localhost:5000/api/test/health
```

For complete testing guide, see [DASHBOARD_TESTING.md](DASHBOARD_TESTING.md)

## Documentation

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Authentication API reference
- [DASHBOARD_API.md](DASHBOARD_API.md) - Dashboard API reference
- [SOCKET_DOCUMENTATION.md](SOCKET_DOCUMENTATION.md) - Socket.IO events
- [DASHBOARD_TESTING.md](DASHBOARD_TESTING.md) - Testing guide
- [DASHBOARD_SUMMARY.md](DASHBOARD_SUMMARY.md) - Implementation summary
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick reference guide
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Complete project summary

## What's Included

### Models
- **User** - Authentication and user management
- **Intersection** - Traffic intersection data
- **TrafficData** - Historical traffic records
- **Event** - System events and notifications

### Services
- **Analytics Service** - Data aggregation and calculations
- **Traffic Simulator** - Realistic traffic data generation
- **Cache Service** - In-memory caching with TTL
- **Jobs Service** - Background task management

### Features
- Real-time traffic monitoring
- Live event notifications
- Performance analytics
- Automated data generation
- Signal state management
- Congestion detection
- Historical data tracking

## License

ISC
