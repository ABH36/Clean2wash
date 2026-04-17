# 🚗 SPARE DRIVER SERVICE MODEL - COMPLETE ANALYSIS

**Platform Type:** Driver-on-Demand (NOT Cab Service)  
**Core Concept:** User owns vehicle, platform provides professional driver  
**Analysis Date:** April 16, 2026  
**Status:** ✅ Analysis Complete (NO CODING)

---

## 📌 TASK 1: CORE SERVICE TYPES

### 1. **Point-to-Point Service** (`point`)
**Base Price:** ₹499

**What it does:**
- Round-trip driver service from user's location
- Driver takes user from Point A to Point B and returns
- Short-duration, specific destination trips

**When user uses it:**
- Airport drops/pickups
- Hospital visits
- Shopping trips
- Quick errands
- Single destination trips

**How it's different:**
- **Shortest duration** (1-2 hours typical)
- **Fixed route** (pickup → destination → return)
- **Lowest base price** among all services
- **No extended availability** - driver completes trip and leaves

---

### 2. **Hourly Booking Service** (`hourly`)
**Base Price:** ₹799

**What it does:**
- Flexible rental of driver for specified hours
- Driver stays with vehicle for entire duration
- Multiple stops allowed within time block

**When user uses it:**
- Multiple errands in a day
- Shopping across multiple locations
- Business meetings at different venues
- Flexible city movement

**How it's different:**
- **Time-based pricing** (₹180/hour standard, ₹150/hour for subscribers)
- **Flexible duration** (4 hours, 8 hours options)
- **Multiple destinations** allowed
- **Driver waits** between stops
- **Hourly rate multiplier** applies for extended hours

---

### 3. **Full Day Service** (`full`)
**Base Price:** ₹999

**What it does:**
- Dedicated chauffeur for entire day (8 hours)
- Driver assigned for full business/personal day
- Comprehensive city movement coverage

**When user uses it:**
- Office commute + meetings
- Family events (weddings, functions)
- Full-day shopping/tourism
- Business conferences
- VIP guest transportation

**How it's different:**
- **Fixed 8-hour block** (not hourly multiplier)
- **Package pricing** (flat rate, not per-hour)
- **Dedicated availability** throughout day
- **Professional service** for extended periods
- **No destination restrictions** within city

---

### 4. **Outstation Service** (`outstation`)
**Base Price:** ₹2,499

**What it does:**
- Inter-city travel with professional driver
- 24-hour travel block for long-distance trips
- Includes driver allowances (stay & food)

**When user uses it:**
- Weekend getaways
- Business trips to other cities
- Family vacations
- Long-distance travel (100+ km)
- Multi-day trips

**How it's different:**
- **Longest duration** (24 hours minimum)
- **Highest base price** (₹2,499+)
- **Destination required** (mandatory field)
- **Allowances included** (₹500/day for driver stay & food)
- **Inter-city coverage** (not limited to city boundaries)
- **Safety protocols** for long-distance travel

---

## 📌 TASK 2: COMPLETE SERVICE FLOW

### **FULL BOOKING FLOW:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER JOURNEY FLOW                             │
└─────────────────────────────────────────────────────────────────┘

1. SERVICE SELECTION
   ↓
   User selects service type (Point/Hourly/Full Day/Outstation)
   ↓
   
2. BOOKING DETAILS
   ↓
   - Select vehicle from garage
   - Choose duration (1h, 4h, 8h, 24h)
   - Pick date & time (Instant or Scheduled)
   - Add pickup location
   - Add destination (if Outstation)
   - Add special instructions
   ↓
   
3. PRICING CALCULATION
   ↓
   Base Price × Vehicle Multiplier × Duration + Addons + Surcharges
   ↓
   
4. PAYMENT
   ↓
   - Online payment (Razorpay)
   - Wallet payment
   - Subscription credits (if active)
   ↓
   Status: PENDING → CONFIRMED
   ↓
   
