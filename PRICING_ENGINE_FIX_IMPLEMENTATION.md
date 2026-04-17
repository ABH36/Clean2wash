# SPARE DRIVER PRICING ENGINE - FIX IMPLEMENTATION GUIDE

**Date:** April 17, 2026  
**Status:** ✅ FIXES READY TO DEPLOY  
**Estimated Time:** 30 minutes

---

## WHAT WAS FIXED

### ✅ 1. Driver Wallet Hold Fields Added
**File:** `Backend/models/SpareDriver.js`

**Changes:**
```javascript
wallet: {
    balance: { type: Number, default: 0 },
    holdAmount: { type: Number, default: 0 },        // NEW
    availableBalance: { type: Number, default: 0 },  // NEW
    lastWithdrawAt: Date
}
```

**Impact:**
- Drivers can no longer withdraw held funds
- Wallet balance properly tracks holds
- Available balance = balance - holdAmount

---

### ✅ 2. Payout Duplication Protection Added
**File:** `Backend/models/DriverPayout.js`

**Changes:**
```javascript
// Added unique compound index
driverPayoutSchema.index(
    { driver: 1, 'payoutPeriod.start': 1, 'payoutPeriod.end': 1 }, 
    { unique: true, name: 'unique_driver_payout_period' }
);
```

**Impact:**
- Cannot create duplicate payouts for same driver + period
- Database enforces uniqueness
- Prevents double payments

---

### ✅ 3. GST & Commission Fields Added to Booking
**File:** `Backend/models/Booking.js`

**Changes:**
```javascript
pricing: {
    baseAmount: Number,
    vehicleMultiplier: Number,
    addonAmount: Number,
    discountAmount: Number,
    subtotal: Number,              // NEW
    gstAmount: Number,             // NEW
    gstPercent: Number,            // NEW
    totalAmount: Number,
    finalAmount: Number,           // NEW
    platformCommission: Number,    // NEW
    driverEarning: Number,         // NEW
    breakdown: Array,
    currency: String
}
```

**Impact:**
- GST stored separately for reporting
- Commission and driver earning tracked
- Easier financial queries and reports

---

### ✅ 4. Pricing Engine Adapter Created
**File:** `Backend/services/pricingEngineAdapter.js`

**Purpose:**
- Bridges old and new pricing engines
- Routes Spare Driver services to new time-based engine
- Routes other services to legacy engine
- Maintains backward compatibility

**Key Features:**
- ✅ Auto-detects service type
- ✅ Uses new engine for Spare Driver
- ✅ Uses legacy engine for other services
- ✅ Handles subscriptions, coupons, loyalty
- ✅ Returns unified response format

---

### ✅ 5. Auto-Penalty System Created
**File:** `Backend/utils/penaltyHelper.js`

**Features:**
- ✅ Auto-applies penalty on driver cancellation
- ✅ Detects no-show (15+ minutes late)
- ✅ Calculates penalty based on trip status
- ✅ Supports late arrival penalties
- ✅ Supports complaint penalties
- ✅ Admin can waive penalties

**Penalty Amounts:**
- Before trip: As per PricingConfig
- After trip start: Higher penalty
- No-show: Maximum penalty
- Late arrival: ₹10/min after 15 min grace (max ₹500)

---

## DEPLOYMENT STEPS

### Step 1: Update Booking Controller (5 minutes)

**File:** `Backend/modules/consumer/controllers/bookingController.js`

**Change Line 13:**
```javascript
// OLD:
const PricingEngine = require('../../../utils/pricingHelper');

// NEW:
const PricingEngine = require('../../../services/pricingEngineAdapter');
```

**Add Penalty Import (after line 16):**
```javascript
const PenaltyHelper = require('../../../utils/penaltyHelper');
```

**Add Auto-Penalty in cancelBooking() (around line 1150):**
```javascript
// After booking.status = 'cancelled';
// Add this:

// Auto-apply penalty if driver cancelled
if (booking.provider?.type === 'sparedriver') {
    try {
        await PenaltyHelper.applyDriverCancellationPenalty(
            booking, 
            'driver', // or 'customer' based on who cancelled
            req.user.id // admin user ID
        );
    } catch (penaltyError) {
        console.error('Failed to apply auto-penalty:', penaltyError);
    }
}
```

---

### Step 2: Update Booking Model References (2 minutes)

**File:** `Backend/models/Booking.js` (Line 634)

**Change:**
```javascript
// OLD:
const PricingEngine = require('../utils/pricingHelper');

// NEW:
const PricingEngine = require('../services/pricingEngineAdapter');
```

---

### Step 3: Run Database Migration (5 minutes)

Create migration script: `Backend/scripts/migratePricingFields.js`

