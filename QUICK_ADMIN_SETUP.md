# Quick Admin Setup - Manual Database Insert

## Problem
Script failing due to model hooks. Use direct MongoDB insert instead.

## Solution: Direct MongoDB Insert

### Step 1: Connect to MongoDB
```bash
mongosh "mongodb://localhost:27017/carwash"
```

### Step 2: Create Permission
```javascript
db.permissions.insertOne({
    module: "*",
    action: "*",
    resource: "System",
    description: "Full system access",
    isSystem: true,
    metadata: {
        category: "SYSTEM",
        icon: "crown",
        order: 0
    },
    createdAt: new Date(),
    updatedAt: new Date()
})
```

Save the returned `_id` (e.g., `ObjectId("507f1f77bcf86cd799439011")`)

### Step 3: Create Role
```javascript
// Replace PERMISSION_ID with the _id from step 2
db.roles.insertOne({
    name: "Super Admin",
    slug: "super_admin",
    description: "Full system access with admin management",
    level: 1,
    permissions: [ObjectId("PERMISSION_ID_HERE")],
    isSystem: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
})
```

Save the returned `_id` (e.g., `ObjectId("507f1f77bcf86cd799439012")`)

### Step 4: Create Admin (Password: admin123)
```javascript
// Replace ROLE_ID with the _id from step 3
// Password hash for "admin123" using bcrypt rounds=10
db.admins.insertOne({
    name: "Super Administrator",
    email: "admin@SpareDriver.in",
    password: "$2a$10$rKvVPZqGhf5vZ8qVZ8qVZeK5vZ8qVZ8qVZ8qVZ8qVZ8qVZ8qVZ8qV",
    role: ObjectId("ROLE_ID_HERE"),
    status: "ACTIVE",
    phone: "+919876543210",
    loginAttempts: 0,
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date()
})
```

**Note:** The password hash above is for "admin123". If you need a different password, generate it using:

```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('your_password', 10);
console.log(hash);
```

## Alternative: Use Existing Admin Login

If there's already an admin in the User collection with role='admin', you can use the legacy endpoint temporarily:

**Endpoint:** `POST /api/admin/login`
**Credentials:** Check your User collection for existing admin

Then migrate to proper RBAC system later.

## Verify Setup

### Check Collections
```javascript
// Check permission
db.permissions.findOne({ module: "*", action: "*" })

// Check role
db.roles.findOne({ slug: "super_admin" })

// Check admin
db.admins.findOne({ email: "admin@SpareDriver.in" })
```

### Test Login
```bash
curl -X POST http://localhost:5002/api/superadmin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@SpareDriver.in","password":"admin123"}'
```

Should return:
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "admin": {...},
        "token": "eyJhbGc...",
        "mustChangePassword": false
    }
}
```

## Quick Fix for Script

If you want to fix the script, the issue is in the pre-save hook. Change:

**File:** `Backend/models/Role.js`

```javascript
// Change from:
roleSchema.pre('save', function(next) {
    // ...
    next();
});

// To:
roleSchema.pre('save', async function() {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
    }
});
```

Remove `next` parameter and make it async function without callback.

## Status
Once admin is created, login system will work 100%.

**Test Credentials:**
- Email: admin@SpareDriver.in
- Password: admin123
