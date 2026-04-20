# 🚗 Booking Model - Spare Driver Relation Analysis

## 📋 Summary

**Booking Model का Spare Driver से DIRECT और CRITICAL relation है!**

Booking model **spare driver bookings को store** करता है और **complete booking lifecycle manage** करता है।

---

## ✅ DIRECT CONNECTION - Booking Model Spare Driver Data Store Karta Hai!

### **YES! Booking Model Spare Driver Se Directly Connected Hai** ✅

---

## 🎯 Spare Driver Fields in Booking Model

### 1. **Service Type Field** ✅
```javascript
service: {
    id: String,
    name: String,
    category: 'Chauffeur',        // Spare driver category
    type: 'sparedriver',           // ✅ SPARE DRIVER TYPE
    duration: String,
    basePrice: Number,
    features: [String],
    metadata: {}
}
```

### 2. **Provider Field** ✅
```javascript
provider: {
    type: 'sparedriver',           // ✅ SPARE DRIVER TYPE
    model: 'SpareDriver',          // ✅ SPARE DRIVER MODEL
    id: ObjectId,                  // ✅ Reference to SpareDriver
    name: String,                  // Driver name
    phone: String,                 // Driver phone
    rating: Number,                // Driver rating
    photo: String                  // Driver photo
}
```

### 3. **Provider Model Mapping** ✅
```javascript
const PROVIDER_TYPE_TO_MODEL = {
    captain: 'Captain',
    vendor: 'User',
    sparedriver: 'SpareDriver'     // ✅ SPARE DRIVER MAPPING
};
```

---

## 📊 Complete Booking Structure for Spare Driver

### Spare Driver Booking Example:
```javascript
{
    _id: "booking123",
    bookingId: "CW123456",
    
    // Consumer Details
    consumer: ObjectId("user123"),  // Reference to User model
    
    // Vehicle Details
    vehicle: ObjectId("vehicle456"), // Customer's vehicle
    
    // Service Details (SPARE DRIVER)
    service: {
        id: "chauffeur-hourly-4h",
        name: "4 Hour Chauffeur Service",
        category: "Chauffeur",       // ✅ Spare driver category
        type: "sparedriver",         // ✅ Spare driver type
        duration: "4 hours",
        basePrice: 800,
        features: [
            "Professional Driver",
            "4 Hours Service",
            "Within City Limits"
        ],
        metadata: {
            hourlyRate: 200,
            maxHours: 12,
            extraHourRate: 250
        }
    },
    
    // Pricing
    pricing: {
        baseAmount: 800,
        vehicleMultiplier: 1.0,
        addonAmount: 0,
        discountAmount: 0,
        subtotal: 800,
        gstAmount: 144,
        gstPercent: 18,
        totalAmount: 944,
        platformCommission: 189,     // 20% commission
        driverEarning: 611,          // 80% to driver
        currency: "INR"
    },
    
    // Schedule
    schedule: {
        type: "scheduled",
        date: "2024-01-20T10:00:00Z",
        timeSlot: {
            start: "10:00",
            end: "14:00"
        },
        estimatedDuration: "4 hours"
    },
    
    // Location (Pickup & Drop)
    location: {
        type: "home",
        address: {
            street: "123 MG Road",
            city: "Bangalore",
            state: "Karnataka",
            pincode: "560001",
            coordinates: {
                lat: 12.9716,
                lng: 77.5946
            }
        },
        destination: {
            street: "456 Indiranagar",
            city: "Bangalore",
            state: "Karnataka",
            pincode: "560038",
            coordinates: {
                lat: 12.9784,
                lng: 77.6408
            }
        },
        landmark: "Near Metro Station",
        instructions: "Call on arrival"
    },
    
    // Status
    status: "assigned",              // Current booking status
    
    // Payment
    payment: {
        method: "online",
        status: "paid",
        transactionId: "pay_123456",
        walletReserveAmount: 944,    // Amount held in wallet
        walletReserveStatus: "held",
        paidAt: "2024-01-20T09:00:00Z"
    },
    
    // Provider (SPARE DRIVER)
    provider: {
        type: "sparedriver",         // ✅ SPARE DRIVER
        model: "SpareDriver",        // ✅ SPARE DRIVER MODEL
        id: ObjectId("driver789"),   // ✅ Reference to SpareDriver
        name: "Rajesh Kumar",
        phone: "+91-9876543210",
        rating: 4.8,
        photo: "https://..."
    },
    
    // Tracking
    tracking: {
        assignedAt: "2024-01-20T09:30:00Z",
        startedAt: null,
        arrivedAt: null,
        completedAt: null,
        currentLocation: {
            lat: 12.9716,
            lng: 77.5946,
            updatedAt: "2024-01-20T09:45:00Z"
        }
    },
    
    // Activity Log
    activityLog: [
        {
            status: "pending",
            timestamp: "2024-01-20T09:00:00Z",
            description: "Booking created",
            metadata: {}
        },
        {
            status: "assigned",
            timestamp: "2024-01-20T09:30:00Z",
            description: "Assigned to spare driver Rajesh Kumar",
            metadata: {
                driverId: "driver789",
                driverName: "Rajesh Kumar"
            }
        }
    ],
    
    // Security
    securityPin: "1234",
    
    // Timestamps
    createdAt: "2024-01-20T09:00:00Z",
    updatedAt: "2024-01-20T09:30:00Z"
}
```

