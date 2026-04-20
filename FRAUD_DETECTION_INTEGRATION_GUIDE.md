# 🔗 Fraud Detection Integration Guide

## Quick Integration Steps

### 1. Add Fraud Check to Booking Creation

**File:** `Backend/modules/consumer/controllers/bookingController.js`

**Add at the top:**
```javascript
const fraudCheckMiddleware = require('../../../middleware/fraudCheckMiddleware');
```

**Add before booking creation (around line 450):**
```javascript
// Check if user is blacklisted
const isBlacklisted = await fraudDetectionService.isBlacklisted('USER', req.user.id.toString());
if (isBlacklisted) {
    return next(new AppError(
        'Your account has been suspended due to suspicious activity. Please contact support.',
        403
    ));
}

// Also check phone blacklist
if (req.user.phone) {
    const phoneBlacklisted = await fraudDetectionService.isBlacklisted('PHONE', req.user.phone);
    if (phoneBlacklisted) {
        return next(new AppError(
            'This phone number has been blocked. Please contact support.',
            403
        ));
    }
}
```

**Add after booking is saved (around line 800):**
```javascript
// Run fraud detection asynchronously
fraudCheckMiddleware.postBookingFraudCheck(booking).catch(err => {
    console.error('Post-booking fraud check error:', err);
});
```

---

### 2. Add Fraud Check to Consumer Routes

**File:** `Backend/modules/consumer/routes/consumerRoutes.js`

**Add at the top:**
```javascript
const fraudCheckMiddleware = require('../../../middleware/fraudCheckMiddleware');
```

**Add to booking routes:**
```javascript
// Protect booking routes with blacklist check
router.use('/bookings', fraudCheckMiddleware.checkBlacklist('USER'));

// Existing booking routes
router.post('/bookings', bookingController.createBooking);
router.get('/bookings', bookingController.getMyBookings);
// ... other routes
```

---

### 3. Add Fraud Check to Driver Routes

**File:** `Backend/modules/sparedrivers/routes/spareDriverRoutes.js`

**Add at the top:**
```javascript
const fraudCheckMiddleware = require('../../../middleware/fraudCheckMiddleware');
```

**Add to driver routes:**
```javascript
// Protect driver routes with blacklist check
router.use(fraudCheckMiddleware.checkBlacklist('DRIVER'));

// Existing driver routes
router.post('/bookings/:id/accept', spareDriverController.acceptBooking);
router.post('/bookings/:id/reject', spareDriverController.rejectBooking);
// ... other routes
```

---

### 4. Add Fraud Check on Driver Actions

**File:** `Backend/modules/sparedrivers/controllers/spareDriverController.js`

**Add at the top:**
```javascript
const fraudDetectionService = require('../../../services/fraudDetectionService');
```

**Add in acceptBooking function (after booking is accepted):**
```javascript
// Run driver fraud check asynchronously
fraudDetectionService.runDriverFraudCheck(req.driver.id).catch(err => {
    console.error('Driver fraud check error:', err);
});
```

**Add in rejectBooking function (after booking is rejected):**
```javascript
// Run driver fraud check asynchronously
fraudDetectionService.runDriverFraudCheck(req.driver.id).catch(err => {
    console.error('Driver fraud check error:', err);
});
```

---

### 5. Add Fraud Check on Payment Actions

**File:** `Backend/modules/consumer/controllers/paymentController.js`

**Add at the top:**
```javascript
const fraudDetectionService = require('../../../services/fraudDetectionService');
```

**Add in payment failure handler:**
```javascript
// Check for suspicious payment patterns
const context = {
    amount: booking.pricing.totalAmount,
    bookingLocation: booking.location?.address?.coordinates,
    userLocation: req.user.profile?.address?.coordinates
};

fraudDetectionService.runUserFraudCheck(
    req.user.id,
    booking._id,
    context
).catch(err => {
    console.error('Payment fraud check error:', err);
});
```

---

### 6. Add Fraud Check on Refund Requests

**File:** `Backend/modules/consumer/controllers/bookingController.js` (or wherever refunds are handled)

**Add in refund handler:**
```javascript
// Check for refund abuse
fraudDetectionService.detectRefundAbuse(req.user.id).catch(err => {
    console.error('Refund abuse check error:', err);
});
```

---

### 7. Add Scheduled Fraud Checks (Optional)

**File:** `Backend/jobs/fraudCheckJob.js` (create new file)

```javascript
const cron = require('node-cron');
const User = require('../models/User');
const SpareDriver = require('../models/SpareDriver');
const fraudDetectionService = require('../services/fraudDetectionService');

/**
 * Run fraud checks on all active users daily
 */
const runDailyFraudChecks = async () => {
    try {
        console.log('[Fraud Check Job] Starting daily fraud checks...');

        // Get all active users
        const users = await User.find({ isActive: true }).select('_id');
        
        let checkedCount = 0;
        let fraudCount = 0;

        for (const user of users) {
            try {
                const fraudDetected = await fraudDetectionService.runUserFraudCheck(user._id);
                if (fraudDetected) fraudCount++;
                checkedCount++;
            } catch (error) {
                console.error(`Error checking user ${user._id}:`, error);
            }
        }

        // Get all active drivers
        const drivers = await SpareDriver.find({ status: 'approved' }).select('_id');
        
        for (const driver of drivers) {
            try {
                const fraudDetected = await fraudDetectionService.runDriverFraudCheck(driver._id);
                if (fraudDetected) fraudCount++;
                checkedCount++;
            } catch (error) {
                console.error(`Error checking driver ${driver._id}:`, error);
            }
        }

        console.log(`[Fraud Check Job] Completed. Checked: ${checkedCount}, Fraud Detected: ${fraudCount}`);
    } catch (error) {
        console.error('[Fraud Check Job] Error:', error);
    }
};

// Schedule to run daily at 2 AM
cron.schedule('0 2 * * *', runDailyFraudChecks);

module.exports = { runDailyFraudChecks };
```

