# 🚀 ANTIGRAVITY - DAY 2 TASKS (Chat Support System)

**Date**: May 5, 2026  
**Phase**: Phase 1 - Chat Support System  
**Day**: 2 of 10  
**Status**: Ready to Execute  
**Estimated Time**: 6-8 hours

---

## 📋 DAY 2 OVERVIEW

Today you will complete the **real-time layer** of the Chat Support System by:
1. ✅ Implementing Socket.IO events for real-time messaging
2. ✅ Adding file upload support with Cloudinary
3. ✅ Testing the complete backend end-to-end

**By end of Day 2**: Backend will be 100% complete and ready for frontend integration.

---

## 🎯 DAY 2 OBJECTIVES

### **Success Criteria**:
- ✅ Socket.IO events working for real-time chat
- ✅ File upload endpoint functional
- ✅ Typing indicators working
- ✅ Read receipts working
- ✅ All backend APIs tested
- ✅ No critical bugs
- ✅ Daily report submitted with screenshots

---

## 📁 EXISTING SOCKET.IO SETUP

**Good News**: Socket.IO is already configured in your project!

### **Key Files**:
1. `Backend/services/enhancedSocketService.js` - Main Socket.IO service
2. `Backend/socketService.js` - Legacy socket service (still in use)
3. `Frontend/src/utils/socket.js` - Frontend socket client
4. `Frontend/src/utils/enhancedSocketClient.js` - Enhanced frontend client

### **How Socket.IO is Initialized**:
```javascript
// Backend/server.js
const enhancedSocket = require('./services/enhancedSocketService');
enhancedSocket.init(server);
```

### **How to Get Socket.IO Instance**:
```javascript
const socketService = require('../services/enhancedSocketService');
const io = socketService.getIO();
```

---

## 🔧 TASK 1: IMPLEMENT SOCKET.IO CHAT EVENTS (3-4 hours)

### **1.1 Create Chat Socket Handler** (`Backend/socket/chatSocketHandler.js`)

Create a new file to handle all chat-related socket events:

```javascript
const supportChatService = require('../services/supportChatService');
const ChatRoom = require('../models/ChatRoom');
const ChatSupportMessage = require('../models/ChatSupportMessage');

/**
 * Chat Socket Handler
 * Handles real-time chat events
 */

const chatSocketHandler = (io, socket) => {
    console.log(`💬 Chat socket connected: ${socket.id}`);

    /**
     * Join a chat room
     * Event: 'join_chat_room'
     * Payload: { roomId: string }
     */
    socket.on('join_chat_room', async (data) => {
        try {
            const { roomId } = data;
            
            // Validate room exists
            const room = await ChatRoom.findById(roomId);
            if (!room) {
                socket.emit('chat_error', { message: 'Chat room not found' });
                return;
            }

            // Join the room
            socket.join(roomId);
            console.log(`✅ Socket ${socket.id} joined room ${roomId}`);

            // Notify others in the room
            socket.to(roomId).emit('user_joined', {
                userId: socket.userId,
                userName: socket.userName,
                timestamp: new Date()
            });

            // Send confirmation
            socket.emit('room_joined', { roomId, room });

        } catch (error) {
            console.error('Error joining chat room:', error);
            socket.emit('chat_error', { message: 'Failed to join room' });
        }
    });

    /**
     * Leave a chat room
     * Event: 'leave_chat_room'
     * Payload: { roomId: string }
     */
    socket.on('leave_chat_room', async (data) => {
        try {
            const { roomId } = data;
            
            socket.leave(roomId);
            console.log(`👋 Socket ${socket.id} left room ${roomId}`);

            // Notify others
            socket.to(roomId).emit('user_left', {
                userId: socket.userId,
                userName: socket.userName,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Error leaving chat room:', error);
        }
    });

    /**
     * Send a message
     * Event: 'send_message'
     * Payload: { roomId: string, content: object }
     */
    socket.on('send_message', async (data) => {
        try {
            const { roomId, content } = data;

            // Validate
            if (!roomId || !content) {
                socket.emit('chat_error', { message: 'Invalid message data' });
                return;
            }

            // Create sender object
            const sender = {
                userId: socket.userId,
                userType: socket.userType,
                name: socket.userName,
                avatar: socket.userAvatar
            };

            // Save message via service
            const message = await supportChatService.sendMessage(roomId, sender, content);

            // Broadcast to all in room (including sender)
            io.to(roomId).emit('new_message', {
                message,
                roomId
            });

            console.log(`📨 Message sent in room ${roomId} by ${socket.userName}`);

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('chat_error', { message: 'Failed to send message' });
        }
    });

    /**
     * Typing indicator - start
     * Event: 'typing_start'
     * Payload: { roomId: string }
     */
    socket.on('typing_start', (data) => {
        try {
            const { roomId } = data;
            
            // Broadcast to others in room (not sender)
            socket.to(roomId).emit('user_typing', {
                userId: socket.userId,
                userName: socket.userName,
                roomId
            });

        } catch (error) {
            console.error('Error in typing_start:', error);
        }
    });

    /**
     * Typing indicator - stop
     * Event: 'typing_stop'
     * Payload: { roomId: string }
     */
    socket.on('typing_stop', (data) => {
        try {
            const { roomId } = data;
            
            // Broadcast to others in room
            socket.to(roomId).emit('user_stopped_typing', {
                userId: socket.userId,
                userName: socket.userName,
                roomId
            });

        } catch (error) {
            console.error('Error in typing_stop:', error);
        }
    });

    /**
     * Mark messages as read
     * Event: 'mark_as_read'
     * Payload: { roomId: string }
     */
    socket.on('mark_as_read', async (data) => {
        try {
            const { roomId } = data;
            
            // Mark as read via service
            await supportChatService.markAsRead(roomId, socket.userId);

            // Notify others in room
            socket.to(roomId).emit('messages_read', {
                userId: socket.userId,
                roomId,
                timestamp: new Date()
            });

            console.log(`✅ Messages marked as read in room ${roomId} by ${socket.userName}`);

        } catch (error) {
            console.error('Error marking as read:', error);
            socket.emit('chat_error', { message: 'Failed to mark as read' });
        }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
        console.log(`💬 Chat socket disconnected: ${socket.id}`);
    });
};

module.exports = chatSocketHandler;
```

