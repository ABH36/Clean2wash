# SPARE DRIVER APP - HIDING STRATEGY

**Goal:** Hide all non-Spare Driver features without changing UI design  
**Approach:** Conditional rendering based on feature flags or simple CSS hiding

---

## 🎯 WHAT TO HIDE

### **1. Home Page (Frontend/src/modules/consumer/pages/Home.jsx)**

#### Hide These Sections:
- ❌ Car wash service cards
- ❌ E-shop product cards
- ❌ Studio services section
- ❌ Apartment wash cards
- ❌ Instant wash banners
- ❌ Full wash booking cards
- ❌ Subscription cards (car wash)
- ❌ Portfolio/Gallery links
- ❌ Insurance center links

#### Keep These Sections:
- ✅ Spare Driver service cards
- ✅ Spare Driver booking CTA
- ✅ Active booking tracker
- ✅ Wallet
- ✅ Profile
- ✅ Notifications
- ✅ Location
- ✅ Refer & Earn
- ✅ Help & Support

---

### **2. Navigation (Frontend/src/modules/consumer/components/layout/MobileLayout.jsx)**

#### Hide These Tabs:
- ❌ Services (car wash)
- ❌ Shop/E-shop
- ❌ Cart
- ❌ Instant wash
- ❌ Studio
- ❌ Gallery/Portfolio

#### Keep These Tabs:
- ✅ Home
- ✅ Bookings (Spare Driver only)
- ✅ Wallet
- ✅ Profile

---

### **3. Profile Page (Frontend/src/modules/consumer/pages/Profile.jsx)**

#### Hide These Menu Items:
- ❌ My Orders (e-shop)
- ❌ Wishlist
- ❌ Subscriptions (car wash)
- ❌ Portfolio
- ❌ Insurance Center
- ❌ Studio Discovery

#### Keep These Menu Items:
- ✅ My Bookings (Spare Driver)
- ✅ Wallet
- ✅ Refer & Earn
- ✅ Vehicles
- ✅ Addresses
- ✅ Payment Methods
- ✅ Notifications
- ✅ Safety & SOS
- ✅ Help & Support

---

### **4. Search (if exists)**

#### Hide from Search Results:
- ❌ Car wash services
- ❌ Products
- ❌ Studios
- ❌ Apartment wash

#### Keep in Search:
- ✅ Spare Driver services
- ✅ Help articles

---

## 🔧 IMPLEMENTATION METHODS

### **Method 1: Conditional Rendering (Recommended)**

```javascript
// In Home.jsx
const SHOW_CAR_WASH = false;
const SHOW_ESHOP = false;
const SHOW_STUDIO = false;
const SHOW_APARTMENT_WASH = false;

// Then use:
{SHOW_CAR_WASH && <CarWashSection />}
{SHOW_ESHOP && <EshopSection />}
```

### **Method 2: CSS Display None**

```javascript
// Add className
<div className="hidden">
  <CarWashSection />
</div>
```

### **Method 3: Filter Arrays**

```javascript
// Filter services to show only Spare Driver
const services = allServices.filter(s => 
  s.type === 'spare-driver' || 
  s.category === 'driver'
);
```

---

## 📝 STEP-BY-STEP HIDING PLAN

### **Step 1: Home Page Cleanup**
1. Find all service rendering sections
2. Add conditional flags
3. Hide car wash, e-shop, studio sections
4. Keep only Spare Driver sections

### **Step 2: Navigation Cleanup**
1. Update MAIN_NAV_ITEMS array
2. Remove shop, cart, services tabs
3. Keep home, bookings, wallet, profile

### **Step 3: Profile Cleanup**
1. Update MENU_GROUPS array
2. Remove orders, wishlist, subscriptions
3. Keep Spare Driver related items

### **Step 4: Routes (Already Done)**
- Routes are already redirected in App.jsx ✅

---

## ✅ CHECKLIST

### Home Page:
- [ ] Hide car wash services
- [ ] Hide e-shop products
- [ ] Hide studio services
- [ ] Hide apartment wash
- [ ] Hide instant wash banners
- [ ] Keep Spare Driver sections

### Navigation:
- [ ] Remove shop tab
- [ ] Remove cart tab
- [ ] Remove services tab
- [ ] Keep 4 tabs: Home, Bookings, Wallet, Profile

### Profile:
- [ ] Hide My Orders
- [ ] Hide Wishlist
- [ ] Hide Subscriptions (car wash)
- [ ] Hide Portfolio
- [ ] Hide Insurance
- [ ] Keep Spare Driver items

### Search:
- [ ] Filter out car wash
- [ ] Filter out products
- [ ] Keep Spare Driver only

---

## 🎯 EXPECTED RESULT

After hiding:
- User sees only Spare Driver related features
- No car wash services visible
- No e-shop/products visible
- No studio/apartment wash visible
- Clean, focused Spare Driver app
- All hidden features still work in backend (for admin)

---

**Next:** Implement hiding in 3 files only