5. DRIVER ASSIGNMENT (BROADCAST MODEL)
   ↓
   System broadcasts booking to nearby drivers
   ↓
   
6. DRIVER SELECTION
   ↓
   - Drivers receive notification
   - Driver can ACCEPT or REJECT
   - First to accept gets the booking
   ↓
   Status: ASSIGNED
   ↓
   
7. DRIVER EN ROUTE
   ↓
   - Driver navigates to pickup location
   - Real-time tracking active
   - User receives driver details (name, phone, photo)
   ↓
   Status: EN_ROUTE → ARRIVED
   ↓
   
8. TRIP ACTIVE
   ↓
   - Driver verifies security PIN
   - Trip starts
   - Real-time location tracking
   - User can contact driver
   ↓
   Status: ACTIVE
   ↓
   
9. TRIP COMPLETION
   ↓
   - Driver completes service
   - Returns to drop location
   - Trip marked complete
   ↓
   Status: COMPLETED
   ↓
   
10. POST-TRIP
    ↓
    - User rates driver
    - Driver receives payout
    - Platform commission deducted
    - Loyalty points awarded
```

---

### **DRIVER ASSIGNMENT LOGIC (BROADCAST MODEL)**

#### **How Driver is Selected:**

1. **Broadcast Trigger:**
   - Booking created → System broadcasts to nearby drivers
   - Scheduled bookings → Broadcast 15 minutes before scheduled time
   - Driver cancellation → Re-broadcast to other drivers

2. **Eligibility Criteria:**
   ```javascript
   Driver must meet ALL conditions:
   - status === 'ACTIVE'
   - isOnline === true
   - verificationStatus === 'APPROVED'
   - NOT in rejectedDrivers list for this booking
   - Within broadcast radius (7km initial, expands to 15km)
   - dutyHours.status.canAcceptBookings === true
   - NOT overworked (daily/weekly limits)
   - NOT needs mandatory break
   ```

3. **Broadcast Radius:**
   - **Initial:** 7km from pickup location
   - **1st retry:** 9km (if no driver accepts)
   - **2nd retry:** 11km
   - **Max:** 15km

4. **Driver Receives:**
   - Push notification
   - Socket.io real-time event
   - Booking details (service, location, vehicle, price)

5. **Driver Actions:**
   - **ACCEPT:** Driver assigned immediately, booking status → ASSIGNED
   - **REJECT:** Driver added to exclusion list, booking re-broadcast to others
   - **IGNORE:** After timeout, booking re-broadcast

---

#### **When Driver is Assigned:**

| Service Type | Assignment Timing |
|-------------|-------------------|
| **Instant** | Immediately after booking creation |
| **Scheduled** | 15 minutes before scheduled time |
| **Priority** | Immediate broadcast with higher notification priority |

---

#### **Can Driver Accept/Reject?**

**YES** - Drivers have full control:

✅ **ACCEPT:**
- Driver confirms availability
- Booking assigned to driver
- Driver receives pickup details
- User notified of driver assignment

❌ **REJECT:**
- Driver can reject with reason
- Driver added to exclusion list for this booking
- Booking re-broadcast to other eligible drivers
- No penalty for first rejection
- **Reliability score impacted** after multiple rejections

---

#### **What Happens if Driver Cancels?**

**Scenario 1: Driver Cancels BEFORE Trip Starts**
```
1. Driver penalty: ₹100 deducted from wallet
2. Reliability score reduced
3. Booking status → PENDING
4. System re-broadcasts to other drivers
5. User notified of cancellation
6. Original driver excluded from re-broadcast
```

**Scenario 2: Driver Cancels AFTER Trip Starts**
```
1. Higher penalty: ₹200 deducted
2. Significant reliability score reduction
3. Admin notification triggered
4. User receives full refund
5. Driver may face suspension review
```

**Scenario 3: Driver No-Show**
```
1. Automatic cancellation after 15 minutes
2. Maximum penalty applied
3. Reliability score heavily impacted
4. Potential account suspension
5. User receives full refund + compensation
```

---

## 📌 TASK 3: PRICING LOGIC

### **BASE PRICING FORMULA:**

```javascript
TOTAL = (Base Price × Vehicle Multiplier × Duration Multiplier) 
        + Addons 
        + Scheduled Premium 
        + Surge Multiplier 
        + Night Allowance 
        + Outstation Allowance
        - Discounts
