# SUPER ADMIN RBAC SYSTEM - INTEGRATION GUIDE

**Date:** April 17, 2026  
**Status:** Production-Ready  
**Estimated Integration Time:** 2-3 hours

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Integration](#backend-integration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 PREREQUISITES

### Required Software:
- ✅ Node.js (v14 or higher)
- ✅ MongoDB (v4.4 or higher)
- ✅ npm or yarn

### Required Packages:
```json
{
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0",
  "mongoose": "^7.0.0",
  "express": "^4.18.0",
  "dotenv": "^16.0.0"
}
```

### Install Dependencies:
```bash
cd Backend
npm install bcryptjs jsonwebtoken mongoose express dotenv
```

---

## 🌍 ENVIRONMENT SETUP

### Step 1: Update `.env` File

Add the following variables to `Backend/.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/your_database_name
# or
MONGO_URI=mongodb://localhost:27017/your_database_name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Super Admin Credentials (for seeding)
SUPER_ADMIN_NAME=Super Administrator
SUPER_ADMIN_EMAIL=admin@clean2wash.com
SUPER_ADMIN_PASSWORD=Admin@123456
SUPER_ADMIN_PHONE=9876543210

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Step 2: Update `package.json`

Add the following scripts to `Backend/package.json`:

```json
{
  "scripts": {
    "seed:rbac": "node scripts/seedRBAC.js",
    "create:superadmin": "node scripts/createSuperAdmin.js",
    "reset:password": "node scripts/resetAdminPassword.js",
    "list:admins": "node scripts/listAdmins.js"
  }
}
```

---

## 💾 DATABASE SETUP

### Step 1: Run RBAC Seeding

This will create all permissions, roles, and the first super admin:

```bash
cd Backend
npm run seed:rbac
```

**Expected Output:**
```
🚀 STARTING RBAC SEEDING

ℹ Connecting to database...
✓ Connected to database

📋 SEEDING PERMISSIONS

✓ Created: drivers:view
✓ Created: drivers:create
✓ Created: drivers:update
...
✓ Permissions Summary:
  Created: 45
  Total: 45

👥 SEEDING ROLES

✓ Created: Super Admin role
✓ Created: Admin role
✓ Created: Sub-Admin role
✓ Created: Manager role

✓ Roles Summary:
  Super Admin: 1 permissions
  Admin: 35 permissions
  Sub-Admin: 15 permissions
  Manager: 8 permissions

👤 CREATING SUPER ADMIN

✓ Super Admin created successfully!
  Name: Super Administrator
  Email: admin@clean2wash.com
  Password: Admin@123456

⚠️  IMPORTANT: Please change the password after first login!

✅ SEEDING COMPLETED SUCCESSFULLY
```

### Step 2: Verify Database

Check MongoDB to ensure collections are created:

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use your_database_name

# Check collections
show collections

# Should see:
# - admins
# - roles
# - permissions
# - activitylogs

# Verify data
db.admins.countDocuments()  # Should be 1
db.roles.countDocuments()   # Should be 4
db.permissions.countDocuments()  # Should be 45
```

---

## 🔌 BACKEND INTEGRATION

### Step 1: Update Main App File

Add to `Backend/app.js` or `Backend/server.js`:

```javascript
const express = require('express');
const app = express();

// ... existing middleware ...

// Import superadmin routes
const superadminRoutes = require('./modules/superadmin/routes');

// Mount superadmin routes
app.use('/api/superadmin', superadminRoutes);

// ... rest of your app ...

module.exports = app;
```

### Step 2: Update Auth Middleware

Ensure `Backend/middleware/authMiddleware.js` has the `protect` function:

```javascript
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.protect = async (req, res, next) => {
    try {
        // Get token from header
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Please log in to access this resource'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get admin with role and permissions
        const admin = await Admin.findById(decoded.id)
            .populate({
                path: 'role',
                populate: {
                    path: 'permissions'
                }
            });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Check if admin is active
        if (admin.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                message: 'Your account is not active'
            });
        }

        // Check if account is locked
        if (admin.isLocked) {
            return res.status(403).json({
                success: false,
                message: 'Your account is locked. Please try again later.'
            });
        }

        // Attach admin to request
        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};
```

### Step 3: Create Admin Auth Controller

Create `Backend/modules/superadmin/controllers/authController.js`:

```javascript
const jwt = require('jsonwebtoken');
const Admin = require('../../../models/Admin');
const ActivityLog = require('../../../models/ActivityLog');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

/**
 * Admin login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find admin with password
        const admin = await Admin.findOne({ email: email.toLowerCase() })
            .select('+password')
            .populate({
                path: 'role',
                populate: {
                    path: 'permissions'
                }
            });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is locked
        if (admin.isLocked) {
            return res.status(403).json({
                success: false,
                message: 'Account is locked. Please try again later.'
            });
        }

        // Check if account is active
        if (admin.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                message: 'Your account is not active'
            });
        }

        // Check password
        const isPasswordCorrect = await admin.correctPassword(password, admin.password);

        if (!isPasswordCorrect) {
            // Increment login attempts
            await admin.incLoginAttempts();

            // Log failed login
            await ActivityLog.create({
                admin: admin._id,
                action: 'LOGIN_FAILED',
                resource: 'Auth',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                status: 'FAILED',
                errorMessage: 'Invalid password'
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Reset login attempts
        await admin.resetLoginAttempts();

        // Log successful login
        await ActivityLog.create({
            admin: admin._id,
            action: 'LOGIN_SUCCESS',
            resource: 'Auth',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: 'SUCCESS'
        });

        // Generate token
        const token = generateToken(admin._id);

        // Remove password from output
        admin.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                admin,
                token,
                mustChangePassword: admin.mustChangePassword
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

/**
 * Get current admin
 */
exports.getMe = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id)
            .populate({
                path: 'role',
                populate: {
                    path: 'permissions'
                }
            });

        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get admin details',
            error: error.message
        });
    }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        // Get admin with password
        const admin = await Admin.findById(req.admin._id).select('+password');

        // Check current password
        const isPasswordCorrect = await admin.correctPassword(currentPassword, admin.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        admin.password = newPassword;
        admin.mustChangePassword = false;
        await admin.save();

        // Log activity
        await ActivityLog.create({
            admin: admin._id,
            action: 'PASSWORD_CHANGED',
            resource: 'Auth',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: 'SUCCESS'
        });

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};

/**
 * Logout
 */
exports.logout = async (req, res) => {
    try {
        // Log activity
        await ActivityLog.create({
            admin: req.admin._id,
            action: 'LOGOUT',
            resource: 'Auth',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: 'SUCCESS'
        });

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};
```

### Step 4: Create Auth Routes

Create `Backend/modules/superadmin/routes/authRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../../../middleware/authMiddleware');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.use(protect);
router.get('/me', authController.getMe);
router.post('/change-password', authController.changePassword);
router.post('/logout', authController.logout);

module.exports = router;
```

### Step 5: Update Main Router

Update `Backend/modules/superadmin/routes/index.js`:

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../../../middleware/authMiddleware');

// Import route modules
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const roleRoutes = require('./roleRoutes');
const permissionRoutes = require('./permissionRoutes');
const activityLogRoutes = require('./activityLogRoutes');

// Public routes
router.use('/auth', authRoutes);

// Protected routes (require authentication)
router.use(protect);
router.use('/admins', adminRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/activity-logs', activityLogRoutes);

module.exports = router;
```

---

## 🧪 TESTING

### Step 1: Start the Server

```bash
cd Backend
npm start
# or
npm run dev
```

### Step 2: Test Login

```bash
curl -X POST http://localhost:5000/api/superadmin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clean2wash.com",
    "password": "Admin@123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "_id": "...",
      "name": "Super Administrator",
      "email": "admin@clean2wash.com",
      "role": {
        "_id": "...",
        "name": "Super Admin",
        "permissions": [...]
      },
      "status": "ACTIVE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "mustChangePassword": false
  }
}
```

### Step 3: Test Protected Route

```bash
# Replace <TOKEN> with the token from login response
curl -X GET http://localhost:5000/api/superadmin/admins \
  -H "Authorization: Bearer <TOKEN>"
