# 🚗 SPARE DRIVER - COMPLETE SERVICES + PRICING ENGINE SYSTEM

**Implementation Date:** April 16, 2026  
**Status:** ✅ BACKEND COMPLETE | 🔄 FRONTEND IN PROGRESS  
**Version:** 1.0

---

## 📋 IMPLEMENTATION SUMMARY

### ✅ COMPLETED (BACKEND)

1. **Models Created:**
   - `ServiceConfig.js` - Service base configuration
   - `PricingConfig.js` - Pricing rules and add-ons
   - `Penalty.js` - Driver penalty system
   - `DriverPayout.js` - Weekly payout management

2. **Services Created:**
   - `pricingEngine.js` - Central pricing calculation engine

3. **Controllers Created:**
   - `adminServiceController.js` - Service CRUD operations
   - `adminPricingController.js` - Pricing configuration
   - `adminPayoutController.js` - Payout management

4. **Routes Created:**
   - `serviceRoutes.js` - `/api/admin/spare-driver/services`
   - `pricingRoutes.js` - `/api/admin/spare-driver/pricing`
   - `payoutRoutes.js` - `/api/admin/spare-driver/payouts`

---

## 🎯 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    PRICING ENGINE FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. SERVICE CONFIG (Base Pricing)
   ├─ Point-to-Point: ₹499
   ├─ Hourly: ₹180/hour (₹150 subscriber)
   ├─ Full Day: ₹999 (8 hours)
   └─ Outstation: ₹2,499/day

2. PRICING CONFIG (Rules & Add-ons)
   ├─ GST: 18%
   ├─ Platform Commission: 20%
   ├─ Surge: 1.5x (peak hours)
   ├─ Night Charge: ₹300
   ├─ Scheduled Premium: ₹100
   └─ Outstation Allowance: ₹500/day

3. PRICING ENGINE (Calculation)
   ├─ Base Amount = Service Base × Vehicle Multiplier × Duration
   ├─ Overtime = Extra Hours × Overtime Rate
   ├─ Add-ons = Scheduled + Night + Outstation
   ├─ Subtotal = Base + Overtime + Add-ons
   ├─ Surge = Subtotal × (Surge Multiplier - 1)
   ├─ GST = Subtotal After Surge × GST%
   ├─ Final Amount = Subtotal + Surge + GST
   ├─ Commission = Subtotal × Commission%
   └─ Driver Earning = Subtotal - Commission

4. PAYOUT SYSTEM
   ├─ Weekly payout generation
   ├─ Penalty deductions
   ├─ Adjustments (bonus/deduction)
   └─ Bank transfer processing
```

---

## 📦 API ENDPOINTS

### **SERVICE CONFIGURATION**

#### GET `/api/admin/spare-driver/services`
Get all service configurations

**Response:**
```json
{
  "status": "success",
  "results": 4,
  "data": {
    "services": [
      {
        "type": "point",
        "name": "Point-to-Point",
        "basePrice": 499,
        "hourlyRate": 0,
        "includedHours": 2,
        "overtimeRate": 150,
        "isActive": true,
        "vehicleMultipliers": {
          "hatchback": 1.0,
          "sedan": 1.2,
          "suv": 1.5,
          "luxury": 2.0
        }
      }
    ]
  }
}
```

#### GET `/api/admin/spare-driver/services/:type`
Get single service configuration

#### PATCH `/api/admin/spare-driver/services/:type`
Update service configuration

**Request Body:**
```json
{
  "basePrice": 599,
  "hourlyRate": 200,
  "subscriberHourlyRate": 170,
  "overtimeRate": 180,
  "isActive": true
}
```

#### PATCH `/api/admin/spare-driver/services/:type/toggle`
Toggle service active status

#### POST `/api/admin/spare-driver/services/initialize`
Initialize default services (run once)

---

### **PRICING CONFIGURATION**

#### GET `/api/admin/spare-driver/pricing/config`
Get pricing configuration

**Response:**
```json
{
  "status": "success",
  "data": {
    "config": {
      "gstPercent": 18,
      "isGstEnabled": true,
      "platformCommissionPercent": 20,
      "surgeMultiplier": 1.5,
      "isSurgeEnabled": false,
      "nightCharge": 300,
      "isNightEnabled": true,
      "scheduledPremium": 100,
      "outstationAllowance": 500,
      "cancellation": {
        "customer": {
          "beforeTrip": 50,
          "afterTripStart": 100
        },
        "driver": {
          "beforeTrip": 100,
          "afterTripStart": 200,
          "noShow": 300
        }
      },
      "walletHoldAmount": 500
    }
  }
}
```

#### PATCH `/api/admin/spare-driver/pricing/config`
Update pricing configuration

**Request Body:**
```json
{
  "gstPercent": 18,
  "platformCommissionPercent": 20,
  "surgeMultiplier": 1.8,
  "nightCharge": 350,
  "scheduledPremium": 150
}
```

#### POST `/api/admin/spare-driver/pricing/calculate`
Calculate price (preview)

**Request Body:**
```json
{
  "serviceType": "hourly",
  "duration": 8,
  "vehicleType": "sedan",
  "isScheduled": true,
  "isSubscriber": false,
  "scheduledTime": "2026-04-16T23:00:00Z"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "pricing": {
      "serviceType": "hourly",
      "serviceName": "Hourly Booking",
      "duration": 8,
      "vehicleType": "sedan",
      "isSubscriber": false,
      "isScheduled": true,
      "baseAmount": 1728,
      "overtimeAmount": 960,
      "addons": {
        "scheduledPremium": 100,
        "nightCharge": 300,
        "outstationAllowance": 0,
        "total": 400
      },
      "subtotal": 3088,
      "surge": {
        "isApplied": false,
        "multiplier": 1.5,
        "amount": 0
      },
      "subtotalAfterSurge": 3088,
      "gst": {
        "isApplied": true,
        "percent": 18,
        "amount": 555.84
      },
      "finalAmount": 3643.84,
      "commission": {
        "percent": 20,
        "amount": 617.6
      },
      "driverEarning": 2470.4,
      "walletHold": 500
    }
  }
}
```

#### GET `/api/admin/spare-driver/pricing/summary`
Get pricing summary (for dashboard)

#### PATCH `/api/admin/spare-driver/pricing/surge/toggle`
Toggle surge pricing

#### PATCH `/api/admin/spare-driver/pricing/night/toggle`
Toggle night charges

---

### **PAYOUT MANAGEMENT**

#### GET `/api/admin/spare-driver/payouts`
Get all payouts

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `status` - Filter by status (PENDING, PROCESSING, COMPLETED, FAILED)
- `driverId` - Filter by driver
- `startDate` - Filter by date range
- `endDate` - Filter by date range

#### GET `/api/admin/spare-driver/payouts/:id`
Get single payout details

#### POST `/api/admin/spare-driver/payouts/generate`
Generate payout for single driver

**Request Body:**
```json
{
  "driverId": "507f1f77bcf86cd799439011",
  "startDate": "2026-04-07",
  "endDate": "2026-04-13"
}
```

#### POST `/api/admin/spare-driver/payouts/generate-all`
Generate payouts for all active drivers

**Request Body:**
```json
{
  "startDate": "2026-04-07",
  "endDate": "2026-04-13"
}
```

#### POST `/api/admin/spare-driver/payouts/:id/adjustment`
Add adjustment to payout

**Request Body:**
```json
{
  "type": "BONUS",
  "amount": 500,
  "reason": "Excellent performance bonus"
}
```

#### POST `/api/admin/spare-driver/payouts/:id/process`
Process payout (mark as completed)

**Request Body:**
```json
{
  "transactionId": "TXN123456789"
}
```

#### GET `/api/admin/spare-driver/payouts/stats`
Get payout statistics

---

## 🧮 PRICING CALCULATION EXAMPLES

### Example 1: Hourly Service (8 hours, Sedan, Subscriber, Scheduled, Night)

```javascript
Input:
- Service: Hourly
- Duration: 8 hours
- Vehicle: Sedan (1.2x)
- Subscriber: Yes
- Scheduled: Yes
- Time: 23:00 (Night)