```

---

### **1. Point-to-Point Pricing**

**Base:** ₹499

```javascript
Calculation:
- Base Price: ₹499
- Vehicle Multiplier: 1.0 (Hatchback), 1.2 (Sedan), 1.5 (SUV)
- Duration: Fixed (1-2 hours)
- Scheduled Premium: +₹100 (if scheduled)
- Surge: 1.5x (during high demand)

Example (Sedan, Instant):
₹499 × 1.2 = ₹598.80 ≈ ₹599
```

---

### **2. Hourly Booking Pricing**

**Base:** ₹799 (4 hours)  
**Hourly Rate:** ₹180/hour (Standard), ₹150/hour (Subscriber)

```javascript
Calculation:
- Base Price: ₹799
- Hourly Rate: ₹180/hour
- Duration Multiplier: hours selected
- Vehicle Multiplier: 1.0-1.5
- Subscriber Discount: ₹30/hour

Example (8 hours, Sedan, Standard):
(₹180 × 8 hours) × 1.2 = ₹1,728

Example (8 hours, Sedan, Subscriber):
(₹150 × 8 hours) × 1.2 = ₹1,440
```

---

### **3. Full Day Pricing**

**Base:** ₹999 (8 hours)

```javascript
Calculation:
- Base Price: ₹999
- Vehicle Multiplier: 1.0-1.5
- Fixed Duration: 8 hours (NO hourly multiplier)
- Package Rate: Flat pricing

Example (Sedan):
₹999 × 1.2 = ₹1,198.80 ≈ ₹1,199

Note: Full Day is PACKAGE pricing, not hourly
```

---

### **4. Outstation Pricing**

**Base:** ₹2,499 (24 hours)

```javascript
Calculation:
- Base Price: ₹2,499
- Vehicle Multiplier: 1.0-1.5
- Duration: 24 hours
- Outstation Allowance: +₹500/day (driver stay & food)
- Destination: Required

Example (SUV, 2 days):
(₹2,499 × 1.5) + (₹500 × 2) = ₹3,748.50 + ₹1,000 = ₹4,748.50 ≈ ₹4,749
```

---

### **VEHICLE MULTIPLIERS:**

| Vehicle Type | Multiplier | Reason |
|-------------|-----------|---------|
| Hatchback | 1.0x | Base rate |
| Sedan | 1.2x | Premium handling |
| SUV | 1.5x | Larger vehicle, higher responsibility |
| Luxury | 2.0x | High-value vehicle |

---

### **SURCHARGES & PREMIUMS:**

#### **1. Scheduled Premium**
```
+₹100 for scheduled bookings
Reason: Guaranteed driver availability at specific time
```

#### **2. Night Allowance**
```
+₹300 for trips between 11 PM - 5 AM
Reason: Night shift compensation for driver
```

#### **3. Surge Pricing**
```
1.5x - 2.0x during high demand
Triggers:
- Peak hours (8-10 AM, 6-8 PM)
- Festivals/holidays
- Low driver availability
```

#### **4. Outstation Allowance**
```
+₹500/day for driver stay & food
Applies to: Outstation service only
```

---

### **OVERTIME HANDLING:**

**Scenario:** User extends trip beyond booked duration

```javascript
Overtime Rate:
- Hourly Service: ₹180/hour (or ₹150 for subscribers)
- Full Day: ₹200/hour after 8 hours
- Point-to-Point: ₹150/hour after 2 hours
- Outstation: ₹250/hour after 24 hours

