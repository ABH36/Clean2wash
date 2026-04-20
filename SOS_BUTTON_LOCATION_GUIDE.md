# 🚨 SOS Button - Location Guide

## 📍 Driver Ko SOS Button Kahan Dikhega?

---

## 1️⃣ **Navigation HUD (Full-Screen Mode)** ✅

**Kab Dikhega:** Jab driver active trip me ho (en_route, arrived, active status)

**Location:** Bottom navigation dock me, phone button ke pehle

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              🗺️ FULL SCREEN MAP                    │
│                                                     │
│         (Driver & Consumer markers visible)         │
│                                                     │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  ⏱️ ETA   👤 Consumer Name   🚨 📞 💬  [Arrived]  │
│  15m      Raj Kumar          SOS CALL CHAT         │
└─────────────────────────────────────────────────────┘
         ↑
    SOS BUTTON (Pulsing Red Circle)
```

**Visual:**
- 🔴 Red pulsing button (64x64px)
- 🔔 Siren icon
- ⚡ Animated rings
- 📍 "SOS" label niche

---

## 2️⃣ **Standard Dashboard (Active Trip Card)** ✅

**Kab Dikhega:** Jab driver dashboard pe ho aur active trip ho

**Location:** Mission card me, communication buttons ke niche

```
┌─────────────────────────────────────────────────────┐
│  🔔 LIVE MISSION                          ₹500      │
│  Point to Point Service                             │
│                                                     │
│  📍 Pickup: MG Road, Bangalore                     │
│                                                     │
│  ┌──────────┬──────────┬──────────┐               │
│  │ Navigate │   Call   │   Chat   │               │
│  └──────────┴──────────┴──────────┘               │
│                                                     │
│              🚨 SOS BUTTON                         │
│           (Pulsing Red Circle)                     │
│                                                     │
│  ┌─────────────────────────────────────┐          │
│  │      Mark Arrived / Start Trip       │          │
│  └─────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
```

**Visual:**
- Center aligned
- Separate row
- Prominent position
- Easy to reach

---

## 3️⃣ **Kab NAHI Dikhega?** ❌

### Disabled States:
1. **No Active Trip** - Button disabled (50% opacity)
2. **Pending Booking** - Not shown
3. **Offline Mode** - Disabled
4. **Completed Trip** - Not shown

```
┌─────────────────────────────────────────────────────┐
│  📡 Scanning for missions...                        │
│                                                     │
│  🚨 SOS (Disabled - No active trip)                │
│     ↑                                               │
│  (Gray, 50% opacity, not clickable)                │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Visual Examples

### Example 1: Navigation HUD (Full-Screen)
```
┌─────────────────────────────────────────────────────┐
│                    🗺️ MAP VIEW                      │
│                                                     │
│  📍 Driver (Yellow marker)                         │
│  📍 Consumer (Yellow marker with person icon)      │
│  ━━━ Yellow polyline connecting them               │
│                                                     │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ Bottom Dock (Rounded top corners)                  │
│ ┌────┐  Raj Kumar        🚨  📞  💬  [Arrived]    │
│ │15m │  MG Road, Blr     ↓   ↓   ↓               │
│ │2.5k│                  SOS CALL CHAT             │
│ └────┘                                             │
└─────────────────────────────────────────────────────┘
```

### Example 2: Dashboard View
```
┌─────────────────────────────────────────────────────┐
│  Dashboard Header                                   │
│  ┌─ Metrics ─┬─ Metrics ─┬─ Metrics ─┐           │
│  │  ₹2,500   │   4.9 ⭐   │  Online   │           │
│  └───────────┴───────────┴───────────┘           │
│                                                     │
│  ┌─────────────────────────────────────┐          │
│  │  🔔 LIVE MISSION          ₹500      │          │
│  │  Point to Point                     │          │
│  │                                     │          │
│  │  📍 MG Road, Bangalore              │          │
│  │                                     │          │
│  │  ┌────────┬────────┬────────┐      │          │
│  │  │Navigate│  Call  │  Chat  │      │          │
│  │  └────────┴────────┴────────┘      │          │
│  │                                     │          │
│  │         🚨 SOS BUTTON               │          │
│  │      (Red, Pulsing)                 │          │
│  │                                     │          │
│  │  ┌─────────────────────────┐       │          │
│  │  │    Mark Arrived          │       │          │
│  │  └─────────────────────────┘       │          │
│  └─────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
```

