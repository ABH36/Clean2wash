# SUPER ADMIN RBAC SYSTEM - INTEGRATION CHECKLIST

**Use this checklist to ensure proper integration**

---

## ✅ PRE-INTEGRATION CHECKLIST

### 1. Dependencies Installed
- [ ] `bcryptjs` installed
- [ ] `jsonwebtoken` installed
- [ ] `mongoose` installed
- [ ] `express` installed
- [ ] `dotenv` installed

**Command:**
```bash
cd Backend
npm install bcryptjs jsonwebtoken mongoose express dotenv
```

### 2. Environment Variables Set
- [ ] `MONGODB_URI` or `MONGO_URI` set
- [ ] `JWT_SECRET` set (strong secret key)
- [ ] `JWT_EXPIRES_IN` set (default: 24h)
- [ ] `SUPER_ADMIN_EMAIL` set (optional, for seeding)
- [ ] `SUPER_ADMIN_PASSWORD` set (optional, for seeding)

**File:** `Backend/.env`

### 3. Files Created
- [ ] All model files exist (4 files)
- [ ] All controller files exist (5 files including auth)
- [ ] All route files exist (6 files)
- [ ] All middleware files exist (2 files)
- [ ] All script files exist (4 files)

---

## ✅ INTEGRATION STEPS

### Step 1: Verify File Structure

```
Backend/
├── models/
│   ├── Admin.js ✓
│   ├── Role.js ✓
│   ├── Permission.js ✓
│   └── ActivityLog.js ✓
├── modules/
│   └── superadmin/
│       ├── controllers/
│       │   ├── authController.js ✓
│       │   ├── adminController.js ✓
│       │   ├── roleController.js ✓
│       │   ├── permissionController.js ✓
│       │   └── activityLogController.js ✓
│       └── routes/
│           ├── authRoutes.js ✓
│           ├── adminRoutes.js ✓
│           ├── roleRoutes.js ✓
│           ├── permissionRoutes.js ✓
│           ├── activityLogRoutes.js ✓
│           └── index.js ✓
├── middleware/
│   ├── authMiddleware.js (update required)
│   ├── rbacMiddleware.js ✓
│   └── activityLogger.js ✓
├── scripts/
│   ├── seedRBAC.js ✓
│   ├── createSuperAdmin.js ✓
│   ├── resetAdminPassword.js ✓
│   └── listAdmins.js ✓
└── utils/
    └── AppError.js (create if missing)
```

- [ ] All files exist in correct locations

### Step 2: Create Missing Utility Files

#### Create `Backend/utils/AppError.js` (if missing):

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

- [ ] `AppError.js` created

### Step 3: Update Auth Middleware

Ensure `Backend/middleware/authMiddleware.js` has the `protect` function:

```javascript
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.protect = async (req, res, next) => {
    try {
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

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id).populate({
            path: 'role',
            populate: { path: 'permissions' }
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Admin not found'
            });
        }

        if (admin.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                message: 'Your account is not active'
            });
        }

        if (admin.isLocked) {
            return res.status(403).json({
                success: false,
                message: 'Your account is locked'
            });
        }

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

- [ ] `protect` middleware exists and updated

### Step 4: Mount Routes in Main App

Add to `Backend/app.js` or `Backend/server.js`:

```javascript
// Import superadmin routes
const superadminRoutes = require('./modules/superadmin/routes');

// Mount superadmin routes
app.use('/api/superadmin', superadminRoutes);
```

- [ ] Routes mounted in main app

### Step 5: Update package.json Scripts

Ensure these scripts exist in `Backend/package.json`:

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

- [ ] Scripts added to package.json

---

## ✅ DATABASE SETUP

### Step 1: Verify MongoDB Connection

```bash
mongosh
# or
mongo
```

- [ ] MongoDB is running
- [ ] Can connect to MongoDB

### Step 2: Run Seed Script

```bash
cd Backend
npm run seed:rbac
```

**Expected Output:**
- ✓ Connected to database
- ✓ Created 45 permissions
- ✓ Created 4 roles
- ✓ Created super admin

- [ ] Seed script ran successfully
- [ ] No errors in output

### Step 3: Verify Database Collections

```bash
mongosh
use your_database_name
show collections
```

Should see:
- admins
- roles
- permissions
- activitylogs

```bash
db.admins.countDocuments()  # Should be 1
db.roles.countDocuments()   # Should be 4
db.permissions.countDocuments()  # Should be 45
```

- [ ] All collections created
- [ ] Data seeded correctly

---

## ✅ TESTING

### Step 1: Start Server

```bash
cd Backend
npm start
```

- [ ] Server starts without errors
- [ ] No MongoDB connection errors
- [ ] Routes mounted successfully

### Step 2: Test Login Endpoint

```bash
curl -X POST http://localhost:5000/api/superadmin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clean2wash.com",
    "password": "Admin@123456"
  }'
```

**Expected:** 200 OK with token

- [ ] Login successful
- [ ] Token received
- [ ] Admin data returned

### Step 3: Test Protected Endpoint

```bash
# Replace <TOKEN> with actual token
curl -X GET http://localhost:5000/api/superadmin/admins \
  -H "Authorization: Bearer <TOKEN>"
