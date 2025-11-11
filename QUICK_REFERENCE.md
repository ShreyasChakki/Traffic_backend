# Smart Traffic IoT - Quick Reference

Quick reference guide for developers working with the Smart Traffic IoT Backend.

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Seed database
npm run seed

# Start development server
npm run dev

# Start production server
npm start

# Delete all data
npm run seed -- -d
```

---

## 🔑 Sample Credentials

```
Admin:    admin@smarttraffic.com / admin123
Operator: operator@smarttraffic.com / operator123
Viewer:   viewer@smarttraffic.com / viewer123
```

---

## 📡 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Authentication
```bash
POST   /auth/register      # Register user
POST   /auth/login         # Login
GET    /auth/me            # Get current user (protected)
PUT    /auth/profile       # Update profile (protected)
PUT    /auth/password      # Change password (protected)
POST   /auth/logout        # Logout (protected)
```

### Dashboard
```bash
GET    /dashboard/stats                    # Dashboard statistics
GET    /dashboard/traffic-status           # Traffic status
GET    /dashboard/events                   # Recent events
GET    /dashboard/performance              # Performance data
GET    /dashboard/events/unread-count      # Unread count
PUT    /dashboard/events/:id/read          # Mark event as read
PUT    /dashboard/events/read-all          # Mark all as read
```

### Health Check
```bash
GET    /test/health        # API health
GET    /test/db            # Database health
```

---

## 🔐 Authentication Header

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📊 Quick Test Commands

### Get Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smarttraffic.com","password":"admin123"}'
```

### Test Dashboard (replace TOKEN)
```bash
TOKEN="your_token_here"

# Stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/dashboard/stats

# Traffic
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/dashboard/traffic-status

# Events
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/dashboard/events
```

---

## 🔌 Socket.IO Quick Setup

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

// Connect to dashboard
socket.on('connected', () => {
  socket.emit('join-dashboard');
});

// Listen for updates
socket.on('stats-update', (data) => console.log('Stats:', data));
socket.on('traffic-status-update', (data) => console.log('Traffic:', data));
socket.on('new-event', (event) => console.log('Event:', event));
socket.on('congestion-alert', (alert) => console.log('Alert:', alert));
```

---

## 📦 Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'admin' | 'operator' | 'viewer',
  avatar: String,
  isActive: Boolean,
  lastLogin: Date
}
```

### Intersection
```javascript
{
  name: String (unique),
  code: String (unique, auto-generated),
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  status: 'active' | 'inactive' | 'maintenance',
  currentSignal: 'red' | 'yellow' | 'green',
  vehicleCount: Number,
  waitTime: Number,
  signalTiming: { red, yellow, green },
  isAdaptive: Boolean
}
```

### TrafficData
```javascript
{
  intersectionId: ObjectId,
  timestamp: Date,
  vehicleCount: Number,
  waitTime: Number,
  congestionLevel: 'low' | 'medium' | 'high',
  signalState: 'red' | 'yellow' | 'green',
  averageSpeed: Number,
  metadata: { temperature, weather, dayOfWeek, hour }
}
```

### Event
```javascript
{
  type: 'sync' | 'alert' | 'override' | 'maintenance',
  intersectionId: ObjectId,
  message: String,
  severity: 'info' | 'warning' | 'error' | 'success',
  timestamp: Date,
  userId: ObjectId,
  isRead: Boolean
}
```

---

## 🎨 Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

## ⚙️ Configuration

### Environment Variables (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart_traffic
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Cache TTL
```
Stats:          5 seconds
Traffic Status: 3 seconds
Events:         10 seconds
Performance:    5 minutes
```

### Background Jobs
```
Traffic Generation: Every 5 seconds
Event Generation:   Every 10 seconds
Signal Cycling:     Every 60 seconds
Stats Broadcast:    Every 10 seconds
Traffic Broadcast:  Every 5 seconds
Data Cleanup:       Every 1 hour
```

---

## 🔍 MongoDB Quick Queries

