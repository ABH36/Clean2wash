# Phase 2: Quick Reference Card

## 🚀 Quick Deploy

```bash
# 1. Run migration
node Backend/scripts/migratePhase2DutyControl.js

# 2. Start cron jobs (add to server.js)
const dutyHoursCronJobs = require('./scripts/dutyHoursCronJobs');
dutyHoursCronJobs.startAll();

# 3. Test
curl http://localhost:5000/api/v1/admin/drivers/[ID]/duty-hours
```

---

## 📋 API Endpoints Cheat Sheet

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/drivers/:id/duty-hours` | Get duty summary |
| PATCH | `/admin/drivers/:id/duty-limits` | Update limits |
| POST | `/admin/drivers/:id/record-break` | Record break |
| GET | `/admin/drivers/:id/booking-eligibility` | Check eligibility |
| GET | `/admin/drivers/overworked/list` | Get overworked |
| GET | `/admin/drivers/fatigue-alerts/all` | Get alerts |
| POST | `/admin/drivers/:id/acknowledge-alert` | Ack alert |
| POST | `/admin/drivers/:id/force-reset-duty` | Emergency reset |

---

## 🔧 Default Limits

```javascript
Daily Max: 600 minutes (10 hours)
Weekly Max: 3600 minutes (60 hours)
Break After: 240 minutes (4 hours)
Min Break: 30 minutes
```

---

## 🤖 Cron Jobs

| Schedule | Task |
|----------|------|
| 00:00 daily | Reset daily hours |
| 00:00 Monday | Reset weekly hours |
| Every hour | Update duty status |
| Every 30 min | Check overwork |
| Every 15 min | Break reminders |

---

## 💡 Helper Methods

```javascript
driver.startDutySession()           // Start tracking
driver.endDutySession()             // End tracking
driver.canAcceptBooking()           // Check eligibility
driver.recordBreak(30)              // Record 30 min break
driver.updateDutyStatus()           // Update status
driver.getDutySummary()             // Get summary
driver.resetDailyDutyHours()        // Reset daily
driver.resetWeeklyDutyHours()       // Reset weekly
```

---

## 🔍 Quick Tests

```bash
# Get duty hours
curl -X GET http://localhost:5000/api/v1/admin/drivers/[ID]/duty-hours \
  -H "Authorization: Bearer [TOKEN]"

# Check eligibility
curl -X GET http://localhost:5000/api/v1/admin/drivers/[ID]/booking-eligibility \
  -H "Authorization: Bearer [TOKEN]"

# Record break
curl -X POST http://localhost:5000/api/v1/admin/drivers/[ID]/record-break \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"durationMinutes": 30}'

# Get overworked
curl -X GET http://localhost:5000/api/v1/admin/drivers/overworked/list \
  -H "Authorization: Bearer [TOKEN]"
```

---

## 📊 Database Fields

```javascript
dutyHours: {
    today: { totalMinutes, sessions, ... },
    weekly: { totalMinutes, ... },
    limits: { dailyMaxMinutes, ... },
    status: { canAcceptBookings, ... }
}

breaks: {
    lastBreakTime,
    totalBreaksToday,
    currentContinuousWorkMinutes
}

fatigueAlerts: [{
    type, message, triggeredAt, acknowledged
}]
```

---

## ⚠️ Alert Types

- `DAILY_LIMIT_REACHED` - Daily limit exceeded
- `WEEKLY_LIMIT_REACHED` - Weekly limit exceeded
- `BREAK_REQUIRED` - Mandatory break needed
- `OVERWORK_WARNING` - Approaching limit (80%)

---

## 🎯 Integration Points

### Before Booking Assignment
```javascript
const eligibility = driver.canAcceptBooking();
if (!eligibility.canAccept) {
    throw new Error(eligibility.reason);
}
```

### On Driver Online
```javascript
driver.startDutySession();
await driver.save();
```

### On Driver Offline
```javascript
driver.endDutySession();
driver.updateDutyStatus();
await driver.save();
```

---

## 📚 Documentation

- **Full Docs:** `PHASE2_FATIGUE_DUTY_CONTROL_IMPLEMENTATION.md`
- **Setup:** `PHASE2_SETUP_GUIDE.md`
- **Summary:** `PHASE2_COMPLETION_SUMMARY.md`
- **Progress:** `OPERATIONS_MODULE_PROGRESS.md`

---

## ✅ Deployment Checklist

- [ ] Backup database
- [ ] Run migration script
- [ ] Setup cron jobs
- [ ] Test endpoints
- [ ] Monitor logs
- [ ] Verify automation

---

## 🆘 Troubleshooting

**Migration fails?**
→ Check MongoDB connection

**Cron jobs not running?**
→ Verify `node-cron` installed

**Duty hours not updating?**
→ Check online/offline integration

**Always eligible?**
→ Verify duty tracking active

---

## 📞 Quick Links

- Migration: `Backend/scripts/migratePhase2DutyControl.js`
- Cron Jobs: `Backend/scripts/dutyHoursCronJobs.js`
- Model: `Backend/models/SpareDriver.js`
- Controller: `Backend/modules/admin/controllers/adminDriverController.js`

---

**Status:** ✅ READY FOR DEPLOYMENT  
**Version:** 2.0.0  
**Date:** April 15, 2026
