# 💰 Pricing Control Flow - Complete Summary

**Date:** April 19, 2026  
**Question:** "Jo pricing amount hai jitna bhi uska control admin side jo new price engine or spare driver service section banaya hai wahi se aa rha haina?"

---

## ✅ ANSWER: **HAAN, BILKUL SAHI!**

Admin ke paas **2 jagah se complete pricing control** hai:

---

## 🎯 PRICING CONTROL POINTS

### 1️⃣ **Admin Pricing Engine** (Global Rules)
**Path:** `/admin/pricing-engine`  
**File:** `Frontend/src/modules/admin/pages/finance/AdminPricingEngine.jsx`

#### Admin Control Karta Hai:
- ✅ **GST Percent** (default: 0%)
- ✅ **Platform Commission** (default: 20%)
- ✅ **Night Charge** (default: ₹300)
- ✅ **Outstation Allowance** (default: ₹500/day)
- ✅ **Wallet Hold Amount** (default: ₹360)
- ✅ **Surge Multiplier** (default: 1.5x)
- ✅ **Scheduled Premium**
- ✅ **Cancellation Charges** (default: ₹100)

**Backend:** `Backend/modules/admin/controllers/adminPricingController.js`  
**Model:** `Backend/models/PricingConfig.js`

---

### 2️⃣ **Spare Driver Services** (Service-Specific Pricing)
**Path:** `/admin/spare-driver-services`  
**File:** `Frontend/src/modules/admin/pages/finance/AdminSpareDriverServices.jsx`

#### Admin Control Karta Hai (Per Service):

##### A. **Point-to-Point Service**
- ✅ Base Price: ₹499
- ✅ Included Hours: 2
- ✅ Overtime Rate: ₹150/hour
- ✅ Vehicle Multipliers:
  - Hatchback: 1.0x
  - Sedan: 1.2x
  - SUV: 1.5x
  - Luxury: 2.0x

##### B. **Hourly Service**
- ✅ Base Price: ₹799
- ✅ Hourly Rate: ₹180
- ✅ Subscriber Rate: ₹150
- ✅ Included Hours: 4
- ✅ Overtime Rate: ₹200/hour
- ✅ Vehicle Multipliers (same as above)

##### C. **Full Day Service**
- ✅ Base Price: ₹999
- ✅ Included Hours: 8
- ✅ Overtime Rate: ₹200/hour
- ✅ Vehicle Multipliers (same as above)

##### D. **Outstation Service**
- ✅ Base Price: ₹2499
- ✅ Included Hours: 24
- ✅ Overtime Rate: ₹250/hour
- ✅ Vehicle Multipliers (same as above)

**Backend:** `Backend/modules/admin/controllers/adminServiceController.js`  
**Model:** `Backend/models/ServiceConfig.js`

---

## 🔄 COMPLETE PRICING FLOW

### Step 1: Consumer Books Trip
```
Consumer selects: Hourly Service (4 hours) + Sedan
```

### Step 2: System Calculates Price
```javascript
// 1. Get service config from Admin Spare Driver Services
basePrice = ₹799 (4 hours)
vehicleMultiplier = 1.2x (Sedan)

// 2. Apply vehicle multiplier
adjustedPrice = ₹799 × 1.2 = ₹958.80

// 3. Check for night allowance (from Admin Pricing Engine)
if (trip starts 11 PM - 5 AM) {
    adjustedPrice += ₹300 (nightAllowance)
}

// 4. Check for outstation (from Admin Pricing Engine)
if (service is outstation) {
    adjustedPrice += ₹500/day (outstationAllowance)
}

// 5. Apply GST (from Admin Pricing Engine)
if (GST enabled) {
    gstAmount = adjustedPrice × (gstPercent / 100)
    finalPrice = adjustedPrice + gstAmount
}

// 6. Calculate wallet reserve (from Admin Pricing Engine)
hourlyRate = adjustedPrice / 4 = ₹239.70
reserveAmount = hourlyRate × 2 = ₹479.40
```

### Step 3: Trip Completes with Overtime
```javascript
// Trip runs 6 hours instead of 4 hours
extraHours = 6 - 4 = 2 hours

// Get overtime rate from Admin Spare Driver Services
overtimeRate = ₹200/hour (from service config)

// Calculate overtime charge
overtimeCharge = 2 × ₹200 = ₹400

// Add to final price
finalPrice = ₹958.80 + ₹400 = ₹1358.80

// Deduct platform commission (from Admin Pricing Engine)
commission = ₹1358.80 × 20% = ₹271.76
driverPayout = ₹1358.80 - ₹271.76 = ₹1087.04
```

---

## 📊 ADMIN CONTROL SUMMARY

| Pricing Component | Control Location | Admin Can Change |
|-------------------|------------------|------------------|
| **Base Price** | Spare Driver Services | ✅ Yes |
| **Hourly Rate** | Spare Driver Services | ✅ Yes |
| **Subscriber Rate** | Spare Driver Services | ✅ Yes |
| **Overtime Rate** | Spare Driver Services | ✅ Yes |
| **Vehicle Multipliers** | Spare Driver Services | ✅ Yes |
| **Night Allowance** | Pricing Engine | ✅ Yes |
| **Outstation Allowance** | Pricing Engine | ✅ Yes |
| **GST Percent** | Pricing Engine | ✅ Yes |
| **Platform Commission** | Pricing Engine | ✅ Yes |
| **Wallet Reserve** | Pricing Engine | ✅ Yes |
| **Surge Multiplier** | Pricing Engine | ✅ Yes |
| **Cancellation Fee** | Pricing Engine | ✅ Yes |

