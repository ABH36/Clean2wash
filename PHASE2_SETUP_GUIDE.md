# Phase 2: Fatigue & Duty Control - Setup Guide

## 🚀 Quick Start

This guide will help you deploy Phase 2 changes to your production/development environment.

---

## ✅ PRE-DEPLOYMENT CHECKLIST

- [ ] Phase 1 is deployed and working
- [ ] Database backup created
- [ ] Node.js dependencies installed (`node-cron` if not already)
- [ ] Environment variables configured
- [ ] Admin authentication working

---

## 📦 STEP 1: Install Dependencies

If you don't have `node-cron` installed:

```bash
cd Backend
npm install node-cron
```

---

## 🗄️ STEP 2: Run Migration Script

This initializes Phase 2 fields for all existing drivers.

```bash
# From project root
node Backend/scripts/migratePhase2DutyControl.js
```

**Expected Output:**
```
🚀 Starting Phase 2 Migration: Fatigue & Duty Control

✅ Connected to MongoDB

📊 Found 25 drivers to migrate

✅ Migrated: Rajesh Kumar (C2W-DR-...)
✅ Migrated: Amit Singh (C2W-DR-...)
...

============================================================
📊 MIGRATION SUMMARY
============================================================
Total Drivers: 25
✅ Migrated: 25
⏭️  Skipped: 0
============================================================

✨ Phase 2 Migration Complete!
```

**⚠️ Important:** Run this script ONLY ONCE. Running it multiple times is safe but unnecessary.

---

## 🔄 STEP 3: Setup Cron Jobs

### Option A: Integrate into Main Server (Recommended)

Add to your `Backend/server.js` or `Backend/index.js`:

```javascript
// Import cron jobs
const dutyHoursCronJobs = require('./scripts/dutyHoursCronJobs');

// After MongoDB connection and server start
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected');
        
        // Start duty hours cron jobs
        dutyHoursCronJobs.startAll();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    });
```

### Option B: Run as Separate Process

```bash
# In a separate terminal
node Backend/scripts/dutyHoursCronJobs.js
```

Keep this process running in the background (use PM2 or similar).

---

## 🧪 STEP 4: Test the Implementation

### Test 1: Check Driver Duty Hours

```bash
curl -X GET http://localhost:5000/api/v1/admin/drivers/[DRIVER_ID]/duty-hours \
  -H "Authorization: Bearer [YOUR_ADMIN_TOKEN]"
```

**Expected Response:**
```json
{
    "status": "success",
    "data": {
        "driver": {
            "id": "...",
            "name": "Rajesh Kumar",
            "driverId": "C2W-DR-..."
        },
        "dutySummary": {
            "today": {
                "totalHours": "0.0",
                "totalMinutes": 0,
                "maxHours": "10.0",
                "remainingMinutes": 600,
                "percentageUsed": "0.0",
                "sessions": 0
            },
            "status": {
                "canAcceptBookings": true,
                "isOverworked": false
            }
        }
    }
}
```

---

### Test 2: Check Booking Eligibility

```bash
curl -X GET http://localhost:5000/api/v1/admin/drivers/[DRIVER_ID]/booking-eligibility \
  -H "Authorization: Bearer [YOUR_ADMIN_TOKEN]"
```

**Expected Response:**
```json
{
    "status": "success",
    "data": {
        "eligibility": {
            "canAccept": true,
            "remainingDailyMinutes": 600,
            "remainingWeeklyMinutes": 3600
        }
    }
}
```

---

### Test 3: Simulate Duty Session

```bash
# 1. Set driver online (starts duty session)
curl -X PATCH http://localhost:5000/api/v1/admin/drivers/[DRIVER_ID]/online-status \
  -H "Authorization: Bearer [YOUR_ADMIN_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"isOnline": true}'

# 2. Wait a few minutes or manually update duty hours

# 3. Check duty hours again
curl -X GET http://localhost:5000/api/v1/admin/drivers/[DRIVER_ID]/duty-hours \
  -H "Authorization: Bearer [YOUR_ADMIN_TOKEN]"

# 4. Set driver offline (ends duty session)
curl -X PATCH http://localhost:5000/api/v1/admin/drivers/[DRIVER_ID]/online-status \
  -H "Authorization: Bearer [YOUR_ADMIN_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"isOnline": false}'
```

---

### Test 4: Record a Break

```bash
curl -X POST http://localhost:5000/api/v1/admin/drivers/[DRIVER_ID]/record-break \
  -H "Authorization: Bearer [YOUR_ADMIN_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"durationMinutes": 30}'
```

