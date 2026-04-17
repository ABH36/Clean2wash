# Phase 1: Driver Operations Upgrade - Implementation Complete

## Overview
This document details the complete implementation of Phase 1 driver operations upgrade, including availability scheduling, online/offline management, reliability scoring, and utilization tracking.

---

## ✅ IMPLEMENTATION SUMMARY

### Features Implemented
1. ✅ Driver Availability Scheduling
2. ✅ Online/Offline Toggle & Tracking
3. ✅ Reliability Score Calculation
4. ✅ Driver Utilization Tracking

---

## 📊 DATABASE CHANGES

### SpareDriver Model - New Fields Added

```javascript
// Availability Scheduling
availabilitySlots: [{
    date: Date,
    timeSlots: [{
        start: String,      // "09:00"
        end: String,        // "17:00"
        isBooked: Boolean,
        bookingId: ObjectId
    }],
    isAvailable: Boolean
}]

// Reliability Score (0-100)
reliabilityScore: {
    score: Number (0-100),
    metrics: {
        totalTrips: Number,
        completedTrips: Number,
        cancelledTrips: Number,
        acceptedBookings: Number,
        rejectedBookings: Number,
        completionRate: Number,
        acceptanceRate: Number,
        avgRating: Number
    },
    lastCalculated: Date
}

// Utilization Tracking
utilization: {
    today: {
        tripsCompleted: Number,
        activeTime: Number,      // minutes
        idleTime: Number,        // minutes
        onlineTime: Number,      // minutes
        lastReset: Date
    },
    weekly: {
        tripsCompleted: Number,
        totalActiveTime: Number, // minutes
        lastReset: Date
    }
}

// Online/Offline Tracking
lastActive: Date,
onlineStatus: {
    isOnline: Boolean,
    lastOnlineAt: Date,
    lastOfflineAt: Date,
    sessionStart: Date
}
```

### New Indexes Added
```javascript
spareDriverSchema.index({ 'onlineStatus.isOnline': 1 });
spareDriverSchema.index({ 'reliabilityScore.score': -1 });
spareDriverSchema.index({ lastActive: -1 });
```

---

## 🔧 HELPER METHODS ADDED

### 1. calculateReliabilityScore()
Calculates driver reliability score based on weighted metrics:
- **Completion Rate** (40% weight)
- **Acceptance Rate** (30% weight)
- **Cancellation Penalty** (20% weight)
- **Rating Score** (10% weight)

**Formula:**
```
score = (completionRate × 0.4) + 
        (acceptanceRate × 0.3) + 
        ((100 - cancellationPenalty) × 0.2) + 
        (ratingScore × 0.1)
```

### 2. updateUtilization(type, value)
Updates driver utilization metrics:
- `tripCompleted` - Increments trip counters
- `activeTime` - Adds active minutes
- `idleTime` - Adds idle minutes
- `onlineTime` - Adds online session minutes

### 3. resetDailyUtilization()
Resets daily utilization counters (run at midnight)

### 4. resetWeeklyUtilization()
Resets weekly utilization counters (run on Monday)

### 5. isAvailableAt(date, timeSlot)
Checks if driver is available at specific date/time

---

## 🌐 API ENDPOINTS

### Enhanced Existing Endpoint

#### GET /api/v1/admin/drivers
**Enhanced with new filters:**
- `minReliability` - Filter by minimum reliability score
- `sortBy` - Sort by any field (default: createdAt)
- `sortOrder` - asc or desc (default: desc)

**Example:**
```
GET /api/v1/admin/drivers?minReliability=80&sortBy=reliabilityScore.score&sortOrder=desc
```

---

### New Endpoints

#### 1. PATCH /api/v1/admin/drivers/:id/online-status
**Purpose:** Toggle driver online/offline status

**Request Body:**
```json
{
    "isOnline": true
}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "driver": {
            "id": "...",
            "name": "Rajesh Kumar",
            "isOnline": true,
            "lastActive": "2024-04-15T10:30:00.000Z"
        }
    }
}
```

**Business Logic:**
- Updates `onlineStatus.isOnline`
- Sets `lastActive` to current time
- If going online: Sets `lastOnlineAt` and `sessionStart`
- If going offline: Sets `lastOfflineAt` and calculates session duration

---

#### 2. GET /api/v1/admin/drivers/:id/availability
**Purpose:** Get driver's availability schedule

