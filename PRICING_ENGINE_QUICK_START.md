# 🚀 PRICING ENGINE - QUICK START GUIDE

## ✅ SYSTEM IS READY!

Everything is implemented and working. Here's how to use it:

---

## 📍 STEP 1: INITIALIZE SERVICES (First Time Only)

1. Start backend: `cd Backend && npm start`
2. Start frontend: `cd Frontend && npm run dev`
3. Login to admin panel
4. Navigate to: **Finance → Spare Driver Services**
5. Click: **"Initialize Services"** button
6. ✅ Done! 4 services created:
   - Point-to-Point (₹499)
   - Hourly (₹799)
   - Full Day (₹999)
   - Outstation (₹2,499)

---

## 📍 STEP 2: CONFIGURE PRICING (Optional)

Navigate to: **Finance → Pricing Engine**

**Quick Settings:**
- GST: 18% (default)
- Commission: 20% (default)
- Surge: 1.5x (toggle on/off)
- Night Charge: ₹300 (toggle on/off)
- Scheduled Premium: ₹100
- Outstation Allowance: ₹500/day

Click **"Save Configuration"** when done.

---

## 📍 STEP 3: TEST CALCULATOR

In **Pricing Engine** page (right side):

1. Select service: **Hourly**
2. Duration: **8 hours**
3. Vehicle: **Sedan**
4. Check: **Subscriber** ✓
5. Check: **Scheduled** ✓
6. Click: **"Calculate Price"**

**Result:**
- Base: ₹1,440
- Overtime: ₹960
- Add-ons: ₹400
- GST: ₹504
- **Final: ₹3,304**
- Driver Earning: ₹2,240

---

## 📍 STEP 4: GENERATE PAYOUTS (Weekly)

Navigate to: **Finance → Driver Payouts**

1. Click: **"Generate Payouts"**
2. Start Date: **2026-04-07** (Monday)
3. End Date: **2026-04-13** (Sunday)
4. Click: **"Generate"**
5. ✅ Payouts created for all active drivers

---

## 📍 STEP 5: PROCESS PAYOUTS

1. Click **"View"** on any payout
2. Enter Transaction ID: **TXN123456789**
3. Click: **"Process"**
4. ✅ Payout marked as COMPLETED

---

## 🎯 QUICK REFERENCE

### **API Endpoints:**
```
GET    /api/admin/spare-driver/services
PATCH  /api/admin/spare-driver/services/:type
POST   /api/admin/spare-driver/services/initialize

GET    /api/admin/spare-driver/pricing/config
PATCH  /api/admin/spare-driver/pricing/config
POST   /api/admin/spare-driver/pricing/calculate

GET    /api/admin/spare-driver/payouts
POST   /api/admin/spare-driver/payouts/generate
POST   /api/admin/spare-driver/payouts/generate-all
POST   /api/admin/spare-driver/payouts/:id/process
```

### **Frontend Routes:**
```
/admin/finance/spare-driver-services  → Services Management
/admin/finance/pricing                → Pricing Engine
/admin/finance/payouts                → Driver Payouts
```

### **Key Files:**
```
Backend:
- models/ServiceConfig.js
- models/PricingConfig.js
- services/pricingEngine.js
- modules/admin/controllers/adminServiceController.js
- modules/admin/controllers/adminPricingController.js
- modules/admin/controllers/adminPayoutController.js

Frontend:
- utils/adminApi.js (API methods)
- pages/finance/AdminSpareDriverServices.jsx
- pages/finance/AdminPricingEngine.jsx
- pages/finance/AdminPayouts.jsx
```

---

## 🧮 PRICING FORMULA

```
Final Amount = 
  (Base × Vehicle Multiplier × Duration) +
  Overtime +
  Add-ons (Scheduled + Night + Outstation) +
  Surge +
  GST

Driver Earning = Subtotal - Commission
```

---

## 🎨 UI NAVIGATION

```
Admin Panel
└── Finance
    ├── Spare Driver Services  ← Configure services
    ├── Pricing Engine         ← Configure pricing + Calculator
    └── Driver Payouts         ← Generate & process payouts
```

---

## ⚡ QUICK TIPS

1. **Initialize services first** - Click the button once
2. **Test calculator** - Verify pricing before going live
3. **Save configurations** - Don't forget to save changes
4. **Weekly payouts** - Run every Monday for previous week
5. **Transaction ID** - Required to process payouts

---

## 🐛 TROUBLESHOOTING

**Services not showing?**
→ Click "Initialize Services" button

**Calculator not working?**
→ Save pricing configuration first

**Payouts empty?**
→ Generate payouts for a date range

**Can't process payout?**
→ Enter transaction ID

---

## ✅ CHECKLIST

- [ ] Backend running
- [ ] Frontend running
- [ ] Logged in as admin
- [ ] Services initialized
- [ ] Pricing configured
- [ ] Calculator tested
- [ ] Payouts generated
- [ ] Payout processed

---

**Status:** 🎉 READY TO USE  
**Support:** Check PRICING_ENGINE_COMPLETE.md for details

