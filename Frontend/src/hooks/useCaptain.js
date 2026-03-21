import { useContext } from 'react';
import CaptainContext from '../context/CaptainContextBase';

/**
 * Hook to access Captain context.
 * Separated to avoid Vite HMR conflicts.
 */
export const useCaptain = () => {
    const context = useContext(CaptainContext);
    if (!context) {
        throw new Error('useCaptain must be used within a CaptainProvider');
    }
    return context;
};

export default useCaptain;