Payment:
- Wallet hold: ₹500 reserved at booking
- Overtime deducted from wallet hold
- If insufficient: Settlement pending (pay later)
- Driver receives overtime pay in next payout
```

---

### **CANCELLATION CHARGES:**

| Cancelled By | Before Trip | After Trip Starts | No-Show |
|-------------|------------|------------------|---------|
| **Customer** | ₹50 | ₹100 | N/A |
| **Driver** | ₹100 | ₹200 | ₹300 |

**Refund Policy:**
- Cancelled >2 hours before: 100% refund (minus ₹50 fee)
- Cancelled <2 hours before: 50% refund
- Cancelled after start: No refund
- Driver cancellation: Full refund + ₹100 compensation

---

## 📌 TASK 4: DRIVER LOGIC

### **DRIVER AVAILABILITY SYSTEM:**

#### **1. Online/Offline Status**

```javascript
Driver States:
- ONLINE: Available for bookings, receives broadcasts
- OFFLINE: Not available, no broadcasts
- BUSY: Currently on trip, no new bookings
- BREAK: On mandatory break, no bookings

Toggle:
- Driver can go online/offline anytime
- Auto-offline after 30 minutes of inactivity
- Auto-offline when duty limits reached
```

---

#### **2. Availability Slots (Scheduled Bookings)**

```javascript
Driver can set availability:
- Date: Specific dates available
- Time Slots: 
  - Morning: 6 AM - 12 PM
  - Afternoon: 12 PM - 6 PM
  - Evening: 6 PM - 12 AM
  - Night: 12 AM - 6 AM

Booking Assignment:
- Only drivers with matching time slots receive broadcast
- Slot marked as BOOKED when driver accepts
- Slot released if driver cancels
```

---

#### **3. Reliability Score (0-100)**

**Calculation Formula:**

```javascript
Reliability Score = 
  (Completion Rate × 40%) +
  (Acceptance Rate × 30%) +
  ((100 - Cancellation Rate) × 20%) +
  (Rating Score × 10%)

Where:
- Completion Rate = (Completed Trips / Total Trips) × 100
- Acceptance Rate = (Accepted Bookings / Total Requests) × 100
- Cancellation Rate = (Cancelled Trips / Total Trips) × 100
- Rating Score = (Avg Rating / 5) × 100
```

**Impact on Driver:**

| Score Range | Status | Impact |
|------------|--------|--------|
| 90-100 | ⭐ Excellent | Priority in broadcasts, bonus eligibility |
| 75-89 | ✅ Good | Normal broadcast priority |
| 60-74 | ⚠️ Average | Lower priority, warning issued |
| 40-59 | 🔴 Poor | Very low priority, review required |
| 0-39 | ❌ Critical | Account suspension risk |

**Score Updates:**
- Recalculated after every trip
- Updated after every acceptance/rejection
- Displayed in driver dashboard
- Used in driver ranking algorithm

---

#### **4. Priority Driver Selection Algorithm**

**Broadcast Order (Highest to Lowest Priority):**

```javascript
1. Reliability Score (40% weight)
   - Drivers with score >90 get priority

2. Distance from Pickup (30% weight)
   - Closer drivers ranked higher
   - Within 2km: Highest priority
   - 2-5km: Medium priority
   - 5-15km: Low priority

3. Acceptance Rate (20% weight)
   - Drivers who accept more bookings ranked higher

4. Last Active Time (10% weight)
   - Recently active drivers get priority
   - Prevents inactive drivers from hogging broadcasts

Sorting Formula:
Priority Score = 
  (Reliability Score × 0.4) +
  ((15000 - Distance in meters) / 15000 × 0.3) +
  (Acceptance Rate × 0.2) +
  (Activity Recency × 0.1)