### **1.2 Integrate Chat Handler into Main Socket Service**

**File**: `Backend/services/enhancedSocketService.js`

Add this to the existing socket initialization:

```javascript
// At the top, import the chat handler
const chatSocketHandler = require('../socket/chatSocketHandler');

// Inside the io.on('connection', ...) block, add:
io.on('connection', (socket) => {
    console.log(`🔌 New connection: ${socket.id}`);

    // ... existing authentication code ...

    // Add chat socket handler
    chatSocketHandler(io, socket);

    // ... rest of existing code ...
});
```

### **1.3 Update Chat Controller to Emit Socket Events**

**File**: `Backend/modules/admin/controllers/chatController.js`

Update the `sendMessage` function:

```javascript
exports.sendMessage = catchAsync(async (req, res, next) => {
    const { roomId } = req.params;
    const { content } = req.body;

    if (!content) {
        return next(new AppError('Please provide message content', 400));
    }

    const sender = {
        userId: req.admin._id || req.admin.id,
        userType: 'Admin',
        name: req.admin.name,
        avatar: req.admin.avatar
    };

    const message = await supportChatService.sendMessage(roomId, sender, content);

    // ✅ Emit socket event
    const socketService = require('../../../services/enhancedSocketService');
    const io = socketService.getIO();
    io.to(roomId).emit('new_message', {
        message,
        roomId
    });

    res.status(201).json({
        status: 'success',
        data: { message }
    });
});
```

---

## 📤 TASK 2: IMPLEMENT FILE UPLOAD (2-3 hours)

### **2.1 Install Multer (if not already installed)**

```bash
npm install multer
```

### **2.2 Create Upload Middleware** (`Backend/middleware/uploadMiddleware.js`)

```javascript
const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new AppError('Invalid file type. Only images and documents allowed.', 400));
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: fileFilter
});

module.exports = upload;
```

### **2.3 Create Cloudinary Upload Service** (`Backend/services/cloudinaryService.js`)

```javascript
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary (add to .env if not already there)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} folder - Cloudinary folder name
 * @returns {Promise<Object>} - Upload result
 */
exports.uploadToCloudinary = (fileBuffer, folder = 'chat-attachments') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto' // Automatically detect file type
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Delete result
 */
exports.deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw error;
    }
};
```

### **2.4 Update Chat Controller Upload Endpoint**

**File**: `Backend/modules/admin/controllers/chatController.js`

```javascript
const upload = require('../../../middleware/uploadMiddleware');
const cloudinaryService = require('../../../services/cloudinaryService');

/**
 * Upload file
 * POST /api/admin/chat/upload
 */
exports.uploadFile = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please upload a file', 400));
    }

    // Upload to Cloudinary
    const result = await cloudinaryService.uploadToCloudinary(
        req.file.buffer,
        'chat-attachments'
    );

    res.status(200).json({
        status: 'success',
        data: {
            fileUrl: result.secure_url,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            publicId: result.public_id
        }
    });
});
```

### **2.5 Update Chat Routes**

**File**: `Backend/modules/admin/routes/chatRoutes.js`

```javascript
const upload = require('../../../middleware/uploadMiddleware');

// Update the upload route
router.post('/upload', upload.single('file'), chatController.uploadFile);
```

