# 🧪 Phase 1 Testing Guide

**Admin Operations Integration - Testing Checklist**

---

## 🚀 Quick Start

### 1. Start Backend Server
```bash
cd Backend
npm start
```

### 2. Start Frontend Server
```bash
cd Frontend
npm run dev
```

### 3. Login as Admin
- Navigate to: `http://localhost:5173/admin/login`
- Use admin credentials

### 4. Navigate to Booking Operations
- Go to: Admin Panel → Operations → Booking Operations
- Or direct URL: `http://localhost:5173/admin/operations/bookings`

---

## ✅ Test Cases

### Test 1: Real Bookings Load ✅

**Steps**:
1. Open Admin Booking Operations page
2. Wait for bookings to load

**Expected Result**:
- ✅ Real chauffeur bookings from database appear
- ✅ Loading spinner shows while fetching
- ✅ Bookings display with correct data (customer name, service, amount, status)
- ✅ No dummy data (like "Priya Sharma", "BK001")

**Check Console**:
```javascript
// Should see:
"[Admin Operations] Loading bookings..."
// API call to: GET /api/admin/bookings/chauffeur
```

---

### Test 2: Status Filter Works ✅

**Steps**:
1. Click status dropdown
2. Select "PENDING"
3. Wait for results

**Expected Result**:
- ✅ Only pending bookings show
- ✅ API call made with `?status=pending`
- ✅ Stats cards update (Pending count increases)

**Repeat for**:
- ASSIGNED
- IN_PROGRESS
- COMPLETED
- ALL (shows all bookings)

---

### Test 3: Search Works ✅

**Steps**:
1. Type booking ID or customer name in search box
2. Wait 500ms (debounce)

**Expected Result**:
- ✅ Filtered bookings appear
- ✅ API call made with `?search=<term>`
- ✅ Results match search term

---

### Test 4: Driver Assignment Works ✅

**Steps**:
1. Find a PENDING booking
2. Click "Assign" button
3. Wait for driver modal to open
4. Check available drivers list

**Expected Result**:
- ✅ Modal opens with "Assign Driver" title
- ✅ Loading spinner shows while fetching drivers
- ✅ Real drivers from database appear
- ✅ Only ACTIVE, APPROVED, ONLINE drivers show
- ✅ Driver details show: name, phone, online status, reliability score

**Check Console**:
```javascript
// Should see:
"Loading available drivers..."
// API call to: GET /api/admin/spare-drivers
```

---

### Test 5: Assign Driver to Booking ✅

**Steps**:
1. Open assign modal (from Test 4)
2. Click on a driver
3. Wait for assignment

**Expected Result**:
- ✅ Success toast: "Driver [name] assigned successfully"
- ✅ Modal closes
- ✅ Booking status changes to "ASSIGNED"
- ✅ Driver name appears in "Assigned Driver" column
- ✅ Bookings list refreshes

**Check Console**:
```javascript
// Should see:
"[Admin Operations] Driver assigned: { bookingId, driverId, driverName }"
// API call to: POST /api/admin/bookings/:id/assign
```

**Check Driver App**:
- Driver should receive notification: "You have been assigned to booking..."

---

### Test 6: Real-Time New Booking ✅

**Steps**:
1. Keep Admin Operations page open
2. Create a new chauffeur booking from consumer app
3. Watch admin panel

**Expected Result**:
- ✅ New booking appears instantly (no page refresh)
- ✅ Success toast: "New chauffeur booking received! 🚗"
- ✅ Booking appears at top of list
- ✅ Stats cards update (Total Bookings +1, Pending +1)

**Check Console**:
```javascript
// Should see:
"[Admin Operations] New booking: { booking }"
// Socket event: new_booking_broadcast
```

---

### Test 7: Real-Time Status Update ✅

**Steps**:
1. Keep Admin Operations page open
2. Have driver update booking status (e.g., start service)
3. Watch admin panel

**Expected Result**:
- ✅ Booking status updates instantly
- ✅ Success toast: "Booking [id] status: in_progress"
- ✅ Status badge color changes
- ✅ Stats cards update

**Check Console**:
```javascript
// Should see:
"[Admin Operations] Booking status updated: { bookingId, status }"
// Socket event: booking_status_updated
```

---

### Test 8: Reassign Driver ✅

**Steps**:
1. Find an ASSIGNED booking
2. Click "Reassign" button
3. Select different driver
4. Confirm assignment

**Expected Result**:
- ✅ Modal opens with "Reassign Driver" title
- ✅ Available drivers load
- ✅ New driver assigned successfully
- ✅ Old driver removed, new driver shown
- ✅ Both drivers notified

---

### Test 9: Booking Details Modal ✅

