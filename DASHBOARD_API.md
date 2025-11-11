# Dashboard API Documentation

Complete API documentation for Smart Traffic IoT Dashboard endpoints.

---

## Base URL
```
http://localhost:5000/api/dashboard
```

## Authentication
All dashboard endpoints require authentication. Include JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Get Dashboard Statistics

**GET** `/stats`

Get overview statistics for the dashboard including traffic flow, wait times, and alerts.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalIntersections": 24,
    "activeIntersections": 22,
    "trafficFlow": 1547,
    "trafficFlowTrend": 12,
    "avgWaitTime": 45,
    "waitTimeTrend": -8,
    "activeAlerts": 3,
    "lastUpdate": "2024-11-05T10:30:00.000Z"
  }
}
```

**Fields:**
- `totalIntersections` - Total number of intersections in system
- `activeIntersections` - Number of active intersections
- `trafficFlow` - Current total vehicle count across all intersections
- `trafficFlowTrend` - Percentage change compared to 1 hour ago
- `avgWaitTime` - Average wait time in seconds
- `waitTimeTrend` - Percentage change in wait time
- `activeAlerts` - Number of active warning/error alerts in last hour
- `lastUpdate` - Timestamp of last update

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/dashboard/stats
```

---

### 2. Get Traffic Status

**GET** `/traffic-status`

Get current traffic status for all active intersections, sorted by congestion level.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional) - Number of results to return (default: 10, max: 50)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "673abc123def456...",
      "name": "MG Road Junction",
      "code": "MGRJ001",
      "status": "active",
      "currentSignal": "green",
      "vehicleCount": 45,
      "waitTime": 32,
      "congestionLevel": "medium",
      "location": {
        "lat": 12.9716,
        "lng": 77.6033
      }
    },
    {
      "id": "673abc123def457...",
      "name": "Brigade Road Cross",
      "code": "BRC001",
      "status": "active",
      "currentSignal": "red",
      "vehicleCount": 68,
      "waitTime": 58,
      "congestionLevel": "high",
      "location": {
        "lat": 12.9726,
        "lng": 77.6082
      }
    }
  ],
  "total": 22
}
```

**Congestion Levels:**
- `low` - 0-30 vehicles
- `medium` - 31-60 vehicles
- `high` - 61+ vehicles

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/dashboard/traffic-status?limit=10"
```

---

### 3. Get Recent Events

**GET** `/events`

Get recent system events with pagination and filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional) - Events per page (default: 10, max: 50)
- `page` (optional) - Page number (default: 1)
- `type` (optional) - Filter by event type (sync/alert/override/maintenance)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "673def789abc123...",
      "type": "sync",
      "message": "Signal sync completed at Park Street",
      "severity": "success",
      "timestamp": "2024-11-05T10:28:00.000Z",
      "relativeTime": "2 mins ago",
      "intersection": "Park Street Circle",
      "user": null,
      "isRead": false
    },
    {
      "id": "673def789abc124...",
      "type": "alert",
      "message": "High congestion detected at MG Road Junction",
      "severity": "warning",
      "timestamp": "2024-11-05T10:25:00.000Z",
      "relativeTime": "5 mins ago",
      "intersection": "MG Road Junction",
      "user": "Admin User",
      "isRead": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

**Event Types:**
- `sync` - Signal synchronization
- `alert` - Traffic alert/warning
- `override` - Manual signal override
- `maintenance` - Maintenance activity

**Severity Levels:**
- `info` - Informational
- `success` - Successful operation
- `warning` - Warning condition
- `error` - Error condition

**Examples:**
```bash
# Get first page
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/dashboard/events?page=1&limit=10"

# Filter by type
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/dashboard/events?type=alert"

# Get page 2 with 20 items
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/dashboard/events?page=2&limit=20"
```

---

### 4. Get Performance Data

**GET** `/performance`

Get signal performance/efficiency data over a time period.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional) - Time period (7days/30days/90days, default: 7days)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-11-05",
      "efficiency": 87
    },
    {
      "date": "2024-11-04",
      "efficiency": 85
    },
    {
      "date": "2024-11-03",
      "efficiency": 90
    },
    {
      "date": "2024-11-02",
      "efficiency": 88
    },
    {
      "date": "2024-11-01",
      "efficiency": 92
    },
    {
      "date": "2024-10-31",
      "efficiency": 86
    },
    {
      "date": "2024-10-30",
      "efficiency": 84
    }
  ]
}
```

**Efficiency Score:**
- Calculated based on average wait time vs target (30 seconds)
- Formula: `100 - (avgWaitTime / targetWaitTime * 100)`
- Range: 0-100 (higher is better)

**Examples:**
```bash
# Last 7 days
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/dashboard/performance?period=7days"

# Last 30 days
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/dashboard/performance?period=30days"

# Last 90 days
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/dashboard/performance?period=90days"
```

---

### 5. Mark Event as Read

**PUT** `/events/:id/read`

Mark a specific event as read.

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` - Event ID

**Response (200):**
```json
{
  "success": true,
  "message": "Event marked as read"
}
```

**Example:**
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/dashboard/events/673def789abc123/read
```

---

### 6. Mark All Events as Read

**PUT** `/events/read-all`

Mark all events as read.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "All events marked as read"
}
```

**Example:**
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/dashboard/events/read-all
```

---

### 7. Get Unread Event Count

**GET** `/events/unread-count`

Get count of unread events.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/dashboard/events/unread-count
```

---

## Socket.IO Real-time Events

### Connection

Connect to Socket.IO server with JWT authentication:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

### Dashboard Events

#### Join Dashboard Room

**Client → Server:**
```javascript
socket.emit('join-dashboard');
```

