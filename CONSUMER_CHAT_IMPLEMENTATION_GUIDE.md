# Consumer Chat System - Implementation Guide

## 🎯 Status: API Methods Added ✅ | Component Needed ❌

### ✅ Step 1: Consumer Chat API Methods - COMPLETE

Added to `Frontend/src/utils/api.js`:

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

### 📋 Step 2: Create Consumer Chat Component

**File to Create**: `Frontend/src/modules/consumer/pages/ConsumerChat.jsx`

**Key Changes from Driver Chat**:
1. Replace `DriverLayout` with `MobileLayout`
2. Replace `spareDriverAPI` with `chatAPI` and `bookingAPI`
3. Change token from `chauffeur_token` to `auth_token`
4. Change userType from `'driver'` to `'consumer'`
5. Update navigation paths to consumer routes
6. Adapt quick replies for consumer perspective

**Consumer Quick Replies**:
```javascript
const quickReplies = [
    "Where are you? 📍",
    "How long will you take? ⏰",
    "I'm waiting at the location 🚗",
    "Please call me 📞",
    "Thank you! 🙏",
    "Drive safely 😊"
];
```

### 📋 Step 3: Add Consumer Chat Route

**File**: `Frontend/src/App.jsx`

Add route:
```javascript
import ConsumerChat from './modules/consumer/pages/ConsumerChat';

// In routes section:
<Route path="/chat/:bookingId" element={P('consumer', <ConsumerChat />)} />
```

### 📋 Step 4: Connect Chat Buttons

**File**: `Frontend/src/modules/consumer/pages/BookingStatus.jsx`

Update MessageSquare button (around line 668):
```javascript
<button 
    onClick={() => navigate(`/chat/${liveBooking._id}`)}
    className={`w-11 h-11 rounded-xl flex items-center justify-center active:scale-90 transition-transform ${
        isDarkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
    }`}
>
    <MessageSquare size={18} strokeWidth={2} />
</button>
```

**File**: `Frontend/src/modules/consumer/pages/BookingConfirmation.jsx`

Update chat button (around line 647):
```javascript
<motion.button
    whileTap={{ scale: 0.95 }}
    onClick={() => navigate(`/chat/${bookingId}`)}
    className="w-full h-14 bg-white/[0.03] border border-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all"
>
    <MessageSquare size={14} strokeWidth={3} /> Chat with Driver
</motion.button>
```

### 📋 Step 5: Add Unread Message Indicators

**File**: `Frontend/src/modules/consumer/pages/MyBookings.jsx`

Add unread count badge to booking cards.

### 🔧 Backend Configuration

Backend is already configured:
- ✅ Chat routes at `/api/chat`
- ✅ Chat controller handles both User and SpareDriver
- ✅ Socket service ready for real-time messaging
- ✅ ChatMessage model supports all message types

### 🎨 Design Guidelines for Consumer Chat

**Colors**:
- Use consumer theme colors (not driver yellow)
- Maintain consistency with existing consumer UI
- Consumer messages: Blue/Brand color
- Driver messages: Gray background

**Layout**:
- Use `MobileLayout` component
- Keep mobile-first responsive design
- Match existing consumer app navigation

### 🔄 Message Flow

```
Consumer sends message →
├── Saved to database (ChatMessage)
├── Socket emits to booking room
├── Driver receives real-time
├── Push notification sent to driver
└── Message status updated (delivered/read)

Driver sends message →
├── Saved to database (ChatMessage)
├── Socket emits to booking room
├── Consumer receives real-time
├── Push notification sent to consumer
└── Message status updated (delivered/read)
```

### 🚀 Implementation Priority

1. ✅ **DONE**: Add chatAPI methods to api.js
2. **TODO**: Create ConsumerChat.jsx component
3. **TODO**: Add chat route in App.jsx
4. **TODO**: Connect chat buttons in BookingStatus.jsx
5. **TODO**: Connect chat button in BookingConfirmation.jsx
6. **TODO**: Add unread indicators in MyBookings.jsx
7. **TODO**: Test real-time messaging between consumer and driver

### 📝 Testing Checklist

- [ ] Consumer can open chat from booking
- [ ] Consumer can send text messages
- [ ] Consumer can receive driver messages in real-time
- [ ] Typing indicators work both ways
- [ ] Read receipts update correctly
- [ ] Location sharing works
- [ ] File upload works
- [ ] Voice messages work
- [ ] Quick replies work
- [ ] Emoji reactions work
- [ ] Unread count displays correctly
- [ ] Socket connection stable
- [ ] Chat works during active trip
- [ ] Chat accessible from booking history

### 🎯 Expected Result

After implementation:
- ✅ Consumer can chat with driver during booking
- ✅ Real-time messaging like Rapido
- ✅ All message types supported
- ✅ Professional UI matching consumer app
- ✅ Seamless integration with existing booking flow

---

**Next Step**: Create the ConsumerChat.jsx component by adapting DriverChatEnhanced.jsx with the changes listed above.