```

**Broadcast Strategy:**
1. **First Wave:** Top 10 drivers (highest priority score)
2. **Second Wave:** Next 20 drivers (if no acceptance in 2 minutes)
3. **Third Wave:** All eligible drivers within 15km (if still no acceptance)

---

### **DUTY HOURS & FATIGUE CONTROL:**

#### **Daily Limits:**
```
Maximum: 10 hours/day
Mandatory Break: After 4 hours continuous work
Minimum Break: 30 minutes
```

#### **Weekly Limits:**
```
Maximum: 60 hours/week
Reset: Every Monday 12:00 AM
```

#### **Booking Eligibility:**

```javascript
Driver CANNOT accept bookings if:
- Daily limit reached (10 hours)
- Weekly limit reached (60 hours)
- Needs mandatory break (4 hours continuous work)
- Manually blocked by admin
- Account suspended

Driver CAN accept bookings if:
- Within daily/weekly limits
- Break taken (if required)
- Status: ACTIVE
- Verification: APPROVED
```

---

## 📌 TASK 5: DIFFERENCE FROM CAB APPS (UBER/OLA)

### **KEY DIFFERENCES:**

| Aspect | Spare Driver (C2W) | Uber/Ola |
|--------|-------------------|----------|
| **Vehicle Ownership** | User owns vehicle | Platform/Driver owns vehicle |
| **Service Type** | Driver-on-demand | Transportation service |
| **Pricing Model** | Time-based (hourly/package) | Distance-based (per km) |
| **Driver Assignment** | Broadcast (driver accepts) | Auto-assigned (no choice) |
| **Service Duration** | 1-24 hours | Trip duration only |
| **Multiple Stops** | Allowed (hourly/full day) | Extra charges per stop |
| **Driver Stays** | Yes (throughout duration) | No (drop and leave) |
| **Pricing** | Flat rate + hourly | Base + per km + per minute |
| **Cancellation** | Driver can reject | Driver auto-assigned |
| **Use Case** | Personal driver for user's car | Ride from A to B |
| **Vehicle Type** | User's vehicle (any) | Platform-approved vehicles only |
| **Insurance** | User's vehicle insurance | Platform insurance |
| **Fuel** | User pays | Included in fare |
| **Toll/Parking** | User pays | Included in fare |

---

### **WHY SPARE DRIVER IS NOT LIKE UBER/OLA:**

#### **1. PRICING LOGIC:**

**Uber/Ola:**
```
Fare = Base Fare + (Distance × Per KM Rate) + (Time × Per Minute Rate) + Surge
Example: ₹50 + (10km × ₹12) + (20min × ₹2) + Surge = ₹210
```

**Spare Driver:**
```
Fare = Base Price × Vehicle Multiplier × Duration + Surcharges
Example: ₹799 × 1.2 × 4 hours = ₹3,836 (Hourly Sedan)
```

**Key Difference:** Time-based vs Distance-based

---

#### **2. DRIVER ASSIGNMENT:**

**Uber/Ola:**
- System auto-assigns nearest driver
- Driver has limited time to accept (15-30 seconds)
- Rejection penalized heavily
- No driver choice

**Spare Driver:**
- System broadcasts to multiple drivers
- Drivers can accept or reject freely
- First to accept gets the booking
- Driver has full control

**Key Difference:** Broadcast vs Auto-Assignment

---

#### **3. SERVICE NATURE:**

**Uber/Ola:**
- **Transportation:** Get from Point A to Point B
- **Vehicle Provided:** Platform/driver's vehicle
- **Trip-Based:** Single journey
- **No Waiting:** Driver leaves after drop

**Spare Driver:**
- **Driver Service:** Professional driver for user's vehicle
- **Vehicle Owned by User:** User's personal car
- **Time-Based:** Driver stays for duration
- **Waiting Allowed:** Driver waits between stops

**Key Difference:** Transportation vs Driver-as-a-Service

---

#### **4. USE CASES:**

**Uber/Ola:**
- Don't have a vehicle
- Need quick ride
- Airport transfers
- One-time trips
- No parking hassles

**Spare Driver:**
- Own a vehicle but can't/don't want to drive
- Need driver for multiple stops
- Full-day events (weddings, conferences)
- Elderly/disabled who own cars
- Business meetings across city
- Outstation trips in own vehicle

---

## 📌 TASK 6: FINAL OUTPUT

### **1. LIST OF SERVICES:**

```
✅ Point-to-Point (₹499)
   - Round trip, 1-2 hours
   - Single destination
   - Quick errands

