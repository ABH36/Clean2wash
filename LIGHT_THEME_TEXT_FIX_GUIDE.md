# 🎨 Light Theme Text Color Fix Guide

## Problem
Consumer pages me light theme me text white hai jo readable nahi hai.

## Solution Strategy

### Approach 1: Global CSS Fix (Recommended - Fastest)
Add this to your global CSS file (`index.css` or `App.css`):

```css
/* Light Theme Text Fix */
[data-theme="light"] .text-white {
  color: #000 !important;
}

[data-theme="light"] .text-white\/60 {
  color: rgba(0, 0, 0, 0.6) !important;
}

[data-theme="light"] .text-white\/40 {
  color: rgba(0, 0, 0, 0.4) !important;
}

[data-theme="light"] .text-white\/20 {
  color: rgba(0, 0, 0, 0.2) !important;
}

/* Exceptions for elements that should stay white */
[data-theme="light"] .bg-black .text-white,
[data-theme="light"] .bg-brand .text-white,
[data-theme="light"] [class*="bg-gradient"] .text-white {
  color: #fff !important;
}
```

### Approach 2: Theme Provider Update
Update `ThemeProvider` to add data attribute:

```javascript
// In ThemeContext.jsx
useEffect(() => {
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
}, [isDarkMode]);
```

### Approach 3: Utility Function (For New Code)
Create a utility function:

```javascript
// utils/themeUtils.js
export const getTextColor = (isDarkMode, opacity = 100) => {
  const opacityMap = {
    100: isDarkMode ? 'text-white' : 'text-black',
    60: isDarkMode ? 'text-white/60' : 'text-black/60',
    40: isDarkMode ? 'text-white/40' : 'text-black/40',
    20: isDarkMode ? 'text-white/20' : 'text-black/20',
  };
  return opacityMap[opacity] || opacityMap[100];
};

// Usage
<h1 className={getTextColor(isDarkMode)}>Title</h1>
<p className={getTextColor(isDarkMode, 60)}>Subtitle</p>
```

## Quick Fix Implementation

### Step 1: Add to index.css
```css
/* Add at the end of Frontend/src/index.css */

/* ========================================
   LIGHT THEME TEXT COLOR FIX
   ======================================== */

/* Base text colors */
.light-mode .text-white:not(.bg-black *):not(.bg-brand *):not([class*="bg-gradient"] *) {
  color: #000 !important;
}

.light-mode .text-white\/80:not(.bg-black *):not(.bg-brand *) {
  color: rgba(0, 0, 0, 0.8) !important;
}

.light-mode .text-white\/60:not(.bg-black *):not(.bg-brand *) {
  color: rgba(0, 0, 0, 0.6) !important;
}

.light-mode .text-white\/40:not(.bg-black *):not(.bg-brand *) {
  color: rgba(0, 0, 0, 0.4) !important;
}

.light-mode .text-white\/20:not(.bg-black *):not(.bg-brand *) {
  color: rgba(0, 0, 0, 0.2) !important;
}

/* Keep white text on dark backgrounds */
.light-mode .bg-black .text-white,
.light-mode .bg-brand .text-white,
.light-mode .bg-slate-900 .text-white,
.light-mode [class*="bg-gradient"] .text-white,
.light-mode [class*="from-"] .text-white {
  color: #fff !important;
}
```

### Step 2: Add light-mode class to body
In `ThemeContext.jsx`:

```javascript
useEffect(() => {
  if (isDarkMode) {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
  }
}, [isDarkMode]);
```

## Files That Need Manual Fix (If CSS doesn't work)

### High Priority (Most Visible)
1. `Frontend/src/modules/consumer/pages/Home.jsx`
2. `Frontend/src/modules/consumer/pages/Profile.jsx`
3. `Frontend/src/modules/consumer/pages/SpareDriverBooking.jsx`
4. `Frontend/src/modules/consumer/pages/BookingStatus.jsx`
5. `Frontend/src/modules/consumer/pages/BookingConfirmation.jsx`

### Pattern to Replace
```javascript
// OLD
className="text-white"

// NEW
className={isDarkMode ? 'text-white' : 'text-black'}

// OLD
className="text-white/60"

// NEW
className={isDarkMode ? 'text-white/60' : 'text-black/60'}
```

## Testing Checklist

- [ ] Home page - All text readable in light mode
- [ ] Profile page - All text readable
- [ ] Booking pages - All text readable
- [ ] Service cards - Text visible
- [ ] Buttons - Text contrast good
- [ ] Modals - Text readable
- [ ] Search results - Text visible
- [ ] Vehicle selection - Text readable

## Common Patterns to Fix

### Pattern 1: Headings
```javascript
// Before
<h1 className="text-white">Title</h1>

// After
<h1 className={`${isDarkMode ? 'text-white' : 'text-black'}`}>Title</h1>
```

### Pattern 2: Paragraphs
```javascript
// Before
<p className="text-white/60">Description</p>

// After
<p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>Description</p>
```

### Pattern 3: Buttons (Keep white on colored backgrounds)
```javascript
// This is OK - white text on colored button
<button className="bg-brand text-white">Click</button>

// This needs fix - white text on light background
<button className={`bg-white/10 ${isDarkMode ? 'text-white' : 'text-black'}`}>Click</button>
```

## Automated Fix Script

Create a script to find and replace:

```bash
# Find all instances
grep -r "text-white" Frontend/src/modules/consumer/pages/*.jsx

# Replace pattern (use with caution)
find Frontend/src/modules/consumer/pages -name "*.jsx" -exec sed -i 's/className="text-white"/className={isDarkMode ? "text-white" : "text-black"}/g' {} +
```

## Status
- ✅ CSS fix approach documented
- ✅ ThemeContext update needed
- ⏳ Awaiting implementation
- 📊 Testing required after fix

---
**Recommendation:** Use CSS approach first (fastest), then manually fix any remaining issues.