---

## 🔄 Booking Lifecycle for Spare Driver

### Complete Flow:
```
1. PENDING
   ↓
   Consumer creates booking
   service.type = 'sparedriver'
   provider = null

2. ASSIGNED
   ↓
   Admin/System assigns driver
   provider.type = 'sparedriver'
   provider.id = driverId
   tracking.assignedAt = Date.now()

3. ACCEPTED
   ↓
   Driver accepts booking
   status = 'accepted'
   activityLog updated

4. EN_ROUTE
   ↓
   Driver starts journey
   status = 'en_route'
   tracking.startedAt = Date.now()
   tracking.currentLocation updated

5. ARRIVED
   ↓
   Driver reaches pickup
   status = 'arrived'
   tracking.arrivedAt = Date.now()

6. IN_PROGRESS
   ↓
   Service started
   status = 'in_progress'
   tracking.washStartedAt = Date.now()

7. COMPLETED
   ↓
   Service completed
   status = 'completed'
   tracking.completedAt = Date.now()
   payment.providerPayoutAmount calculated
   payment.platformCommissionAmount calculated
```

---

## 🎯 Spare Driver Specific Features

### 1. **Service Category: Chauffeur** ✅
```javascript
service: {
    category: 'Chauffeur',  // Only for spare driver
    type: 'sparedriver'     // Identifies spare driver booking
}
```

### 2. **Provider Type: sparedriver** ✅
```javascript
provider: {
    type: 'sparedriver',    // Identifies provider as spare driver
    model: 'SpareDriver',   // References SpareDriver model
    id: ObjectId            // Spare driver ID
}
```

### 3. **Wallet Reserve System** ✅
```javascript
payment: {
    walletReserveAmount: 944,        // Amount held
    walletReserveHours: 4,           // Hours reserved
    walletReserveHeldAmount: 944,    // Currently held
    walletReserveConsumedAmount: 0,  // Consumed so far
    walletReserveReleasedAmount: 0,  // Released amount
    walletReserveStatus: 'held',     // Status
    walletReserveHeldAt: Date,       // When held
    walletReserveReleasedAt: null    // When released
}
```

### 4. **Hourly Service Tracking** ✅
```javascript
// For hourly chauffeur services
tracking: {
    startedAt: Date,           // Service start time
    completedAt: Date,         // Service end time
    // Calculate actual hours used
    actualHours: (completedAt - startedAt) / (1000 * 60 * 60)
}
```

### 5. **Location Tracking** ✅
```javascript
location: {
    address: {
        // Pickup location
        coordinates: { lat, lng }
    },
    destination: {
        // Drop location
        coordinates: { lat, lng }
    }
},
tracking: {
    currentLocation: {
        lat: Number,
        lng: Number,
        updatedAt: Date  // Real-time updates
    }
}
```

---

## 📊 Booking Queries for Spare Driver

### 1. **Get All Spare Driver Bookings**
```javascript
const spareDriverBookings = await Booking.find({
    'service.type': 'sparedriver',
    isActive: true
});
```

### 2. **Get Active Spare Driver Bookings**
```javascript
const activeBookings = await Booking.find({
    'service.type': 'sparedriver',
    status: { $in: ['assigned', 'accepted', 'en_route', 'arrived', 'in_progress'] },
    isActive: true
}).populate('provider.id', 'name phone location');
```

### 3. **Get Driver's Bookings**
```javascript
const driverBookings = await Booking.find({
    'provider.type': 'sparedriver',
    'provider.id': driverId,
    isActive: true
}).sort({ createdAt: -1 });
```

### 4. **Get Pending Assignments**
```javascript
const pendingBookings = await Booking.find({
    'service.type': 'sparedriver',
    status: 'pending',
    'provider.id': null,
    isActive: true
});
```

### 5. **Get Completed Bookings for Payout**
```javascript
const completedBookings = await Booking.find({
    'provider.type': 'sparedriver',
    'provider.id': driverId,
    status: 'completed',
    'payment.providerPayoutAmount': { $gt: 0 },
    createdAt: { $gte: weekStart, $lte: weekEnd }
});
```

