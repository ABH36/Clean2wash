# Operations Module - Complete UI Design Specification

## Overview
Complete UI design for Operations Module covering Phase 1 (Driver Operations), Phase 2 (Fatigue & Duty Control), and Phase 3 (Vehicle Management).

---

## 🎨 DESIGN SYSTEM

### Color Palette
```javascript
const colors = {
    brand: '#FF6B00',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#8b5cf6',
    cyan: '#06b6d4'
};
```

### Typography
- **Headers:** font-black, tracking-tight
- **Body:** font-bold, text-[11px]
- **Labels:** font-black, uppercase, tracking-widest, text-[9px]
- **Mono:** font-mono for IDs and numbers

### Components Style
- **Cards:** rounded-2xl, border, shadow-soft
- **Buttons:** rounded-xl, font-black, uppercase, tracking-widest
- **Inputs:** rounded-xl, border, shadow-inner
- **Badges:** rounded-lg, font-black, uppercase

---

## 📱 UI COMPONENTS

### 1. Driver Operations Dashboard (Phase 1 & 2)

**File:** `Frontend/src/modules/admin/pages/AdminDriversOperations.jsx`

#### Features:
1. **Header Section**
   - Title with live indicator
   - Search bar
   - Refresh button
   - Filter dropdown
   - Export button

2. **Stats Cards Grid** (4 columns)
   - Total Drivers
   - Online Now (with pulse animation)
   - Active Status
   - Overworked Drivers (Phase 2)

3. **Filters Bar**
   - Status filter (All, Active, Blocked, Pending)
   - Online status filter
   - Reliability score filter (slider)
   - Duty hours filter
   - Sort options

4. **Drivers Table**
   Columns:
   - Driver Info (Avatar, Name, ID)
   - Contact (Phone, City, Location)
   - Status (Online/Offline, Active/Blocked)
   - Performance (Reliability Score, Trips, Rating)
   - Duty Hours (Today, Weekly, Status) - Phase 2
   - Actions (View, Edit, Toggle Online, Block/Unblock)

5. **Driver Detail Modal**
   Tabs:
   - Overview
   - Duty Hours (Phase 2)
   - Availability Schedule (Phase 1)
   - Reliability Metrics (Phase 1)
   - Service History
   - Documents

6. **Duty Control Panel** (Phase 2)
   - Daily duty hours progress bar
   - Weekly duty hours progress bar
   - Break status indicator
   - Overwork alerts
   - Force reset button (admin override)
   - Record break button

7. **Overworked Drivers Alert Panel** (Phase 2)
   - List of overworked drivers
   - Duty hours exceeded
   - Blocked until timestamp
   - Quick actions

---

### 2. Vehicle Management Dashboard (Phase 3)

**File:** `Frontend/src/modules/admin/pages/AdminVehicleManagement.jsx`

#### Features:
1. **Header Section**
   - Title with vehicle count
   - Search bar (registration, make, model)
   - Filter dropdown
   - Add vehicle button
   - Export button

2. **Stats Cards Grid** (5 columns)
   - Total Vehicles
   - Pending Approval
   - Active Vehicles
   - Documents Expiring Soon
   - Luxury Vehicles

3. **Filters Bar**
   - Status filter (All, Pending, Approved, Rejected, Suspended)
   - Category filter (Sedan, SUV, Hatchback, Luxury, etc.)
   - Document renewal filter
   - Owner filter

4. **Vehicles Grid/Table View Toggle**
   
   **Grid View:**
   - Vehicle card with photo
   - Make, Model, Year
   - Registration number
   - Status badge
   - Quick actions

   **Table View:**
   Columns:
   - Vehicle Info (Photo, Make, Model, Year, Registration)
   - Owner (Name, Phone)
   - Classification (Category, Size, Fuel Type)
   - Status (Approval status, Active/Inactive)
   - Documents (RC, Insurance, Pollution - with expiry)
   - Actions (View, Approve, Reject, Edit)

5. **Vehicle Detail Modal**
   Tabs:
   - Overview (Basic info, Classification)
   - Documents (RC, Insurance, Pollution, Photos)
   - Special Instructions (Parking, Access, Handling)
   - Service History
   - Issues (Reported issues with severity)
   - Admin Notes

6. **Approval Workflow Panel**
   - Document viewer
   - Classification selector
   - Verification notes textarea
   - Approve/Reject buttons
   - Bulk approve option

7. **Document Renewal Alerts Panel**
   - List of vehicles with expiring documents
   - Days remaining
   - Document type
   - Quick contact owner button

8. **Vehicle Statistics Dashboard**
   - Status breakdown (pie chart)
   - Category breakdown (bar chart)
   - Monthly registrations trend
   - Document compliance rate

---

## 🎯 DETAILED COMPONENT SPECIFICATIONS

### Driver Card Component
```jsx
<DriverCard>
  <Avatar with online indicator />
  <Name and ID />
  <Status badges (Online, Active, Overworked) />
  <Performance metrics />
  <Duty hours progress />
  <Quick actions />
</DriverCard>
```

