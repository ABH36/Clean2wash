const mongoose = require('mongoose');
const { sendNotification } = require('./utils/notificationService');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketService = require('./socketService');

dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const DB = process.env.MONGODB_URI;

// We need a dummy server to init socketService if it's not already running
// But in a real scenario, we'd want to connect to the existing running server's socket.
// For this test, we'll just use the notificationService which calls socketService.getIO()
// Note: This script assumes the main server IS RUNNING so it can't "getIO" unless it share the same process or we mock it.
// BETTER APPROACH: Use a simple script that just hits an internal route if we had one, OR 
// just use the model to create and let the user refresh, OR 
// actually try to initialize a minimal socket environment.

async function trigger() {
    try {
        await mongoose.connect(DB);
        const user = await User.findOne({ phone: '9999999999' });

        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        console.log('Triggering real-time notification for user:', user._id);

        // Since we can't easily access the running server's Socket.io instance from a separate process,
        // we'll just create the notification in DB and the user can see it on refresh, 
        // OR we can tell the user we'll simulate it via the browser subagent by calling the API.

        // Actually, let's just use the notificationService and see if we can mock the IO for the sake of DB entry
        // but for real-time verification, the browser subagent is better at "simulating" server actions if we had an endpoint.

        const notification = await sendNotification(user._id, {
            title: 'Real-time Alert! 🚀',
            message: 'This is a live notification triggered at ' + new Date().toLocaleTimeString(),
            type: 'booking',
            priority: 'medium'
        });

        if (notification) {
            console.log('Notification created in DB. (Real-time emit might fail if server is separate process)');
        }

        process.exit(0);
    } catch (error) {
        console.error('Trigger failed:', error);
        process.exit(1);
    }
}

trigger();
