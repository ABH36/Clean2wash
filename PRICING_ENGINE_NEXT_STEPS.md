# 🚀 PRICING ENGINE - NEXT STEPS

## ✅ COMPLETED

### Backend (100% Complete)
1. ✅ Models created (ServiceConfig, PricingConfig, Penalty, DriverPayout)
2. ✅ Pricing Engine service created
3. ✅ Controllers created (Service, Pricing, Payout)
4. ✅ Routes created and registered
5. ✅ Backend errors fixed (require statements moved to top)

### Backend is READY TO USE!

**API Endpoints Available:**
- `/api/admin/spare-driver/services` - Service management
- `/api/admin/spare-driver/pricing` - Pricing configuration
- `/api/admin/spare-driver/payouts` - Payout management

---

## 🔄 NEXT: FRONTEND IMPLEMENTATION

### Step 1: Add API Methods to adminApi.js

Add these methods to `Frontend/src/utils/adminApi.js`:

```javascript
// Spare Driver Services
getSpareDriverServices: () => apiClient.request('/spare-driver/services'),
getSpareDriverService: (type) => apiClient.request(`/spare-driver/services/${type}`),
updateSpareDriverService: (type, data) => apiClient.request(`/spare-driver/services/${type}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
}),
toggleSpareDriverService: (type) => apiClient.request(`/spare-driver/services/${type}/toggle`, {
    method: 'PATCH'
}),
initializeSpareDriverServices: () => apiClient.request('/spare-driver/services/initialize', {
    method: 'POST'
}),

// Spare Driver Pricing
getPricingConfig: () => apiClient.request('/spare-driver/pricing/config'),
updatePricingConfig: (data) => apiClient.request('/spare-driver/pricing/config', {
    method: 'PATCH',
    body: JSON.stringify(data)
}),
calculatePrice: (data) => apiClient.request('/spare-driver/pricing/calculate', {
    method: 'POST',
    body: JSON.stringify(data)
}),
getPricingSummary: () => apiClient.request('/spare-driver/pricing/summary'),
toggleSurge: () => apiClient.request('/spare-driver/pricing/surge/toggle', {
    method: 'PATCH'
}),
toggleNightCharges: () => apiClient.request('/spare-driver/pricing/night/toggle', {
    method: 'PATCH'
}),

// Spare Driver Payouts
getPayouts: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.request(`/spare-driver/payouts${query ? `?${query}` : ''}`);
},
getPayout: (id) => apiClient.request(`/spare-driver/payouts/${id}`),
generatePayout: (data) => apiClient.request('/spare-driver/payouts/generate', {
    method: 'POST',
    body: JSON.stringify(data)
}),
generateAllPayouts: (data) => apiClient.request('/spare-driver/payouts/generate-all', {
    method: 'POST',
    body: JSON.stringify(data)
}),
addPayoutAdjustment: (id, data) => apiClient.request(`/spare-driver/payouts/${id}/adjustment`, {
    method: 'POST',
    body: JSON.stringify(data)
}),
processPayout: (id, transactionId) => apiClient.request(`/spare-driver/payouts/${id}/process`, {
    method: 'POST',
    body: JSON.stringify({ transactionId })
}),
getPayoutStats: () => apiClient.request('/spare-driver/payouts/stats'),
```

### Step 2: Create Frontend Pages

Create these 3 pages in `Frontend/src/modules/admin/pages/finance/`:

1. **AdminSpareDriverServices.jsx**
   - Service cards (Point, Hourly, Full Day, Outstation)
   - Edit base price, hourly rate, overtime rate
   - Toggle active/inactive
   - Vehicle multipliers configuration
   - Initialize services button

2. **AdminPricingEngine.jsx**
   - GST configuration (percent, toggle)
   - Platform commission (percent)
   - Surge pricing (toggle, multiplier, peak hours)
   - Night charges (toggle, amount, hours)
   - Scheduled premium (toggle, amount)
   - Outstation allowance
   - Cancellation charges (customer/driver)
   - Wallet hold amount
   - **Pricing Preview Calculator** (embedded)

3. **AdminPayouts.jsx**
   - Payout list with filters (status, driver, date range)
   - Payout details modal
   - Generate payout button (single/all)
   - Process payout workflow
   - Add adjustment (bonus/deduction)
   - Payout statistics cards

### Step 3: Add Routes to AdminRoutesConfig.jsx

Add these routes:

```javascript
{
    path: 'spare-driver-services',
    element: <AdminSpareDriverServices />,
    title: 'Spare Driver Services'
},
{
    path: 'pricing-engine',
    element: <AdminPricingEngine />,
    title: 'Pricing Engine'
},
{
    path: 'driver-payouts',
    element: <AdminPayouts />,
    title: 'Driver Payouts'
}
```

### Step 4: Add Navigation Links

Add to Admin sidebar/navigation:

```javascript
{
    label: 'Spare Driver',
    icon: <Car />,
    children: [
        { label: 'Services', path: '/admin/spare-driver-services' },
        { label: 'Pricing Engine', path: '/admin/pricing-engine' },
        { label: 'Driver Payouts', path: '/admin/driver-payouts' }
    ]
}
```

---

## 📋 FRONTEND COMPONENT STRUCTURE

### AdminSpareDriverServices.jsx
```
- Header with "Initialize Services" button
- Stats cards (Total Services, Active, Inactive)
- Service cards grid (4 cards)
  - Each card:
    - Service icon & name
    - Base price input
    - Hourly rate input (if applicable)
    - Subscriber rate input (if applicable)
    - Overtime rate input
    - Included hours
    - Vehicle multipliers (Hatchback, Sedan, SUV, Luxury)
    - Active toggle
    - Save button
