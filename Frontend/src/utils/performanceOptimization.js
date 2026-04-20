import React from 'react';

/**
 * Performance optimization utilities
 * Provides helpers for React.memo, virtualization, and lazy loading
 */

/**
 * Deep comparison for React.memo
 */
export const deepEqual = (prevProps, nextProps) => {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
};

/**
 * Shallow comparison for React.memo (default behavior)
 */
export const shallowEqual = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (let key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};

/**
 * Custom comparison for specific props
 */
export const compareProps = (propsToCompare) => (prevProps, nextProps) => {
  for (let prop of propsToCompare) {
    if (prevProps[prop] !== nextProps[prop]) {
      return false;
    }
  }
  return true;
};

/**
 * Memoize component with custom comparison
 */
export const memoize = (Component, compare = shallowEqual) => {
  return React.memo(Component, (prevProps, nextProps) => {
    return compare(prevProps, nextProps);
  });
};

/**
 * Virtualization helper for large lists
 */
export class VirtualList {
  constructor(options = {}) {
    this.itemHeight = options.itemHeight || 100;
    this.containerHeight = options.containerHeight || 600;
    this.overscan = options.overscan || 3;
    this.items = options.items || [];
  }

  getVisibleRange(scrollTop) {
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan);
    const endIndex = Math.min(
      this.items.length - 1,
      Math.ceil((scrollTop + this.containerHeight) / this.itemHeight) + this.overscan
    );

    return { startIndex, endIndex };
  }

  getItemStyle(index) {
    return {
      position: 'absolute',
      top: index * this.itemHeight,
      height: this.itemHeight,
      width: '100%'
    };
  }

  getTotalHeight() {
    return this.items.length * this.itemHeight;
  }

  getVisibleItems(scrollTop) {
    const { startIndex, endIndex } = this.getVisibleRange(scrollTop);
    return this.items.slice(startIndex, endIndex + 1).map((item, i) => ({
      item,
      index: startIndex + i,
      style: this.getItemStyle(startIndex + i)
    }));
  }
}

/**
 * Pagination helper
 */
export class Paginator {
  constructor(items, pageSize = 20) {
    this.items = items;
    this.pageSize = pageSize;
    this.currentPage = 1;
  }

  get totalPages() {
    return Math.ceil(this.items.length / this.pageSize);
  }

  get hasNextPage() {
    return this.currentPage < this.totalPages;
  }

  get hasPrevPage() {
    return this.currentPage > 1;
  }

  getCurrentPage() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.items.slice(start, end);
  }

  nextPage() {
    if (this.hasNextPage) {
      this.currentPage++;
    }
    return this.getCurrentPage();
  }

  prevPage() {
    if (this.hasPrevPage) {
      this.currentPage--;
    }
    return this.getCurrentPage();
  }

  goToPage(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
    return this.getCurrentPage();
  }
}

/**
 * Lazy load images
 */
export const lazyLoadImage = (src, placeholder = '') => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(src);
    img.onerror = () => resolve(placeholder);
  });
};

/**
 * Intersection Observer for lazy loading
 */
export const createLazyLoader = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01
  };

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
      }
    });
  }, { ...defaultOptions, ...options });
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Request Animation Frame throttle
 */
export const rafThrottle = (func) => {
  let rafId = null;
  return function executedFunction(...args) {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
};

/**
 * Batch updates
 */
export class BatchUpdater {
  constructor(callback, delay = 100) {
    this.callback = callback;
    this.delay = delay;
    this.queue = [];
    this.timeoutId = null;
  }

  add(item) {
    this.queue.push(item);
    this.scheduleFlush();
  }

  scheduleFlush() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush() {
    if (this.queue.length > 0) {
      this.callback(this.queue);
      this.queue = [];
    }
    this.timeoutId = null;
  }

  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.queue = [];
  }
}

/**
 * Measure component render time
 */
export const measureRenderTime = (componentName) => {
  return (Component) => {
    return React.forwardRef((props, ref) => {
      const startTime = performance.now();

      React.useEffect(() => {
        const endTime = performance.now();
        console.log(`[Performance] ${componentName} rendered in ${(endTime - startTime).toFixed(2)}ms`);
      });

      return <Component {...props} ref={ref} />;
    });
  };
};

/**
 * Optimize re-renders by tracking prop changes
 */
export const trackPropChanges = (componentName) => {
  return (Component) => {
    return React.memo((props) => {
      const prevPropsRef = React.useRef(props);

      React.useEffect(() => {
        const changedProps = Object.keys(props).filter(
          key => props[key] !== prevPropsRef.current[key]
        );

        if (changedProps.length > 0) {
          console.log(`[${componentName}] Props changed:`, changedProps);
        }

        prevPropsRef.current = props;
      });

      return <Component {...props} />;
    });
  };
};

/**
 * Cache expensive calculations
 */
export class MemoCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    return this.cache.get(JSON.stringify(key));
  }

  set(key, value) {
    const stringKey = JSON.stringify(key);

    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(stringKey, value);
  }

  has(key) {
    return this.cache.has(JSON.stringify(key));
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * Memoize expensive function calls
 */
export const memoizeFunction = (fn, cacheSize = 100) => {
  const cache = new MemoCache(cacheSize);

  return (...args) => {
    if (cache.has(args)) {
      return cache.get(args);
    }

    const result = fn(...args);
    cache.set(args, result);
    return result;
  };
};

export default {
  deepEqual,
  shallowEqual,
  compareProps,
  memoize,
  VirtualList,
  Paginator,
  lazyLoadImage,
  createLazyLoader,
  debounce,
  throttle,
  rafThrottle,
  BatchUpdater,
  measureRenderTime,
  trackPropChanges,
  MemoCache,
  memoizeFunction
};