---

## 🧪 TASK 3: TESTING (1-2 hours)

### **3.1 Test Socket.IO Events**

Create a test HTML file or use Socket.IO client tester:

```html
<!-- test-chat-socket.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Chat Socket Test</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
    <h1>Chat Socket Test</h1>
    <div id="status"></div>
    <div id="messages"></div>

    <script>
        const socket = io('http://localhost:5002', {
            auth: {
                token: 'YOUR_ADMIN_JWT_TOKEN_HERE'
            }
        });

        socket.on('connect', () => {
            document.getElementById('status').innerHTML = '✅ Connected';
            
            // Join a room
            socket.emit('join_chat_room', { roomId: 'YOUR_ROOM_ID_HERE' });
        });

        socket.on('room_joined', (data) => {
            console.log('Joined room:', data);
        });

        socket.on('new_message', (data) => {
            console.log('New message:', data);
            const div = document.createElement('div');
            div.textContent = JSON.stringify(data);
            document.getElementById('messages').appendChild(div);
        });

        socket.on('user_typing', (data) => {
            console.log('User typing:', data);
        });

        socket.on('chat_error', (error) => {
            console.error('Chat error:', error);
        });
    </script>
</body>
</html>
```

### **3.2 Test API Endpoints with Postman/Thunder Client**

**Test Sequence**:

1. **Create Room**:
```bash
POST http://localhost:5002/api/admin/chat/rooms
Headers: Authorization: Bearer YOUR_TOKEN
Body:
{
  "participants": [
    { "userId": "admin_id", "userType": "Admin", "name": "Admin" },
    { "userId": "user_id", "userType": "User", "name": "Test User" }
  ],
  "type": "support"
}
```

2. **Upload File**:
```bash
POST http://localhost:5002/api/admin/chat/upload
Headers: Authorization: Bearer YOUR_TOKEN
Body: form-data
  - file: [select a file]
```

3. **Send Message with File**:
```bash
POST http://localhost:5002/api/admin/chat/rooms/:roomId/messages
Headers: Authorization: Bearer YOUR_TOKEN
Body:
{
  "content": {
    "type": "file",
    "text": "Here's the document",
    "fileUrl": "cloudinary_url_from_upload",
    "fileName": "document.pdf",
    "fileSize": 12345
  }
}
```

4. **Get Messages**:
```bash
GET http://localhost:5002/api/admin/chat/rooms/:roomId/messages?page=1&limit=50
Headers: Authorization: Bearer YOUR_TOKEN
```

5. **Mark as Read**:
```bash
PATCH http://localhost:5002/api/admin/chat/rooms/:roomId/read
Headers: Authorization: Bearer YOUR_TOKEN
```

---

## 📝 TASK 4: OPTIONAL IMPROVEMENTS (30 min)

### **4.1 Add Input Validation**

Update `chatController.createRoom`:

```javascript
exports.createRoom = catchAsync(async (req, res, next) => {
    const { participants, type, metadata } = req.body;

    // Enhanced validation
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
        return next(new AppError('Please provide participants array', 400));
    }

    // Validate each participant
    for (const p of participants) {
        if (!p.userId || !p.userType) {
            return next(new AppError('Each participant must have userId and userType', 400));
        }
    }

    const room = await supportChatService.createChatRoom(participants, type, metadata);

    res.status(201).json({
        status: 'success',
        data: { room }
    });
});
```

### **4.2 Use AppError in Service Layer**

Update `Backend/services/supportChatService.js`:

```javascript
const AppError = require('../utils/AppError');

// Replace all throw new Error() with:
if (!room) throw new AppError('Chat room not found', 404);
```

### **4.3 Add Compound Index**

Update `Backend/models/ChatRoom.js`:

```javascript
// Add this index
ChatRoomSchema.index({ 'participants.userId': 1, status: 1 });
```

---

## 📊 DAY 2 DELIVERABLES

### **Files to Create**:
1. ✅ `Backend/socket/chatSocketHandler.js` - Socket event handlers
2. ✅ `Backend/middleware/uploadMiddleware.js` - Multer configuration
3. ✅ `Backend/services/cloudinaryService.js` - Cloudinary upload service

### **Files to Modify**:
1. ✅ `Backend/services/enhancedSocketService.js` - Integrate chat handler
2. ✅ `Backend/modules/admin/controllers/chatController.js` - Add socket emit + file upload
3. ✅ `Backend/modules/admin/routes/chatRoutes.js` - Add upload middleware
4. ✅ `Backend/services/supportChatService.js` - Use AppError (optional)
5. ✅ `Backend/models/ChatRoom.js` - Add compound index (optional)

