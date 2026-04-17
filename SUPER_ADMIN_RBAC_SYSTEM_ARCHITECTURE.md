# SUPER ADMIN RBAC SYSTEM - COMPLETE ARCHITECTURE

**Date:** April 17, 2026  
**System:** Role-Based Access Control for Admin Panel  
**Status:** Production-Ready Architecture

---

## 🎯 SYSTEM OVERVIEW

A complete Super Admin Control System with granular Role-Based Access Control (RBAC) for managing multiple admin users with different permission levels.

### Key Features:
- ✅ Multi-level admin hierarchy (Super Admin → Admin → Sub-Admin → Manager)
- ✅ Granular permission system (module + action level)
- ✅ Dynamic role creation and management
- ✅ Activity logging and audit trail
- ✅ JWT-based authentication with role validation
- ✅ Frontend permission-based UI rendering
- ✅ Scalable and maintainable architecture

---

## 📊 DATABASE SCHEMA

### 1. Admin Model
```javascript
{
    name: String,
    email: String (unique),
    password: String (hashed),
    role: ObjectId (ref: Role),
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    phone: String,
    avatar: String,
    lastLogin: Date,
    loginAttempts: Number,
    lockUntil: Date,
    createdBy: ObjectId (ref: Admin),
    updatedBy: ObjectId (ref: Admin),
    metadata: {
        department: String,
        employeeId: String,
        notes: String
    },
    timestamps: true
}
```

### 2. Role Model
```javascript
{
    name: String (unique),
    slug: String (unique),
    description: String,
    permissions: [ObjectId] (ref: Permission),
    level: Number (1=SuperAdmin, 2=Admin, 3=SubAdmin, 4=Manager),
    isSystem: Boolean (prevent deletion of system roles),
    isActive: Boolean,
    createdBy: ObjectId (ref: Admin),
    timestamps: true
}
```

### 3. Permission Model
```javascript
{
    module: String (e.g., 'drivers', 'bookings', 'services'),
    action: String (e.g., 'view', 'create', 'update', 'delete'),
    resource: String (e.g., 'driver_management', 'booking_management'),
    description: String,
    isSystem: Boolean,
    metadata: {
        category: String,
        icon: String,
        order: Number
    }
}
```

### 4. ActivityLog Model
```javascript
{
    admin: ObjectId (ref: Admin),
    action: String,
    resource: String,
    resourceId: ObjectId,
    changes: {
        before: Object,
        after: Object
    },
    ipAddress: String,
    userAgent: String,
    status: 'SUCCESS' | 'FAILED',
    errorMessage: String,
    timestamp: Date
}
```

---

## 🏗️ BACKEND ARCHITECTURE

### Folder Structure
```
Backend/
├── models/
│   ├── Admin.js
│   ├── Role.js
│   ├── Permission.js
│   └── ActivityLog.js
├── modules/
│   └── superadmin/
│       ├── controllers/
│       │   ├── adminController.js
│       │   ├── roleController.js
│       │   ├── permissionController.js
│       │   └── activityLogController.js
│       ├── routes/
│       │   ├── adminRoutes.js
│       │   ├── roleRoutes.js
│       │   ├── permissionRoutes.js
│       │   └── activityLogRoutes.js
│       ├── services/
│       │   ├── adminService.js
│       │   ├── roleService.js
│       │   └── permissionService.js
│       └── validators/
│           ├── adminValidator.js
│           └── roleValidator.js
├── middleware/
│   ├── authMiddleware.js (existing)
│   ├── rbacMiddleware.js (NEW)
│   ├── activityLogger.js (NEW)
│   └── superAdminGuard.js (NEW)
└── utils/
    ├── permissionHelper.js (NEW)
    └── roleHelper.js (NEW)
```

---

## 🔐 PERMISSION STRUCTURE

### Permission Categories

#### 1. Driver Management
```javascript
{
    module: 'drivers',
    permissions: [
        { action: 'view', description: 'View driver list and details' },
        { action: 'create', description: 'Add new drivers' },
        { action: 'update', description: 'Edit driver information' },
        { action: 'delete', description: 'Remove drivers' },
        { action: 'verify', description: 'Verify driver documents' },
        { action: 'approve', description: 'Approve/reject drivers' },
        { action: 'suspend', description: 'Suspend/activate drivers' }
    ]
}
```

#### 2. Booking Management
```javascript
{
    module: 'bookings',
    permissions: [
        { action: 'view', description: 'View all bookings' },
        { action: 'create', description: 'Create bookings' },
        { action: 'update', description: 'Update booking details' },
        { action: 'cancel', description: 'Cancel bookings' },
        { action: 'assign', description: 'Assign drivers to bookings' },
        { action: 'refund', description: 'Process refunds' }
    ]
}
```

