# 🚀 Edge Case Fixes - Integration Guide

## ⚡ **QUICK START (5 Minutes)**

### **Step 1: Install Dependencies**
```bash
npm install node-cron
```

### **Step 2: Add to server.js**
```javascript
// Add at the top
const edgeCaseMonitor = require('./jobs/edgeCaseMonitorJob');

// After server starts
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Start edge case monitoring
    edgeCaseMonitor.startAllJobs();
    console.log('✅ Edge case monitoring started');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    edgeCaseMonitor.stopAllJobs();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    edgeCaseMonitor.stopAllJobs();
    process.exit(0);
});
```

### **Step 3: Test It Works**
```bash
# Start server
npm start

# You should see:
# ✅ Edge case monitoring started
# [EdgeCaseMonitor] Starting all monitoring jobs...
# [EdgeCaseMonitor] All jobs started successfully
```

---

## 📋 **USAGE EXAMPLES**

### **1. Manual Payment Settlement**
```javascript
const edgeCaseHandler = require('./services/edgeCaseHandlerService');

// Settle a specific booking
const result = await edgeCaseHandler.processPaymentSettlement(bookingId);

console.log(result);
// {
//   success: true,
//   bookingId: 'CW123456',
//   driverEarning: 450,
//   platformCommission: 50,
//   settlementTime: '2024-01-15T10:30:00.000Z'
// }
```

### **2. Queue Status Update (Offline)**
```javascript
// When network is poor, queue the update
const queueItem = await edgeCaseHandler.queueStatusUpdate(
    bookingId,
    'in_progress',
    {
        source: 'driver_app',
        location: { lat: 28.7041, lng: 77.1025 },
        timestamp: new Date()
    }
);

// System will automatically process it when network returns
```

### **3. Safe Concurrent Wallet Transaction**
```javascript
// Use this instead of regular wallet transaction for high-traffic scenarios
const result = await edgeCaseHandler.safeConcurrentWalletTransaction(
    userId,
    100,
    'credit',
    {
        category: 'REWARD',
        description: 'Referral bonus',
        referenceId: `REF-${Date.now()}`
    }
);

console.log(result);
// {
//   success: true,
//   balance: 1100,
//   attempt: 1  // Number of retries needed
// }
```

### **4. Reconcile Wallet Balance**
```javascript
// Check and fix wallet inconsistencies
const result = await edgeCaseHandler.reconcileWalletBalance(userId);

console.log(result);
// {
//   success: true,
//   currentBalance: 1000,
//   calculatedBalance: 1000,
//   discrepancy: 0,
//   reconciled: false
// }

// If discrepancy found:
// {
//   success: true,
//   currentBalance: 1005,
//   calculatedBalance: 1000,
//   discrepancy: 5,
//   reconciled: true  // Auto-corrected
// }
```

---

## 🔧 **CONFIGURATION OPTIONS**

### **Environment Variables (.env)**
```env
# Payment Settlement
SETTLEMENT_RETRY_ATTEMPTS=3
SETTLEMENT_RETRY_DELAY=2000

# Status Queue
STATUS_QUEUE_MAX_ATTEMPTS=5
STATUS_QUEUE_EXPIRY_HOURS=24

# Wallet Reconciliation
WALLET_RECONCILIATION_TOLERANCE=0.01
WALLET_CREDIT_LIMIT=-500

# Scheduled Bookings
SCHEDULED_DISPATCH_WINDOW=30
TIMEZONE=Asia/Kolkata

# Monitoring
ENABLE_EDGE_CASE_MONITORING=true
LOG_LEVEL=info
```

### **Custom Cron Schedules**
```javascript
// Modify in edgeCaseMonitorJob.js

// Change settlement frequency (default: every 5 minutes)
const processPaymentSettlements = cron.schedule('*/10 * * * *', async () => {
    // Runs every 10 minutes instead
});

// Change reconciliation frequency (default: every hour)
const reconcileWallets = cron.schedule('0 */2 * * *', async () => {
    // Runs every 2 hours instead
});
```

---

## 📊 **MONITORING & LOGS**

### **Check Job Status**
```javascript
// In your admin API or monitoring dashboard
const edgeCaseMonitor = require('./jobs/edgeCaseMonitorJob');

// Get all jobs
const jobs = edgeCaseMonitor.jobs;

// Check if running
console.log('Payment Settlements:', jobs.processPaymentSettlements.running);
console.log('Status Updates:', jobs.processStatusUpdates.running);
console.log('Wallet Reconciliation:', jobs.reconcileWallets.running);
```

### **View Logs**
```bash
# Server logs will show:
[EdgeCaseMonitor] Processing payment settlements...
[EdgeCaseMonitor] Settlements: 5 success, 0 failed

[EdgeCaseMonitor] Processing queued status updates...
[EdgeCaseMonitor] Status updates: 3 success, 0 failed

[EdgeCaseMonitor] Reconciling wallet balances...
[EdgeCaseMonitor] Reconciled 10 wallets, found 1 discrepancies

[EdgeCaseMonitor] Processing scheduled bookings...
[EdgeCaseMonitor] Dispatched 2 scheduled bookings

[EdgeCaseMonitor] Detecting stuck bookings...
[EdgeCaseMonitor] Found 0 stuck bookings
```