**Server → Client (on join):**
```javascript
socket.on('dashboard-initial-data', (data) => {
  console.log('Initial data:', data);
  // {
  //   stats: { ... },
  //   trafficStatus: [ ... ],
  //   timestamp: "2024-11-05T10:30:00.000Z"
  // }
});

socket.on('room-joined', (data) => {
  console.log('Joined room:', data.room); // 'dashboard'
});
```

#### Leave Dashboard Room

**Client → Server:**
```javascript
socket.emit('leave-dashboard');
```

#### Real-time Updates

**Stats Update (every 10 seconds):**
```javascript
socket.on('stats-update', (data) => {
  console.log('Stats updated:', data.stats);
  // Update dashboard stats display
});
```

**Traffic Status Update (every 5 seconds):**
```javascript
socket.on('traffic-status-update', (data) => {
  console.log('Traffic updated:', data.data);
  // Update traffic status display
});
```

**New Event:**
```javascript
socket.on('new-event', (event) => {
  console.log('New event:', event);
  // {
  //   id: "...",
  //   type: "sync",
  //   message: "...",
  //   severity: "success",
  //   timestamp: "...",
  //   relativeTime: "2 mins ago",
  //   intersection: "..."
  // }
});
```

**Traffic Update (per intersection):**
```javascript
socket.on('traffic-update', (data) => {
  console.log('Intersection updated:', data);
  // {
  //   intersectionId: "...",
  //   name: "MG Road Junction",
  //   vehicleCount: 45,
  //   waitTime: 32,
  //   congestionLevel: "medium",
  //   currentSignal: "green",
  //   timestamp: "..."
  // }
});
```

**Congestion Alert:**
```javascript
socket.on('congestion-alert', (data) => {
  console.log('Congestion alert:', data);
  // {
  //   id: "...",
  //   intersectionId: "...",
  //   name: "MG Road Junction",
  //   vehicleCount: 85,
  //   waitTime: 95,
  //   congestionLevel: "high",
  //   timestamp: "..."
  // }
});
```

#### Manual Refresh Requests

**Request Stats Update:**
```javascript
socket.emit('request-stats-update');

socket.on('stats-update', (data) => {
  console.log('Stats:', data.stats);
});
```

**Request Traffic Update:**
```javascript
socket.emit('request-traffic-update');

socket.on('traffic-status-update', (data) => {
  console.log('Traffic:', data.data);
});
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

### Common Error Codes

- **400** - Bad Request (invalid parameters)
- **401** - Unauthorized (missing/invalid token)
- **404** - Not Found (resource doesn't exist)
- **500** - Internal Server Error

---

## Caching

The following endpoints use caching to improve performance:

| Endpoint | Cache TTL |
|----------|-----------|
| `/stats` | 5 seconds |
| `/traffic-status` | 3 seconds |
| `/events` | 10 seconds |
| `/performance` | 5 minutes |

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- Applies to all `/api/*` endpoints

---

## Complete Dashboard Integration Example

```javascript
import { io } from 'socket.io-client';

class DashboardService {
  constructor(token) {
    this.token = token;
    this.baseURL = 'http://localhost:5000/api/dashboard';
    this.socket = null;
  }

  // Initialize Socket.IO connection
  connectSocket() {
    this.socket = io('http://localhost:5000', {
      auth: { token: this.token }
    });

    this.socket.on('connected', (data) => {
      console.log('Connected:', data.message);
      this.socket.emit('join-dashboard');
    });

    this.socket.on('stats-update', (data) => {
      this.updateStats(data.stats);
    });

    this.socket.on('traffic-status-update', (data) => {
      this.updateTrafficStatus(data.data);
    });

    this.socket.on('new-event', (event) => {
      this.addNewEvent(event);
    });

    this.socket.on('congestion-alert', (alert) => {
      this.showCongestionAlert(alert);
    });
  }

  // Fetch initial data
  async fetchStats() {
    const response = await fetch(`${this.baseURL}/stats`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return await response.json();
  }

  async fetchTrafficStatus(limit = 10) {
    const response = await fetch(`${this.baseURL}/traffic-status?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return await response.json();
  }

  async fetchEvents(page = 1, limit = 10, type = null) {
    let url = `${this.baseURL}/events?page=${page}&limit=${limit}`;
    if (type) url += `&type=${type}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return await response.json();
  }

  async fetchPerformance(period = '7days') {
    const response = await fetch(`${this.baseURL}/performance?period=${period}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return await response.json();
  }

  // Update methods (implement based on your UI framework)
  updateStats(stats) {
    console.log('Update stats:', stats);
  }

  updateTrafficStatus(status) {
    console.log('Update traffic:', status);
  }

  addNewEvent(event) {
    console.log('New event:', event);
  }

  showCongestionAlert(alert) {
    console.log('Congestion alert:', alert);
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.emit('leave-dashboard');
      this.socket.disconnect();
    }
  }
}

// Usage
const dashboard = new DashboardService('YOUR_JWT_TOKEN');
dashboard.connectSocket();

// Fetch initial data
const stats = await dashboard.fetchStats();
const traffic = await dashboard.fetchTrafficStatus(10);
const events = await dashboard.fetchEvents(1, 10);
const performance = await dashboard.fetchPerformance('7days');

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  dashboard.disconnect();
});
```

---

## Testing

### Using cURL

```bash
# Set your token
TOKEN="your_jwt_token_here"

# Get stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/dashboard/stats

# Get traffic status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/dashboard/traffic-status

# Get events
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/dashboard/events

# Get performance
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/dashboard/performance?period=7days
```

### Using Postman

Import the provided Postman collection and set the `token` variable to your JWT token.

---

## Support

For issues or questions, refer to:
- Main README.md
- API_DOCUMENTATION.md
- SOCKET_DOCUMENTATION.md