#### 3. Service Management
```javascript
{
    module: 'services',
    permissions: [
        { action: 'view', description: 'View services' },
        { action: 'create', description: 'Create new services' },
        { action: 'update', description: 'Update service pricing' },
        { action: 'delete', description: 'Remove services' },
        { action: 'toggle', description: 'Enable/disable services' }
    ]
}
```

#### 4. Payout Management
```javascript
{
    module: 'payouts',
    permissions: [
        { action: 'view', description: 'View payout requests' },
        { action: 'approve', description: 'Approve payouts' },
        { action: 'reject', description: 'Reject payouts' },
        { action: 'process', description: 'Process payments' },
        { action: 'export', description: 'Export payout reports' }
    ]
}
```

#### 5. Analytics Access
```javascript
{
    module: 'analytics',
    permissions: [
        { action: 'view_dashboard', description: 'View main dashboard' },
        { action: 'view_reports', description: 'View detailed reports' },
        { action: 'export_data', description: 'Export analytics data' },
        { action: 'view_revenue', description: 'View revenue analytics' }
    ]
}
```

#### 6. Admin Management (Super Admin Only)
```javascript
{
    module: 'admins',
    permissions: [
        { action: 'view', description: 'View admin list' },
        { action: 'create', description: 'Create new admins' },
        { action: 'update', description: 'Update admin details' },
        { action: 'delete', description: 'Remove admins' },
        { action: 'manage_roles', description: 'Assign roles to admins' },
        { action: 'view_activity', description: 'View activity logs' }
    ]
}
```

---

## 🔑 DEFAULT ROLES

### 1. Super Admin
```javascript
{
    name: 'Super Admin',
    slug: 'super_admin',
    level: 1,
    permissions: ['*'], // All permissions
    description: 'Full system access with admin management'
}
```

### 2. Admin
```javascript
{
    name: 'Admin',
    slug: 'admin',
    level: 2,
    permissions: [
        'drivers:*',
        'bookings:*',
        'services:view,update',
        'payouts:view,approve',
        'analytics:view_dashboard,view_reports'
    ],
    description: 'Full operational access except admin management'
}
```

### 3. Sub-Admin
```javascript
{
    name: 'Sub-Admin',
    slug: 'sub_admin',
    level: 3,
    permissions: [
        'drivers:view,update,verify',
        'bookings:view,update,assign',
        'services:view',
        'payouts:view',
        'analytics:view_dashboard'
    ],
    description: 'Limited operational access'
}
```

### 4. Manager
```javascript
{
    name: 'Manager',
    slug: 'manager',
    level: 4,
    permissions: [
        'drivers:view',
        'bookings:view',
        'analytics:view_dashboard'
    ],
    description: 'Read-only access for monitoring'
}
```

---

## 🛡️ MIDDLEWARE ARCHITECTURE

### 1. RBAC Middleware
```javascript
// Check if admin has specific permission
requirePermission('drivers', 'create')

// Check if admin has any of the permissions
requireAnyPermission(['drivers:create', 'drivers:update'])

// Check if admin has all permissions
requireAllPermissions(['drivers:view', 'drivers:update'])

// Check role level
requireRoleLevel(2) // Admin level or higher
```

### 2. Activity Logger Middleware
```javascript
// Automatically logs all admin actions
logActivity({
    action: 'CREATE_DRIVER',
    resource: 'Driver',
    resourceId: driverId,
    changes: { before: null, after: driverData }
})
```

### 3. Super Admin Guard
```javascript
// Protect super admin only routes
requireSuperAdmin()
```

---

## 📡 API ENDPOINTS

### Admin Management
```
POST   /api/superadmin/admins              - Create admin
GET    /api/superadmin/admins              - List all admins
GET    /api/superadmin/admins/:id          - Get admin details
PATCH  /api/superadmin/admins/:id          - Update admin
DELETE /api/superadmin/admins/:id          - Delete admin
PATCH  /api/superadmin/admins/:id/status   - Toggle admin status
PATCH  /api/superadmin/admins/:id/role     - Assign role
POST   /api/superadmin/admins/:id/reset-password - Reset password
```

### Role Management
```
POST   /api/superadmin/roles               - Create role
GET    /api/superadmin/roles               - List all roles
GET    /api/superadmin/roles/:id           - Get role details
PATCH  /api/superadmin/roles/:id           - Update role
DELETE /api/superadmin/roles/:id           - Delete role
PATCH  /api/superadmin/roles/:id/permissions - Update permissions
```

