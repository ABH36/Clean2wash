# SUPER ADMIN RBAC SYSTEM - QUICK REFERENCE

**Quick access guide for common tasks**

---

## 🚀 QUICK START

### 1. Initial Setup (First Time Only)

```bash
cd Backend

# Install dependencies
npm install

# Seed RBAC system (creates permissions, roles, and super admin)
npm run seed:rbac

# Start server
npm start
```

**Default Super Admin Credentials:**
- Email: `admin@clean2wash.com`
- Password: `Admin@123456`

---

## 📝 COMMON TASKS

### Create New Admin

```bash
# Method 1: Via API
POST /api/superadmin/admins
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password@123",
  "role": "<role_id>",
  "phone": "9876543210"
}

# Method 2: Via CLI
npm run create:superadmin
```

### Reset Admin Password

```bash
# Via CLI (Interactive)
npm run reset:password

# Via API
POST /api/superadmin/admins/:id/reset-password
Authorization: Bearer <token>
```

### List All Admins

```bash
# Via CLI
npm run list:admins

# Via API
GET /api/superadmin/admins
Authorization: Bearer <token>
```

### Change Admin Status

```bash
PATCH /api/superadmin/admins/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "ACTIVE" | "INACTIVE" | "SUSPENDED"
}
```

---

## 🔐 AUTHENTICATION

### Login

```bash
POST /api/superadmin/auth/login
Content-Type: application/json

{
  "email": "admin@clean2wash.com",
  "password": "Admin@123456"
}

# Response:
{
  "success": true,
  "data": {
    "admin": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "mustChangePassword": false
  }
}
```

### Get Current Admin

```bash
GET /api/superadmin/auth/me
Authorization: Bearer <token>
```

### Change Password

```bash
POST /api/superadmin/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123"
}
```

### Logout

```bash
POST /api/superadmin/auth/logout
Authorization: Bearer <token>
```

---

## 👥 ROLE MANAGEMENT

### List All Roles

```bash
GET /api/superadmin/roles
Authorization: Bearer <token>
```

### Create Role

```bash
POST /api/superadmin/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Customer Support",
  "description": "Handle customer queries",
  "permissions": ["<permission_id_1>", "<permission_id_2>"],
  "level": 5
}
```

### Update Role Permissions

```bash
PATCH /api/superadmin/roles/:id/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissions": ["<permission_id_1>", "<permission_id_2>"]
}
```

### Duplicate Role

```bash
POST /api/superadmin/roles/:id/duplicate
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Role Name"
}
```

---

## 🔑 PERMISSION MANAGEMENT

### List All Permissions

```bash
GET /api/superadmin/permissions
Authorization: Bearer <token>
```

### Get Grouped Permissions (by module)

```bash
GET /api/superadmin/permissions/grouped
Authorization: Bearer <token>

# Response:
{
  "drivers": [
    { "module": "drivers", "action": "view", ... },
    { "module": "drivers", "action": "create", ... }
  ],
  "bookings": [ ... ]
}
```

### Get Permissions by Category

```bash
GET /api/superadmin/permissions/category/operations
Authorization: Bearer <token>

# Categories: operations, finance, configuration, analytics, system
```

### Search Permissions

```bash
GET /api/superadmin/permissions/search?q=driver
Authorization: Bearer <token>
```

---

## 📊 ACTIVITY LOGS

### List Activity Logs

```bash
GET /api/superadmin/activity-logs
Authorization: Bearer <token>

# With filters:
GET /api/superadmin/activity-logs?action=CREATE_ADMIN&status=SUCCESS&startDate=2026-04-01&endDate=2026-04-17
```

### Get Admin's Activity

```bash
GET /api/superadmin/activity-logs/admin/:adminId
Authorization: Bearer <token>
```

### Get Recent Activities

```bash
GET /api/superadmin/activity-logs/recent?limit=10
Authorization: Bearer <token>
```

### Get Failed Activities

```bash
GET /api/superadmin/activity-logs/failed
Authorization: Bearer <token>
```

### Export Logs

```bash
# Export as JSON
GET /api/superadmin/activity-logs/export?format=json
Authorization: Bearer <token>

# Export as CSV
GET /api/superadmin/activity-logs/export?format=csv
Authorization: Bearer <token>
```

### Get Activity Statistics