Calculation:
1. Base: ₹150/hour × 8 × 1.2 = ₹1,440
2. Overtime: (8 - 4) × ₹200 × 1.2 = ₹960
3. Add-ons:
   - Scheduled Premium: ₹100
   - Night Charge: ₹300
   - Total Add-ons: ₹400
4. Subtotal: ₹1,440 + ₹960 + ₹400 = ₹2,800
5. Surge: Not applied = ₹0
6. GST (18%): ₹2,800 × 0.18 = ₹504
7. Final Amount: ₹2,800 + ₹504 = ₹3,304
8. Commission (20%): ₹2,800 × 0.20 = ₹560
9. Driver Earning: ₹2,800 - ₹560 = ₹2,240
```

### Example 2: Outstation Service (2 days, SUV)

```javascript
Input:
- Service: Outstation
- Duration: 48 hours (2 days)
- Vehicle: SUV (1.5x)
- Subscriber: No
- Scheduled: Yes

Calculation:
1. Base: ₹2,499 × 2 days × 1.5 = ₹7,497
2. Overtime: 0 (within included hours)
3. Add-ons:
   - Scheduled Premium: ₹100
   - Outstation Allowance: ₹500 × 2 = ₹1,000
   - Total Add-ons: ₹1,100
4. Subtotal: ₹7,497 + ₹1,100 = ₹8,597
5. Surge: Not applied = ₹0
6. GST (18%): ₹8,597 × 0.18 = ₹1,547.46
7. Final Amount: ₹8,597 + ₹1,547.46 = ₹10,144.46
8. Commission (20%): ₹8,597 × 0.20 = ₹1,719.40
9. Driver Earning: ₹8,597 - ₹1,719.40 = ₹6,877.60
```

---

## 🔄 NEXT STEPS (FRONTEND)

### 1. Services Management UI
- Service cards with edit capability
- Toggle active/inactive
- Update pricing fields
- Vehicle multiplier configuration

### 2. Pricing Engine UI
- GST configuration
- Platform commission settings
- Surge pricing toggle + multiplier
- Night charges toggle + amount
- Cancellation charges editor
- Pricing preview calculator

### 3. Payout Management UI
- Payout list with filters
- Payout details view
- Generate payout button
- Process payout workflow
- Adjustment management

---

## ✅ BACKEND IMPLEMENTATION STATUS

| Component | Status | Files |
|-----------|--------|-------|
| **Models** | ✅ Complete | ServiceConfig, PricingConfig, Penalty, DriverPayout |
| **Services** | ✅ Complete | pricingEngine.js |
| **Controllers** | ✅ Complete | adminServiceController, adminPricingController, adminPayoutController |
| **Routes** | ✅ Complete | serviceRoutes, pricingRoutes, payoutRoutes |
| **Integration** | ✅ Complete | Routes registered in adminRoutes.js |

---

## 🎨 FRONTEND IMPLEMENTATION (NEXT)

Will create:
1. `AdminSpareDriverServices.jsx` - Services management page
2. `AdminPricingEngine.jsx` - Pricing configuration page
3. `AdminPayouts.jsx` - Payout management page
4. `PricingPreview.jsx` - Pricing calculator component

---

**Implementation By:** Kiro AI  
**Date:** April 16, 2026  
**Status:** Backend Complete ✅ | Frontend Pending 🔄