**Response:**
```json
{
    "status": "success",
    "data": {
        "driver": {
            "id": "...",
            "name": "Rajesh Kumar",
            "driverId": "C2W-DR-...",
            "isOnline": true,
            "availabilitySlots": [
                {
                    "date": "2024-04-16",
                    "timeSlots": [
                        {
                            "start": "09:00",
                            "end": "17:00",
                            "isBooked": false,
                            "bookingId": null
                        }
                    ],
                    "isAvailable": true
                }
            ]
        }
    }
}
```

---

#### 3. PATCH /api/v1/admin/drivers/:id/availability
**Purpose:** Update driver availability slots

**Request Body:**
```json
{
    "date": "2024-04-16",
    "timeSlots": [
        {
            "start": "09:00",
            "end": "13:00",
            "isBooked": false
        },
        {
            "start": "14:00",
            "end": "18:00",
            "isBooked": false
        }
    ],
    "isAvailable": true
}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "availabilitySlots": [...]
    }
}
```

**Business Logic:**
- If slot exists for date: Updates it
- If slot doesn't exist: Creates new slot
- Allows partial updates (only date required)

---

#### 4. GET /api/v1/admin/drivers/:id/reliability
**Purpose:** Get driver's reliability score and metrics

**Response:**
```json
{
    "status": "success",
    "data": {
        "driver": {
            "id": "...",
            "name": "Rajesh Kumar",
            "driverId": "C2W-DR-...",
            "reliabilityScore": {
                "score": 87,
                "metrics": {
                    "totalTrips": 150,
                    "completedTrips": 145,
                    "cancelledTrips": 5,
                    "acceptedBookings": 160,
                    "rejectedBookings": 10,
                    "completionRate": 97,
                    "acceptanceRate": 94,
                    "avgRating": 4.7
                },
                "lastCalculated": "2024-04-15T10:00:00.000Z"
            }
        }
    }
}
```

---

#### 5. POST /api/v1/admin/drivers/:id/recalculate-reliability
**Purpose:** Recalculate reliability score from actual booking data

**Response:**
```json
{
    "status": "success",
    "data": {
        "driver": {
            "id": "...",
            "name": "Rajesh Kumar",
            "reliabilityScore": {...},
            "calculatedScore": 87
        }
    }
}
```

**Business Logic:**
1. Fetches all bookings for driver
2. Counts total, completed, cancelled trips
3. Updates metrics
4. Calculates new score using weighted formula
5. Saves to database

---

#### 6. GET /api/v1/admin/drivers/:id/utilization
**Purpose:** Get driver utilization statistics

**Response:**
```json
{
    "status": "success",
    "data": {
        "driver": {
            "id": "...",
            "name": "Rajesh Kumar",
            "driverId": "C2W-DR-...",
            "isOnline": true,
            "utilization": {
                "today": {
                    "tripsCompleted": 5,
                    "activeTime": 240,
                    "idleTime": 60,
                    "onlineTime": 300,
                    "lastReset": "2024-04-15T00:00:00.000Z"
                },
                "weekly": {
                    "tripsCompleted": 32,
                    "totalActiveTime": 1680,
                    "lastReset": "2024-04-10T00:00:00.000Z"
                }
            },
            "utilizationPercentage": 80.0
        }
    }
}
```

**Calculation:**
```
utilizationPercentage = (activeTime / (activeTime + idleTime)) × 100
```

---

#### 7. GET /api/v1/admin/drivers/available/search
**Purpose:** Find available drivers for scheduling

**Query Parameters:**
- `date` (required) - Date to check availability
- `timeSlot` (optional) - JSON string: `{"start":"09:00","end":"17:00"}`

**Example:**
```
GET /api/v1/admin/drivers/available/search?date=2024-04-16&timeSlot={"start":"09:00","end":"17:00"}
```

**Response:**
```json
{
    "status": "success",
    "results": 5,
    "data": {
        "drivers": [
            {
                "id": "...",
                "name": "Rajesh Kumar",
                "driverId": "C2W-DR-...",
                "phone": "+91 98765 43210",
                "reliabilityScore": 87,
                "isOnline": true,
                "location": {
                    "type": "Point",
                    "coordinates": [77.6212, 12.9352]
                }
            }
        ]
    }
}
```

**Business Logic:**
1. Finds drivers with ACTIVE status
2. Filters by APPROVED verification
3. Checks availability on specified date
4. If timeSlot provided: Filters by specific time
5. Sorts by reliability score (highest first)

---

## 🔄 AUTOMATED TASKS (Recommended)

### Daily Reset (Midnight)
```javascript
// Run at 00:00 every day
cron.schedule('0 0 * * *', async () => {
    const drivers = await SpareDriver.find({});
    for (const driver of drivers) {
        driver.resetDailyUtilization();
        await driver.save();
    }
});
```