```bash
GET /api/superadmin/activity-logs/stats
Authorization: Bearer <token>

# Response includes:
# - Total activities
# - Success/Failed counts
# - Activities by action
# - Activities by resource
# - Most active admins
# - Timeline data
```

---

## 🛡️ PERMISSION CHECKING

### In Routes (Middleware)

```javascript
const { requirePermission, requireAnyPermission, requireSuperAdmin } = require('../middleware/rbacMiddleware');

// Single permission
router.post('/drivers', requirePermission('drivers', 'create'), createDriver);

// Any permission
router.patch('/drivers/:id', requireAnyPermission(['drivers:update', 'drivers:*']), updateDriver);

// Super admin only
router.delete('/admins/:id', requireSuperAdmin(), deleteAdmin);
```

### In Controllers (Manual Check)

```javascript
const Role = require('../models/Role');

// Check if admin has permission
const role = await Role.findById(req.admin.role).populate('permissions');
const hasPermission = role.permissions.some(p => 
  p.module === 'drivers' && (p.action === 'create' || p.action === '*')
);

if (!hasPermission) {
  return res.status(403).json({ message: 'Access denied' });
}
```

---

## 📈 STATISTICS

### Admin Statistics

```bash
GET /api/superadmin/admins/stats
Authorization: Bearer <token>

# Response:
{
  "total": 10,
  "active": 8,
  "inactive": 1,
  "suspended": 1,
  "byRole": {
    "Super Admin": 1,
    "Admin": 5,
    "Sub-Admin": 3,
    "Manager": 1
  }
}
```

### Role Statistics

```bash
GET /api/superadmin/roles/stats
Authorization: Bearer <token>

# Response:
{
  "total": 4,
  "active": 4,
  "inactive": 0,
  "system": 4,
  "custom": 0,
  "adminCounts": {
    "Super Admin": 1,
    "Admin": 5,
    "Sub-Admin": 3,
    "Manager": 1
  }
}
```

### Permission Statistics

```bash
GET /api/superadmin/permissions/stats
Authorization: Bearer <token>

# Response:
{
  "total": 45,
  "byModule": {
    "drivers": 8,
    "bookings": 7,
    "services": 6,
    ...
  },
  "byCategory": {
    "operations": 20,
    "finance": 10,
    "configuration": 8,
    ...
  }
}
```

---

## 🔧 CLI COMMANDS

```bash
# Seed RBAC system
npm run seed:rbac

# Create super admin (interactive)
npm run create:superadmin

# Reset admin password (interactive)
npm run reset:password

# List all admins
npm run list:admins

# Start server
npm start

# Start in development mode
npm run dev
```

---

## 🎯 DEFAULT ROLES & PERMISSIONS

### Super Admin (Level 1)
- **Permissions:** All (`*:*`)
- **Access:** Full system access including admin management

### Admin (Level 2)
- **Permissions:** All except admin management
- **Modules:** drivers, bookings, services, payouts, analytics
- **Actions:** All actions in allowed modules

### Sub-Admin (Level 3)
- **Permissions:** Limited operational access
- **Modules:** drivers, bookings, services, analytics
- **Actions:** view, update, verify, assign, view_dashboard, view_reports

### Manager (Level 4)
- **Permissions:** Read-only access
- **Modules:** drivers, bookings, services, analytics
- **Actions:** view, view_dashboard

---

## 🚨 COMMON ERRORS

### 401 Unauthorized
- **Cause:** Missing or invalid token
- **Solution:** Login again to get a new token

### 403 Forbidden
- **Cause:** Insufficient permissions
- **Solution:** Check admin's role and permissions

### 404 Not Found
- **Cause:** Resource doesn't exist
- **Solution:** Verify the ID is correct

### 409 Conflict
- **Cause:** Duplicate email or name
- **Solution:** Use a different email/name

### 500 Internal Server Error
- **Cause:** Server error
- **Solution:** Check server logs and database connection

---

## 📞 SUPPORT

### Check Logs
```bash
# Activity logs
GET /api/superadmin/activity-logs/failed

# Server logs
tail -f logs/error.log
```

### Database Check
```bash
mongosh
use your_database_name
db.admins.find()
db.roles.find()
db.permissions.find()
```

### Reset Everything
```bash
# Re-run seed script (safe, idempotent)
npm run seed:rbac
```

---

**Last Updated:** April 17, 2026  
**Version:** 1.0.0  
**Status:** Production-Ready