---

### Test 5: Get Overworked Drivers

```bash
curl -X GET http://localhost:5000/api/v1/admin/drivers/overworked/list \
  -H "Authorization: Bearer [YOUR_ADMIN_TOKEN]"
```

---

## 🔧 STEP 5: Configure Duty Limits (Optional)

Default limits are:
- Daily: 10 hours (600 minutes)
- Weekly: 60 hours (3600 minutes)
- Mandatory break after: 4 hours (240 minutes)
- Minimum break duration: 30 minutes

To customize for a specific driver:

```bash
curl -X PATCH http://localhost:5000/api/v1/admin/drivers/[DRIVER_ID]/duty-limits \
  -H "Authorization: Bearer [YOUR_ADMIN_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "dailyMaxMinutes": 720,
    "weeklyMaxMinutes": 4200,
    "mandatoryBreakAfterMinutes": 300,
    "minimumBreakMinutes": 45
  }'
```

---

## 📊 STEP 6: Monitor Cron Jobs

Check logs to ensure cron jobs are running:

```bash
# If using PM2
pm2 logs

# If running directly
# Check terminal output for:
# - "🌅 Running daily duty hours reset..."
# - "📅 Running weekly duty hours reset..."
# - "🔄 Updating duty status for active drivers..."
# - "⚠️  Checking for overworked drivers..."
```

---

## 🎯 STEP 7: Integration with Booking System

Update your booking assignment logic to check eligibility:

```javascript
// In your booking controller
const assignDriverToBooking = async (bookingId, driverId) => {
    const driver = await SpareDriver.findById(driverId);
    
    // Check eligibility
    const eligibility = driver.canAcceptBooking();
    
    if (!eligibility.canAccept) {
        throw new Error(eligibility.reason);
    }
    
    // Proceed with assignment
    // ...
};
```

---

## 🔍 VERIFICATION CHECKLIST

After deployment, verify:

- [ ] Migration script completed successfully
- [ ] All drivers have `dutyHours` field initialized
- [ ] Cron jobs are running (check logs)
- [ ] API endpoints respond correctly
- [ ] Booking eligibility checks work
- [ ] Overworked drivers list is accessible
- [ ] Break recording works
- [ ] Duty limits can be updated

---

## 🚨 TROUBLESHOOTING

### Issue: Migration script fails

**Solution:**
- Check MongoDB connection
- Verify `.env` file has correct `MONGO_URI`
- Ensure database is accessible

### Issue: Cron jobs not running

**Solution:**
- Check if `node-cron` is installed
- Verify timezone setting in cron jobs
- Check server logs for errors

### Issue: Duty hours not updating

**Solution:**
- Ensure `startDutySession()` is called when driver goes online
- Ensure `endDutySession()` is called when driver goes offline
- Check if online/offline toggle is working

### Issue: Booking eligibility always returns true

**Solution:**
- Verify duty hours are being tracked
- Check if `updateDutyStatus()` is being called
- Manually test with high duty hours

---

## 📝 ROLLBACK PROCEDURE

If you need to rollback Phase 2:

1. **Stop cron jobs:**
   ```javascript
   dutyHoursCronJobs.stopAll();
   ```

2. **Remove Phase 2 fields (optional):**
   ```javascript
   await SpareDriver.updateMany({}, {
       $unset: {
           dutyHours: "",
           breaks: "",
           fatigueAlerts: ""
       }
   });
   ```

3. **Revert code changes:**
   - Restore previous version of `SpareDriver.js`
   - Restore previous version of `adminDriverController.js`
   - Restore previous version of `adminRoutes.js`

---

## 🎉 SUCCESS INDICATORS

You'll know Phase 2 is working when:

1. ✅ Drivers have duty hours tracked
2. ✅ Overworked drivers are automatically blocked
3. ✅ Break requirements are enforced
4. ✅ Fatigue alerts are created
5. ✅ Admin can view duty summaries
6. ✅ Cron jobs reset hours daily/weekly

---

## 📞 SUPPORT

If you encounter issues:

1. Check the logs
2. Review the documentation: `PHASE2_FATIGUE_DUTY_CONTROL_IMPLEMENTATION.md`
3. Test individual endpoints
4. Verify database state

---

## 🚀 NEXT STEPS

After Phase 2 is stable:

- **Phase 3:** Vehicle Management
- **Phase 4:** Booking Operations Enhancement
- **Phase 5:** Live Tracking System
- **Phase 6:** Dispatch & Matching Engine

---

## END OF SETUP GUIDE