✅ Hourly Booking (₹799)
   - Flexible rental, 4-8 hours
   - Multiple stops
   - ₹180/hour standard, ₹150/hour subscriber

✅ Full Day (₹999)
   - Dedicated 8-hour shift
   - Package pricing
   - All-day availability

✅ Outstation (₹2,499)
   - Inter-city travel, 24 hours
   - Includes driver allowance (₹500/day)
   - Destination required
```

---

### **2. FLOW DIAGRAM (TEXT-BASED):**

```
┌──────────────────────────────────────────────────────────────┐
│                   SPARE DRIVER SERVICE FLOW                   │
└──────────────────────────────────────────────────────────────┘

USER SIDE                          DRIVER SIDE
─────────                          ───────────

1. Select Service Type
   (Point/Hourly/Full/Outstation)
   ↓
2. Choose Vehicle from Garage
   ↓
3. Select Duration & Schedule
   ↓
4. Add Pickup Location
   ↓
5. Add Destination (if Outstation)
   ↓
6. Review Pricing
   ↓
7. Make Payment                    
   ↓                               
8. Booking Created ────────────→  1. Receive Broadcast
   Status: PENDING                   Notification
                                     ↓
                                  2. View Booking Details
                                     (Location, Vehicle, Price)
                                     ↓
                                  3. ACCEPT or REJECT
                                     ↓
                                     ACCEPT
                                     ↓
9. Driver Assigned ←──────────── 4. Booking Assigned
   Status: ASSIGNED                  Status: ASSIGNED
   ↓                                 ↓
10. Track Driver Location        5. Navigate to Pickup
    ↓                                ↓
11. Driver Arrives               6. Arrive at Location
    Status: ARRIVED                  Status: ARRIVED
    ↓                                ↓
12. Verify Security PIN          7. Verify PIN
    ↓                                ↓
13. Trip Starts                  8. Start Trip
    Status: ACTIVE                   Status: ACTIVE
    ↓                                ↓
14. Real-time Tracking           9. Drive User
    ↓                                ↓
15. Trip Completes               10. Complete Trip
    Status: COMPLETED                Status: COMPLETED
    ↓                                ↓
16. Rate Driver                  11. Receive Payout
    ↓                                ↓
17. Loyalty Points Awarded       12. Reliability Score Updated
```

---

### **3. PRICING LOGIC SUMMARY:**

```javascript
// BASE FORMULA
Total = (Base × Vehicle Multiplier × Duration) + Surcharges - Discounts

// VEHICLE MULTIPLIERS
Hatchback: 1.0x
Sedan: 1.2x
SUV: 1.5x
Luxury: 2.0x

// SURCHARGES
Scheduled Premium: +₹100
Night Allowance (11 PM - 5 AM): +₹300
Outstation Allowance: +₹500/day
Surge (High Demand): 1.5x - 2.0x

// HOURLY RATES
Standard: ₹180/hour
Subscriber: ₹150/hour

// OVERTIME
Hourly: ₹180/hour
Full Day: ₹200/hour (after 8 hours)
Point-to-Point: ₹150/hour (after 2 hours)
Outstation: ₹250/hour (after 24 hours)

// CANCELLATION
Customer: ₹50 (before trip), ₹100 (after start)
Driver: ₹100 (before trip), ₹200 (after start), ₹300 (no-show)
```

---

### **4. DRIVER ASSIGNMENT LOGIC:**

```javascript
// ELIGIBILITY CRITERIA
✅ status === 'ACTIVE'
✅ isOnline === true
✅ verificationStatus === 'APPROVED'
✅ NOT in rejectedDrivers list
✅ Within broadcast radius (7-15km)
✅ canAcceptBookings === true
✅ NOT overworked (daily/weekly limits)
✅ NOT needs mandatory break

