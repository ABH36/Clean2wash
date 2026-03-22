import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// 🔥 Firebase Cloud Messaging Configuration
// These should ideally come from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const currentToken = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY'
            });
            if (currentToken) {
                console.log('✅ FCM: Device token acquired');
                return currentToken;
            } else {
                console.warn('⚠️ FCM: No registration token available. Request permission to generate one.');
            }
        }
    } catch (err) {
        console.error('❌ FCM: Error getting token:', err);
    }
    return null;
};

export const onMessageListener = (callback) => {
    if (callback) {
        return onMessage(messaging, (payload) => {
            console.log("📬 FCM: Foreground message received:", payload);
            callback(payload);
        });
    }
    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log("📬 FCM: Foreground message received:", payload);
            resolve(payload);
        });
    });
};

export default app;