### Duty Hours Widget
```jsx
<DutyHoursWidget>
  <Daily progress bar with percentage />
  <Weekly progress bar with percentage />
  <Break status indicator />
  <Continuous work time />
  <Alert badges />
  <Action buttons (Record break, Force reset) />
</DutyHoursWidget>
```

### Vehicle Card Component
```jsx
<VehicleCard>
  <Vehicle photo />
  <Make, Model, Year />
  <Registration number />
  <Status badge />
  <Owner info />
  <Document expiry indicators />
  <Quick actions />
</VehicleCard>
```

### Document Viewer Component
```jsx
<DocumentViewer>
  <Document image/PDF viewer />
  <Document type badge />
  <Upload date />
  <Expiry date (if applicable) />
  <Verification status />
  <Verify/Reject buttons />
</DocumentViewer>
```

---

## 🎨 UI PATTERNS

### Status Badges
```jsx
// Online Status
<Badge color="emerald" pulse>
  <Dot /> Online
</Badge>

// Offline Status
<Badge color="slate">
  <Dot /> Offline
</Badge>

// Overworked Status
<Badge color="red" icon={AlertTriangle}>
  Overworked
</Badge>

// Break Required
<Badge color="amber" icon={Coffee}>
  Break Required
</Badge>

// Approved
<Badge color="green" icon={CheckCircle}>
  Approved
</Badge>

// Pending
<Badge color="amber" icon={Clock}>
  Pending
</Badge>

// Rejected
<Badge color="red" icon={XCircle}>
  Rejected
</Badge>
```

### Progress Bars
```jsx
// Duty Hours Progress
<ProgressBar 
  value={dutyHours} 
  max={maxHours}
  color={getColorByPercentage(percentage)}
  label="Daily Duty Hours"
/>

// Color logic:
// 0-60%: green
// 60-80%: amber
// 80-100%: red
// 100%+: red with pulse
```

### Action Buttons
```jsx
// Primary Action
<Button variant="primary" icon={Eye}>
  View Details
</Button>

// Toggle Online
<Button 
  variant={isOnline ? "danger" : "success"} 
  icon={Power}
>
  {isOnline ? "Set Offline" : "Set Online"}
</Button>

// Block/Unblock
<Button 
  variant={isBlocked ? "success" : "danger"} 
  icon={Ban}
>
  {isBlocked ? "Unblock" : "Block"}
</Button>

// Approve
<Button variant="success" icon={CheckCircle}>
  Approve
</Button>

// Reject
<Button variant="danger" icon={XCircle}>
  Reject
</Button>
```

---

## 📊 DATA VISUALIZATION

### Driver Performance Chart
```jsx
<LineChart>
  <Line dataKey="reliabilityScore" stroke="#FF6B00" />
  <Line dataKey="completionRate" stroke="#10b981" />
  <Line dataKey="acceptanceRate" stroke="#3b82f6" />
</LineChart>
```

### Duty Hours Trend
```jsx
<AreaChart>
  <Area dataKey="dailyHours" fill="#8b5cf6" />
  <Area dataKey="weeklyHours" fill="#06b6d4" />
</AreaChart>
```

### Vehicle Status Distribution
```jsx
<PieChart>
  <Pie data={statusBreakdown} />
</PieChart>
```

---

## 🔔 ALERTS & NOTIFICATIONS

### Overwork Alert
```jsx
<Alert severity="critical" icon={AlertTriangle}>
  <Title>Driver Overworked</Title>
  <Message>
    {driverName} has exceeded daily duty limit (10 hours).
    Driver is automatically blocked until tomorrow.
  </Message>
  <Actions>
    <Button>View Details</Button>
    <Button>Force Reset</Button>
  </Actions>
</Alert>
```

### Break Required Alert
```jsx
<Alert severity="warning" icon={Coffee}>
  <Title>Mandatory Break Required</Title>
  <Message>
    {driverName} has worked {continuousHours} hours continuously.
    Break required before accepting new bookings.
  </Message>
  <Actions>
    <Button>Record Break</Button>
  </Actions>
</Alert>
```

### Document Expiry Alert
```jsx
<Alert severity="warning" icon={AlertCircle}>
  <Title>Document Expiring Soon</Title>
  <Message>
    {vehicleRegistration} - {documentType} expires in {daysRemaining} days.
  </Message>
  <Actions>
    <Button>Contact Owner</Button>
    <Button>View Vehicle</Button>
  </Actions>
</Alert>
```

---

## 🎭 ANIMATIONS

### Card Hover
```jsx
whileHover={{ y: -4, scale: 1.02 }}
transition={{ type: "spring", stiffness: 300 }}
```

### List Item Entrance
```jsx
initial={{ opacity: 0, x: -20 }}
animate={{ opacity: 1, x: 0 }}
transition={{ delay: index * 0.05 }}
```

### Modal Entrance
```jsx
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.95 }}
```

