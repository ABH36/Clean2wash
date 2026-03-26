const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables for the service account path
dotenv.config({ path: './.env.local' });

/**
 * 🔥 Firebase Service Account Initialization
 * Note: To enable FCM, you must place your serviceAccountKey.json 
 * in the Backend root and set the GOOGLE_APPLICATION_CREDENTIALS path.
 */
try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || path.join(__dirname, '../serviceAccountKey.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
    });

    console.log('✅ Firebase Admin Initialized'.green.bold);
} catch (error) {
    console.warn('⚠️  Firebase Admin: serviceAccountKey.json not found or invalid. Push notifications will be disabled.'.yellow);
    // Silent fail for optional service
}

/**
 * Send a multicast message to multiple device tokens
 * @param {string[]} tokens - Array of FCM tokens
 * @param {Object} payload - Notification payload { title, body, data }
 */
const sendMulticastNotification = async (tokens, payload) => {
    if (!tokens || tokens.length === 0) return null;
    if (!admin.apps.length) return null;

    try {
        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            tokens: tokens,
            android: {
                priority: 'high',
                notification: {
                    sound: 'default'
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default'
                    }
                }
            }
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`📡 FCM: Successfully sent ${response.successCount} messages.`);

        // Handle failed tokens (optional: purge them from User model)
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });
            return { success: true, failedTokens };
        }

        return { success: true };
    } catch (error) {
        console.error('❌ FCM: Multicast error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send a single notification
 * @param {string} token - FCM token
 * @param {Object} payload - Notification payload
 */
const sendSingleNotification = async (token, payload) => {
    return sendMulticastNotification([token], payload);
};

module.exports = {
    sendMulticastNotification,
    sendSingleNotification
};
