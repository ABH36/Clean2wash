# Consumer Chat System - Complete Implementation Guide

## 🎯 Overview
Complete guide to implement consumer-side chat system for communication with drivers during bookings, just like Rapido.

## ✅ Step 1: Consumer Chat API Methods (COMPLETED)

### Added to `Frontend/src/utils/api.js`:
```javascript
export const chatAPI = {
    getChatMessages: (bookingId) => apiClient.request(`/chat/${bookingId}`, { baseURL: '/api' }),
    sendChatMessage: (messageData) => apiClient.request('/chat/send', {
        method: 'POST',
        body: JSON.stringify(messageData),
        baseURL: '/api'
    }),
    markChatAsRead: (bookingId) => apiClient.request(`/chat/${bookingId}/read`, {
        method: 'PATCH',
        baseURL: '/api'
    }),
    sendLocation: (locationData) => apiClient.request('/chat/location', {
        method: 'POST',
        body: JSON.stringify(locationData),
        baseURL: '/api'
    }),
    getUnreadCount: () => apiClient.request('/chat/unread-count', { baseURL: '/api' }),
    getActiveChats: () => apiClient.request('/chat/active', { baseURL: '/api' }),
    uploadChatFile: (formData) => apiClient.request('/chat/upload', {
        method: 'POST',
        body: formData,
        headers: {},
        baseURL: '/api'
    })
};
```

## 📋 Step 2: Create Consumer Chat Component

### File: `Frontend/src/modules/consumer/pages/ConsumerChat.jsx`

**Component Structure:**
- Similar to DriverChatEnhanced but with consumer-specific UI
- Uses MobileLayout instead of DriverLayout
- Consumer-friendly color scheme
- All same features: text, voice, location, files, reactions

**Key Features:**
1. Real-time messaging with driver
2. Typing indicators
3. Message status (sent/delivered/read)
4. Voice recording
5. Location sharing
6. File upload
7. Message reactions
8. Quick replies
9. Emoji picker

## 🔧 Step 3: Add Consumer Chat Route

### In `Frontend/src/App.jsx`:
```javascript
import ConsumerChat from './modules/consumer/pages/ConsumerChat';

// Add route:
<Route path="/chat/:bookingId" element={P('consumer', <ConsumerChat />)} />
```

## 🔗 Step 4: Connect Chat Buttons

### In `Frontend/src/modules/consumer/pages/BookingStatus.jsx`:

**Find the MessageSquare button (around line 668):**
```javascript
// BEFORE (no onClick):
<button className={`w-11 h-11 rounded-xl...`}>
    <MessageSquare size={18} strokeWidth={2} />
</button>

// AFTER (with onClick):
<button 
    onClick={() => navigate(`/chat/${bookingId}`)}
    className={`w-11 h-11 rounded-xl...`}
>
    <MessageSquare size={18} strokeWidth={2} />
</button>
```

### In `Frontend/src/modules/consumer/pages/BookingConfirmation.jsx`:

**Find the "Transmit Message" button (around line 647):**
```javascript
// BEFORE:
<motion.button className="w-full h-14...">
    <MessageSquare size={14} strokeWidth={3} /> Transmit Message
</motion.button>

// AFTER:
<motion.button 
    onClick={() => navigate(`/chat/${bookingId}`)}
    className="w-full h-14..."
>
    <MessageSquare size={14} strokeWidth={3} /> Transmit Message
</motion.button>
```

## 🔄 Step 5: Socket Integration for Real-time

### Consumer socket setup (in ConsumerChat component):
```javascript
useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        socketService.connect(token);
        socketService.joinBookingRoom(bookingId);

        const socket = socketService.getSocket();
        if (socket) {
            socket.on('new_message', (data) => {
                if (data.bookingId === bookingId) {
                    setMessages(prev => [...prev, data.message]);
                    chatAPI.markChatAsRead(bookingId);
                }
            });

            socket.on('user_typing', (data) => {
                if (data.bookingId === bookingId && data.userType === 'driver') {
                    setIsTyping(true);
                }
            });

            socket.on('user_stopped_typing', (data) => {
                if (data.bookingId === bookingId && data.userType === 'driver') {
                    setIsTyping(false);
                }
            });
        }
    }

    return () => {
        const socket = socketService.getSocket();
        if (socket) {
            socket.off('new_message');
            socket.off('user_typing');
            socket.off('user_stopped_typing');
        }
    };
}, [bookingId]);
```

## 🎨 Step 6: Consumer Chat UI Design