### **Testing Evidence**:
- [ ] Screenshot of Socket.IO connection
- [ ] Screenshot of real-time message delivery
- [ ] Screenshot of file upload success
- [ ] Screenshot of Postman/Thunder Client tests
- [ ] Screenshot of messages in database

---

## 📝 DAY 2 REPORT TEMPLATE

```markdown
# Daily Progress Report - May 5, 2026

## Phase: Phase 1
## Day: 2 of 10
## Feature: Chat Support System - Real-Time Layer
## Status: [In Progress / Completed]

### ✅ What I Completed Today:
1. Created chatSocketHandler.js with 7 socket events
2. Integrated chat handler into enhancedSocketService.js
3. Implemented file upload with Cloudinary
4. Updated chat controller to emit socket events
5. Tested all socket events end-to-end
6. Tested file upload functionality

### 🔧 Backend Changes:
**Files Created:**
- `Backend/socket/chatSocketHandler.js` - Socket event handlers (7 events)
- `Backend/middleware/uploadMiddleware.js` - Multer file upload config
- `Backend/services/cloudinaryService.js` - Cloudinary integration

**Files Modified:**
- `Backend/services/enhancedSocketService.js` - Added chat handler integration
- `Backend/modules/admin/controllers/chatController.js` - Added socket emit + file upload
- `Backend/modules/admin/routes/chatRoutes.js` - Added upload middleware

**Socket Events Implemented:**
- `join_chat_room` - Join a chat room
- `leave_chat_room` - Leave a chat room
- `send_message` - Send message with real-time broadcast
- `typing_start` - Typing indicator start
- `typing_stop` - Typing indicator stop
- `mark_as_read` - Mark messages as read
- `disconnect` - Handle disconnection

### 🧪 Testing Done:
- [x] Socket.IO connection tested
- [x] Real-time message delivery tested
- [x] Typing indicators tested
- [x] Read receipts tested
- [x] File upload tested (images + documents)
- [x] All API endpoints tested with Postman
- [x] Database persistence verified

### 📸 Screenshots:
[Attach 5-7 screenshots showing:]
1. Socket.IO connection success
2. Real-time message in console
3. File upload success response
4. Cloudinary uploaded file
5. Messages in MongoDB
6. Postman test results
7. Socket event logs

### ⚠️ Issues Encountered:
1. [Issue 1] - [How resolved]
2. [Issue 2] - [How resolved]

### 📊 Performance Metrics:
- Socket Connection Time: [X ms]
- Message Delivery Latency: [X ms]
- File Upload Time (5MB): [X seconds]
- API Response Time: [X ms]

### 📅 Tomorrow's Plan:
1. Start frontend Chat Sidebar component
2. Create Chat Window component
3. Integrate Socket.IO client
4. Test real-time messaging from frontend

### ⏱️ Time Spent: [X hours]
```

---

## ⚠️ CRITICAL REMINDERS

### **DO's**:
1. ✅ Test each socket event individually
2. ✅ Use existing Socket.IO setup (don't create new)
3. ✅ Add proper error handling in socket events
4. ✅ Test file upload with different file types
5. ✅ Verify messages persist in database
6. ✅ Check Cloudinary dashboard for uploaded files
7. ✅ Take screenshots of everything
8. ✅ Submit detailed daily report

### **DON'Ts**:
1. ❌ Don't create new Socket.IO instance
2. ❌ Don't skip testing
3. ❌ Don't forget to emit socket events from controller
4. ❌ Don't hardcode file paths
5. ❌ Don't skip error handling
6. ❌ Don't forget to add Cloudinary credentials to .env

---

## 🔍 ENVIRONMENT VARIABLES NEEDED

Add these to `.env` if not already present:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🎯 DAY 2 SUCCESS CHECKLIST

Before marking Day 2 as complete:

- [ ] chatSocketHandler.js created with 7 events
- [ ] Socket handler integrated into enhancedSocketService.js
- [ ] File upload middleware created
- [ ] Cloudinary service created
- [ ] Chat controller emits socket events
- [ ] Upload endpoint functional
- [ ] All socket events tested
- [ ] File upload tested (images + documents)
- [ ] Real-time messaging works
- [ ] Typing indicators work
- [ ] Read receipts work
- [ ] Messages persist in database
- [ ] Files uploaded to Cloudinary
- [ ] No console errors
- [ ] Daily report submitted
- [ ] Screenshots attached (5-7 minimum)

---

## 🚀 START DAY 2 NOW!

**First Task**: Create `Backend/socket/chatSocketHandler.js`

**Estimated Time**: 6-8 hours

**Good Luck, Antigravity! Make Day 2 even better than Day 1! 🚀**

---

*Document Created: May 4, 2026*  
*Day: 2 of 10*  
*Feature: Chat Support System - Real-Time Layer*  
*Status: Ready for Execution*
