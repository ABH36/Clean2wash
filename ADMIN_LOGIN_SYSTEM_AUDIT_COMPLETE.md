# Admin Login System - Complete Audit & Fix 🔐

## Current Status: ⚠️ DUAL LOGIN SYSTEMS FOUND

### Problem Discovered
There are **TWO separate admin login systems** in the codebase:

1. **Legacy System** (INCORRECT) ❌
   - Endpoint: `/api/admin/login`
   - Controller: `Backend/modules/admin/controllers/adminAuthController.js`
   - Uses: **User model** with `role: 'admin'`
   - Token: `{ id, role: 'admin' }`
   - Status: **WRONG MODEL - Should not be used**

2. **New RBAC System** (CORRECT) ✅
   - Endpoint: `/api/superadmin/auth/login`
   - Controller: `Backend/modules/superadmin/controllers/authController.js`
   - Uses: **Admin model** with Role-based permissions
   - Token: `{ id, role: 'admin' }`
   - Status: **CORRECT - Should be used**

## Detailed Analysis

### 1. Legacy Admin Login (WRONG) ❌

**File:** `Backend/modules/admin/controllers/adminAuthController.js`

```javascript
// ❌ PROBLEM: Uses User model instead of Admin model
const admin = await User.findOne({ email, role: 'admin' }).select('+password');
```

**Issues:**
- Uses User model (consumer model)
- No role-based permissions
- No account status check (ACTIVE/INACTIVE/SUSPENDED)
- No account locking mechanism
- No activity logging
- No password change enforcement
- Simple role check (`role: 'admin'`)

**Endpoint:** `POST /api/admin/login`
**Route:** `Backend/modules/admin/routes/adminRoutes.js`

### 2. New RBAC Admin Login (CORRECT) ✅

**File:** `Backend/modules/superadmin/controllers/authController.js`

```javascript
// ✅ CORRECT: Uses Admin model with full RBAC
const admin = await Admin.findOne({ email: email.toLowerCase() })
    .select('+password')
    .populate({
        path: 'role',
        populate: {
            path: 'permissions'
        }
    });
```

**Features:**
- Uses Admin model (dedicated admin model)
- Role-based access control (RBAC)
- Account status validation (ACTIVE/INACTIVE/SUSPENDED)
- Account locking after 5 failed attempts
- Activity logging for all actions
- Password change enforcement
- Permission-based access
- Proper role hierarchy (Super Admin, Admin, Sub-Admin)

**Endpoint:** `POST /api/superadmin/auth/login`
**Route:** `Backend/modules/superadmin/routes/authRoutes.js`

## Frontend Integration

### Current Frontend Setup

**Login Page:** `Frontend/src/modules/admin/pages/AdminLogin.jsx`
```javascript
const { adminLogin } = useAuth();
const result = await adminLogin(email, password);
```

**Auth Context:** `Frontend/src/context/AuthContext.jsx`
```javascript
const adminLogin = useCallback(async (email, password) => {
    const response = await adminAPI.login(email, password);
    // ...
}, []);
```

**API Client:** `Frontend/src/utils/adminApi.js`
```javascript
async login(email, password) {
    return this.request('/login', {  // ❌ Calls /api/admin/login
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}
```

**Problem:** Frontend is calling `/api/admin/login` (legacy/wrong endpoint)

## Solution: Fix Frontend to Use Correct Endpoint

### Option 1: Update adminApi.js (RECOMMENDED) ✅

Change the login endpoint to use the correct RBAC system:

```javascript
async login(email, password) {
    // Use superadmin auth endpoint
    return fetch('/api/superadmin/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    }).then(res => res.json());
}
```

### Option 2: Fix Backend adminAuthController (NOT RECOMMENDED)

Update the legacy controller to use Admin model instead of User model. This is not recommended because:
- Duplicate code
- Maintenance overhead
- Confusion between two systems

## Recommended Action Plan

### Step 1: Update Frontend API Client ✅

**File:** `Frontend/src/utils/adminApi.js`

Change:
```javascript
async login(email, password) {
    return this.request('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}
```

To:
```javascript
async login(email, password) {
    // Use RBAC admin login endpoint
    const response = await fetch('/api/superadmin/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
    }
    
    return response.json();
}
```

### Step 2: Update Auth Context (if needed)

**File:** `Frontend/src/context/AuthContext.jsx`

The current implementation should work, but verify response structure:

```javascript
const adminLogin = useCallback(async (email, password) => {
    try {
        const response = await adminAPI.login(email, password);
        
        // Response structure from /api/superadmin/auth/login:
        // {
        //     success: true,
        //     message: 'Login successful',
        //     data: {
        //         admin: { ...adminData },
        //         token: "...",
        //         mustChangePassword: false
        //     }
        // }
        
        const token = response.data?.token;
        const adminData = response.data?.admin;

        if (token) {
            adminAPI.setToken(token);
        }

        const userSession = {
            id: adminData._id,
            name: adminData.name,
            email: adminData.email,
            role: 'admin',
            roleDetails: adminData.role, // Include role with permissions
            token,
            mustChangePassword: response.data?.mustChangePassword,
            ...adminData
        };

        login('admin', userSession);
        return { success: true, data: userSession };
    } catch (error) {
        console.error('Admin Login error:', error);
        return { success: false, error: error.message };
    }
}, []);
```

### Step 3: Deprecate Legacy Login (Optional)

**File:** `Backend/modules/admin/routes/adminRoutes.js`