```

### Step 4: Test Permission Checking

```bash
# Create a new admin (requires admins:create permission)
curl -X POST http://localhost:5000/api/superadmin/admins \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password@123",
    "role": "<ROLE_ID>"
  }'
```

### Step 5: Test Activity Logging

```bash
# Get activity logs
curl -X GET http://localhost:5000/api/superadmin/activity-logs \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🔍 TROUBLESHOOTING

### Issue 1: "Cannot find module 'AppError'"

**Solution:** Create `Backend/utils/AppError.js`:

```javascript
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
```

### Issue 2: "JWT_SECRET is not defined"

**Solution:** Ensure `.env` file has `JWT_SECRET` variable:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Issue 3: "Cannot connect to MongoDB"

**Solution:** Check MongoDB connection:

```bash
# Check if MongoDB is running
mongosh

# If not running, start MongoDB
# On Linux/Mac:
sudo systemctl start mongod

# On Windows:
net start MongoDB
```

### Issue 4: "Super Admin role not found"

**Solution:** Run the seed script:

```bash
npm run seed:rbac
```

### Issue 5: "Permission denied" errors

**Solution:** Check if:
1. Admin has the correct role assigned
2. Role has the required permissions
3. Middleware is properly configured

```bash
# List all admins and their roles
npm run list:admins
```

---

## 📚 USEFUL COMMANDS

```bash
# Seed RBAC system
npm run seed:rbac

# Create super admin interactively
npm run create:superadmin

# Reset admin password
npm run reset:password

# List all admins
npm run list:admins

# Start server
npm start

# Start server in development mode
npm run dev
```

---

## 🎉 INTEGRATION COMPLETE!

Your Super Admin RBAC system is now fully integrated and ready to use.

### Next Steps:
1. ✅ Change default super admin password
2. ✅ Create additional admin users
3. ✅ Test all API endpoints
4. ✅ Integrate with frontend
5. ✅ Deploy to production

---

**Need Help?**
- Check the API documentation
- Review the controller files
- Check activity logs for errors
- Contact the development team

**Prepared By:** Kiro AI  
**Date:** April 17, 2026  
**Status:** Production-Ready
