# Operations Module - UI Implementation Guide

## 🎯 Quick Implementation Summary

Aapke Operations Module ke liye complete UI ready hai. Yeh guide aapko step-by-step batayega ki kaise implement karein.

---

## 📁 FILE STRUCTURE

```
Frontend/src/modules/admin/pages/
├── AdminDriversOperations.jsx      ✅ (Already exists - needs enhancement)
├── AdminVehicleManagement.jsx      ✅ (Already exists - needs enhancement)
├── AdminBookingsOperations.jsx     ✅ (Already exists)
└── AdminLiveTracking.jsx           ✅ (Already exists)

Frontend/src/modules/admin/components/
├── DriverCard.jsx                  ⏳ (To be created)
├── DutyHoursWidget.jsx            ⏳ (To be created)
├── VehicleCard.jsx                ⏳ (To be created)
├── DocumentViewer.jsx             ⏳ (To be created)
└── ApprovalWorkflow.jsx           ⏳ (To be created)
```

---

## 🚀 IMPLEMENTATION STEPS

### Step 1: Enhance AdminDriversOperations.jsx

**Current Status:** Basic UI exists  
**Required:** Add Phase 1 & 2 features

**Features to Add:**
1. ✅ Duty Hours Widget
2. ✅ Overwork Alerts Panel
3. ✅ Reliability Score Display
4. ✅ Break Recording
5. ✅ Availability Schedule
6. ✅ Driver Detail Modal with Tabs

**Key Components:**
```jsx
// Duty Hours Progress Bar
<div className="space-y-2">
    <div className="flex justify-between text-xs">
        <span>Daily: {dutyHours.today}h / {dutyHours.limit}h</span>
        <span>{percentage}%</span>
    </div>
    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
            className={`h-full transition-all ${getColorClass(percentage)}`}
            style={{ width: `${percentage}%` }}
        />
    </div>
</div>

// Overwork Alert Badge
{driver.dutyHours.status.isOverworked && (
    <Badge color="red" icon={AlertTriangle} pulse>
        Overworked
    </Badge>
)}

// Break Required Badge
{driver.dutyHours.status.needsBreak && (
    <Badge color="amber" icon={Coffee}>
        Break Required
    </Badge>
)}
```

---

### Step 2: Enhance AdminVehicleManagement.jsx

**Current Status:** Basic UI exists  
**Required:** Add Phase 3 features

**Features to Add:**
1. ✅ Vehicle Grid/Table View
2. ✅ Approval Workflow
3. ✅ Document Viewer
4. ✅ Classification Editor
5. ✅ Special Instructions
6. ✅ Issue Management
7. ✅ Document Renewal Alerts

**Key Components:**
```jsx
// Vehicle Card (Grid View)
<div className="bg-surface rounded-xl border p-4">
    <img src={vehicle.photo} className="w-full h-40 object-cover rounded-lg" />
    <h3 className="font-bold mt-3">{vehicle.make} {vehicle.model}</h3>
    <p className="text-xs text-content-subtle">{vehicle.registrationNumber}</p>
    <StatusBadge status={vehicle.status} />
    <DocumentExpiryIndicators vehicle={vehicle} />
    <ActionButtons vehicle={vehicle} />
</div>

// Approval Workflow
<Modal>
    <DocumentViewer documents={vehicle.documents} />
    <ClassificationSelector 
        value={classification}
        onChange={setClassification}
    />
    <TextArea 
        label="Verification Notes"
        value={notes}
        onChange={setNotes}
    />
    <div className="flex gap-2">
        <Button variant="success" onClick={handleApprove}>
            Approve
        </Button>
        <Button variant="danger" onClick={handleReject}>
            Reject
        </Button>
    </div>
</Modal>
```

---

## 🎨 REUSABLE COMPONENTS

### 1. StatusBadge Component