```

**Expected:** 200 OK with admin list

- [ ] Protected route accessible with token
- [ ] Returns admin data

### Step 4: Test Permission Checking

```bash
# Create admin (requires admins:create permission)
curl -X POST http://localhost:5000/api/superadmin/admins \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "test@example.com",
    "password": "Test@123456",
    "role": "<ROLE_ID>"
  }'
```

**Expected:** 201 Created

- [ ] Admin created successfully
- [ ] Permission checking works

### Step 5: Test Activity Logging

```bash
curl -X GET http://localhost:5000/api/superadmin/activity-logs \
  -H "Authorization: Bearer <TOKEN>"
```

**Expected:** 200 OK with activity logs

- [ ] Activity logs created
- [ ] Login activity logged
- [ ] Create admin activity logged

### Step 6: Test CLI Commands

```bash
# List admins
npm run list:admins
```

**Expected:** Table of admins

- [ ] CLI command works
- [ ] Shows all admins

---

## ✅ SECURITY VERIFICATION

### Password Security
- [ ] Passwords are hashed (bcrypt)
- [ ] Password length validation (min 8 chars)
- [ ] Password not returned in API responses

### Authentication
- [ ] JWT token required for protected routes
- [ ] Token expiry works (24h default)
- [ ] Invalid token returns 401

### Authorization
- [ ] Permission checking works
- [ ] Super admin has all permissions
- [ ] Lower roles have limited permissions
- [ ] 403 returned for insufficient permissions

### Account Security
- [ ] Login attempts tracked
- [ ] Account locks after 5 failed attempts
- [ ] Locked accounts cannot login
- [ ] Inactive accounts cannot login

### Activity Logging
- [ ] All actions logged
- [ ] IP address captured
- [ ] User agent captured
- [ ] Success/failure tracked

---

## ✅ FINAL VERIFICATION

### API Endpoints Working
- [ ] POST /api/superadmin/auth/login
- [ ] GET /api/superadmin/auth/me
- [ ] POST /api/superadmin/auth/change-password
- [ ] GET /api/superadmin/admins
- [ ] POST /api/superadmin/admins
- [ ] GET /api/superadmin/roles
- [ ] GET /api/superadmin/permissions
- [ ] GET /api/superadmin/activity-logs

### CLI Commands Working
- [ ] npm run seed:rbac
- [ ] npm run create:superadmin
- [ ] npm run reset:password
- [ ] npm run list:admins

### Documentation Available
- [ ] SUPER_ADMIN_RBAC_SYSTEM_ARCHITECTURE.md
- [ ] SUPER_ADMIN_IMPLEMENTATION_GUIDE.md
- [ ] SUPER_ADMIN_CONTROLLERS_COMPLETE.md
- [ ] SUPER_ADMIN_INTEGRATION_GUIDE.md
- [ ] SUPER_ADMIN_QUICK_REFERENCE.md
- [ ] SUPER_ADMIN_SETUP_COMPLETE.md

---

## ✅ POST-INTEGRATION TASKS

### Security
- [ ] Change default super admin password
- [ ] Update JWT_SECRET to strong value
- [ ] Review all admin accounts
- [ ] Test permission boundaries

### Configuration
- [ ] Set appropriate JWT expiry time
- [ ] Configure rate limiting (optional)
- [ ] Set up CORS properly
- [ ] Enable HTTPS in production

### Monitoring
- [ ] Set up error logging
- [ ] Monitor activity logs
- [ ] Set up alerts for failed logins
- [ ] Monitor database performance

### Documentation
- [ ] Document custom roles created
- [ ] Document admin credentials (securely)
- [ ] Create user guide for admins
- [ ] Document any customizations

---

## 🚨 TROUBLESHOOTING

### If seed script fails:
1. Check MongoDB connection
2. Verify .env file has MONGODB_URI
3. Check for existing data conflicts
4. Review error messages

### If login fails:
1. Verify super admin was created
2. Check email and password
3. Verify JWT_SECRET is set
4. Check server logs

### If permission checking fails:
1. Verify role has permissions
2. Check middleware is applied
3. Verify admin has role assigned
4. Check permission format (module:action)

### If activity logging fails:
1. Check ActivityLog model exists
2. Verify middleware is applied
3. Check database connection
4. Review error logs

---

## 📞 NEED HELP?

### Check Documentation:
- `SUPER_ADMIN_INTEGRATION_GUIDE.md` - Detailed integration steps
- `SUPER_ADMIN_QUICK_REFERENCE.md` - Quick commands and examples
- `SUPER_ADMIN_SETUP_COMPLETE.md` - Complete overview

### Debug Commands:
```bash
# Check database
mongosh
use your_database_name
db.admins.find().pretty()
db.roles.find().pretty()

# Check server logs
tail -f logs/error.log

# List admins
npm run list:admins

# Test login
curl -X POST http://localhost:5000/api/superadmin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clean2wash.com","password":"Admin@123456"}'
```

---

## ✅ INTEGRATION COMPLETE!

Once all items are checked, your Super Admin RBAC system is fully integrated and ready for use!

**Next Steps:**
1. Build frontend components
2. Train your team
3. Deploy to production
4. Monitor and maintain

---

**Last Updated:** April 17, 2026  
**Version:** 1.0.0  
**Status:** Production-Ready