### Permission Management
```
GET    /api/superadmin/permissions         - List all permissions
GET    /api/superadmin/permissions/grouped - Get permissions by module
POST   /api/superadmin/permissions         - Create permission (system only)
```

### Activity Logs
```
GET    /api/superadmin/activity-logs       - List activity logs
GET    /api/superadmin/activity-logs/:adminId - Get admin's activity
GET    /api/superadmin/activity-logs/export - Export logs
```

### Auth
```
POST   /api/superadmin/auth/login          - Admin login
POST   /api/superadmin/auth/logout         - Admin logout
GET    /api/superadmin/auth/me             - Get current admin
PATCH  /api/superadmin/auth/change-password - Change password
```

---

## 🎨 FRONTEND ARCHITECTURE

### Folder Structure
```
Frontend/src/modules/superadmin/
├── pages/
│   ├── AdminList.jsx
│   ├── AdminForm.jsx
│   ├── RoleList.jsx
│   ├── RoleForm.jsx
│   ├── PermissionMatrix.jsx
│   └── ActivityLogs.jsx
├── components/
│   ├── PermissionCheckbox.jsx
│   ├── RoleSelector.jsx
│   ├── AdminStatusBadge.jsx
│   └── ActivityLogItem.jsx
├── hooks/
│   ├── usePermissions.js
│   ├── useRoles.js
│   └── useActivityLogs.js
├── context/
│   └── PermissionContext.jsx
└── utils/
    ├── permissionChecker.js
    └── roleHelper.js
```

### Permission Context
```javascript
// Provides permission checking throughout the app
<PermissionProvider>
    <App />
</PermissionProvider>

// Usage in components
const { hasPermission, hasAnyPermission } = usePermissions();

if (hasPermission('drivers', 'create')) {
    // Show create button
}
```

### Protected Components
```javascript
// Conditional rendering based on permissions
<ProtectedComponent permission="drivers:create">
    <CreateDriverButton />
</ProtectedComponent>

// Protected routes
<ProtectedRoute 
    path="/admin/drivers/create" 
    permission="drivers:create"
    component={CreateDriver}
/>
```

---

## 🔒 SECURITY FEATURES

### 1. Password Security
- ✅ Bcrypt hashing (10 rounds)
- ✅ Password strength validation
- ✅ Password history (prevent reuse)
- ✅ Forced password change on first login

### 2. Account Security
- ✅ Login attempt limiting (5 attempts)
- ✅ Account lockout (30 minutes)
- ✅ Session timeout (24 hours)
- ✅ IP-based access control (optional)

### 3. Token Security
- ✅ JWT with short expiry (24h)
- ✅ Refresh token rotation
- ✅ Token blacklisting on logout
- ✅ Role and permissions embedded in token

### 4. Audit Trail
- ✅ All admin actions logged
- ✅ IP address tracking
- ✅ User agent logging
- ✅ Change history (before/after)

---

## 📈 SCALABILITY FEATURES

### 1. Dynamic Permissions
- Add new modules without code changes
- Permission inheritance
- Custom permission creation

### 2. Role Hierarchy
- Parent-child role relationships
- Permission inheritance from parent roles
- Role templates for quick setup

### 3. Multi-Tenancy Ready
- Workspace/organization support
- Isolated admin spaces
- Cross-workspace permissions

### 4. Performance Optimization
- Permission caching (Redis)
- Lazy loading of permissions
- Indexed database queries

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Core Setup (Day 1-2)
- ✅ Database models
- ✅ Authentication system
- ✅ Basic RBAC middleware
- ✅ Admin CRUD APIs

### Phase 2: Permission System (Day 3-4)
- ✅ Permission model and seeding
- ✅ Role management APIs
- ✅ Permission checking middleware
- ✅ Activity logging

### Phase 3: Frontend (Day 5-7)
- ✅ Admin list and forms
- ✅ Role management UI
- ✅ Permission matrix
- ✅ Activity logs viewer

### Phase 4: Integration (Day 8-9)
- ✅ Integrate with existing admin routes
- ✅ Add permission checks to all APIs
- ✅ Update frontend with permission-based rendering
- ✅ Testing and bug fixes

### Phase 5: Production (Day 10)
- ✅ Security audit
- ✅ Performance testing
- ✅ Documentation
- ✅ Deployment

---

## 📋 NEXT STEPS

1. Review architecture
2. Approve database schema
3. Begin Phase 1 implementation
4. Set up development environment
5. Create initial seed data

---

**Prepared By:** Kiro AI  
**Date:** April 17, 2026  
**Status:** Ready for Implementation
