import { toast } from 'react-hot-toast';

/**
 * Centralized error handling utility
 * Provides consistent error handling across the application
 */

export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

export const getErrorType = (error) => {
  if (!error.response) return ERROR_TYPES.NETWORK;
  
  const status = error.response.status;
  
  if (status === 401 || status === 403) return ERROR_TYPES.AUTH;
  if (status === 404) return ERROR_TYPES.NOT_FOUND;
  if (status === 409) return ERROR_TYPES.CONFLICT;
  if (status === 422 || status === 400) return ERROR_TYPES.VALIDATION;
  if (status >= 500) return ERROR_TYPES.SERVER;
  
  return ERROR_TYPES.UNKNOWN;
};

export const getErrorMessage = (error) => {
  // API error with message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // API error with error field
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  // Network error
  if (error.message === 'Network Error') {
    return 'Network connection failed. Please check your internet connection.';
  }
  
  // Timeout error
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }
  
  // Generic error message
  if (error.message) {
    return error.message;
  }
  
  return 'Something went wrong. Please try again.';
};

export const handleError = (error, context = '', options = {}) => {
  const {
    showToast = true,
    onAuthError,
    onNetworkError,
    customMessage
  } = options;
  
  console.error(`[${context}]`, error);
  
  const errorType = getErrorType(error);
  const message = customMessage || getErrorMessage(error);
  
  // Handle authentication errors
  if (errorType === ERROR_TYPES.AUTH) {
    if (showToast) {
      toast.error('Session expired. Please login again.', { id: 'auth-error' });
    }
    
    if (onAuthError) {
      onAuthError();
    } else {
      // Default: redirect to login after delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
    return;
  }
  
  // Handle network errors
  if (errorType === ERROR_TYPES.NETWORK) {
    if (showToast) {
      toast.error(message, { 
        id: 'network-error',
        duration: 4000,
        icon: '📡'
      });
    }
    
    if (onNetworkError) {
      onNetworkError();
    }
    return;
  }
  
  // Handle conflict errors (race conditions, etc.)
  if (errorType === ERROR_TYPES.CONFLICT) {
    if (showToast) {
      toast.error(message, { 
        id: 'conflict-error',
        duration: 3000,
        icon: '⚠️'
      });
    }
    return;
  }
  
  // Handle validation errors
  if (errorType === ERROR_TYPES.VALIDATION) {
    if (showToast) {
      toast.error(message, { 
        id: 'validation-error',
        duration: 3000
      });
    }
    return;
  }
  
  // Handle not found errors
  if (errorType === ERROR_TYPES.NOT_FOUND) {
    if (showToast) {
      toast.error(message, { 
        id: 'not-found-error',
        duration: 3000
      });
    }
    return;
  }
  
  // Handle server errors
  if (errorType === ERROR_TYPES.SERVER) {
    if (showToast) {
      toast.error('Server error. Our team has been notified.', { 
        id: 'server-error',
        duration: 4000,
        icon: '🔧'
      });
    }
    return;
  }
  
  // Handle unknown errors
  if (showToast) {
    toast.error(message, { 
      id: 'unknown-error',
      duration: 3000
    });
  }
};

/**
 * Async error wrapper for API calls
 * Usage: const [data, error] = await asyncHandler(apiCall());
 */
export const asyncHandler = async (promise) => {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error];
  }
};

/**
 * Retry logic for failed requests
 */
export const retryRequest = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;
      
      // Don't retry on auth or validation errors
      const errorType = getErrorType(error);
      if ([ERROR_TYPES.AUTH, ERROR_TYPES.VALIDATION].includes(errorType)) {
        throw error;
      }
      
      if (isLastAttempt) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

export default {
  handleError,
  asyncHandler,
  retryRequest,
  getErrorType,
  getErrorMessage,
  ERROR_TYPES
};
