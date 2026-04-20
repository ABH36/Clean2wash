# Frontend Bug Fixes - Quick Reference Guide

## 🚀 Quick Start

### Import the Utilities
```javascript
// Error handling
import { handleError, asyncHandler, retryRequest } from '../utils/errorHandler';

// Socket management
import { useSocketConnection, useBookingSocket } from '../hooks/useSocketConnection';

// Cleanup hooks
import { useInterval, useTimeout, useAnimationFrame } from '../hooks/useCleanupEffect';

// Performance
import { memoize, VirtualList, debounce, throttle } from '../utils/performanceOptimization';
```

---

## 📋 Common Patterns

### 1. API Call with Error Handling

```javascript
// Pattern 1: Try-Catch
try {
  const response = await apiCall();
  // Handle success
} catch (error) {
  handleError(error, 'ComponentName');
}

// Pattern 2: Async Handler
const [data, error] = await asyncHandler(apiCall());
if (error) {
  handleError(error, 'ComponentName');
  return;
}
// Use data

// Pattern 3: With Retry
const data = await retryRequest(() => apiCall(), 3, 1000);
```

---

### 2. Socket Connection

```javascript
// For booking tracking
const socket = useBookingSocket(bookingId, {
  onStatusUpdate: (data) => {
    setBookingStatus(data.status);
  },
  onLocationUpdate: (data) => {
    setDriverLocation(data.location);
  },
  onDriverAssigned: (data) => {
    setDriver(data.driver);
  }
});

// Custom socket usage
const socket = useSocketConnection({
  autoConnect: true,
  bookingId: '123',
  userId: 'user123',
  onConnect: () => console.log('Connected'),
  onDisconnect: (reason) => console.log('Disconnected:', reason)
});

// Manual control
socket.connect();
socket.disconnect();
socket.emit('event', data);
socket.on('event', handler);
```

---

### 3. Timers and Intervals

```javascript
// Interval (runs repeatedly)
useInterval(() => {
  updateTime();
}, 1000); // Every 1 second

// Timeout (runs once)
useTimeout(() => {
  showMessage();
}, 5000); // After 5 seconds

// Animation frame
useAnimationFrame((timestamp) => {
  updateAnimation(timestamp);
});

// With manual control
const clearTimer = useInterval(() => {
  updateTime();
}, 1000);

// Later...
clearTimer(); // Stop the interval
```

---

### 4. Debounce and Throttle

```javascript
// Debounce (wait for user to stop typing)
const debouncedSearch = debounce((query) => {
  searchAPI(query);
}, 300);

// Usage
<input onChange={(e) => debouncedSearch(e.target.value)} />

// Throttle (limit execution rate)
const throttledScroll = throttle(() => {
  handleScroll();
}, 100);

// Usage
<div onScroll={throttledScroll}>...</div>
```

---

### 5. Large Lists (Virtualization)

```javascript
import { FixedSizeList } from 'react-window';

const VehicleList = ({ vehicles }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={vehicles.length}
      itemSize={120}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <VehicleCard vehicle={vehicles[index]} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

---

### 6. Memoize Components

```javascript
import { memoize, compareProps } from '../utils/performanceOptimization';

// Basic memoization
const ItemCard = ({ item }) => {
  return <div>{item.name}</div>;
};

export default memoize(ItemCard);

// Custom comparison
export default memoize(ItemCard, (prev, next) => {
  return prev.item.id === next.item.id;
});

// Compare specific props
export default memoize(ItemCard, compareProps(['item.id', 'isSelected']));
```

---

### 7. Event Listeners

```javascript
import { useEventListener } from '../hooks/useCleanupEffect';

// Window event
useEventListener('resize', () => {
  handleResize();
});

// Element event
const ref = useRef(null);
useEventListener('click', handleClick, ref.current);

// With options
useEventListener('scroll', handleScroll, window, { passive: true });
```

---

### 8. Abort Fetch Requests

```javascript
import { useAbortController } from '../hooks/useCleanupEffect';

const MyComponent = () => {
  const { getSignal, abort } = useAbortController();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data', {
        signal: getSignal()
      });
      const data = await response.json();
      // Use data
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
      } else {
        handleError(error, 'MyComponent');
      }
    }
  };

  // Cancel on button click
  const handleCancel = () => {
    abort();
  };

  return <button onClick={handleCancel}>Cancel</button>;
};
```

---

### 9. Check if Component is Mounted

```javascript
import { useMountedState } from '../hooks/useCleanupEffect';