```javascript
// Connect to MongoDB
mongo
use smart_traffic

// Count documents
db.users.count()
db.intersections.count()
db.trafficdatas.count()
db.events.count()

// View recent data
db.intersections.find().pretty()
db.trafficdatas.find().sort({timestamp: -1}).limit(5).pretty()
db.events.find().sort({timestamp: -1}).limit(5).pretty()

// Clear collections
db.trafficdatas.deleteMany({})
db.events.deleteMany({})

// Find by criteria
db.intersections.find({status: "active"})
db.events.find({severity: "warning"})
db.trafficdatas.find({congestionLevel: "high"})
```

---

## 🐛 Common Issues & Solutions

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongod

# Or start MongoDB service
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
# Mac: brew services start mongodb-community
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### JWT Token Invalid
```bash
# Get new token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smarttraffic.com","password":"admin123"}'
```

### No Data in Dashboard
```bash
# Seed database
npm run seed

# Wait 5-10 seconds for traffic simulator
# Check server logs for "Generated traffic data"
```

---

## 📝 Useful Code Snippets

### Create Intersection
```javascript
const intersection = await Intersection.create({
  name: "Test Junction",
  location: {
    latitude: 12.9716,
    longitude: 77.6033,
    address: "Test Address"
  },
  status: "active"
});
```

### Query Traffic Data
```javascript
const data = await TrafficData.find({
  intersectionId: id,
  timestamp: { $gte: startDate, $lte: endDate }
}).sort({ timestamp: -1 });
```

### Create Event
```javascript
const event = await Event.create({
  type: "alert",
  intersectionId: id,
  message: "High congestion detected",
  severity: "warning"
});
```

### Emit Socket Event
```javascript
if (global.io) {
  global.io.to('dashboard').emit('stats-update', {
    stats: data,
    timestamp: new Date().toISOString()
  });
}
```

---

## 📚 Documentation Files

```
README.md                  - Project overview
API_DOCUMENTATION.md       - Auth API reference
SOCKET_DOCUMENTATION.md    - Socket.IO events
DASHBOARD_API.md           - Dashboard API reference
DASHBOARD_TESTING.md       - Testing guide
DASHBOARD_SUMMARY.md       - Implementation summary
PROJECT_SUMMARY.md         - Complete project summary
QUICK_REFERENCE.md         - This file
```

---

## 🎯 HTTP Status Codes

```
200 - OK (Success)
201 - Created (Resource created)
400 - Bad Request (Invalid input)
401 - Unauthorized (No/invalid token)
403 - Forbidden (Insufficient permissions)
404 - Not Found (Resource not found)
429 - Too Many Requests (Rate limited)
500 - Internal Server Error
```

---

## 🔧 Development Tools

### Postman Collection
```
Import: Smart_Traffic_API.postman_collection.json
Set variable: token = YOUR_JWT_TOKEN
```

### VS Code Extensions
- REST Client
- MongoDB for VS Code
- Socket.IO Client
- Thunder Client

### Browser Tools
- Chrome DevTools (Network, Console)
- Socket.IO Client Extension
- Postman Desktop

---

## 🚦 Traffic Congestion Levels

```
Low:      0-30 vehicles    (Green)
Medium:  31-60 vehicles    (Yellow)
High:    61+ vehicles      (Red)
```

---

## 📊 Performance Benchmarks

```
API Response Time (cached):  < 50ms
API Response Time (uncached): < 200ms
Socket.IO Latency:           < 10ms
Database Query Time:         < 100ms
Background Job Execution:    < 500ms
```

---

## 🎓 Learning Resources

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [Socket.IO Docs](https://socket.io/)
- [JWT.io](https://jwt.io/)
- [MongoDB Manual](https://docs.mongodb.com/)

---

## 📞 Quick Help

```bash
# Check server status
curl http://localhost:5000/api/test/health

# Check database status
curl http://localhost:5000/api/test/db

# View server logs
npm run dev

# Check MongoDB
mongo
show dbs
use smart_traffic
show collections
```

---

## ✅ Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection working
- [ ] All tests passing
- [ ] JWT secret changed
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error handling tested
- [ ] Socket.IO working
- [ ] Background jobs running
- [ ] Documentation updated

---

**For detailed information, refer to the complete documentation files.**