**Add to server.js:**
```javascript
// Start fraud check job
require('./jobs/fraudCheckJob');
```

---

## Testing the Integration

### 1. Test Blacklist Protection

```bash
# Add user to blacklist via admin panel or API
POST /api/admin/fraud/blacklist
{
  "entityType": "USER",
  "entityId": "USER_ID_HERE",
  "reason": "Test blacklist",
  "severity": "HIGH",
  "isPermanent": false,
  "expiresAt": "2024-12-31"
}

# Try to create booking with blacklisted user
# Should get 403 error: "Your account has been suspended..."
```

### 2. Test Fraud Detection

```bash
# Create multiple bookings and cancel them
# After 5 cancellations in 7 days, check admin dashboard
# Should see "MULTIPLE_CANCELLATIONS" alert

# Create rapid bookings (5 within 2 minutes)
# Should see "RAPID_BOOKINGS" alert
```

### 3. Test Admin Dashboard

```bash
# Open admin panel
# Navigate to: /admin/fraud

# Should see:
# - Overview tab with stats
# - Alerts tab with fraud alerts
# - Blacklist tab with blacklisted entities
```

---

## Environment Variables (Optional)

Add to `.env`:

```env
# Fraud Detection Settings
FRAUD_DETECTION_ENABLED=true
FRAUD_AUTO_SUSPEND_CRITICAL=false
FRAUD_NOTIFICATION_EMAIL=admin@example.com
FRAUD_CHECK_INTERVAL_HOURS=24
```

---

## Monitoring & Logging

Add logging to track fraud detection:

```javascript
// In fraudDetectionService.js
const logger = require('../utils/logger');

// Log all fraud alerts
logger.info('Fraud Alert Created', {
    alertType: alert.alertType,
    severity: alert.severity,
    riskScore: alert.riskScore,
    userId: alert.user,
    driverId: alert.driver
});
```

---

## Performance Optimization

### 1. Cache Blacklist Checks

```javascript
const NodeCache = require('node-cache');
const blacklistCache = new NodeCache({ stdTTL: 300 }); // 5 minutes

const isBlacklisted = async (entityType, entityId) => {
    const cacheKey = `${entityType}:${entityId}`;
    
    // Check cache first
    const cached = blacklistCache.get(cacheKey);
    if (cached !== undefined) return cached;
    
    // Check database
    const blacklistEntry = await Blacklist.findOne({
        entityType,
        entityId,
        isActive: true,
        $or: [
            { isPermanent: true },
            { expiresAt: { $gt: new Date() } }
        ]
    });
    
    const result = blacklistEntry ? blacklistEntry.isValid() : false;
    
    // Cache result
    blacklistCache.set(cacheKey, result);
    
    return result;
};
```

### 2. Batch Fraud Checks

Instead of checking each user individually, batch them:

```javascript
const batchSize = 100;
const users = await User.find({ isActive: true }).select('_id').limit(batchSize);

await Promise.allSettled(
    users.map(user => fraudDetectionService.runUserFraudCheck(user._id))
);
```

---

## Security Best Practices

1. **Rate Limiting**
   - Add rate limiting to fraud check endpoints
   - Prevent abuse of manual fraud check APIs

2. **Access Control**
   - Only super admins can add to blacklist
   - Regular admins can only investigate alerts

3. **Audit Trail**
   - Log all blacklist additions/removals
   - Track who investigated which alerts

4. **Data Privacy**
   - Don't expose sensitive user data in alerts
   - Mask phone numbers and emails in logs

---

## Troubleshooting

### Issue: Fraud checks not running

**Solution:**
- Check if middleware is properly added to routes
- Verify fraudDetectionService is imported correctly
- Check console for errors

### Issue: Too many false positives

**Solution:**
- Adjust detection thresholds in fraudDetectionService.js
- Increase time windows for pattern detection
- Fine-tune risk score calculations

### Issue: Performance issues

**Solution:**
- Enable caching for blacklist checks
- Run fraud checks asynchronously
- Use batch processing for bulk checks
- Add database indexes

---

## Next Steps

1. ✅ Integrate fraud checks into booking flow
2. ✅ Add blacklist protection to routes
3. ✅ Test all fraud detection scenarios
4. ✅ Monitor fraud alerts in admin dashboard
5. ✅ Fine-tune detection thresholds based on real data
6. ✅ Set up scheduled fraud checks (optional)
7. ✅ Configure notifications and alerts
8. ✅ Train team on using fraud dashboard

---

**Integration is straightforward and non-breaking. All fraud checks run asynchronously and won't affect user experience!** 🚀
