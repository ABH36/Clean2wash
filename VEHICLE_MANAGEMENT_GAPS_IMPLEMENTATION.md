# 🔧 VEHICLE MANAGEMENT - MISSING FEATURES IMPLEMENTATION GUIDE

**Priority Implementation Guide for 15% Missing Features**

---

## 📋 IMPLEMENTATION PRIORITY

### Phase 1: CRITICAL (Must Have for Production)
1. ✅ Real VAHAN Integration (5-7 days) - **HIGH PRIORITY**
2. ✅ Document Upload System (3-4 days) - **HIGH PRIORITY**
3. ✅ Vehicle Verification (2-3 days) - **MEDIUM PRIORITY**

### Phase 2: ENHANCEMENTS (Nice to Have)
4. ⚠️ User Photo Upload (2-3 days)
5. ⚠️ Service History (3-4 days)
6. ⚠️ Expiry Notifications (2-3 days)

**Total Effort:** 15-22 days for complete implementation

---

## 1. REAL VAHAN INTEGRATION ✅

### Current Status: Mock Implementation
```javascript
// Backend/modules/consumer/controllers/vehicleController.js
exports.fetchFromVAHAN = catchAsync(async (req, res, next) => {
    // Mock data - NOT REAL
    const mockVAHANData = { ... };
    await new Promise(resolve => setTimeout(resolve, 1500));
    res.status(200).json({ ... });
});
```

### Implementation Steps:

#### Step 1: Get VAHAN API Access
```bash
# Register at VAHAN portal
1. Visit: https://vahan.parivahan.gov.in/
2. Register for API access
3. Get API credentials
4. Add to .env file
```

#### Step 2: Install Dependencies
```bash
npm install axios
```

#### Step 3: Create VAHAN Service
**File:** `Backend/services/vahanService.js` (NEW)
```javascript
const axios = require('axios');
const AppError = require('../utils/AppError');

const VAHAN_API_URL = process.env.VAHAN_API_URL || 'https://vahan-api.gov.in/v1';
const VAHAN_API_KEY = process.env.VAHAN_API_KEY;

/**
 * Fetch vehicle details from VAHAN API
 * @param {String} registrationNumber - Vehicle registration number
 * @returns {Object} Vehicle details
 */
const fetchVehicleDetails = async (registrationNumber) => {
    try {
        const response = await axios.post(`${VAHAN_API_URL}/vehicle-details`, {
            registrationNumber: registrationNumber.toUpperCase().replace(/\s/g, ''),
            apiKey: VAHAN_API_KEY
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VAHAN_API_KEY}`
            },
            timeout: 10000 // 10 second timeout
        });

        if (response.data.status === 'success') {
            return {
                success: true,
                data: {
                    plate: response.data.registrationNumber,
                    brand: response.data.maker,
                    model: response.data.model,
                    type: mapVehicleClass(response.data.vehicleClass),
                    fuelType: response.data.fuelType,
                    transmission: response.data.transmission || 'Manual',
                    year: response.data.registrationYear,
                    color: response.data.color,
                    insuranceExpiry: response.data.insuranceUpto,
                    pucExpiry: response.data.pucUpto,
                    registrationDate: response.data.registrationDate,
                    ownerName: response.data.ownerName,
                    chassisNumber: response.data.chassisNumber,
                    engineNumber: response.data.engineNumber
                }
            };
        } else {
            return {
                success: false,
                error: 'Vehicle not found in VAHAN database'
            };
        }
    } catch (error) {
        console.error('VAHAN API Error:', error.message);
        
        if (error.code === 'ECONNABORTED') {
            return {
                success: false,
                error: 'VAHAN API timeout. Please try again.'
            };
        }
        
        if (error.response?.status === 404) {
            return {
                success: false,
                error: 'Vehicle not found. Please enter details manually.'
            };
        }
        
        return {
            success: false,
            error: 'Unable to fetch vehicle details. Please enter manually.'
        };
    }
};

/**
 * Map VAHAN vehicle class to our vehicle types
 */