**Steps**:
1. Click "Details" button on any booking
2. Check all tabs

**Expected Result**:
- ✅ Modal opens with booking details
- ✅ **Overview Tab**: Shows booking info, customer info
- ✅ **Time Tracking Tab**: Shows planned vs actual duration
- ✅ **Driver Info Tab**: Shows assigned driver or "No Driver Assigned"

---

### Test 10: Advanced View Toggle ✅

**Steps**:
1. Click "Advanced View" button
2. Check table columns

**Expected Result**:
- ✅ Additional columns appear:
  - Time Tracking (service time progress)
  - Overtime (shows if overtime occurred)
  - Priority (URGENT, HIGH, NORMAL)
- ✅ Button text changes to "Basic View"
- ✅ Click again to hide columns

---

## 🔍 Console Checks

### Socket Connection
Open browser console and check:

```javascript
// Should see:
"[Socket] Connected to server"
"[Socket] Joined admin room"
"[Socket] Listening for: booking_status_updated"
"[Socket] Listening for: new_booking_broadcast"
"[Socket] Listening for: driver_assigned"
```

### API Calls
Check Network tab:

```
GET /api/admin/bookings/chauffeur?status=pending&limit=100
GET /api/admin/spare-drivers
POST /api/admin/bookings/:id/assign
```

All should return `200 OK` with proper JSON response.

---

## ❌ Error Scenarios

### Test 11: No Drivers Available

**Steps**:
1. Set all drivers to OFFLINE or BLOCKED
2. Try to assign driver to booking

**Expected Result**:
- ✅ Modal shows: "No Drivers Available"
- ✅ Message: "All drivers are currently offline or busy"
- ✅ No error in console

---

### Test 12: API Failure

**Steps**:
1. Stop backend server
2. Try to load bookings

**Expected Result**:
- ✅ Error toast: "Failed to load bookings"
- ✅ Empty state shows: "No bookings found"
- ✅ No crash, app remains functional

---

### Test 13: Socket Disconnect

**Steps**:
1. Disconnect internet
2. Wait 5 seconds
3. Reconnect internet

**Expected Result**:
- ✅ Socket automatically reconnects
- ✅ Real-time updates resume
- ✅ No data loss

---

## 📊 Performance Checks

### Load Time
- ✅ Bookings load in < 2 seconds
- ✅ Drivers load in < 1 second
- ✅ No lag when filtering/searching

### Memory
- ✅ No memory leaks (check Chrome DevTools)
- ✅ Socket listeners cleaned up on unmount

### Network
- ✅ API calls are debounced (search)
- ✅ No duplicate requests
- ✅ Proper error handling

---

## 🎯 Success Criteria

**Phase 1 is successful if**:
- ✅ All 13 test cases pass
- ✅ No console errors
- ✅ Real-time updates work smoothly
- ✅ Driver assignment works end-to-end
- ✅ Search and filters work correctly
- ✅ No dummy data visible

---

## 🐛 Common Issues & Fixes

### Issue 1: Bookings Not Loading
**Symptom**: Empty table, no loading spinner  
**Fix**: Check backend is running, check API endpoint `/api/admin/bookings/chauffeur`

### Issue 2: Socket Not Connecting
**Symptom**: No real-time updates  
**Fix**: Check `localStorage.getItem('admin_token')` exists, check socket server running

### Issue 3: Driver Assignment Fails
**Symptom**: Error toast after clicking assign  
**Fix**: Check driver ID is valid, check booking exists, check API endpoint

### Issue 4: Filters Not Working
**Symptom**: All bookings show regardless of filter  
**Fix**: Check query parameters in network tab, check backend query building

---

## 📝 Test Report Template

```markdown
# Phase 1 Test Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Dev/Staging/Production]

## Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Real Bookings Load | ✅/❌ | |
| Status Filter | ✅/❌ | |
| Search | ✅/❌ | |
| Driver Assignment | ✅/❌ | |
| Assign Driver | ✅/❌ | |
| Real-Time New Booking | ✅/❌ | |
| Real-Time Status Update | ✅/❌ | |
| Reassign Driver | ✅/❌ | |
| Booking Details | ✅/❌ | |
| Advanced View | ✅/❌ | |
| No Drivers Available | ✅/❌ | |
| API Failure | ✅/❌ | |
| Socket Disconnect | ✅/❌ | |

## Overall Status
- **Pass Rate**: X/13 (XX%)
- **Critical Issues**: [List]
- **Minor Issues**: [List]
- **Recommendations**: [List]

## Sign-off
- [ ] Ready for Phase 2
- [ ] Needs fixes
```

---

*Testing Guide for Phase 1*  
*Last Updated: Current Session*  
*Status: Ready for Testing*