### Design Guidelines:
- Use MobileLayout for consistent consumer UI
- Primary color: Blue (#3B82F6) for consumer actions
- Driver messages: Left-aligned, gray background
- Consumer messages: Right-aligned, blue background
- Clean, modern, mobile-first design
- Touch-friendly buttons (44px minimum)

## 📱 Step 7: Message Types Support

### Text Messages:
```javascript
await chatAPI.sendChatMessage({
    bookingId,
    messageType: 'text',
    content: { text: messageText }
});
```

### Location Sharing:
```javascript
await chatAPI.sendLocation({
    bookingId,
    location: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        address: 'Current Location'
    }
});
```

### Voice Messages:
```javascript
// Record audio using MediaRecorder API
const blob = new Blob(chunks, { type: 'audio/webm' });
const formData = new FormData();
formData.append('file', blob, `voice_${Date.now()}.webm`);

const uploadResponse = await chatAPI.uploadChatFile(formData);
await chatAPI.sendChatMessage({
    bookingId,
    messageType: 'voice',
    content: {
        voiceUrl: uploadResponse.data.fileUrl,
        duration: recordingTime
    }
});
```

### File Upload:
```javascript
const formData = new FormData();
formData.append('file', file);

const uploadResponse = await chatAPI.uploadChatFile(formData);
await chatAPI.sendChatMessage({
    bookingId,
    messageType: 'image', // or 'file'
    content: {
        fileUrl: uploadResponse.data.fileUrl,
        fileName: file.name
    }
});
```

## 🔔 Step 8: Unread Message Indicators

### Add to BookingStatus page:
```javascript
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
    const fetchUnreadCount = async () => {
        try {
            const response = await chatAPI.getUnreadCount();
            setUnreadCount(response.data?.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };
    
    fetchUnreadCount();
    
    // Listen for new messages via socket
    const socket = socketService.getSocket();
    if (socket) {
        socket.on('new_message', () => {
            setUnreadCount(prev => prev + 1);
        });
    }
}, []);

// Show badge on chat button:
<button className="relative...">
    <MessageSquare size={18} />
    {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
        </span>
    )}
</button>
```

## 🚀 Step 9: Quick Replies for Consumers

### Consumer-specific quick replies:
```javascript
const quickReplies = [
    "Where are you? 📍",
    "How long will you take? ⏰",
    "I'm waiting at the location 👋",
    "Please call me 📞",
    "Thank you! 🙏",
    "Drive safely 🚗"
];
```

## 🔒 Step 10: Security & Validation

### Message validation:
```javascript
const validateMessage = (message) => {
    if (!message || message.trim().length === 0) {
        return false;
    }
    if (message.length > 1000) {
        toast.error('Message too long (max 1000 characters)');
        return false;
    }
    return true;
};
```

### File upload validation:
```javascript
const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    
    if (file.size > maxSize) {
        toast.error('File too large (max 10MB)');
        return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
        toast.error('File type not allowed');
        return false;
    }
    
    return true;
};
```

## 📊 Step 11: Testing Checklist

### Functional Testing:
- [ ] Consumer can send text messages to driver
- [ ] Driver messages appear in real-time
- [ ] Typing indicators work both ways
- [ ] Voice recording and playback works
- [ ] Location sharing opens in maps
- [ ] File upload and download works
- [ ] Message reactions work
- [ ] Quick replies send correctly
- [ ] Unread count updates in real-time
- [ ] Chat history loads correctly

### UI/UX Testing:
- [ ] Mobile responsive design
- [ ] Touch-friendly buttons
- [ ] Smooth animations
- [ ] Loading states visible
- [ ] Error messages clear
- [ ] Back button works
- [ ] Keyboard doesn't hide input
- [ ] Scroll to bottom on new message

### Integration Testing:
- [ ] Socket connection stable
- [ ] API calls successful
- [ ] File uploads complete
- [ ] Real-time sync works
- [ ] Multiple tabs sync
- [ ] Offline handling works

## 🎉 Implementation Summary

### What's Completed:
✅ Consumer chat API methods added
✅ Backend routes ready (/api/chat/*)
✅ Socket service configured
✅ Database models ready
✅ Message types supported

### What Needs to be Done:
🔨 Create ConsumerChat.jsx component
🔨 Add chat route to App.jsx
🔨 Connect chat buttons in BookingStatus
🔨 Connect chat buttons in BookingConfirmation
🔨 Add unread message indicators
🔨 Test end-to-end communication

## 🔗 Connection Flow

```
Consumer Opens Chat
    ↓
Navigate to /chat/:bookingId
    ↓
Load ConsumerChat Component
    ↓
Fetch booking details
    ↓
Connect to socket room: "booking_${bookingId}"
    ↓
Load existing messages
    ↓
Real-time communication active
    ↓
Consumer ←→ Driver messaging
```

## 📝 Backend Integration

### Chat Controller handles both:
- **Consumer (User type)**: Sends messages as 'User'
- **Driver (SpareDriver type)**: Sends messages as 'SpareDriver'

### Message routing:
```javascript
// Consumer sends message:
{
    bookingId: "booking_123",
    sender: { id: consumerId, type: 'User' },
    receiver: { id: driverId, type: 'SpareDriver' },
    content: { text: "Hello" }
}

// Driver receives via socket: "booking_123" room
// Driver sends reply:
{
    bookingId: "booking_123",
    sender: { id: driverId, type: 'SpareDriver' },
    receiver: { id: consumerId, type: 'User' },
    content: { text: "Hi, on my way!" }
}

// Consumer receives via socket: "booking_123" room
```

## 🎯 Final Result

After implementation, consumers will be able to:
- ✅ Chat with driver in real-time during booking
- ✅ Send text, voice, location, and files
- ✅ See typing indicators
- ✅ Get message delivery status
- ✅ Use quick replies for common messages
- ✅ React to messages with emojis
- ✅ See unread message count
- ✅ Professional Rapido-level chat experience

---

**Status**: API methods added ✅ | Component needs creation 🔨 | Routes need setup 🔨
**Priority**: HIGH - Critical for consumer-driver communication
**Estimated Time**: 2-3 hours for complete implementation