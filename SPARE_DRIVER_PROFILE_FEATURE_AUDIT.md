# 🚗 Spare Driver Profile Feature Audit

**Date:** April 20, 2026  
**Status:** GAPS IDENTIFIED

---

## 📊 EXECUTIVE SUMMARY

Spare Driver model me **50+ features** implement kiye gaye hain, but profile page me sirf **basic features** show ho rahe hain. Bahut saare important features missing hain jo driver ko dikhne chahiye.

---

## ✅ CURRENTLY SHOWING (Profile Page)

### Basic Information
- ✅ Name
- ✅ Driver ID
- ✅ Email
- ✅ Phone
- ✅ Address (Street, City, Pincode)
- ✅ Profile Photo (with upload)

### Status & Verification
- ✅ Premium Status (Elite Operator)
- ✅ Police Verification Status
- ✅ Kit Purchase Status
- ✅ Wallet Balance (indirect)

### Quick Actions
- ✅ Edit Profile
- ✅ Update Address
- ✅ Kit Purchase
- ✅ Premium Upgrade
- ✅ Logout

---

## ❌ MISSING FEATURES (Not Showing)

### 1. **Service Management** ❌
**Model Fields:**
- `allowedServices[]` - Services driver can provide (point, hourly, full_day, outstation)
- `preferredServices[]` - Driver's preferred services
- Service-specific stats (completedTrips, rating per service)

**Should Show:**
- Which services driver can provide
- Service-wise ratings
- Service-wise completed trips
- Toggle service on/off
- Best performing service

### 2. **Reliability Score** ❌
**Model Fields:**
- `reliabilityScore.score` (0-100)
- `reliabilityScore.metrics.totalTrips`
- `reliabilityScore.metrics.completedTrips`
- `reliabilityScore.metrics.cancelledTrips`
- `reliabilityScore.metrics.completionRate`
- `reliabilityScore.metrics.acceptanceRate`
- `reliabilityScore.metrics.avgRating`

**Should Show:**
- Overall reliability score with visual indicator
- Completion rate percentage
- Acceptance rate percentage
- Average rating
- Total trips completed

### 3. **Utilization Stats** ❌
**Model Fields:**
- `utilization.today.tripsCompleted`
- `utilization.today.activeTime`
- `utilization.today.idleTime`
- `utilization.today.onlineTime`
- `utilization.weekly.tripsCompleted`
- `utilization.weekly.totalActiveTime`

**Should Show:**
- Today's trips completed
- Today's active time
- Weekly trips completed
- Weekly active time
- Utilization percentage

### 4. **Duty Hours & Fatigue Management** ❌
**Model Fields:**
- `dutyHours.today.totalMinutes`
- `dutyHours.weekly.totalMinutes`
- `dutyHours.limits` (daily/weekly max, break requirements)
- `dutyHours.status.isOverworked`
- `dutyHours.status.needsBreak`
- `dutyHours.status.canAcceptBookings`
- `breaks.currentContinuousWorkMinutes`
- `breaks.totalBreaksToday`
- `fatigueAlerts[]`

**Should Show:**
- Daily duty hours (used/remaining)
- Weekly duty hours (used/remaining)
- Break status (needs break or not)
- Continuous work time
- Fatigue alerts
- Booking acceptance eligibility

### 5. **Online Status & Availability** ❌
**Model Fields:**
- `onlineStatus.isOnline`
- `onlineStatus.lastOnlineAt`
- `onlineStatus.lastOfflineAt`
- `onlineStatus.sessionStart`
- `lastActive`
- `availabilitySlots[]`

**Should Show:**
- Current online/offline status
- Last active time
- Session duration
- Availability calendar
- Scheduled slots

### 6. **Bank Details** ❌
**Model Fields:**
- `bankDetails.accountName`
- `bankDetails.accountNumber`
- `bankDetails.ifscCode`
- `bankDetails.bankName`
- `bankDetails.upiId`

**Should Show:**
- Bank account details (masked)
- UPI ID
- Add/Edit bank details option
- Verification status