// BROADCAST RADIUS
Initial: 7km
1st Retry: 9km
2nd Retry: 11km
Maximum: 15km

// PRIORITY ALGORITHM
Priority Score = 
  (Reliability Score × 0.4) +
  (Distance Factor × 0.3) +
  (Acceptance Rate × 0.2) +
  (Activity Recency × 0.1)

// BROADCAST WAVES
Wave 1: Top 10 drivers (highest priority)
Wave 2: Next 20 drivers (after 2 minutes)
Wave 3: All eligible drivers (after 5 minutes)

// DRIVER ACTIONS
ACCEPT → Booking assigned immediately
REJECT → Driver excluded, re-broadcast to others
IGNORE → Timeout, re-broadcast to others
```

---

### **5. KEY RULES:**

#### **BUSINESS RULES:**

```
1. User MUST own vehicle (platform provides driver only)
2. Pricing is TIME-BASED, not distance-based
3. Driver assignment is BROADCAST-BASED, not auto-assigned
4. Drivers can ACCEPT or REJECT bookings freely
5. Scheduled bookings broadcast 15 minutes before start time
6. Wallet hold (₹500) reserved for overtime/penalties
7. Driver receives 80% of fare, platform takes 20% commission
8. Outstation service REQUIRES destination
9. Night allowance (₹300) applies 11 PM - 5 AM
10. Subscriber rate: ₹150/hour vs ₹180/hour standard
```

#### **DRIVER RULES:**

```
1. Maximum 10 hours/day duty
2. Maximum 60 hours/week duty
3. Mandatory 30-minute break after 4 hours continuous work
4. Reliability score must be >60 to receive bookings
5. Driver can reject bookings without penalty (affects score)
6. Driver cancellation penalty: ₹100 (before trip), ₹200 (after start)
7. No-show penalty: ₹300 + account suspension risk
8. Overtime pay: ₹180-₹250/hour depending on service type
9. Driver must verify security PIN before starting trip
10. Driver receives payout weekly (every Monday)
```

#### **BOOKING RULES:**

```
1. Minimum booking duration: 1 hour
2. Maximum advance booking: 30 days
3. Cancellation allowed up to 2 hours before (50% refund)
4. Cancellation <2 hours: ₹50 fee
5. Driver no-show: Full refund + ₹100 compensation
6. Overtime charged from wallet hold
7. Settlement pending if wallet insufficient
8. Security PIN required to start trip
9. Real-time tracking mandatory during trip
10. Rating mandatory after trip completion
```

#### **PAYMENT RULES:**

```
1. Payment required before booking confirmation
2. Wallet hold: ₹500 reserved at booking
3. Overtime deducted from wallet hold
4. Refunds processed within 5-7 business days
5. Driver payout: 80% of fare
6. Platform commission: 20% of fare
7. Subscriber discount: ₹30/hour
8. Surge pricing: 1.5x-2.0x during high demand
9. Night allowance: ₹300 (11 PM - 5 AM)
10. Outstation allowance: ₹500/day (driver stay & food)
```

---

## ✅ ANALYSIS COMPLETE

**Status:** ✅ Understanding Phase Complete  
**Next Step:** Ready for Services Module Implementation  
**Documentation:** Complete service model, pricing logic, and driver assignment algorithm documented

**Key Takeaways:**
1. Spare Driver is a **driver-on-demand** platform, NOT a cab service
2. Pricing is **time-based**, not distance-based
3. Driver assignment uses **broadcast model**, not auto-assignment
4. Four core services: Point-to-Point, Hourly, Full Day, Outstation
5. Drivers have full control to accept/reject bookings
6. Reliability score (0-100) determines driver priority
7. Duty hours and fatigue control ensure driver safety
8. Wallet hold system manages overtime and penalties

---

**Analysis By:** Kiro AI  
**Date:** April 16, 2026  
**Version:** 1.0  
**Status:** ✅ Complete (NO CODING - Analysis Only)