### Pulse Animation (Online Indicator)
```jsx
<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints
- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md, lg)
- **Desktop:** > 1024px (xl, 2xl)

### Mobile Adaptations
1. **Stats Cards:** 2 columns instead of 4/5
2. **Table:** Convert to card list view
3. **Filters:** Collapse into dropdown
4. **Actions:** Show icon-only buttons
5. **Modal:** Full-screen on mobile

---

## 🎨 DARK MODE SUPPORT

All components support dark mode with:
- `dark:` prefixes for Tailwind classes
- Proper contrast ratios
- Smooth transitions: `transition-colors duration-500`

---

## 🔍 SEARCH & FILTERS

### Search Implementation
```jsx
const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phone.includes(searchTerm) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### Filter Options

**Drivers:**
- Status: All, Active, Blocked, Pending
- Online: All, Online, Offline
- Reliability: 0-5 (slider)
- Duty Hours: 0-24 (slider)
- Sort: Name, Score, Duty Hours, Trips

**Vehicles:**
- Status: All, Pending, Approved, Rejected, Suspended
- Category: All, Sedan, SUV, Hatchback, Luxury, etc.
- Renewal: All, Expiring Soon, Expired
- Sort: Registration, Owner, Date Added

---

## 📥 EXPORT FUNCTIONALITY

### Export Options
- CSV
- Excel
- PDF

### Export Data

**Drivers Export:**
- ID, Name, Phone, City
- Status, Online Status
- Reliability Score, Trips
- Duty Hours (Today, Weekly)
- Last Active

**Vehicles Export:**
- Registration, Make, Model, Year
- Owner Name, Phone
- Status, Category
- Document Expiry Dates
- Last Service Date

---

## 🎯 KEY INTERACTIONS

### Driver Operations
1. **Toggle Online:** Click power button → Confirm → Update status
2. **Block Driver:** Click block button → Enter reason → Confirm
3. **View Details:** Click eye icon → Open modal with tabs
4. **Record Break:** Click coffee icon → Enter duration → Save
5. **Force Reset:** Click reset button → Confirm warning → Reset hours

### Vehicle Management
1. **Approve Vehicle:** Click approve → Review docs → Add notes → Confirm
2. **Reject Vehicle:** Click reject → Enter reason → Confirm
3. **View Details:** Click eye icon → Open modal with tabs
4. **Update Classification:** Edit → Select category/size/fuel → Save
5. **Report Issue:** Click report → Enter issue + severity → Save

---

## 🚀 PERFORMANCE OPTIMIZATIONS

1. **Lazy Loading:** Load images and heavy components on demand
2. **Pagination:** Show 50 items per page
3. **Virtual Scrolling:** For large lists (1000+ items)
4. **Debounced Search:** 300ms delay
5. **Memoization:** Use React.memo for expensive components
6. **Optimistic Updates:** Update UI immediately, sync with backend

---

## 🎨 SAMPLE CODE STRUCTURE

```jsx
// AdminDriversOperations.jsx
const AdminDriversOperations = () => {
    // State
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [selectedDriver, setSelectedDriver] = useState(null);
    
    // Fetch data
    useEffect(() => {
        fetchDrivers();
    }, [filters]);
    
    // Render
    return (
        <div className="space-y-6">
            <Header />
            <StatsCards />
            <FiltersBar />
            <DriversTable />
            <DriverDetailModal />
        </div>
    );
};

// AdminVehicleManagement.jsx
const AdminVehicleManagement = () => {
    // State
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    const [filters, setFilters] = useState({});
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    
    // Fetch data
    useEffect(() => {
        fetchVehicles();
    }, [filters]);
    
    // Render
    return (
        <div className="space-y-6">
            <Header />
            <StatsCards />
            <FiltersBar />
            <ViewToggle />
            {viewMode === 'grid' ? <VehiclesGrid /> : <VehiclesTable />}
            <VehicleDetailModal />
            <ApprovalModal />
        </div>
    );
};
```

---

## 📝 IMPLEMENTATION CHECKLIST

### Phase 1 & 2 (Driver Operations)
- [ ] Header with search and filters
- [ ] Stats cards (Total, Online, Active, Overworked)
- [ ] Drivers table with all columns
- [ ] Online/Offline toggle
- [ ] Block/Unblock functionality
- [ ] Driver detail modal
- [ ] Duty hours widget
- [ ] Break recording
- [ ] Overwork alerts panel
- [ ] Reliability score display
- [ ] Availability schedule view
- [ ] Export functionality

### Phase 3 (Vehicle Management)
- [ ] Header with search and filters
- [ ] Stats cards (Total, Pending, Active, Expiring, Luxury)
- [ ] Grid/Table view toggle
- [ ] Vehicles grid view
- [ ] Vehicles table view
- [ ] Vehicle detail modal
- [ ] Approval workflow
- [ ] Document viewer
- [ ] Classification editor
- [ ] Special instructions editor
- [ ] Issue reporting
- [ ] Document renewal alerts
- [ ] Statistics dashboard
- [ ] Export functionality

---

## 🎉 FINAL NOTES

This UI design provides:
- ✅ Complete coverage of all backend features
- ✅ Intuitive user experience
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Accessibility considerations
- ✅ Performance optimizations
- ✅ Consistent design system

**Ready for implementation!** 🚀

---

## END OF UI DESIGN SPECIFICATION