---

## 🎯 ADMIN UI LOCATIONS

### 1. Pricing Engine
```
Admin Panel → Finance → Pricing Engine
URL: /admin/pricing-engine
```

**Features:**
- Toggle GST on/off
- Set GST percentage
- Set platform commission
- Toggle surge pricing
- Set surge multiplier
- Toggle night charges
- Set night charge amount
- Set outstation allowance
- Set wallet hold amount
- Live pricing calculator

### 2. Spare Driver Services
```
Admin Panel → Finance → Spare Driver Services
URL: /admin/spare-driver-services
```

**Features:**
- View all 4 service types
- Edit base price per service
- Edit hourly rates
- Edit subscriber rates
- Edit overtime rates
- Edit vehicle multipliers
- Toggle service active/inactive
- Initialize default services

---

## 🔍 BACKEND API ENDPOINTS

### Pricing Engine APIs
```
GET    /api/admin/pricing/config          - Get pricing config
PATCH  /api/admin/pricing/config          - Update pricing config
POST   /api/admin/pricing/calculate       - Calculate price preview
GET    /api/admin/pricing/cancellation    - Get cancellation charges
PATCH  /api/admin/pricing/cancellation    - Update cancellation charges
POST   /api/admin/pricing/toggle-surge    - Toggle surge pricing
POST   /api/admin/pricing/toggle-night    - Toggle night charges
GET    /api/admin/pricing/summary         - Get pricing summary
```

### Spare Driver Service APIs
```
GET    /api/admin/spare-driver/services           - Get all services
GET    /api/admin/spare-driver/services/:type     - Get single service
PATCH  /api/admin/spare-driver/services/:type     - Update service
POST   /api/admin/spare-driver/services/:type/toggle - Toggle service
POST   /api/admin/spare-driver/services/initialize   - Initialize defaults
```

---

## 💡 EXAMPLE: Admin Changes Price

### Scenario: Admin wants to increase hourly rate from ₹180 to ₹200

**Step 1:** Admin opens Spare Driver Services page
```
/admin/spare-driver-services
```

**Step 2:** Admin finds "Hourly Booking" service card

**Step 3:** Admin changes:
- Hourly Rate: ₹180 → ₹200
- Overtime Rate: ₹200 → ₹220

**Step 4:** Admin clicks "Save Changes"

**Step 5:** Backend updates `ServiceConfig` model
```javascript
await ServiceConfig.findOneAndUpdate(
    { type: 'hourly' },
    { 
        hourlyRate: 200,
        overtimeRate: 220
    }
);
```

**Step 6:** Next booking automatically uses new rates
```
Consumer books 4-hour trip:
Old Price: ₹799 (4 × ₹180 = ₹720 + base)
New Price: ₹899 (4 × ₹200 = ₹800 + base)
```

---

## ✅ FINAL ANSWER

**Haan, admin ka complete control hai!**

### Admin Control Karta Hai:
1. ✅ **Service Base Prices** (Point-to-Point, Hourly, Full Day, Outstation)
2. ✅ **Hourly Rates** (Standard + Subscriber rates)
3. ✅ **Overtime Rates** (per service type)
4. ✅ **Vehicle Multipliers** (Hatchback, Sedan, SUV, Luxury)
5. ✅ **Night Allowance** (₹300 default)
6. ✅ **Outstation Allowance** (₹500/day default)
7. ✅ **GST** (percentage + enable/disable)
8. ✅ **Platform Commission** (20% default)
9. ✅ **Surge Pricing** (multiplier + enable/disable)
10. ✅ **Cancellation Charges** (₹100 default)

### Auto-Detection System:
- ✅ Overtime charges (grace period: 15 min)
- ✅ Night allowance (11 PM - 5 AM)
- ✅ Outstation multi-day allowance
- ✅ Waiting charges (grace period: 15 min)
- ✅ Vehicle multiplier application
- ✅ Subscriber rate discount

**Sab kuch admin ke control mein hai! 🎯**

---

## 📝 TECHNICAL FILES

### Frontend:
- `Frontend/src/modules/admin/pages/finance/AdminPricingEngine.jsx`
- `Frontend/src/modules/admin/pages/finance/AdminSpareDriverServices.jsx`

### Backend:
- `Backend/modules/admin/controllers/adminPricingController.js`
- `Backend/modules/admin/controllers/adminServiceController.js`
- `Backend/models/PricingConfig.js`
- `Backend/models/ServiceConfig.js`
- `Backend/utils/pricingHelper.js`

### Routes:
- `Backend/modules/admin/routes/pricingRoutes.js`
- `Backend/modules/admin/routes/serviceRoutes.js`

---

**Summary:** Admin ke paas **2 powerful dashboards** hain jahan se wo **complete pricing control** kar sakta hai - ek global rules ke liye (Pricing Engine) aur ek service-specific pricing ke liye (Spare Driver Services). Dono jagah se changes real-time apply hote hain! ✅