### Weekly Reset (Monday Midnight)
```javascript
// Run at 00:00 every Monday
cron.schedule('0 0 * * 1', async () => {
    const drivers = await SpareDriver.find({});
    for (const driver of drivers) {
        driver.resetWeeklyUtilization();
        await driver.save();
    }
});
```

### Reliability Score Update (Daily)
```javascript
// Run at 02:00 every day
cron.schedule('0 2 * * *', async () => {
    const drivers = await SpareDriver.find({ status: 'ACTIVE' });
    for (const driver of drivers) {
        driver.calculateReliabilityScore();
        await driver.save();
    }
});
```

---

## 📱 FRONTEND INTEGRATION

### Driver List Enhancement

**Add filters:**
```javascript
// Reliability filter
<select onChange={(e) => setMinReliability(e.target.value)}>
    <option value="">All Reliability</option>
    <option value="80">80+ (Excellent)</option>
    <option value="60">60+ (Good)</option>
    <option value="40">40+ (Fair)</option>
</select>

// Online status filter
<select onChange={(e) => setIsOnline(e.target.value)}>
    <option value="">All Status</option>
    <option value="true">Online</option>
    <option value="false">Offline</option>
</select>
```

**Display reliability badge:**
```javascript
const getReliabilityColor = (score) => {
    if (score >= 80) return 'emerald';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'amber';
    return 'red';
};

<div className={`px-2 py-1 rounded bg-${getReliabilityColor(driver.reliabilityScore.score)}-500/10 text-${getReliabilityColor(driver.reliabilityScore.score)}-500`}>
    {driver.reliabilityScore.score}%
</div>
```

---

### Driver Detail Page

**Online/Offline Toggle:**
```javascript
const toggleOnlineStatus = async (driverId, isOnline) => {
    const res = await adminAPI.patch(`/drivers/${driverId}/online-status`, {
        isOnline
    });
    // Update UI
};

<button onClick={() => toggleOnlineStatus(driver._id, !driver.onlineStatus.isOnline)}>
    {driver.onlineStatus.isOnline ? 'Set Offline' : 'Set Online'}
</button>
```

**Availability Calendar:**
```javascript
<Calendar
    value={selectedDate}
    onChange={setSelectedDate}
    tileClassName={({ date }) => {
        const slot = driver.availabilitySlots.find(s => 
            isSameDay(new Date(s.date), date)
        );
        return slot?.isAvailable ? 'available' : 'unavailable';
    }}
/>
```

**Reliability Score Display:**
```javascript
<div className="reliability-card">
    <h3>Reliability Score</h3>
    <div className="score">{driver.reliabilityScore.score}/100</div>
    <div className="metrics">
        <div>Completion: {driver.reliabilityScore.metrics.completionRate}%</div>
        <div>Acceptance: {driver.reliabilityScore.metrics.acceptanceRate}%</div>
        <div>Avg Rating: {driver.reliabilityScore.metrics.avgRating}/5.0</div>
    </div>
    <button onClick={() => recalculateScore(driver._id)}>
        Recalculate
    </button>
</div>
```

**Utilization Stats:**
```javascript
<div className="utilization-stats">
    <h3>Today's Utilization</h3>
    <div className="progress-bar">
        <div style={{ width: `${driver.utilizationPercentage}%` }} />
    </div>
    <div className="stats">
        <div>Trips: {driver.utilization.today.tripsCompleted}</div>
        <div>Active: {driver.utilization.today.activeTime} min</div>
        <div>Idle: {driver.utilization.today.idleTime} min</div>
    </div>
</div>
```

---

## 🧪 TESTING

### Test Scenarios

#### 1. Online/Offline Toggle
```bash
# Set driver online
curl -X PATCH http://localhost:5000/api/v1/admin/drivers/[ID]/online-status \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"isOnline": true}'

# Set driver offline
curl -X PATCH http://localhost:5000/api/v1/admin/drivers/[ID]/online-status \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"isOnline": false}'
```

#### 2. Update Availability
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/drivers/[ID]/availability \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-04-16",
    "timeSlots": [
        {"start": "09:00", "end": "17:00", "isBooked": false}
    ],
    "isAvailable": true
}'
```

#### 3. Recalculate Reliability
```bash
curl -X POST http://localhost:5000/api/v1/admin/drivers/[ID]/recalculate-reliability \
  -H "Authorization: Bearer [TOKEN]"