---

## 🔗 Booking Model Relations

### 1. **Consumer Relation** ✅
```javascript
consumer: {
    type: ObjectId,
    ref: 'User'  // References User model
}

// Populate
await Booking.findById(bookingId)
    .populate('consumer', 'name phone email');
```

### 2. **Vehicle Relation** ✅
```javascript
vehicle: {
    type: ObjectId,
    ref: 'Vehicle'  // References Vehicle model
}

// Populate
await Booking.findById(bookingId)
    .populate('vehicle', 'brand model type plate');
```

### 3. **Spare Driver Relation** ✅
```javascript
provider: {
    type: 'sparedriver',
    model: 'SpareDriver',
    id: ObjectId  // References SpareDriver model
}

// Populate
await Booking.findById(bookingId)
    .populate('provider.id', 'name phone location vehicle');
```

### 4. **Subscription Relation** ✅
```javascript
subscriptionId: {
    type: ObjectId,
    ref: 'Subscription'
}

// Populate
await Booking.findById(bookingId)
    .populate('subscriptionId', 'plan status');
```

---

## 🎯 Booking Model Methods

### 1. **Pre-Save Middleware** ✅
```javascript
// Generate booking ID
bookingSchema.pre('save', async function() {
    if (this.isNew || !this.bookingId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.bookingId = `CW${timestamp}${random}`;
    }
    
    // Sync geoPoint for location tracking
    if (this.location?.address?.coordinates) {
        const { lat, lng } = this.location.address.coordinates;
        this.location.address.geoPoint = {
            type: 'Point',
            coordinates: [lng, lat]
        };
    }
});
```

### 2. **Pre-Validate Middleware** ✅
```javascript
// Auto-set provider model based on type
bookingSchema.pre('validate', async function() {
    if (this.provider?.type) {
        const model = resolveProviderModel(this.provider.type);
        if (model) {
            this.provider.model = model;  // Sets 'SpareDriver' for sparedriver type
        }
    }
});
```

### 3. **Update Middleware** ✅
```javascript
// Sync provider model on updates
bookingSchema.pre('findOneAndUpdate', async function() {
    const update = this.getUpdate();
    if (update.provider?.type === 'sparedriver') {
        update.provider.model = 'SpareDriver';
    }
});
```

---

## 📊 Booking Statistics for Spare Driver

### Driver Performance Stats:
```javascript
const stats = await Booking.aggregate([
    {
        $match: {
            'provider.type': 'sparedriver',
            'provider.id': new mongoose.Types.ObjectId(driverId),
            isActive: true
        }
    },
    {
        $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalEarnings: { $sum: '$payment.providerPayoutAmount' }
        }
    }
]);

// Result:
{
    completed: { count: 120, totalEarnings: 96000 },
    cancelled: { count: 5, totalEarnings: 0 },
    in_progress: { count: 2, totalEarnings: 0 }
}
```

### Weekly Earnings:
```javascript
const weeklyEarnings = await Booking.aggregate([
    {
        $match: {
            'provider.type': 'sparedriver',
            'provider.id': new mongoose.Types.ObjectId(driverId),
            status: 'completed',
            createdAt: { $gte: weekStart, $lte: weekEnd }
        }
    },
    {
        $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalEarnings: { $sum: '$payment.providerPayoutAmount' },
            totalCommission: { $sum: '$payment.platformCommissionAmount' }
        }
    }
]);
```

---

## 🔄 Real-World Usage Examples

### Example 1: Create Spare Driver Booking
```javascript
const booking = await Booking.create({
    consumer: userId,
    vehicle: vehicleId,
    service: {
        id: 'chauffeur-hourly-4h',
        name: '4 Hour Chauffeur Service',
        category: 'Chauffeur',
        type: 'sparedriver',  // ✅ Spare driver
        duration: '4 hours',
        basePrice: 800
    },
    pricing: {
        baseAmount: 800,
        totalAmount: 944
    },
    schedule: {
        type: 'scheduled',
        date: new Date('2024-01-20T10:00:00Z'),
        timeSlot: { start: '10:00', end: '14:00' }
    },
    location: {
        address: { /* pickup */ },
        destination: { /* drop */ }
    },
    status: 'pending',
    payment: {
        method: 'online',
        status: 'paid'
    }
});

// Booking ID auto-generated: CW123456
```

### Example 2: Assign Driver to Booking
```javascript
const booking = await Booking.findById(bookingId);

booking.provider = {
    type: 'sparedriver',      // ✅ Spare driver
    model: 'SpareDriver',     // ✅ Auto-set by middleware
    id: driverId,
    name: driver.name,
    phone: driver.phone,
    rating: driver.reliabilityScore
};

booking.status = 'assigned';
booking.tracking.assignedAt = new Date();

await booking.save();
```