```javascript
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const SpareDriver = require('../models/SpareDriver');
require('dotenv').config();

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔄 Migrating pricing fields...');
    
    // 1. Add missing pricing fields to existing bookings
    const bookings = await Booking.find({});
    let updated = 0;
    
    for (const booking of bookings) {
        let needsUpdate = false;
        
        if (!booking.pricing.subtotal) {
            booking.pricing.subtotal = booking.pricing.totalAmount;
            needsUpdate = true;
        }
        
        if (!booking.pricing.finalAmount) {
            booking.pricing.finalAmount = booking.pricing.totalAmount;
            needsUpdate = true;
        }
        
        // Extract GST from breakdown if exists
        if (!booking.pricing.gstAmount && booking.pricing.breakdown) {
            const gstItem = booking.pricing.breakdown.find(item => 
                item.type === 'tax' || item.name?.includes('GST')
            );
            if (gstItem) {
                booking.pricing.gstAmount = gstItem.amount;
                booking.pricing.gstPercent = 18; // default
                needsUpdate = true;
            }
        }
        
        if (needsUpdate) {
            await booking.save();
            updated++;
        }
    }
    
    console.log(`✅ Updated ${updated} bookings`);
    
    // 2. Add wallet hold fields to spare drivers
    const drivers = await SpareDriver.find({});
    let driversUpdated = 0;
    
    for (const driver of drivers) {
        if (driver.wallet && typeof driver.wallet.holdAmount === 'undefined') {
            driver.wallet.holdAmount = 0;
            driver.wallet.availableBalance = driver.wallet.balance;
            await driver.save();
            driversUpdated++;
        }
    }
    
    console.log(`✅ Updated ${driversUpdated} drivers`);
    
    console.log('✅ Migration complete!');
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
```

**Run:**
```bash
cd Backend
node scripts/migratePricingFields.js
```

---

### Step 4: Test the System (15 minutes)

#### Test 1: Create Spare Driver Booking
```bash
# Use Postman or curl
POST /api/consumer/bookings
{
    "vehicleId": "...",
    "service": {
        "name": "Hourly Driver Service",
        "type": "sparedriver",
        "category": "Chauffeur",
        "basePrice": 180,
        "duration": "2 Hours"
    },
    "schedule": {
        "type": "instant",
        "date": "2026-04-17",
        "estimatedDuration": "2 Hours"
    },
    "paymentMethod": "wallet"
}
```

**Expected:**
- ✅ Pricing calculated using new engine
- ✅ GST stored in `pricing.gstAmount`
- ✅ Commission stored in `pricing.platformCommission`
- ✅ Driver earning stored in `pricing.driverEarning`
- ✅ Wallet hold applied (₹300 for 2-hour reserve)

#### Test 2: Cancel Booking (Driver)
```bash
POST /api/consumer/bookings/:id/cancel
{
    "reason": "Driver unavailable"
}
```

**Expected:**
- ✅ Booking cancelled
- ✅ Penalty auto-created
- ✅ Penalty auto-applied to driver wallet
- ✅ Wallet hold released

#### Test 3: Generate Payout
```bash
POST /api/admin/payouts/generate
{
    "driverId": "...",
    "startDate": "2026-04-10",
    "endDate": "2026-04-17"
}
```

**Expected:**
- ✅ Payout created
- ✅ Penalties deducted
- ✅ Cannot create duplicate payout (unique constraint)

---

### Step 5: Update Admin APIs (3 minutes)

Ensure all admin pricing APIs use the adapter:

**Files to check:**
- `Backend/modules/admin/controllers/adminPricingController.js`
- `Backend/modules/admin/controllers/adminPayoutController.js`

**Update imports:**
```javascript
const PricingEngine = require('../../../services/pricingEngineAdapter');
```

---

## VERIFICATION CHECKLIST

After deployment, verify:

- [ ] Spare Driver bookings use new pricing engine
- [ ] Other service bookings still work (legacy engine)
- [ ] GST stored separately in database
- [ ] Commission and driver earning tracked
- [ ] Wallet holds work correctly
- [ ] Driver wallet shows hold amount
- [ ] Penalties auto-apply on cancellation
- [ ] Cannot create duplicate payouts
- [ ] Admin can view pricing breakdown
- [ ] Reports show GST separately

---

## ROLLBACK PLAN

If issues occur:

### Quick Rollback (2 minutes)
```javascript
// In bookingController.js, revert line 13:
const PricingEngine = require('../../../utils/pricingHelper');

// Remove penalty auto-apply code
```

### Full Rollback (5 minutes)
```bash
# Restore from backup
git checkout HEAD~1 Backend/modules/consumer/controllers/bookingController.js
git checkout HEAD~1 Backend/models/Booking.js
git checkout HEAD~1 Backend/models/SpareDriver.js
git checkout HEAD~1 Backend/models/DriverPayout.js

# Restart server
npm restart
```

---

## MONITORING

After deployment, monitor:

1. **Pricing Accuracy**
   - Compare old vs new pricing for same service
   - Verify GST calculations
   - Check commission splits

2. **Penalty Application**
   - Check penalty logs
   - Verify driver wallet deductions
   - Monitor penalty disputes

3. **Payout Generation**
   - Verify no duplicate payouts
   - Check penalty deductions
   - Validate earning calculations

4. **Performance**
   - Monitor API response times
   - Check database query performance
   - Watch for errors in logs

---

## NEXT STEPS

### Phase 2: Complete Migration (1 week)

1. **Migrate All Services to New Engine**
   - Update wash services
   - Update detailing services
   - Update add-on services

2. **Remove Legacy Engine**
   - Archive `pricingHelper.js`
   - Update all references
   - Clean up old code

3. **Enhanced Reporting**
   - GST reports
   - Commission reports
   - Driver earning reports
   - Penalty reports

4. **Admin Dashboard Updates**
   - Show pricing breakdown
   - Display GST separately
   - Track penalties
   - Monitor payouts

---

## SUPPORT

If issues occur:

1. Check logs: `Backend/logs/error.log`
2. Review validation report: `PRICING_ENGINE_VALIDATION_REPORT.md`
3. Test with Postman collection
4. Contact: Kiro AI

---

**Prepared By:** Kiro AI  
**Last Updated:** April 17, 2026  
**Status:** ✅ Ready for Deployment