const mapVehicleClass = (vehicleClass) => {
    const mapping = {
        'MOTOR CAR': 'Sedan',
        'MOTOR CYCLE': 'Bike',
        'SCOOTER': 'Scooter',
        'JEEP': 'SUV',
        'STATION WAGON': 'SUV',
        'OMNI BUS': 'Bus',
        'TRACTOR': 'Tractor',
        'LIGHT MOTOR VEHICLE': 'Hatchback',
        'MEDIUM GOODS VEHICLE': 'Truck',
        'HEAVY GOODS VEHICLE': 'Truck'
    };
    
    return mapping[vehicleClass?.toUpperCase()] || 'Sedan';
};

module.exports = { fetchVehicleDetails };
```

#### Step 4: Update Controller
**File:** `Backend/modules/consumer/controllers/vehicleController.js`
```javascript
const { fetchVehicleDetails } = require('../../services/vahanService');

exports.fetchFromVAHAN = catchAsync(async (req, res, next) => {
    const { plate } = req.body;

    if (!plate) {
        return next(new AppError('Vehicle plate number is required', 400));
    }

    // Fetch from real VAHAN API
    const result = await fetchVehicleDetails(plate);

    if (!result.success) {
        return next(new AppError(result.error, 400));
    }

    res.status(200).json({
        status: 'success',
        message: 'Vehicle details fetched from VAHAN',
        data: {
            vehicle: result.data
        }
    });
});
```

#### Step 5: Environment Variables
**File:** `Backend/.env`
```bash
VAHAN_API_URL=https://vahan-api.gov.in/v1
VAHAN_API_KEY=your_vahan_api_key_here
```

---

## 2. DOCUMENT UPLOAD SYSTEM ✅

### Implementation Steps:

#### Step 1: Install Dependencies
```bash
npm install multer cloudinary multer-storage-cloudinary
```

#### Step 2: Configure Cloudinary
**File:** `Backend/config/cloudinary.js` (NEW)
```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'vehicle-documents',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDF files are allowed'), false);
        }
    }
});

module.exports = { upload, cloudinary };
```

#### Step 3: Update Vehicle Model
**File:** `Backend/models/Vehicle.js`
```javascript
// Add to vehicle schema:
documents: {
    rc: {
        url: String,
        publicId: String,
        uploadedAt: Date,
        verified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date
    },
    insurance: {
        url: String,
        publicId: String,
        uploadedAt: Date,
        expiryDate: Date,
        verified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date
    },
    puc: {
        url: String,
        publicId: String,
        uploadedAt: Date,
        expiryDate: Date,
        verified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date
    }
},
photos: [{
    url: String,
    publicId: String,
    isPrimary: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now }
}]
```

#### Step 4: Create Upload Controller
**File:** `Backend/modules/consumer/controllers/vehicleController.js`
```javascript
const { upload, cloudinary } = require('../../../config/cloudinary');

/**
 * Upload vehicle document (RC/Insurance/PUC)
 */
exports.uploadDocument = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { documentType } = req.body; // 'rc', 'insurance', 'puc'

    const vehicle = await Vehicle.findOne({
        _id: id,
        owner: req.user.id,
        isActive: true
    });

    if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
    }

    if (!req.file) {
        return next(new AppError('Please upload a document', 400));
    }

    // Delete old document if exists
    if (vehicle.documents[documentType]?.publicId) {
        await cloudinary.uploader.destroy(vehicle.documents[documentType].publicId);
    }

    // Update vehicle with new document
    vehicle.documents[documentType] = {
        url: req.file.path,
        publicId: req.file.filename,
        uploadedAt: new Date(),
        verified: false
    };

    await vehicle.save();

    res.status(200).json({
        status: 'success',
        message: `${documentType.toUpperCase()} document uploaded successfully`,
        data: {
            document: vehicle.documents[documentType]
        }
    });
});

/**
 * Upload vehicle photo
 */
exports.uploadPhoto = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const vehicle = await Vehicle.findOne({
        _id: id,
        owner: req.user.id,
        isActive: true
    });

    if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
    }

    if (!req.file) {
        return next(new AppError('Please upload a photo', 400));
    }

    // Add photo to vehicle
    vehicle.photos.push({
        url: req.file.path,
        publicId: req.file.filename,
        isPrimary: vehicle.photos.length === 0 // First photo is primary
    });

    // Update vehicle image if first photo
    if (vehicle.photos.length === 1) {
        vehicle.image = req.file.path;
    }

    await vehicle.save();

    res.status(200).json({
        status: 'success',
        message: 'Photo uploaded successfully',
        data: {
            photo: vehicle.photos[vehicle.photos.length - 1]
        }
    });
});