---

## 🚨 **TROUBLESHOOTING**

### **Problem: Jobs not starting**
```javascript
// Check if cron is installed
npm list node-cron

// Verify jobs are started
const edgeCaseMonitor = require('./jobs/edgeCaseMonitorJob');
edgeCaseMonitor.startAllJobs();

// Check logs for errors
```

### **Problem: Settlement failures**
```javascript
// Check booking status
const booking = await Booking.findById(bookingId);
console.log('Status:', booking.status);
console.log('Payment Status:', booking.payment.status);
console.log('Settlement Status:', booking.payment.settlementStatus);

// Manual retry
const result = await edgeCaseHandler.processPaymentSettlement(
    bookingId,
    { forceSettle: true, maxRetries: 5 }
);
```

### **Problem: Wallet inconsistencies**
```javascript
// Run manual reconciliation
const result = await edgeCaseHandler.reconcileWalletBalance(userId);

if (result.reconciled) {
    console.log(`Fixed discrepancy of ₹${result.discrepancy}`);
}

// Check transaction log
const transactions = await WalletTransaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50);
```

### **Problem: Status queue growing**
```javascript
// Check queue size
const StatusUpdateQueue = mongoose.model('StatusUpdateQueue');
const queueSize = await StatusUpdateQueue.countDocuments({ status: 'pending' });
console.log('Queue size:', queueSize);

// Process manually
const results = await edgeCaseHandler.processQueuedStatusUpdates();
console.log('Processed:', results.length);

// Clear failed items
await StatusUpdateQueue.deleteMany({ status: 'failed' });
```

---

## 🎯 **BEST PRACTICES**

### **1. Use Transactions for Critical Operations**
```javascript
// Always use transactions for multi-step operations
const session = await mongoose.startSession();
session.startTransaction();

try {
    await Operation1({ session });
    await Operation2({ session });
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}
```

### **2. Implement Idempotency**
```javascript
// Always check if operation already completed
const existing = await Operation.findOne({ referenceId });
if (existing) {
    return { success: true, alreadyProcessed: true };
}

// Use unique indexes
schema.index({ referenceId: 1 }, { unique: true, sparse: true });
```

### **3. Add Retry Logic**
```javascript
// Implement exponential backoff
for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
        await operation();
        break;
    } catch (error) {
        if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        } else {
            throw error;
        }
    }
}
```

### **4. Log Everything**
```javascript
// Comprehensive logging
console.log('[Operation] Starting...', { userId, amount });

try {
    const result = await operation();
    console.log('[Operation] Success', result);
    return result;
} catch (error) {
    console.error('[Operation] Failed', { error: error.message, userId });
    throw error;
}
```

---

## 📈 **PERFORMANCE TIPS**

### **1. Optimize Cron Frequency**
```javascript
// High-priority: Every minute
processScheduledBookings - Every 1 minute

// Medium-priority: Every 2-5 minutes
processStatusUpdates - Every 2 minutes
processPaymentSettlements - Every 5 minutes

// Low-priority: Every hour or more
reconcileWallets - Every 1 hour
cleanupStatusQueue - Every 6 hours
```

### **2. Limit Batch Sizes**
```javascript
// Process in batches to avoid memory issues
const pendingItems = await Model.find(query).limit(50);

// For large datasets, use cursor
const cursor = Model.find(query).cursor();
for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    await processItem(doc);
}
```

### **3. Use Indexes**
```javascript
// Ensure proper indexes for cron queries
Booking.index({ 'payment.settlementStatus': 1, status: 1 });
Booking.index({ 'schedule.date': 1, scheduledAlertSent: 1 });
StatusUpdateQueue.index({ status: 1, attempts: 1 });
```

---

## ✅ **VERIFICATION CHECKLIST**

After integration, verify:

- [ ] Server starts without errors
- [ ] Cron jobs are running (check logs)
- [ ] Payment settlements processing
- [ ] Status queue processing
- [ ] Wallet reconciliation working
- [ ] Scheduled bookings dispatching
- [ ] Stuck bookings detected
- [ ] Logs are clear and informative
- [ ] No memory leaks
- [ ] Database indexes created

---

## 🎉 **SUCCESS INDICATORS**

You'll know it's working when you see:

```bash
✅ [EdgeCaseMonitor] All jobs started successfully
✅ [EdgeCaseMonitor] Settlements: X success, 0 failed
✅ [EdgeCaseMonitor] Status updates: X success, 0 failed
✅ [EdgeCaseMonitor] Reconciled X wallets, found 0 discrepancies
✅ [EdgeCaseMonitor] Dispatched X scheduled bookings
✅ [EdgeCaseMonitor] Found 0 stuck bookings
```

---

**Integration Time**: 5-10 minutes  
**Testing Time**: 15-20 minutes  
**Total Setup**: 30 minutes  

## 🚀 **READY TO DEPLOY!**

All edge cases are now handled automatically with monitoring, retry logic, and complete audit trails!