```

### AdminPricingEngine.jsx
```
- Header with "Pricing Configuration"
- Two-column layout:
  
  LEFT COLUMN:
  - GST Section
    - Enable toggle
    - Percent input
  - Commission Section
    - Percent input
  - Surge Pricing Section
    - Enable toggle
    - Multiplier input
    - Peak hours configuration
  - Night Charges Section
    - Enable toggle
    - Amount input
    - Hours configuration
  - Scheduled Premium Section
    - Enable toggle
    - Amount input
  - Outstation Allowance
    - Amount input
  - Cancellation Charges
    - Customer (before/after)
    - Driver (before/after/no-show)
  - Wallet Hold
    - Amount input
  
  RIGHT COLUMN:
  - Pricing Preview Calculator
    - Service type dropdown
    - Duration input
    - Vehicle type dropdown
    - Subscriber toggle
    - Scheduled toggle
    - Scheduled time picker
    - Calculate button
    - Pricing breakdown display
      - Base amount
      - Overtime
      - Add-ons
      - Subtotal
      - Surge
      - GST
      - Final amount
      - Commission
      - Driver earning
```

### AdminPayouts.jsx
```
- Header with filters
  - Status dropdown
  - Driver search
  - Date range picker
  - Generate Payout button
  - Generate All Payouts button
- Stats cards
  - Total Payouts
  - Pending Amount
  - Processing Amount
  - Completed Amount
- Payouts table
  - Driver name
  - Period
  - Trips count
  - Total earnings
  - Penalties
  - Adjustments
  - Payout amount
  - Status
  - Actions (View, Process)
- Payout Details Modal
  - Driver info
  - Period
  - Trips list
  - Penalties list
  - Adjustments list
  - Add adjustment button
  - Process payout button
```

---

## 🎨 DESIGN GUIDELINES

- Use existing admin design system
- Follow clean minimal aesthetic
- Use Lucide React icons
- Use Framer Motion for animations
- Use react-hot-toast for notifications
- Use consistent color scheme:
  - Primary: var(--primary)
  - Success: emerald-600
  - Warning: amber-600
  - Error: red-600
  - Muted: gray-500

---

## 🧪 TESTING CHECKLIST

### Backend Testing
1. ✅ Initialize services: `POST /api/admin/spare-driver/services/initialize`
2. ✅ Get all services: `GET /api/admin/spare-driver/services`
3. ✅ Update service: `PATCH /api/admin/spare-driver/services/hourly`
4. ✅ Get pricing config: `GET /api/admin/spare-driver/pricing/config`
5. ✅ Calculate price: `POST /api/admin/spare-driver/pricing/calculate`
6. ✅ Generate payout: `POST /api/admin/spare-driver/payouts/generate`

### Frontend Testing
1. ⏳ Services page loads
2. ⏳ Can edit service pricing
3. ⏳ Can toggle service active/inactive
4. ⏳ Pricing calculator works
5. ⏳ Can update pricing config
6. ⏳ Can generate payouts
7. ⏳ Can view payout details
8. ⏳ Can process payouts

---

## 📝 NOTES

- Backend is 100% complete and tested
- All API endpoints are working
- Pricing engine is production-ready
- Frontend needs to be created
- Use adminAPI utility (NOT axios)
- Follow existing code patterns
- Maintain clean minimal design

---

**Status:** Backend Complete ✅ | Frontend Pending 🔄  
**Next Action:** Create frontend pages using adminAPI  
**Priority:** High - Core pricing system