/**
 * Delete vehicle photo
 */
exports.deletePhoto = catchAsync(async (req, res, next) => {
    const { id, photoId } = req.params;

    const vehicle = await Vehicle.findOne({
        _id: id,
        owner: req.user.id,
        isActive: true
    });

    if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
    }

    const photo = vehicle.photos.id(photoId);
    if (!photo) {
        return next(new AppError('Photo not found', 404));
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(photo.publicId);

    // Remove from vehicle
    vehicle.photos.pull(photoId);

    // If deleted photo was primary, set first photo as primary
    if (photo.isPrimary && vehicle.photos.length > 0) {
        vehicle.photos[0].isPrimary = true;
        vehicle.image = vehicle.photos[0].url;
    }

    await vehicle.save();

    res.status(200).json({
        status: 'success',
        message: 'Photo deleted successfully'
    });
});
```

#### Step 5: Add Routes
**File:** `Backend/modules/consumer/routes/consumerRoutes.js`
```javascript
const { upload } = require('../../../config/cloudinary');

// Document upload routes
router.post('/vehicles/:id/upload-document', 
    upload.single('document'), 
    vehicleController.uploadDocument
);

router.post('/vehicles/:id/upload-photo', 
    upload.single('photo'), 
    vehicleController.uploadPhoto
);

router.delete('/vehicles/:id/photos/:photoId', 
    vehicleController.deletePhoto
);
```

#### Step 6: Environment Variables
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 3. VEHICLE VERIFICATION SYSTEM ✅

### Implementation Steps:

#### Step 1: Update Vehicle Model
**File:** `Backend/models/Vehicle.js`
```javascript
// Add to vehicle schema:
verification: {
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date,
    rejectionReason: String,
    adminNotes: String
}
```

#### Step 2: Create Admin Controller
**File:** `Backend/modules/admin/controllers/adminVehicleManagementController.js`
```javascript
/**
 * Verify vehicle
 */
exports.verifyVehicle = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { notes } = req.body;

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
    }

    vehicle.verification.status = 'verified';
    vehicle.verification.verifiedBy = req.user.id;
    vehicle.verification.verifiedAt = new Date();
    vehicle.verification.adminNotes = notes;

    await vehicle.save();

    // Send notification to user
    // TODO: Implement notification

    res.status(200).json({
        status: 'success',
        message: 'Vehicle verified successfully',
        data: { vehicle }
    });
});

/**
 * Reject vehicle
 */
exports.rejectVehicle = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { reason, notes } = req.body;

    if (!reason) {
        return next(new AppError('Rejection reason is required', 400));
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
    }

    vehicle.verification.status = 'rejected';
    vehicle.verification.verifiedBy = req.user.id;
    vehicle.verification.verifiedAt = new Date();
    vehicle.verification.rejectionReason = reason;
    vehicle.verification.adminNotes = notes;

    await vehicle.save();

    // Send notification to user
    // TODO: Implement notification

    res.status(200).json({
        status: 'success',
        message: 'Vehicle rejected',
        data: { vehicle }
    });
});
```

---

## 📊 IMPLEMENTATION TIMELINE

### Week 1: VAHAN Integration
- Day 1-2: Get API access, setup
- Day 3-4: Implement service
- Day 5: Testing & error handling
- Day 6-7: Frontend integration

### Week 2: Document Upload
- Day 1-2: Cloudinary setup
- Day 3: Backend implementation
- Day 4: Frontend UI
- Day 5: Testing

### Week 3: Verification System
- Day 1-2: Backend implementation
- Day 3: Admin panel UI
- Day 4: Testing
- Day 5: Notifications

---

## 🎯 FINAL CHECKLIST

### Phase 1 (Critical)
- [ ] VAHAN API access obtained
- [ ] VAHAN service implemented
- [ ] Error handling added
- [ ] Frontend updated
- [ ] Cloudinary account created
- [ ] Document upload implemented
- [ ] Photo upload implemented
- [ ] Verification system implemented
- [ ] Admin panel updated
- [ ] Notifications added

### Phase 2 (Enhancements)
- [ ] Service history implemented
- [ ] Expiry notifications added
- [ ] Push notifications setup
- [ ] Email reminders configured

---

**Implementation Guide Created By:** Kiro AI  
**Date:** April 19, 2026  
**Estimated Total Time:** 15-22 days
