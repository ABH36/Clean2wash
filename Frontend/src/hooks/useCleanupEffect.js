import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hooks for managing side effects with automatic cleanup
 * Prevents memory leaks from timers, intervals, and animation frames
 */

/**
 * useInterval with automatic cleanup
 */
export const useInterval = (callback, delay, immediate = false) => {
  const savedCallback = useRef();
  const intervalIdRef = useRef(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    // Execute immediately if requested
    if (immediate) {
      tick();
    }

    intervalIdRef.current = setInterval(tick, delay);

    // Cleanup
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [delay, immediate]);

  // Return function to manually clear interval
  const clear = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  return clear;
};

/**
 * useTimeout with automatic cleanup
 */
export const useTimeout = (callback, delay) => {
  const savedCallback = useRef();
  const timeoutIdRef = useRef(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timeout
  useEffect(() => {
    if (delay === null) return;

    timeoutIdRef.current = setTimeout(() => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }, delay);

    // Cleanup
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [delay]);

  // Return function to manually clear timeout
  const clear = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  return clear;
};

/**
 * useAnimationFrame with automatic cleanup
 */
export const useAnimationFrame = (callback, deps = []) => {
  const frameIdRef = useRef(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;

    const animate = (timestamp) => {
      if (!isActiveRef.current) return;

      callback(timestamp);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      isActiveRef.current = false;
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, deps);

  // Return function to manually cancel animation
  const cancel = useCallback(() => {
    isActiveRef.current = false;
    if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
  }, []);

  return cancel;
};

/**
 * useDebounce with automatic cleanup
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * useThrottle with automatic cleanup
 */
export const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRanRef = useRef(Date.now());
  const timeoutRef = useRef(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRanRef.current;

    if (timeSinceLastRun >= limit) {
      setThrottledValue(value);
      lastRanRef.current = now;
    } else {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        setThrottledValue(value);
        lastRanRef.current = Date.now();
      }, limit - timeSinceLastRun);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, limit]);

  return throttledValue;
};

/**
 * useEventListener with automatic cleanup
 */
export const useEventListener = (eventName, handler, element = window, options = {}) => {
  const savedHandler = useRef();

  // Remember the latest handler
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Make sure element supports addEventListener
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    // Create event listener that calls handler function stored in ref
    const eventListener = (event) => {
      if (savedHandler.current) {
        savedHandler.current(event);
      }
    };

    // Add event listener
    element.addEventListener(eventName, eventListener, options);

    // Cleanup
    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
};

/**
 * useAbortController for cancelling fetch requests
 */
export const useAbortController = () => {
  const abortControllerRef = useRef(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const getSignal = useCallback(() => {
    return abortControllerRef.current?.signal;
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
    }
  }, []);

  return { getSignal, abort };
};

/**
 * useCleanupCallback - ensures callback is called on unmount
 */
export const useCleanupCallback = (callback) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (callbackRef.current) {
        callbackRef.current();
      }
    };
  }, []);
};

/**
 * useMountedState - tracks if component is mounted
 */
export const useMountedState = () => {
  const mountedRef = useRef(false);
  const isMounted = useCallback(() => mountedRef.current, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return isMounted;
};

export default {
  useInterval,
  useTimeout,
  useAnimationFrame,
  useDebounce,
  useThrottle,
  useEventListener,
  useAbortController,
  useCleanupCallback,
  useMountedState
};