```jsx
// components/StatusBadge.jsx
const StatusBadge = ({ status, type = 'default' }) => {
    const config = {
        online: { color: 'emerald', icon: Activity, pulse: true },
        offline: { color: 'slate', icon: Activity },
        active: { color: 'blue', icon: CheckCircle },
        blocked: { color: 'red', icon: Ban },
        overworked: { color: 'red', icon: AlertTriangle, pulse: true },
        breakRequired: { color: 'amber', icon: Coffee },
        approved: { color: 'green', icon: CheckCircle },
        pending: { color: 'amber', icon: Clock },
        rejected: { color: 'red', icon: XCircle }
    };
    
    const { color, icon: Icon, pulse } = config[status] || config.default;
    
    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-${color}-500/10 text-${color}-500 border border-${color}-500/20`}>
            {pulse && <div className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse`} />}
            <Icon size={12} />
            {status}
        </div>
    );
};
```

---

### 2. ProgressBar Component

```jsx
// components/ProgressBar.jsx
const ProgressBar = ({ value, max, label, showPercentage = true }) => {
    const percentage = Math.min((value / max) * 100, 100);
    
    const getColor = (pct) => {
        if (pct >= 100) return 'bg-red-500';
        if (pct >= 80) return 'bg-amber-500';
        if (pct >= 60) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };
    
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
                <span className="text-content-subtle">{label}</span>
                {showPercentage && (
                    <span className="text-content">{percentage.toFixed(0)}%</span>
                )}
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${getColor(percentage)}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-content-subtle">
                <span>{value.toFixed(1)}h</span>
                <span>{max}h</span>
            </div>
        </div>
    );
};
```

---

### 3. DutyHoursWidget Component

```jsx
// components/DutyHoursWidget.jsx
const DutyHoursWidget = ({ driver }) => {
    const { dutyHours } = driver;
    
    return (
        <div className="bg-surface rounded-xl border p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest">
                    Duty Hours
                </h3>
                <Timer size={18} className="text-brand" />
            </div>
            
            {/* Daily Progress */}
            <ProgressBar 
                value={dutyHours.today.totalMinutes / 60}
                max={dutyHours.limits.dailyMaxMinutes / 60}
                label="Today"
            />
            
            {/* Weekly Progress */}
            <ProgressBar 
                value={dutyHours.weekly.totalMinutes / 60}
                max={dutyHours.limits.weeklyMaxMinutes / 60}
                label="This Week"
            />
            
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
                {dutyHours.status.isOverworked && (
                    <StatusBadge status="overworked" />
                )}
                {dutyHours.status.needsBreak && (
                    <StatusBadge status="breakRequired" />
                )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
                <Button 
                    size="sm" 
                    variant="outline"
                    icon={Coffee}
                    onClick={() => handleRecordBreak(driver.id)}
                >
                    Record Break
                </Button>
                <Button 
                    size="sm" 
                    variant="outline"
                    icon={RefreshCw}
                    onClick={() => handleForceReset(driver.id)}
                >
                    Force Reset
                </Button>
            </div>
        </div>
    );
};
```

---

### 4. VehicleCard Component

```jsx
// components/VehicleCard.jsx
const VehicleCard = ({ vehicle, onView, onApprove, onReject }) => {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="bg-surface rounded-xl border overflow-hidden shadow-soft"
        >
            {/* Vehicle Image */}
            <div className="relative h-40 bg-slate-200 dark:bg-slate-800">
                {vehicle.documents.photos[0] ? (
                    <img 
                        src={vehicle.documents.photos[0].url}
                        className="w-full h-full object-cover"
                        alt={vehicle.fullName}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Car size={48} className="text-slate-400" />
                    </div>
                )}
                <StatusBadge 
                    status={vehicle.status.toLowerCase()}
                    className="absolute top-2 right-2"
                />
            </div>
            
            {/* Vehicle Info */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-bold text-content">
                        {vehicle.vehicleInfo.make} {vehicle.vehicleInfo.model}
                    </h3>
                    <p className="text-xs text-content-subtle font-mono">
                        {vehicle.vehicleInfo.registrationNumber}
                    </p>
                </div>
                
                {/* Owner Info */}
                <div className="flex items-center gap-2 text-xs">
                    <User size={12} className="text-content-subtle" />
                    <span className="text-content-subtle">{vehicle.userId.name}</span>
                </div>
                
                {/* Classification */}
                <div className="flex gap-2">
                    <Badge size="sm">{vehicle.classification.category}</Badge>
                    <Badge size="sm">{vehicle.classification.fuelType}</Badge>
                </div>
                
                {/* Document Expiry Indicators */}
                <DocumentExpiryIndicators vehicle={vehicle} />
                
                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button 
                        size="sm" 
                        variant="outline" 
                        icon={Eye}
                        onClick={() => onView(vehicle)}
                        className="flex-1"
                    >
                        View
                    </Button>
                    {vehicle.status === 'PENDING' && (
                        <>
                            <Button 
                                size="sm" 
                                variant="success" 
                                icon={CheckCircle}
                                onClick={() => onApprove(vehicle)}
                            >
                                Approve
                            </Button>
                            <Button 
                                size="sm" 
                                variant="danger" 
                                icon={XCircle}
                                onClick={() => onReject(vehicle)}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
```

---

### 5. DocumentExpiryIndicators Component

```jsx
// components/DocumentExpiryIndicators.jsx
const DocumentExpiryIndicators = ({ vehicle }) => {
    const checkExpiry = (expiryDate) => {
        if (!expiryDate) return null;
        
        const now = new Date();
        const expiry = new Date(expiryDate);
        const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) return { status: 'expired', color: 'red', text: 'Expired' };
        if (daysRemaining <= 30) return { status: 'expiring', color: 'amber', text: `${daysRemaining}d` };
        return { status: 'valid', color: 'green', text: 'Valid' };
    };
    
    const insurance = checkExpiry(vehicle.documents.insurance?.expiryDate);
    const pollution = checkExpiry(vehicle.documents.pollutionCertificate?.expiryDate);
    
    return (
        <div className="flex gap-2">
            {insurance && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black bg-${insurance.color}-500/10 text-${insurance.color}-500`}>
                    <Shield size={10} />
                    Insurance: {insurance.text}
                </div>
            )}
            {pollution && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black bg-${pollution.color}-500/10 text-${pollution.color}-500`}>
                    <Shield size={10} />
                    PUC: {pollution.text}
                </div>
            )}
        </div>
    );
};
```

---

## 🔌 API INTEGRATION

### Driver Operations API Calls

```jsx
// utils/driverOperationsAPI.js
export const driverOperationsAPI = {
    // Get all drivers with filters
    getDrivers: async (filters) => {
        const params = new URLSearchParams(filters);
        const res = await fetch(`/api/v1/admin/drivers?${params}`);
        return res.json();
    },
    
    // Toggle online status
    toggleOnlineStatus: async (driverId, isOnline) => {
        const res = await fetch(`/api/v1/admin/drivers/${driverId}/online-status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isOnline })
        });
        return res.json();
    },
    
    // Get duty hours
    getDutyHours: async (driverId) => {
        const res = await fetch(`/api/v1/admin/drivers/${driverId}/duty-hours`);
        return res.json();
    },
    
    // Record break
    recordBreak: async (driverId, durationMinutes) => {
        const res = await fetch(`/api/v1/admin/drivers/${driverId}/record-break`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ durationMinutes })
        });
        return res.json();
    },
    
    // Get overworked drivers
    getOverworkedDrivers: async () => {
        const res = await fetch('/api/v1/admin/drivers/overworked/list');
        return res.json();
    }
};
```

### Vehicle Management API Calls

```jsx
// utils/vehicleManagementAPI.js
export const vehicleManagementAPI = {
    // Get all vehicles with filters
    getVehicles: async (filters) => {
        const params = new URLSearchParams(filters);
        const res = await fetch(`/api/v1/admin/vehicles?${params}`);
        return res.json();
    },
    
    // Get pending vehicles
    getPendingVehicles: async () => {
        const res = await fetch('/api/v1/admin/vehicles/pending');
        return res.json();
    },
    
    // Approve vehicle
    approveVehicle: async (vehicleId, data) => {
        const res = await fetch(`/api/v1/admin/vehicles/${vehicleId}/approve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    
    // Reject vehicle
    rejectVehicle: async (vehicleId, rejectionReason) => {
        const res = await fetch(`/api/v1/admin/vehicles/${vehicleId}/reject`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rejectionReason })
        });
        return res.json();
    },
    
    // Get vehicles needing renewal
    getVehiclesNeedingRenewal: async () => {
        const res = await fetch('/api/v1/admin/vehicles/renewal-needed');
        return res.json();
    }
};
```

---

## 🎯 IMPLEMENTATION PRIORITY

### High Priority (Implement First)
1. ✅ Driver Operations Table with basic features
2. ✅ Duty Hours Widget
3. ✅ Vehicle Management Grid/Table
4. ✅ Approval Workflow

### Medium Priority
1. ✅ Overwork Alerts Panel
2. ✅ Document Renewal Alerts
3. ✅ Driver Detail Modal
4. ✅ Vehicle Detail Modal

### Low Priority (Nice to Have)
1. ⏳ Export functionality
2. ⏳ Advanced filters
3. ⏳ Statistics dashboard
4. ⏳ Bulk operations

---

## 📝 TESTING CHECKLIST

### Driver Operations
- [ ] Load drivers list
- [ ] Search drivers
- [ ] Filter by status
- [ ] Toggle online/offline
- [ ] Block/unblock driver
- [ ] View duty hours
- [ ] Record break
- [ ] View overworked drivers
- [ ] Force reset duty hours

### Vehicle Management
- [ ] Load vehicles list
- [ ] Search vehicles
- [ ] Filter by status/category
- [ ] Switch grid/table view
- [ ] View vehicle details
- [ ] Approve vehicle
- [ ] Reject vehicle
- [ ] Update classification
- [ ] View document renewal alerts
- [ ] Report issue

---

## 🚀 DEPLOYMENT STEPS

1. **Install Dependencies** (if needed)
   ```bash
   npm install framer-motion react-hot-toast
   ```

2. **Copy Components**
   - Copy all component files to respective folders
   - Update imports

3. **Test Locally**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Deploy**
   - Deploy to your hosting platform
   - Verify all features working

---

## 🎉 SUMMARY

Aapke paas ab complete UI design specification hai:

✅ **Design System** - Colors, typography, components  
✅ **Component Library** - Reusable components  
✅ **API Integration** - Ready-to-use API calls  
✅ **Implementation Guide** - Step-by-step instructions  
✅ **Testing Checklist** - Comprehensive testing guide  

**Next Steps:**
1. Review the design specification
2. Implement components one by one
3. Test each feature
4. Deploy to production

**Need Help?**
- Refer to `OPERATIONS_MODULE_UI_DESIGN.md` for detailed specs
- Check existing `AdminDashboard.jsx` for design patterns
- Use the reusable components provided

**Happy Coding!** 🚀

---

## END OF IMPLEMENTATION GUIDE
