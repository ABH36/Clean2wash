# 🚀 Real-Time Communication - Quick Integration Guide

## ⚡ **QUICK START (10 Minutes)**

### **Step 1: Backend Integration**

Replace existing socket service:

```javascript
// In server.js - REPLACE old socketService with enhanced version

// OLD:
// const socketService = require('./socketService');

// NEW:
const enhancedSocket = require('./services/enhancedSocketService');

// Initialize after server starts
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Initialize enhanced socket
    enhancedSocket.init(server);
    console.log('✅ Enhanced Socket.IO initialized');
});
```

### **Step 2: Frontend Integration**

Update your socket usage:

```javascript
// OLD: Direct socket.io-client usage
// import { io } from 'socket.io-client';

// NEW: Use enhanced client
import socketClient from './utils/enhancedSocketClient';
import { useEnhancedSocket } from './hooks/useEnhancedSocket';

// In your component
function MyComponent() {
    const token = localStorage.getItem('token');
    const { isConnected, emit, on } = useEnhancedSocket(token);
    
    // Use socket methods
    useEffect(() => {
        if (isConnected) {
            emit('join_booking_room', bookingId);
        }
    }, [isConnected]);
    
    return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>;
}
```

### **Step 3: Test It Works**

```bash
# Start server
npm start

# Check logs:
# ✅ Enhanced Socket.IO initialized
# [Socket] Connected: abc123 (User: user123, Role: driver)
```

---

## 📋 **MIGRATION GUIDE**

### **Backend Changes:**

**Before:**
```javascript
const socketService = require('./socketService');
const io = socketService.init(server);

// Send notification
io.to(userId).emit('notification', data);
```

**After:**
```javascript
const enhancedSocket = require('./services/enhancedSocketService');
enhancedSocket.init(server);

// Send notification with retry
const result = enhancedSocket.sendNotification(userId, data);
if (result.queued) {
    console.log('Notification queued for offline user');
}
```

### **Frontend Changes:**

**Before:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
    auth: { token }
});

socket.on('connect', () => {
    console.log('Connected');
});

socket.emit('update_location', data);
```

**After:**
```javascript
import { useEnhancedSocket } from './hooks/useEnhancedSocket';

function MyComponent() {
    const { isConnected, emit, on } = useEnhancedSocket(token);
    
    // Auto-reconnect, queuing, error handling built-in
    const updateLocation = async () => {
        const result = await emit('update_location', data);
        if (result.queued) {
            console.log('Queued for later');
        }
    };
}
```

---

## 🎯 **COMMON USE CASES**

### **1. Driver Location Tracking**

```javascript
import { useLocationTracking } from './hooks/useEnhancedSocket';

function DriverTracking({ bookingId }) {
    const {
        isTracking,
        lastUpdate,
        error,
        startTracking,
        stopTracking
    } = useLocationTracking(bookingId, true); // Auto-start
    
    return (
        <div>
            <div>Tracking: {isTracking ? 'Active' : 'Inactive'}</div>
            <div>Last Update: {lastUpdate?.toLocaleTimeString()}</div>
            {error && <div>Error: {error}</div>}
            <button onClick={stopTracking}>Stop Tracking</button>
        </div>
    );
}
```

### **2. Real-Time Notifications**

```javascript
import { useSocketNotifications } from './hooks/useEnhancedSocket';

function NotificationBell() {
    const {
        notifications,
        unreadCount,
        markAsRead,
        clearNotifications
    } = useSocketNotifications((notification) => {
        // Show toast
        toast.info(notification.message);
    });
    
    return (
        <div>
            <Badge count={unreadCount}>
                <BellIcon onClick={markAsRead} />
            </Badge>
            {notifications.map(n => (
                <NotificationItem key={n.id} notification={n} />
            ))}
        </div>
    );
}
```

### **3. Booking Status Updates**

```javascript
function BookingStatus({ bookingId }) {
    const { on, isConnected } = useEnhancedSocket(token);
    const [status, setStatus] = useState('pending');
    
    useEffect(() => {
        const unsubscribe = on('booking_update', (data) => {
            if (data.bookingId === bookingId) {
                setStatus(data.status);
            }
        });
        
        return unsubscribe;
    }, [bookingId, on]);
    
    return (
        <div>
            <div>Status: {status}</div>
            <div>Connected: {isConnected ? '🟢' : '🔴'}</div>
        </div>
    );
}
```

### **4. Connection Status Indicator**

```javascript
function ConnectionStatus() {
    const {
        isConnected,
        connectionStatus,
        error,
        latency,
        queueSize
    } = useEnhancedSocket(token);
    
    return (
        <div className="connection-status">
            <div className={isConnected ? 'online' : 'offline'}>
                {connectionStatus}
            </div>
            {latency && <div>Latency: {latency}ms</div>}
            {queueSize > 0 && <div>Queued: {queueSize} events</div>}
            {error && <div className="error">{error}</div>}
        </div>
    );
}
```

---

## 🔧 **CONFIGURATION**

### **Environment Variables:**

```env
# Backend (.env)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
REDIS_URL=redis://localhost:6379  # Optional for scaling
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Frontend (.env)
VITE_API_URL=http://localhost:5000
```

### **Custom Settings:**

```javascript
// Backend - Adjust timeouts
const enhancedSocket = require('./services/enhancedSocketService');

