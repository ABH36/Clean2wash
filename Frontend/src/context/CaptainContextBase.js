import { createContext } from 'react';

/**
 * Base Context for Captain operations.
 * Separated to avoid Vite HMR conflicts in the Provider.
 */
const CaptainContext = createContext(null);

export default CaptainContext;