### 7. **Wallet Details** ❌
**Model Fields:**
- `wallet.balance`
- `wallet.holdAmount`
- `wallet.availableBalance`
- `wallet.lastWithdrawAt`

**Should Show:**
- Total balance
- Hold amount (pending bookings)
- Available balance
- Last withdrawal date
- Withdrawal history link

### 8. **Kit Recovery Plan** ❌
**Model Fields:**
- `onboardingRecovery.enabled`
- `onboardingRecovery.monthlyDeductionAmount`
- `onboardingRecovery.totalMonths`
- `onboardingRecovery.monthsDeducted`
- `onboardingRecovery.pendingAmount`
- `onboardingRecovery.nextDeductionAt`

**Should Show:**
- Recovery plan status
- Monthly deduction amount
- Months completed/remaining
- Pending amount
- Next deduction date

### 9. **Documents Status** ❌
**Model Fields:**
- `documents.aadhaarCard` (front/back)
- `documents.panCard`
- `documents.drivingLicense`
- `documents.selfie`
- `documents.policeVerification`

**Should Show:**
- Document upload status (uploaded/pending)
- Document verification status
- Document expiry dates
- Re-upload option

### 10. **Profile Details** ❌
**Model Fields:**
- `profile.languages[]`
- `profile.city`
- `profile.experience`
- `profile.availability` (Full-time/Part-time)
- `profile.education`

**Should Show:**
- Languages spoken
- Years of experience
- Availability type
- Education
- City

### 11. **Inquiries/Support** ❌
**Model Fields:**
- `inquiries[]` (category, subject, message, status, adminReply)

**Should Show:**
- List of submitted inquiries
- Inquiry status (open/reviewed/resolved)
- Admin replies
- Create new inquiry button

### 12. **FCM Tokens** ❌
**Model Fields:**
- `fcmTokens[]` (token, platform, lastUsed)

**Should Show:**
- Registered devices
- Last used date
- Remove device option

---

## 🎯 PRIORITY FEATURES TO ADD

### HIGH PRIORITY (Must Have)
1. **Reliability Score Card** - Shows driver's performance metrics
2. **Duty Hours Dashboard** - Daily/weekly hours with limits
3. **Service Management** - Which services driver provides
4. **Wallet Details** - Complete wallet information
5. **Bank Details Section** - For withdrawals
6. **Documents Status** - Upload/verification status

### MEDIUM PRIORITY (Should Have)
7. **Utilization Stats** - Today's and weekly performance
8. **Online Status Toggle** - Go online/offline
9. **Availability Calendar** - Set available slots
10. **Kit Recovery Plan** - Show recovery progress
11. **Profile Details** - Languages, experience, etc.

### LOW PRIORITY (Nice to Have)
12. **Fatigue Alerts** - Show active alerts
13. **Inquiries List** - Support tickets
14. **Device Management** - FCM tokens
15. **Session History** - Login/logout history

---

## 📋 RECOMMENDED PROFILE SECTIONS

### Section 1: Performance Dashboard
```
┌─────────────────────────────────────┐
│ 🏆 Reliability Score: 95/100       │
│ ⭐ Rating: 4.8/5.0                  │
│ ✅ Completion Rate: 98%             │
│ 📊 Acceptance Rate: 95%             │
│ 🚗 Total Trips: 234                 │
└─────────────────────────────────────┘
```

### Section 2: Duty Hours
```
┌─────────────────────────────────────┐
│ ⏰ Today: 6.5h / 10h (65%)          │
│ 📅 This Week: 32h / 60h (53%)       │
│ ☕ Breaks Today: 2                   │
│ ⚠️ Status: Can Accept Bookings     │
└─────────────────────────────────────┘
```

### Section 3: Services Offered
```
┌─────────────────────────────────────┐
│ ✅ Point to Point (45 trips, 4.9★)  │
│ ✅ Hourly (89 trips, 4.8★)          │
│ ✅ Full Day (23 trips, 4.7★)        │
│ ❌ Outstation (Not Active)          │
└─────────────────────────────────────┘
```

