# SPARE DRIVER PRICING ENGINE - QUICK REFERENCE CARD

**Last Updated:** April 17, 2026  
**Version:** 1.0

---

## 🚀 QUICK START

### Deploy in 3 Steps

1. **Update Booking Controller** (1 line change)
   ```javascript
   // Line 13 in Backend/modules/consumer/controllers/bookingController.js
   const PricingEngine = require('../../../services/pricingEngineAdapter');
   ```

2. **Run Migration**
   ```bash
   cd Backend
   node scripts/migratePricingFields.js
   ```

3. **Restart Server**
   ```bash
   npm restart
   ```

---

## 📋 WHAT WAS FIXED

| Issue | Status | Impact |
|-------|--------|--------|
| Wrong pricing engine used | ✅ Fixed | Now uses time-based pricing |
| Duplicate pricing logic | ✅ Fixed | Single source of truth |
| GST not stored separately | ✅ Fixed | Better reporting |
| No payout duplication protection | ✅ Fixed | Prevents double payments |
| No auto-penalty | ✅ Fixed | Automatic enforcement |
| Driver wallet missing holds | ✅ Fixed | Proper fund tracking |

---

## 🔧 KEY FILES

### Created
- `Backend/services/pricingEngineAdapter.js` - Unified pricing
- `Backend/utils/penaltyHelper.js` - Auto-penalties
- `Backend/scripts/migratePricingFields.js` - Data migration

### Modified
- `Backend/models/Booking.js` - Added pricing fields
- `Backend/models/SpareDriver.js` - Added wallet holds
- `Backend/models/DriverPayout.js` - Added unique constraint

---

## 💰 PRICING FLOW

### Spare Driver Services (NEW)
```
Service Type → Duration → Vehicle Type → Base Price
    ↓
+ Overtime (if > included hours)
+ Scheduled Premium (if scheduled)
+ Night Charge (11 PM - 5 AM)
+ Outstation Allowance (if outstation)
    ↓
= Subtotal
    ↓
× Surge Multiplier (if peak hours)
    ↓
= Subtotal After Surge
    ↓
+ GST (18%)
    ↓
= Final Amount

Platform Commission = Subtotal × 20%
Driver Earning = Subtotal - Commission
```

### Other Services (LEGACY)
```
Base Price × Vehicle Multiplier + Addons
    ↓
- Subscription Discount
- Gold Pass Discount
- Coupon Discount
    ↓
= Final Amount
```

---

## 🎯 PRICING EXAMPLES

### Example 1: Hourly Driver (2 hours)
```
Base: ₹180/hour × 2 hours = ₹360
GST: ₹360 × 18% = ₹64.80
Final: ₹424.80

Commission: ₹360 × 20% = ₹72
Driver Earning: ₹360 - ₹72 = ₹288
```

### Example 2: Full Day Driver
```
Base: ₹1,800 (fixed)
GST: ₹1,800 × 18% = ₹324
Final: ₹2,124

Commission: ₹1,800 × 20% = ₹360
Driver Earning: ₹1,800 - ₹360 = ₹1,440
```

### Example 3: Night Shift (2 hours, 11 PM)
```
Base: ₹180/hour × 2 hours = ₹360
Night Charge: ₹300
Subtotal: ₹660
GST: ₹660 × 18% = ₹118.80
Final: ₹778.80

Commission: ₹660 × 20% = ₹132
Driver Earning: ₹660 - ₹132 = ₹528
```

---

## ⚠️ PENALTIES

### Auto-Applied Penalties

| Scenario | Amount | Deduction |
|----------|--------|-----------|
| Cancel before trip | As per config | Wallet |
| Cancel after start | Higher penalty | Wallet |
| No-show (15+ min late) | Maximum penalty | Wallet |
| Late arrival | ₹10/min after 15 min | Wallet |

### Penalty Flow
```
Driver Cancels → Penalty Created → Auto-Applied → Wallet Deducted
                                                 ↓
                                    (If insufficient balance)
                                                 ↓
                                    Deducted from Next Payout
```

---

## 💳 WALLET HOLDS

### Consumer Wallet
```
Booking Created → Hold ₹300 (2-hour reserve)
                       ↓
              Booking Completed → Release Hold
                       ↓
              Booking Cancelled → Release Hold
```