const MyComponent = () => {
  const isMounted = useMountedState();

  const fetchData = async () => {
    const data = await apiCall();
    
    // Only update state if still mounted
    if (isMounted()) {
      setData(data);
    }
  };

  return <div>...</div>;
};
```

---

### 10. Lazy Load Images

```javascript
import { lazyLoadImage, createLazyLoader } from '../utils/performanceOptimization';

// Single image
const loadImage = async () => {
  const src = await lazyLoadImage(
    'https://example.com/image.jpg',
    '/placeholder.jpg'
  );
  setImageSrc(src);
};

// Multiple images with Intersection Observer
useEffect(() => {
  const loader = createLazyLoader((element) => {
    const src = element.dataset.src;
    element.src = src;
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    loader.observe(img);
  });

  return () => loader.disconnect();
}, []);
```

---

## 🐛 Common Mistakes to Avoid

### ❌ Don't Do This:

```javascript
// 1. No cleanup
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  // Missing cleanup!
}, []);

// 2. Creating objects in render
<Component data={{ id: 1 }} /> // New object every render

// 3. Inconsistent error handling
try { ... } catch (e) { alert(e.message) }

// 4. Not checking if mounted
const fetchData = async () => {
  const data = await apiCall();
  setState(data); // Component might be unmounted!
};

// 5. Rendering all items
{items.map(item => <Item />)} // Slow with 1000+ items
```

### ✅ Do This Instead:

```javascript
// 1. Always cleanup
useInterval(() => {}, 1000); // Automatic cleanup

// 2. Memoize objects
const data = useMemo(() => ({ id: 1 }), []);
<Component data={data} />

// 3. Consistent error handling
try { ... } catch (e) { handleError(e, 'Component') }

// 4. Check if mounted
const isMounted = useMountedState();
const fetchData = async () => {
  const data = await apiCall();
  if (isMounted()) setState(data);
};

// 5. Virtualize large lists
<VirtualList items={items} />
```

---

## 🧪 Testing Checklist

### Before Committing:
- [ ] No console errors
- [ ] No memory leaks (check DevTools)
- [ ] Socket disconnects properly
- [ ] Timers are cleared
- [ ] Error handling works
- [ ] Performance is acceptable
- [ ] Mobile responsive

### Memory Leak Check:
```javascript
// 1. Open Chrome DevTools
// 2. Go to Memory tab
// 3. Take heap snapshot
// 4. Use the app
// 5. Take another snapshot
// 6. Compare - memory should be stable
```

### Socket Check:
```javascript
// 1. Open Network tab
// 2. Filter by WS (WebSocket)
// 3. Navigate through app
// 4. Check connections are closed
// 5. No lingering connections
```

---

## 📊 Performance Benchmarks

### Target Metrics:
- **Initial Load**: < 500ms
- **Time to Interactive**: < 1s
- **Re-renders**: < 3 per action
- **Scroll FPS**: 60fps
- **Memory Growth**: < 10MB per hour

### How to Measure:
```javascript
// 1. Open Chrome DevTools
// 2. Go to Performance tab
// 3. Click Record
// 4. Interact with app
// 5. Stop recording
// 6. Analyze results
```

---

## 🔍 Debugging Tips

### Find Memory Leaks:
```javascript
// Add to component
useEffect(() => {
  console.log('Component mounted');
  return () => {
    console.log('Component unmounted');
  };
}, []);

// If "unmounted" doesn't log, there's a leak!
```

### Track Re-renders:
```javascript
import { trackPropChanges } from '../utils/performanceOptimization';

export default trackPropChanges('ComponentName')(MyComponent);

// Check console for prop changes
```

### Measure Render Time:
```javascript
import { measureRenderTime } from '../utils/performanceOptimization';

export default measureRenderTime('ComponentName')(MyComponent);

// Check console for render times
```

---

## 📚 Additional Resources

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [React Window](https://react-window.vercel.app/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)

---

## 🆘 Need Help?

### Common Issues:

**Q: Socket not connecting?**
A: Check if token is valid and server is running

**Q: Memory still growing?**
A: Check for event listeners and timers without cleanup

**Q: List still slow?**
A: Use virtualization with react-window

**Q: Too many re-renders?**
A: Use React.memo and useMemo

**Q: Error handling not working?**
A: Make sure to import handleError correctly

---

**Keep this guide handy for quick reference!** 📖