### Section 4: Wallet & Earnings
```
┌─────────────────────────────────────┐
│ 💰 Balance: ₹12,450                 │
│ 🔒 Hold: ₹2,500                     │
│ ✅ Available: ₹9,950                │
│ 📤 Last Withdrawal: 2 days ago      │
│ [Withdraw] [History]                │
└─────────────────────────────────────┘
```

### Section 5: Bank Details
```
┌─────────────────────────────────────┐
│ 🏦 Bank: HDFC Bank                  │
│ 💳 Account: ****1234                │
│ 🔑 IFSC: HDFC0001234                │
│ 📱 UPI: driver@paytm                │
│ [Edit Details]                      │
└─────────────────────────────────────┘
```

### Section 6: Documents
```
┌─────────────────────────────────────┐
│ ✅ Aadhaar Card (Verified)          │
│ ✅ PAN Card (Verified)              │
│ ✅ Driving License (Verified)       │
│ ✅ Selfie (Verified)                │
│ ⏳ Police Verification (Pending)    │
└─────────────────────────────────────┘
```

### Section 7: Kit Recovery (if applicable)
```
┌─────────────────────────────────────┐
│ 📦 Kit Recovery Plan                │
│ ₹199/month × 8 months               │
│ Completed: 3/8 months               │
│ Pending: ₹995                       │
│ Next Deduction: 15 May 2026         │
└─────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: Critical Features (2-3 hours)
1. Add Reliability Score Card
2. Add Duty Hours Dashboard
3. Add Service Management Section
4. Add Wallet Details Section

### Phase 2: Important Features (2-3 hours)
5. Add Bank Details Section
6. Add Documents Status Section
7. Add Kit Recovery Progress
8. Add Utilization Stats

### Phase 3: Additional Features (1-2 hours)
9. Add Online Status Toggle
10. Add Availability Calendar
11. Add Profile Details Section
12. Add Inquiries List

---

## 📝 SAMPLE CODE STRUCTURE

### Reliability Score Card Component
```jsx
<div className="bg-surface border border-content/[0.04] rounded-[2.2rem] p-6">
  <h3 className="text-sm font-black text-content uppercase mb-4">
    Performance Metrics
  </h3>
  
  {/* Reliability Score */}
  <div className="flex items-center justify-between mb-4">
    <span className="text-xs text-content/40">Reliability Score</span>
    <div className="flex items-center gap-2">
      <div className="w-32 h-2 bg-content/[0.05] rounded-full overflow-hidden">
        <div 
          className="h-full bg-brand" 
          style={{ width: `${driver.reliabilityScore.score}%` }}
        />
      </div>
      <span className="text-sm font-black text-brand">
        {driver.reliabilityScore.score}/100
      </span>
    </div>
  </div>
  
  {/* Other Metrics */}
  <div className="grid grid-cols-2 gap-4">
    <MetricCard 
      label="Completion Rate" 
      value={`${driver.reliabilityScore.metrics.completionRate}%`}
    />
    <MetricCard 
      label="Acceptance Rate" 
      value={`${driver.reliabilityScore.metrics.acceptanceRate}%`}
    />
    <MetricCard 
      label="Avg Rating" 
      value={`${driver.reliabilityScore.metrics.avgRating}/5.0`}
    />
    <MetricCard 
      label="Total Trips" 
      value={driver.reliabilityScore.metrics.totalTrips}
    />
  </div>
</div>
```

---

## ✅ CONCLUSION

**Current Status:** Profile page shows only **20%** of available features

**Recommendation:** Implement at least **Phase 1 & 2** features to provide drivers with complete visibility of their account and performance.

**Impact:** 
- Better driver engagement
- Transparency in earnings and performance
- Self-service for common queries
- Reduced support tickets

---

**Audit By:** Kiro AI  
**Date:** April 20, 2026  
**Next Action:** Implement missing features in priority order