// Modify in enhancedSocketService.js
{
    pingInterval: 25000,      // Increase for poor networks
    pingTimeout: 60000,       // Increase timeout
    connectTimeout: 45000,    // Connection timeout
    reconnectionAttempts: 10, // Max reconnection attempts
}

// Frontend - Adjust reconnection
// Modify in enhancedSocketClient.js
{
    maxReconnectAttempts: 10,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000
}
```

---

## 🚨 **TROUBLESHOOTING**

### **Problem: Connection not establishing**

```javascript
// Check token
const token = localStorage.getItem('token');
console.log('Token:', token ? 'Present' : 'Missing');

// Check server URL
console.log('API URL:', import.meta.env.VITE_API_URL);

// Check connection status
const status = socketClient.getStatus();
console.log('Status:', status);
```

### **Problem: Events not being received**

```javascript
// Verify connection
const { isConnected } = useEnhancedSocket(token);
console.log('Connected:', isConnected);

// Check if joined room
emit('join_booking_room', bookingId);

// Listen to event
on('event_name', (data) => {
    console.log('Received:', data);
});
```

### **Problem: Location updates failing**

```javascript
// Check geolocation permission
navigator.permissions.query({ name: 'geolocation' }).then(result => {
    console.log('Geolocation:', result.state);
});

// Check location tracking
const { isTracking, error } = useLocationTracking(bookingId, true);
console.log('Tracking:', isTracking, 'Error:', error);

// Manual update
const location = {
    lat: 28.7041,
    lng: 77.1025
};
const result = await emit('update_location', { bookingId, location });
console.log('Result:', result);
```

### **Problem: High queue size**

```javascript
// Check queue size
const { queueSize } = useEnhancedSocket(token);
console.log('Queue size:', queueSize);

// If queue growing, check connection
if (queueSize > 20) {
    console.warn('Large queue, connection may be unstable');
    // Force reconnect
    socketClient.disconnect();
    await socketClient.connect(token);
}
```

---

## 📊 **MONITORING**

### **Backend Monitoring:**

```javascript
// Add to your monitoring/admin endpoint
app.get('/api/admin/socket-stats', (req, res) => {
    const enhancedSocket = require('./services/enhancedSocketService');
    
    res.json({
        connectedClients: enhancedSocket.getConnectedClientsCount(),
        locationQueueSize: locationUpdateQueue.size,
        notificationQueueSize: notificationQueue.size
    });
});
```

### **Frontend Monitoring:**

```javascript
// Add to your app
function SocketMonitor() {
    const status = socketClient.getStatus();
    
    useEffect(() => {
        // Log status every 30 seconds
        const interval = setInterval(() => {
            console.log('[Socket Monitor]', status);
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);
    
    return null;
}
```

---

## ✅ **VERIFICATION CHECKLIST**

After integration, verify:

- [ ] Server starts without errors
- [ ] Socket.IO initializes successfully
- [ ] Client connects with token
- [ ] Auto-reconnect works
- [ ] Events are queued when offline
- [ ] Queued events sent on reconnect
- [ ] Location updates working
- [ ] Notifications delivered
- [ ] Heartbeat monitoring active
- [ ] Error handling working
- [ ] Latency tracking working
- [ ] Queue cleanup running

---

## 🎯 **BEST PRACTICES**

### **1. Always Use Hooks**
```javascript
// ✅ Good
const { emit, on } = useEnhancedSocket(token);

// ❌ Bad
import { io } from 'socket.io-client';
const socket = io(url);
```

### **2. Handle Connection Status**
```javascript
// ✅ Good
const { isConnected, emit } = useEnhancedSocket(token);

if (isConnected) {
    await emit('event', data);
} else {
    // Show offline indicator
}

// ❌ Bad
emit('event', data); // May fail if not connected
```

### **3. Clean Up Listeners**
```javascript
// ✅ Good
useEffect(() => {
    const unsubscribe = on('event', handler);
    return unsubscribe; // Cleanup
}, []);

// ❌ Bad
on('event', handler); // Memory leak
```

### **4. Use Auto Location Tracking**
```javascript
// ✅ Good
const { isTracking } = useLocationTracking(bookingId, true);

// ❌ Bad
setInterval(() => {
    navigator.geolocation.getCurrentPosition(pos => {
        emit('update_location', pos);
    });
}, 5000);
```

---

## 🚀 **PERFORMANCE TIPS**

### **1. Limit Event Frequency**
```javascript
// Use throttle for high-frequency events
import { throttle } from 'lodash';

const throttledUpdate = throttle((location) => {
    emit('update_location', { bookingId, location });
}, 5000); // Max once per 5 seconds
```

### **2. Batch Updates**
```javascript
// Batch multiple updates
const updates = [];
updates.push(update1, update2, update3);

emit('batch_update', { updates });
```

### **3. Optimize Payload Size**
```javascript
// ✅ Good - Send only necessary data
emit('update_location', {
    bookingId,
    location: { lat, lng }
});

// ❌ Bad - Send entire object
emit('update_location', entireBookingObject);
```

---

**Integration Time**: 10-15 minutes  
**Testing Time**: 15-20 minutes  
**Total Setup**: 30 minutes  

## 🎉 **READY TO GO!**

Enhanced Socket.IO with automatic reconnection, event queuing, error handling, and complete monitoring is now integrated!