```

#### 4. Search Available Drivers
```bash
curl -X GET "http://localhost:5000/api/v1/admin/drivers/available/search?date=2024-04-16&timeSlot={\"start\":\"09:00\",\"end\":\"17:00\"}" \
  -H "Authorization: Bearer [TOKEN]"
```

---

## 📊 BUSINESS LOGIC

### Reliability Score Calculation

**Example:**
```
Driver Stats:
- Total Trips: 100
- Completed: 95
- Cancelled: 5
- Accepted Bookings: 110
- Rejected Bookings: 10
- Avg Rating: 4.5

Calculation:
- Completion Rate = (95/100) × 100 = 95%
- Acceptance Rate = (110/120) × 100 = 91.67%
- Cancellation Penalty = (5/100) × 100 = 5%
- Rating Score = (4.5/5) × 100 = 90%

Weighted Score:
= (95 × 0.4) + (91.67 × 0.3) + ((100-5) × 0.2) + (90 × 0.1)
= 38 + 27.5 + 19 + 9
= 93.5 ≈ 94

Final Score: 94/100
```

---

### Utilization Percentage

**Formula:**
```
Utilization % = (Active Time / (Active Time + Idle Time)) × 100
```

**Example:**
```
Active Time: 240 minutes (4 hours)
Idle Time: 60 minutes (1 hour)

Utilization = (240 / (240 + 60)) × 100
            = (240 / 300) × 100
            = 80%
```

---

## 🔒 SECURITY CONSIDERATIONS

### Data Privacy
- Sensitive fields excluded from responses (`-password -bankDetails.accountNumber`)
- Only admin users can access these endpoints
- Authentication required for all operations

### Validation
- Boolean validation for `isOnline`
- Date validation for availability slots
- Enum validation for status fields

---

## 🚀 NEXT STEPS (Phase 2)

**Fatigue & Duty Control:**
1. Daily duty hours limit tracking
2. Automatic blocking when limit exceeded
3. Mandatory break enforcement
4. Overwork alerts

**Estimated Effort:** 1-2 days

---

## 📝 MIGRATION NOTES

### For Existing Drivers

**Run this script to initialize new fields:**
```javascript
const SpareDriver = require('./models/SpareDriver');

async function migrateDrivers() {
    const drivers = await SpareDriver.find({});
    
    for (const driver of drivers) {
        // Initialize reliability score
        if (!driver.reliabilityScore) {
            driver.reliabilityScore = {
                score: 100,
                metrics: {
                    totalTrips: 0,
                    completedTrips: 0,
                    cancelledTrips: 0,
                    acceptedBookings: 0,
                    rejectedBookings: 0,
                    completionRate: 100,
                    acceptanceRate: 100,
                    avgRating: 5.0
                },
                lastCalculated: new Date()
            };
        }
        
        // Initialize utilization
        if (!driver.utilization) {
            driver.utilization = {
                today: {
                    tripsCompleted: 0,
                    activeTime: 0,
                    idleTime: 0,
                    onlineTime: 0,
                    lastReset: new Date()
                },
                weekly: {
                    tripsCompleted: 0,
                    totalActiveTime: 0,
                    lastReset: new Date()
                }
            };
        }
        
        // Initialize online status
        if (!driver.onlineStatus) {
            driver.onlineStatus = {
                isOnline: driver.isOnline || false,
                lastOnlineAt: null,
                lastOfflineAt: null,
                sessionStart: null
            };
        }
        
        // Initialize availability slots
        if (!driver.availabilitySlots) {
            driver.availabilitySlots = [];
        }
        
        // Initialize lastActive
        if (!driver.lastActive) {
            driver.lastActive = new Date();
        }
        
        await driver.save();
    }
    
    console.log(`Migrated ${drivers.length} drivers`);
}

migrateDrivers();
```

---

## ✅ CHECKLIST

- [x] SpareDriver model updated with new fields
- [x] Indexes added for performance
- [x] Helper methods implemented
- [x] Controller endpoints created
- [x] Routes configured
- [x] Error handling implemented
- [x] Documentation complete
- [ ] Frontend components (next step)
- [ ] Cron jobs setup (optional)
- [ ] Migration script run (if existing data)

---

## 🎉 SUMMARY

Phase 1 is **COMPLETE** with:
- ✅ 4 major features implemented
- ✅ 7 new API endpoints
- ✅ 5 helper methods
- ✅ Enhanced existing endpoint
- ✅ Database schema updated
- ✅ Full documentation provided

**Ready for Phase 2: Fatigue & Duty Control**

---

## END OF DOCUMENTATION