Comment out or remove the legacy login route:

```javascript
// DEPRECATED: Use /api/superadmin/auth/login instead
// router.post('/login', adminAuthController.login);
```

Or add a redirect:

```javascript
router.post('/login', (req, res) => {
    res.status(410).json({
        status: 'error',
        message: 'This endpoint is deprecated. Please use /api/superadmin/auth/login',
        newEndpoint: '/api/superadmin/auth/login'
    });
});
```

## Testing Checklist

### Backend Tests

#### Test Legacy Endpoint (Should Fail or Redirect)
```bash
POST http://localhost:5002/api/admin/login
{
    "email": "admin@example.com",
    "password": "password123"
}

Expected: 410 Gone or redirect message
```

#### Test RBAC Endpoint (Should Work)
```bash
POST http://localhost:5002/api/superadmin/auth/login
{
    "email": "admin@example.com",
    "password": "password123"
}

Expected: 200 OK with token and admin data
Response:
{
    "success": true,
    "message": "Login successful",
    "data": {
        "admin": {
            "_id": "...",
            "name": "Admin Name",
            "email": "admin@example.com",
            "role": {
                "_id": "...",
                "name": "Super Admin",
                "level": 1,
                "permissions": [...]
            },
            "status": "ACTIVE"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "mustChangePassword": false
    }
}
```

### Frontend Tests

1. **Login Flow**
   - Navigate to `/admin/login`
   - Enter credentials
   - Click "Verify & Unlock"
   - Should redirect to `/admin` dashboard
   - Token should be stored in localStorage

2. **Token Validation**
   - Check localStorage for `auth_admin_token`
   - Token should be JWT with `role: 'admin'`
   - Decode token to verify structure

3. **Protected Routes**
   - Try accessing `/admin/users` without login
   - Should redirect to `/admin/login`
   - After login, should access successfully

4. **Logout**
   - Click logout button
   - Should clear token from localStorage
   - Should redirect to `/admin/login`

## Database Setup

### Create Initial Super Admin

You need at least one admin in the database to login. Run this script:

```javascript
// scripts/createSuperAdmin.js
const mongoose = require('mongoose');
const Admin = require('./Backend/models/Admin');
const Role = require('./Backend/models/Role');
const Permission = require('./Backend/models/Permission');

async function createSuperAdmin() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Create Super Admin role
    const superAdminRole = await Role.create({
        name: 'Super Admin',
        slug: 'super_admin',
        description: 'Full system access',
        level: 1,
        permissions: [], // Will add * permission
        isSystem: true,
        isActive: true
    });
    
    // Create Super Admin user
    const superAdmin = await Admin.create({
        name: 'Super Administrator',
        email: 'admin@SpareDriver.in',
        password: 'admin123', // Will be hashed automatically
        role: superAdminRole._id,
        status: 'ACTIVE',
        mustChangePassword: false
    });
    
    console.log('Super Admin created:', superAdmin.email);
    process.exit(0);
}

createSuperAdmin();
```

Run:
```bash
node scripts/createSuperAdmin.js
```

## Comparison Table

| Feature | Legacy System (/api/admin/login) | RBAC System (/api/superadmin/auth/login) |
|---------|----------------------------------|------------------------------------------|
| Model | User (Consumer model) ❌ | Admin (Dedicated model) ✅ |
| Permissions | Simple role check | Full RBAC with permissions ✅ |
| Account Status | No validation ❌ | ACTIVE/INACTIVE/SUSPENDED ✅ |
| Account Locking | No ❌ | After 5 failed attempts ✅ |
| Activity Logging | No ❌ | All actions logged ✅ |
| Password Change | No enforcement ❌ | Enforced on first login ✅ |
| Role Hierarchy | No ❌ | Super Admin > Admin > Sub-Admin ✅ |
| Token Structure | `{ id, role }` | `{ id, role }` ✅ |
| Response Format | `{ status, token, data }` | `{ success, message, data }` |

## Security Implications

### Using Legacy System (WRONG)
- ❌ No proper admin separation from consumers
- ❌ No permission-based access control
- ❌ No account locking (brute force vulnerable)
- ❌ No activity audit trail
- ❌ No role hierarchy enforcement

### Using RBAC System (CORRECT)
- ✅ Dedicated Admin model with proper separation
- ✅ Permission-based access control
- ✅ Account locking after failed attempts
- ✅ Complete activity audit trail
- ✅ Role hierarchy with level-based access
- ✅ Password change enforcement
- ✅ Account status management

## Final Recommendation

**MUST DO:**
1. ✅ Update `Frontend/src/utils/adminApi.js` to use `/api/superadmin/auth/login`
2. ✅ Test login flow end-to-end
3. ✅ Create initial Super Admin in database
4. ✅ Deprecate legacy `/api/admin/login` endpoint

**OPTIONAL:**
- Remove legacy adminAuthController.js
- Clean up User model admin role references
- Update documentation

## Status After Fix

Once frontend is updated to use `/api/superadmin/auth/login`:

✅ Admin login will use proper RBAC system
✅ All security features will be active
✅ Permission-based access control will work
✅ Activity logging will track all actions
✅ Account locking will prevent brute force
✅ Role hierarchy will be enforced

---

**Date:** April 20, 2026
**System:** Spare Driver/Chauffeur Service App
**Module:** Admin Login System
**Status:** ⚠️ Needs Frontend Update to Use Correct Endpoint
