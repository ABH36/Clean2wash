import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Power, Search, RefreshCw, CheckCircle, XCircle, AlertTriangle, X, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../../utils/adminApi';
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';

const LIBRARIES = ['places'];

const ZoneManagement = () => {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [selectedZone, setSelectedZone] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        code: '',
        status: 'active',
        services: {
            spareDriver: { enabled: true, minDrivers: 5, maxRadius: 15 },
            carWash: { enabled: true, minCaptains: 3 },
            apartmentWash: { enabled: true }
        },
        metadata: {
            city: '',
            state: '',
            country: 'India'
        }
    });

    const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 }); // Default Delhi
    const [autocomplete, setAutocomplete] = useState(null);
    
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_API_KEY,
        libraries: LIBRARIES
    });

    useEffect(() => {
        fetchZones();
    }, []);

    const fetchZones = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getZones();
            setZones(response.data.zones || []);
        } catch (error) {
            console.error('Failed to fetch zones:', error);
            toast.error('Failed to load zones');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateZone = () => {
        setSelectedZone(null);
        setFormData({
            name: '',
            displayName: '',
            code: '',
            status: 'active',
            services: {
                spareDriver: { enabled: true, minDrivers: 5, maxRadius: 15 },
                carWash: { enabled: true, minCaptains: 3 },
                apartmentWash: { enabled: true }
            },
            metadata: {
                city: '',
                state: '',
                country: 'India'
            }
        });
        setMapCenter({ lat: 28.6139, lng: 77.2090 });
        setShowForm(true);
    };

    const handleSaveZone = async () => {
        try {
            if (!formData.name || !formData.code) {
                toast.error('Please fill in required fields');
                return;
            }

            const zoneData = {
                ...formData,
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [mapCenter.lng - 0.1, mapCenter.lat - 0.1],
                        [mapCenter.lng + 0.1, mapCenter.lat - 0.1],
                        [mapCenter.lng + 0.1, mapCenter.lat + 0.1],
                        [mapCenter.lng - 0.1, mapCenter.lat + 0.1],
                        [mapCenter.lng - 0.1, mapCenter.lat - 0.1]
                    ]]
                },
                center: {
                    type: 'Point',
                    coordinates: [mapCenter.lng, mapCenter.lat]
                }
            };

            if (selectedZone) {
                await adminAPI.updateZone(selectedZone._id, zoneData);
                toast.success('Zone updated successfully');
            } else {
                await adminAPI.createZone(zoneData);
                toast.success('Zone created successfully');
            }

            setShowForm(false);
            fetchZones();
        } catch (error) {
            console.error('Failed to save zone:', error);
            toast.error(error.message || 'Failed to save zone');
        }
    };

    const handleToggleStatus = async (zoneId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await adminAPI.updateZoneStatus(zoneId, newStatus);
            toast.success('Zone status updated');
            fetchZones();
        } catch (error) {
            console.error('Failed to toggle status:', error);
            toast.error('Failed to update zone status');
        }
    };

    const handleDeleteZone = async (zoneId) => {
        if (!window.confirm('Are you sure you want to delete this zone? This will affect service availability in this area.')) return;

        try {
            await adminAPI.deleteZone(zoneId);
            toast.success('Zone deleted successfully');
            fetchZones();
        } catch (error) {
            console.error('Failed to delete zone:', error);
            toast.error('Failed to delete zone');
        }
    };

    const handleEditZone = (zone) => {
        setSelectedZone(zone);
        setFormData({
            name: zone.name || '',
            displayName: zone.displayName || '',
            code: zone.code || '',
            status: zone.status || 'active',
            services: {
                spareDriver: zone.services?.spareDriver || { enabled: true, minDrivers: 5, maxRadius: 15 },
                carWash: zone.services?.carWash || { enabled: true, minCaptains: 3 },
                apartmentWash: zone.services?.apartmentWash || { enabled: true }
            },
            metadata: {
                city: zone.metadata?.city || '',
                state: zone.metadata?.state || '',
                country: zone.metadata?.country || 'India'
            }
        });
        
        if (zone.center?.coordinates) {
            setMapCenter({
                lat: zone.center.coordinates[1],
                lng: zone.center.coordinates[0]
            });
        }
        setShowForm(true);
    };

    const fetchAddressDetails = (lat, lng) => {
        if (!window.google) return;
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                let city = '', state = '', country = 'India';
                
                // Better address component parsing
                const components = results[0].address_components;
                for (const component of components) {
                    if (component.types.includes('locality')) {
                        city = component.long_name;
                    } else if (component.types.includes('administrative_area_level_2') && !city) {
                        city = component.long_name;
                    } else if (component.types.includes('administrative_area_level_1')) {
                        state = component.long_name;
                    } else if (component.types.includes('country')) {
                        country = component.long_name;
                    }
                }

                setFormData(prev => {
                    const newCity = city || prev.metadata.city || 'Unknown';
                    const citySlug = newCity.toLowerCase().replace(/\s+/g, '-');
                    
                    // Suggest values if current values are empty or still the old suggestions
                    const suggestedName = !prev.name || prev.name.includes('-') ? citySlug : prev.name;
                    const suggestedDisplayName = !prev.displayName || prev.displayName.includes('Service Zone') ? `${newCity} Service Zone` : prev.displayName;
                    const suggestedCode = !prev.code || prev.code.length === 6 ? (newCity.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 900 + 100)) : prev.code;

                    return {
                        ...prev,
                        name: suggestedName,
                        displayName: suggestedDisplayName,
                        code: suggestedCode,
                        metadata: {
                            ...prev.metadata,
                            city: newCity,
                            state: state || prev.metadata.state,
                            country: country
                        }
                    };
                });
            }
        });
    };

    const onPlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setMapCenter({ lat, lng });
                fetchAddressDetails(lat, lng);
            }
        }
    };

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            const loadingToast = toast.loading('Locating your position...');
            navigator.geolocation.getCurrentPosition((pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setMapCenter({ lat, lng });
                fetchAddressDetails(lat, lng);
                toast.dismiss(loadingToast);
                toast.success('Location detected');
            }, (err) => {
                toast.dismiss(loadingToast);
                toast.error('Location access denied');
            });
        }
    };

    const filteredZones = zones.filter(zone => {
        const matchesSearch = zone.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            zone.code?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || zone.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const badges = {
            active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
            inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
            maintenance: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Maintenance' },
            coming_soon: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Coming Soon' }
        };
        return badges[status] || badges.inactive;
    };

    return (
        <div className='p-6 max-w-7xl mx-auto bg-[var(--bg)] min-h-screen'>
            <div className='mb-6'>
                <h1 className='text-2xl font-bold text-[var(--text-primary)] mb-2'>Service Zone Management</h1>
                <p className='text-sm text-[var(--text-secondary)]'>Control where your app is available and operational</p>
            </div>

            <div className='bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] p-4 mb-6'>
                <div className='flex items-center justify-between gap-4'>
                    <div className='flex items-center gap-3 flex-1'>
                        <div className='relative flex-1 max-w-md'>
                            <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]' size={18} />
                            <input
                                type='text'
                                placeholder='Search zones...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='w-full pl-12 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all'
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all'
                        >
                            <option value='all'>All Status</option>
                            <option value='active'>Active</option>
                            <option value='inactive'>Inactive</option>
                            <option value='maintenance'>Maintenance</option>
                            <option value='coming_soon'>Coming Soon</option>
                        </select>
                        <button
                            onClick={fetchZones}
                            className='p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors'
                            title='Refresh'
                        >
                            <RefreshCw size={18} className='text-[var(--text-secondary)]' />
                        </button>
                    </div>
                    <button
                        onClick={handleCreateZone}
                        className='flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors'
                    >
                        <Plus size={18} />
                        Create Zone
                    </button>
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                <div className='bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-[var(--text-secondary)]'>Total Zones</p>
                            <p className='text-2xl font-bold text-[var(--text-primary)]'>{zones.length}</p>
                        </div>
                        <MapPin className='text-[var(--primary)]' size={32} />
                    </div>
                </div>
                <div className='bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-[var(--text-secondary)]'>Active Zones</p>
                            <p className='text-2xl font-bold text-green-500'>{zones.filter(z => z.status === 'active').length}</p>
                        </div>
                        <CheckCircle className='text-green-500' size={32} />
                    </div>
                </div>
                <div className='bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-[var(--text-secondary)]'>Inactive Zones</p>
                            <p className='text-2xl font-bold text-[var(--text-muted)]'>{zones.filter(z => z.status === 'inactive').length}</p>
                        </div>
                        <XCircle className='text-[var(--text-muted)]' size={32} />
                    </div>
                </div>
                <div className='bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-[var(--text-secondary)]'>Maintenance</p>
                            <p className='text-2xl font-bold text-orange-500'>{zones.filter(z => z.status === 'maintenance').length}</p>
                        </div>
                        <AlertTriangle className='text-orange-500' size={32} />
                    </div>
                </div>
            </div>

            <div className='bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden'>
                {loading ? (
                    <div className='flex items-center justify-center py-12'>
                        <RefreshCw className='animate-spin text-blue-600' size={32} />
                    </div>
                ) : filteredZones.length === 0 ? (
                    <div className='text-center py-12'>
                        <MapPin className='mx-auto text-gray-400 mb-4' size={48} />
                        <p className='text-gray-600'>No zones found</p>
                        <button
                            onClick={handleCreateZone}
                            className='mt-4 text-blue-600 hover:text-blue-700 font-medium'
                        >
                            Create your first zone
                        </button>
                    </div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full'>
                            <thead className='bg-[var(--bg-secondary)] border-b border-[var(--border)]'>
                                <tr>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase'>Zone</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase'>Code</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase'>Location</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase'>Status</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase'>Services</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-[var(--border)]'>
                                {filteredZones.map((zone) => {
                                    const statusBadge = getStatusBadge(zone.status);
                                    return (
                                        <tr key={zone._id} className='hover:bg-[var(--bg-secondary)]/50 transition-colors'>
                                            <td className='px-6 py-4'>
                                                <div className='flex items-center gap-2'>
                                                    <MapPin size={16} className='text-[var(--text-muted)]' />
                                                    <div>
                                                        <p className='font-medium text-[var(--text-primary)]'>{zone.displayName}</p>
                                                        <p className='text-sm text-[var(--text-secondary)]'>{zone.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4'>
                                                <span className='font-mono text-sm text-[var(--text-secondary)]'>{zone.code}</span>
                                            </td>
                                            <td className='px-6 py-4'>
                                                <p className='text-sm text-[var(--text-primary)]'>{zone.metadata?.city || 'N/A'}</p>
                                                <p className='text-xs text-[var(--text-secondary)]'>{zone.metadata?.state}</p>
                                            </td>
                                            <td className='px-6 py-4'>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                                                    {statusBadge.label}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4'>
                                                <div className='flex gap-1'>
                                                    {zone.services?.spareDriver?.enabled && (
                                                        <span className='px-2 py-1 text-xs bg-[var(--primary)]/10 text-[var(--primary)] rounded'>Driver</span>
                                                    )}
                                                    {zone.services?.carWash?.enabled && (
                                                        <span className='px-2 py-1 text-xs bg-purple-500/10 text-purple-500 rounded'>Wash</span>
                                                    )}
                                                    {zone.services?.apartmentWash?.enabled && (
                                                        <span className='px-2 py-1 text-xs bg-emerald-500/10 text-emerald-500 rounded'>Apt</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4'>
                                                <div className='flex items-center gap-2'>
                                                    <button
                                                        onClick={() => handleEditZone(zone)}
                                                        className='p-2 hover:bg-[var(--bg-secondary)] rounded transition-colors'
                                                        title='Edit Zone'
                                                    >
                                                        <Edit size={16} className='text-[var(--primary)]' />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(zone._id, zone.status)}
                                                        className='p-2 hover:bg-[var(--bg-secondary)] rounded transition-colors'
                                                        title={zone.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <Power size={16} className={zone.status === 'active' ? 'text-green-500' : 'text-[var(--text-muted)]'} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteZone(zone._id)}
                                                        className='p-2 hover:bg-[var(--bg-secondary)] rounded transition-colors'
                                                        title='Delete'
                                                    >
                                                        <Trash2 size={16} className='text-red-500' />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Zone Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
                        onClick={() => setShowForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className='bg-[var(--card)] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border)]'
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className='p-6 overflow-y-auto'>
                                <div className='flex items-center justify-between mb-6'>
                                    <h2 className='text-xl font-bold text-[var(--text-primary)]'>
                                        {selectedZone ? 'Edit Zone' : 'Create New Zone'}
                                    </h2>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className='p-2 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)]'
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className='space-y-4'>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <label className='block text-sm font-medium text-[var(--text-secondary)] mb-1'>
                                                Zone Name *
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                className='w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]'
                                                placeholder='e.g., delhi-central'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-[var(--text-secondary)] mb-1'>
                                                Display Name *
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.displayName}
                                                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                                                className='w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]'
                                                placeholder='e.g., Central Delhi'
                                            />
                                        </div>
                                    </div>

                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <label className='block text-sm font-medium text-[var(--text-secondary)] mb-1'>
                                                Zone Code *
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.code}
                                                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                                className='w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono'
                                                placeholder='e.g., DEL001'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-[var(--text-secondary)] mb-1'>
                                                Status
                                            </label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                                                className='w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm text-[var(--text-primary)]'
                                            >
                                                <option value='active'>Active</option>
                                                <option value='inactive'>Inactive</option>
                                                <option value='maintenance'>Maintenance</option>
                                                <option value='coming_soon'>Coming Soon</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Map Selection Section */}
                                    <div className='space-y-3'>
                                        <div className='flex items-center justify-between'>
                                            <label className='block text-sm font-medium text-[var(--text-secondary)]'>
                                                Zone Center & Area Selection
                                            </label>
                                            <button 
                                                onClick={handleLocateMe}
                                                className='flex items-center gap-1 text-xs text-[var(--primary)] hover:opacity-80 font-bold'
                                            >
                                                <Navigation size={12} /> Detect Current
                                            </button>
                                        </div>
                                        
                                        <div className='relative h-[300px] rounded-xl overflow-hidden border border-[var(--border)]'>
                                            {isLoaded ? (
                                                <>
                                                    <div className='absolute top-3 left-3 right-3 z-10'>
                                                        <Autocomplete
                                                            onLoad={setAutocomplete}
                                                            onPlaceChanged={onPlaceChanged}
                                                        >
                                                            <div className='relative'>
                                                                <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]' size={16} />
                                                                <input
                                                                    type='text'
                                                                    placeholder='Search area to auto-fill details...'
                                                                    className='w-full pl-12 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all'
                                                                />
                                                            </div>
                                                        </Autocomplete>
                                                    </div>
                                                    <GoogleMap
                                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                                        center={mapCenter}
                                                        zoom={12}
                                                        onClick={(e) => {
                                                            const lat = e.latLng.lat();
                                                            const lng = e.latLng.lng();
                                                            setMapCenter({ lat, lng });
                                                            fetchAddressDetails(lat, lng);
                                                        }}
                                                        options={{
                                                            disableDefaultUI: true,
                                                            zoomControl: true,
                                                        }}
                                                    >
                                                        <Marker 
                                                            position={mapCenter} 
                                                            draggable 
                                                            onDragEnd={(e) => {
                                                                const lat = e.latLng.lat();
                                                                const lng = e.latLng.lng();
                                                                setMapCenter({ lat, lng });
                                                                fetchAddressDetails(lat, lng);
                                                            }} 
                                                        />
                                                    </GoogleMap>
                                                </>
                                            ) : (
                                                <div className='w-full h-full bg-gray-100 flex items-center justify-center text-gray-400'>
                                                    Loading Map...
                                                </div>
                                            )}
                                        </div>
                                        <p className='text-[10px] text-gray-500 italic'>Click or drag marker to set precise zone center. Polygon boundary is auto-generated around center.</p>
                                    </div>

                                    <div className='grid grid-cols-3 gap-4'>
                                        <div>
                                            <label className='block text-sm font-medium text-[var(--text-secondary)] mb-1'>
                                                City
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.metadata.city}
                                                onChange={(e) => setFormData({
                                                    ...formData, 
                                                    metadata: {...formData.metadata, city: e.target.value}
                                                })}
                                                className='w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]'
                                                placeholder='e.g., Delhi'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-[var(--text-secondary)] mb-1'>
                                                State
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.metadata.state}
                                                onChange={(e) => setFormData({
                                                    ...formData, 
                                                    metadata: {...formData.metadata, state: e.target.value}
                                                })}
                                                className='w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]'
                                                placeholder='e.g., Delhi'
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-[var(--text-secondary)] mb-1'>
                                                Country
                                            </label>
                                            <input
                                                type='text'
                                                value={formData.metadata.country}
                                                onChange={(e) => setFormData({
                                                    ...formData, 
                                                    metadata: {...formData.metadata, country: e.target.value}
                                                })}
                                                className='w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]'
                                                placeholder='India'
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className='text-lg font-medium text-[var(--text-primary)] mb-3'>Service Configuration</h3>
                                        <div className='space-y-3'>
                                            <div className='flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]'>
                                                <div>
                                                    <h4 className='font-medium text-[var(--text-primary)]'>Spare Driver Service</h4>
                                                    <p className='text-sm text-[var(--text-secondary)]'>Point-to-point and hourly driver service</p>
                                                </div>
                                                <label className='flex items-center'>
                                                    <input
                                                        type='checkbox'
                                                        checked={formData.services.spareDriver.enabled}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            services: {
                                                                ...formData.services,
                                                                spareDriver: {
                                                                    ...formData.services.spareDriver,
                                                                    enabled: e.target.checked
                                                                }
                                                            }
                                                        })}
                                                        className='sr-only'
                                                    />
                                                    <div className={`w-11 h-6 rounded-full transition-colors ${formData.services.spareDriver.enabled ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}>
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${formData.services.spareDriver.enabled ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}></div>
                                                    </div>
                                                </label>
                                            </div>

                                            <div className='flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]'>
                                                <div>
                                                    <h4 className='font-medium text-[var(--text-primary)]'>Car Wash Service</h4>
                                                    <p className='text-sm text-[var(--text-secondary)]'>Doorstep car washing and detailing</p>
                                                </div>
                                                <label className='flex items-center'>
                                                    <input
                                                        type='checkbox'
                                                        checked={formData.services.carWash.enabled}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            services: {
                                                                ...formData.services,
                                                                carWash: {
                                                                    ...formData.services.carWash,
                                                                    enabled: e.target.checked
                                                                }
                                                            }
                                                        })}
                                                        className='sr-only'
                                                    />
                                                    <div className={`w-11 h-6 rounded-full transition-colors ${formData.services.carWash.enabled ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}>
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${formData.services.carWash.enabled ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}></div>
                                                    </div>
                                                </label>
                                            </div>

                                            <div className='flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]'>
                                                <div>
                                                    <h4 className='font-medium text-[var(--text-primary)]'>Apartment Wash</h4>
                                                    <p className='text-sm text-[var(--text-secondary)]'>Apartment complex washing service</p>
                                                </div>
                                                <label className='flex items-center'>
                                                    <input
                                                        type='checkbox'
                                                        checked={formData.services.apartmentWash.enabled}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            services: {
                                                                ...formData.services,
                                                                apartmentWash: {
                                                                    ...formData.services.apartmentWash,
                                                                    enabled: e.target.checked
                                                                }
                                                            }
                                                        })}
                                                        className='sr-only'
                                                    />
                                                    <div className={`w-11 h-6 rounded-full transition-colors ${formData.services.apartmentWash.enabled ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}>
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${formData.services.apartmentWash.enabled ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}></div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='flex items-center justify-end gap-3 p-6 border-t border-[var(--border)] bg-[var(--bg-secondary)]/30'>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className='px-6 py-2 border border-[var(--border)] rounded-lg text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-secondary)] transition-all'
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveZone}
                                        className='px-8 py-2 bg-[var(--primary)] text-white rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[var(--primary)]/20'
                                    >
                                        {selectedZone ? 'Update Zone' : 'Create Zone'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ZoneManagement;
