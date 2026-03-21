import { useContext } from 'react';
import LocationContext from '../context/LocationContextBase';

export const useGeoLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useGeoLocation must be used within a LocationProvider');
    }
    return context;
};