### Driver Wallet
```
Balance: ₹1,000
Hold: ₹200 (pending bookings)
Available: ₹800 (can withdraw)
```

---

## 📊 DATABASE FIELDS

### Booking.pricing (NEW)
```javascript
{
    baseAmount: 360,
    subtotal: 360,
    gstAmount: 64.8,
    gstPercent: 18,
    finalAmount: 424.8,
    platformCommission: 72,
    driverEarning: 288,
    breakdown: [...]
}
```

### SpareDriver.wallet (NEW)
```javascript
{
    balance: 1000,
    holdAmount: 200,
    availableBalance: 800,
    lastWithdrawAt: Date
}
```

---

## 🧪 TESTING

### Test 1: Create Booking
```bash
POST /api/consumer/bookings
{
    "service": { "type": "sparedriver", "name": "Hourly Driver" },
    "schedule": { "type": "instant", "estimatedDuration": "2 Hours" }
}
```

**Verify:**
- ✅ `pricing.gstAmount` exists
- ✅ `pricing.platformCommission` exists
- ✅ `pricing.driverEarning` exists
- ✅ `payment.walletReserveHeldAmount` = 300

### Test 2: Cancel Booking
```bash
POST /api/consumer/bookings/:id/cancel
```

**Verify:**
- ✅ Penalty created in database
- ✅ Driver wallet deducted
- ✅ Wallet hold released

### Test 3: Generate Payout
```bash
POST /api/admin/payouts/generate
```

**Verify:**
- ✅ Payout created
- ✅ Penalties deducted
- ✅ Cannot create duplicate (error)

---

## 🔍 MONITORING

### Key Metrics
```sql
-- Bookings with new pricing
SELECT COUNT(*) FROM bookings 
WHERE pricing.gstAmount IS NOT NULL;

-- Total penalties applied
SELECT SUM(amount) FROM penalties 
WHERE status = 'APPLIED';

-- Drivers with wallet holds
SELECT COUNT(*) FROM sparedrivers 
WHERE wallet.holdAmount > 0;

-- Duplicate payout attempts (should be 0)
SELECT driver, COUNT(*) FROM driverpayouts 
GROUP BY driver, payoutPeriod.start 
HAVING COUNT(*) > 1;
```

### Error Logs
```bash
# Watch for pricing errors
tail -f Backend/logs/error.log | grep -i pricing

# Watch for penalty errors
tail -f Backend/logs/error.log | grep -i penalty

# Watch for payout errors
tail -f Backend/logs/error.log | grep -i payout
```

---

## 🆘 TROUBLESHOOTING

### Issue: Pricing calculation wrong
**Solution:** Check if adapter is being used
```javascript
// Should be:
const PricingEngine = require('../../../services/pricingEngineAdapter');
```

### Issue: Penalty not applied
**Solution:** Check if penaltyHelper is imported
```javascript
const PenaltyHelper = require('../../../utils/penaltyHelper');
await PenaltyHelper.applyDriverCancellationPenalty(booking, 'driver', adminId);
```

### Issue: Duplicate payout created
**Solution:** Unique constraint should prevent this. If it happens:
```bash
# Check index exists
db.driverpayouts.getIndexes()

# Should see: unique_driver_payout_period
```

### Issue: Wallet hold not released
**Solution:** Check cancellation handler
```javascript
if (booking.service?.type === 'sparedriver') {
    await releaseChauffeurReserve(booking, 'consumer_cancelled');
}
```

---

## 📞 SUPPORT

### Documentation
- Full Validation: `PRICING_ENGINE_VALIDATION_REPORT.md`
- Implementation: `PRICING_ENGINE_FIX_IMPLEMENTATION.md`
- Integration: `PRICING_ENGINE_INTEGRATION_COMPLETE.md`

### Quick Links
- Pricing Engine: `Backend/services/pricingEngine.js`
- Pricing Adapter: `Backend/services/pricingEngineAdapter.js`
- Penalty Helper: `Backend/utils/penaltyHelper.js`

---

**Need Help?** Check the full documentation or contact Kiro AI.

**Version:** 1.0 | **Date:** April 17, 2026