### Example 3: Driver Accepts Booking
```javascript
const booking = await Booking.findById(bookingId);

if (booking.provider.id.toString() !== driverId) {
    throw new Error('Not assigned to you');
}

booking.status = 'accepted';
booking.activityLog.push({
    status: 'accepted',
    timestamp: new Date(),
    description: 'Driver accepted booking',
    metadata: { driverId }
});

await booking.save();
```

### Example 4: Update Driver Location
```javascript
const booking = await Booking.findOneAndUpdate(
    {
        _id: bookingId,
        'provider.id': driverId,
        status: { $in: ['en_route', 'in_progress'] }
    },
    {
        $set: {
            'tracking.currentLocation': {
                lat: 12.9716,
                lng: 77.5946,
                updatedAt: new Date()
            }
        }
    },
    { new: true }
);
```

### Example 5: Complete Booking
```javascript
const booking = await Booking.findById(bookingId);

booking.status = 'completed';
booking.tracking.completedAt = new Date();

// Calculate earnings
const totalAmount = booking.pricing.totalAmount;
const commission = totalAmount * 0.20;  // 20% platform commission
const driverEarning = totalAmount - commission;

booking.payment.providerPayoutAmount = driverEarning;
booking.payment.platformCommissionAmount = commission;

await booking.save();

// Create payout record
await DriverPayout.create({
    driver: booking.provider.id,
    booking: booking._id,
    amount: driverEarning,
    status: 'pending'
});
```

---

## 📊 Booking Indexes for Performance

### Optimized Indexes:
```javascript
// For spare driver queries
bookingSchema.index({ 'provider.id': 1 });
bookingSchema.index({ 'provider.type': 1, status: 1 });
bookingSchema.index({ 'service.type': 1, status: 1 });

// For location-based queries
bookingSchema.index({ 'location.address.geoPoint': '2dsphere' });

// For date-based queries
bookingSchema.index({ 'schedule.date': 1, status: 1 });
bookingSchema.index({ createdAt: -1 });

// For consumer queries
bookingSchema.index({ consumer: 1, createdAt: -1 });
```

---

## ✅ Summary Table

| Feature | Booking Model | Spare Driver Relation |
|---------|--------------|----------------------|
| **Direct Data Storage** | ✅ Yes | Stores spare driver bookings |
| **Service Type** | ✅ Yes | `service.type = 'sparedriver'` |
| **Provider Type** | ✅ Yes | `provider.type = 'sparedriver'` |
| **Provider Model** | ✅ Yes | `provider.model = 'SpareDriver'` |
| **Driver Reference** | ✅ Yes | `provider.id` references SpareDriver |
| **Location Tracking** | ✅ Yes | Real-time location updates |
| **Wallet Reserve** | ✅ Yes | Holds customer payment |
| **Earnings Calculation** | ✅ Yes | Driver payout calculated |
| **Activity Logging** | ✅ Yes | Complete booking history |
| **Status Tracking** | ✅ Yes | Full lifecycle management |

---

## 🎊 Final Answer

### **Haan, Booking Model Spare Driver Se DIRECTLY Connected Hai!**

### Connection Type:
- ✅ **Direct**: Haan (Booking model spare driver data store karta hai)
- ✅ **Critical**: Haan (Bina booking ke spare driver service nahi ho sakti)
- ⭐ **Importance**: ESSENTIAL (Booking model spare driver ka core hai)

### Key Points:
1. ✅ Booking model **spare driver bookings store** karta hai
2. ✅ `service.type = 'sparedriver'` field se identify hota hai
3. ✅ `provider.type = 'sparedriver'` driver ko identify karta hai
4. ✅ `provider.id` SpareDriver model ko reference karta hai
5. ✅ Complete booking lifecycle manage karta hai
6. ✅ Location tracking, payments, earnings sab handle karta hai

### Booking Model Ke Bina:
- ❌ Spare driver booking create nahi ho sakti
- ❌ Driver assignment nahi ho sakti
- ❌ Location tracking nahi ho sakti
- ❌ Payment processing nahi ho sakti
- ❌ Earnings calculation nahi ho sakti
- ❌ Booking history nahi ho sakti

**Booking model spare driver system ka HEART hai!** 🚗✅

---

**Status**: ✅ **ANALYZED**  
**Connection**: 🔗 **DIRECT & CRITICAL**  
**Importance**: ⭐⭐⭐⭐⭐ **ESSENTIAL**

🎉 **Booking model spare driver ke liye absolutely essential hai!** 📋🚗