---

## 🔴 SOS Button Design

### Active State (During Trip)
```
     ⭕ ← Outer pulsing ring (animate-ping)
    ⭕⭕ ← Middle pulsing ring (animate-pulse)
   ┌───┐
   │ 🚨 │ ← Red circle (64x64px)
   └───┘
    SOS  ← Label (8px, uppercase)
```

**Colors:**
- Background: `#EF4444` (Red 500)
- Shadow: `0 0 20px rgba(239, 68, 68, 0.5)`
- Rings: Red with opacity

### Disabled State (No Trip)
```
   ┌───┐
   │ 🚨 │ ← Gray circle (50% opacity)
   └───┘
    SOS  ← Gray label
```

**Colors:**
- Background: `#EF4444` with 50% opacity
- No shadow
- No animation
- Cursor: not-allowed

---

## 📱 Mobile View

### Portrait Mode (Most Common)
```
┌─────────────────┐
│   Dashboard     │
│                 │
│  ┌───────────┐  │
│  │  Mission  │  │
│  │           │  │
│  │ Navigate  │  │
│  │ Call Chat │  │
│  │           │  │
│  │    🚨     │  │ ← Center, prominent
│  │   SOS     │  │
│  │           │  │
│  │ [Arrived] │  │
│  └───────────┘  │
│                 │
└─────────────────┘
```

### Landscape Mode (Navigation)
```
┌─────────────────────────────────────────┐
│                                         │
│           🗺️ MAP VIEW                   │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ ETA  Name    🚨 📞 💬  [Arrived]       │
└─────────────────────────────────────────┘
```

---

## 🎬 User Journey

### Scenario 1: Driver Starts Trip
```
1. Driver accepts booking
   └─ SOS button appears (disabled)

2. Driver clicks "En Route"
   └─ SOS button becomes active (pulsing)

3. Driver reaches pickup
   └─ SOS button still active

4. Driver starts trip
   └─ SOS button still active

5. Driver completes trip
   └─ SOS button disappears
```

### Scenario 2: Emergency During Trip
```
1. Driver in active trip
   └─ SOS button pulsing (visible)

2. Driver clicks SOS
   └─ Vibration feedback
   └─ Modal opens

3. Driver selects reason
   └─ "Accident" selected

4. Driver confirms
   └─ Alert sent
   └─ Admin notified
   └─ Success toast

5. Driver continues trip
   └─ SOS button still available
```

---

## 🔍 Finding SOS Button

### Quick Reference:

**Active Trip (Full-Screen Navigation):**
- Look at bottom dock
- Between ETA info and phone button
- Red pulsing circle
- Can't miss it!

**Active Trip (Dashboard):**
- Scroll to mission card
- Below Navigate/Call/Chat buttons
- Above status update button
- Center aligned

**No Active Trip:**
- Button not visible OR
- Button visible but disabled (gray)

---

## ⚠️ Important Notes

1. **Always Visible During Active Trip** ✅
   - En route
   - Arrived
   - Active (trip started)

2. **Never Hidden** ✅
   - No scroll required
   - Always in viewport
   - Prominent position

3. **Easy to Reach** ✅
   - Thumb-friendly position
   - Large touch target (64x64px)
   - No accidental clicks (confirmation required)

4. **Visual Feedback** ✅
   - Pulsing animation
   - Red color (danger)
   - Siren icon
   - Clear label

---

## 🎯 Summary

**Driver ko SOS button dikhega:**

✅ **Navigation HUD** - Bottom dock me (full-screen map)
✅ **Dashboard** - Mission card me (center position)
✅ **Active Trip Only** - En route, arrived, active status
✅ **Prominent & Pulsing** - Red, animated, impossible to miss
✅ **Always Accessible** - No scroll, always visible

**Driver ko SOS button NAHI dikhega:**

❌ No active trip
❌ Pending booking (not accepted yet)
❌ Completed trip
❌ Offline mode (disabled)

---

**Visual Position:** Bottom-center (dashboard) or Bottom-left (navigation HUD)  
**Size:** 64x64px  
**Color:** Red (#EF4444)  
**Animation:** Pulsing rings  
**Status:** Always visible during active trips
