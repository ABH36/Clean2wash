import React, { useState, useEffect, useMemo } from 'react';
import { 
    MapPin, Plus, Edit, Trash2, Power, Search, RefreshCw, 
    CheckCircle, XCircle, AlertTriangle, X, Navigation, 
    Globe, Shield, Zap, Car, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../../utils/adminApi';
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import PageShell, { SectionCard, FilterBar, SearchBox, PageLoader } from '../../components/PageShell';

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
                const components = results[0].address_components;
                for (const component of components) {
                    if (component.types.includes('locality')) city = component.long_name;
                    else if (component.types.includes('administrative_area_level_2') && !city) city = component.long_name;
                    else if (component.types.includes('administrative_area_level_1')) state = component.long_name;
                    else if (component.types.includes('country')) country = component.long_name;
                }

                setFormData(prev => {
                    const newCity = city || prev.metadata.city || 'Unknown';
                    const citySlug = newCity.toLowerCase().replace(/\s+/g, '-');
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
            const loadingToast = toast.loading('Locating current cluster...');
            navigator.geolocation.getCurrentPosition((pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setMapCenter({ lat, lng });
                fetchAddressDetails(lat, lng);
                toast.dismiss(loadingToast);
                toast.success('Cluster synchronized');
            }, (err) => {
                toast.dismiss(loadingToast);
                toast.error('Sensor access denied');
            });
        }
    };

    const filteredZones = useMemo(() => zones.filter(zone => {
        const matchesSearch = zone.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            zone.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            zone.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || zone.status === statusFilter;
        return matchesSearch && matchesStatus;
    }), [zones, searchTerm, statusFilter]);

    const getStatusBadge = (status) => {
        const map = {
            active: 'adm-badge-success',
            inactive: 'adm-badge-navy',
            maintenance: 'adm-badge-amber',
            coming_soon: 'adm-badge-info'
        };
        return map[status] || 'adm-badge-navy';
    };

    return (
        <PageShell
            title="Operational Grids"
            subtitle="Geospatial zone management and service availability matrix"
            icon={Globe}
            accent="navy"
            badge="Geo-Core v2"
            actions={
                <button
                    onClick={handleCreateZone}
                    className="adm-btn adm-btn-primary h-11 px-6 flex items-center gap-2"
                >
                    <Plus size={18} /> Deploy New Zone
                </button>
            }
        >
            <div className="space-y-8">
                {/* ── PERFORMANCE METRICS ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Grids', value: zones.filter(z => z.status === 'active').length, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                        { label: 'Total Units', value: zones.length, icon: MapPin, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                        { label: 'Under Maintenance', value: zones.filter(z => z.status === 'maintenance').length, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
                        { label: 'Expansion Nodes', value: zones.filter(z => z.status === 'coming_soon').length, icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' }
                    ].map((stat, i) => (
                        <div key={i} className={`p-6 rounded-[2rem] border border-slate-100 ${stat.bg} relative overflow-hidden group`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${stat.color}`}>{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                            <stat.icon className={`absolute -bottom-4 -right-4 w-16 h-16 opacity-[0.05] transition-transform group-hover:scale-110 ${stat.color}`} />
                        </div>
                    ))}
                </div>

                <FilterBar>
                    <SearchBox 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="Search geospatial index..." 
                    />
                    <div className="ml-auto flex items-center gap-3">
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value)}
                            className="h-11 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-amber-500 transition-all"
                        >
                            <option value="all">All Status Modes</option>
                            <option value="active">Active Fleet</option>
                            <option value="inactive">Deactivated</option>
                            <option value="maintenance">In-Service</option>
                            <option value="coming_soon">Planned Grid</option>
                        </select>
                        <button 
                            onClick={fetchZones}
                            className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </FilterBar>

                {loading ? (
                    <PageLoader />
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {filteredZones.map((zone, i) => (
                            <motion.div
                                key={zone._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="adm-card group hover:border-amber-500 transition-all flex flex-col overflow-hidden"
                            >
                                <div className="h-40 bg-slate-100 flex items-center justify-center relative">
                                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                    <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-900 group-hover:scale-110 transition-transform">
                                        <MapPin size={32} />
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <div className={`adm-badge ${getStatusBadge(zone.status)}`}>{zone.status}</div>
                                    </div>
                                    <div className="absolute top-4 right-4 flex gap-2 translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => handleEditZone(zone)} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-lg"><Edit size={14} /></button>
                                        <button onClick={() => handleDeleteZone(zone._id)} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-lg"><Trash2 size={14} /></button>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{zone.code}</span>
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">#{zone._id.slice(-6)}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2 group-hover:text-amber-600 transition-colors">{zone.displayName}</h3>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-6">
                                        <Globe size={14} />
                                        <span className="font-bold uppercase tracking-wide">{zone.metadata?.city}, {zone.metadata?.state}</span>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {zone.services?.spareDriver?.enabled && <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center" title="Spare Driver"><Navigation size={14} /></div>}
                                            {zone.services?.carWash?.enabled && <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center" title="Car Wash"><Car size={14} /></div>}
                                            {zone.services?.apartmentWash?.enabled && <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center" title="Apartment Wash"><Building2 size={14} /></div>}
                                        </div>
                                        <button 
                                            onClick={() => handleToggleStatus(zone._id, zone.status)}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${zone.status === 'active' ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                                        >
                                            <Power size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── ZONE DEPLOYMENT FORM ── */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">{selectedZone ? 'Reconfigure Grid' : 'Deploy New Cluster'}</h3>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mt-1.5">Geospatial Parameter Configuration</p>
                                </div>
                                <button onClick={() => setShowForm(false)} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm"><X size={24} /></button>
                            </div>

                            <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grid Identifier</label>
                                                <input className="adm-input h-12" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. bangalore-central" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cluster Code</label>
                                                <input className="adm-input h-12 font-black tracking-widest uppercase" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. BLR01" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Public Label</label>
                                            <input className="adm-input h-12" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} placeholder="e.g. Bangalore Core Service Zone" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Mode</label>
                                                <select className="adm-input h-12 appearance-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                                    <option value="active">LIVE OPS</option>
                                                    <option value="inactive">DEACTIVATED</option>
                                                    <option value="maintenance">MAINTENANCE</option>
                                                    <option value="coming_soon">FUTURE EXPANSION</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary City</label>
                                                <input className="adm-input h-12" value={formData.metadata.city} onChange={e => setFormData({...formData, metadata: {...formData.metadata, city: e.target.value}})} placeholder="City" />
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-slate-50 space-y-4">
                                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Zap size={14} className="text-amber-500" /> Service Availability Matrix</h4>
                                            
                                            {[
                                                { id: 'spareDriver', label: 'Spare Driver Fleet', icon: Navigation, color: 'indigo' },
                                                { id: 'carWash', label: 'Car Detailing Grid', icon: Car, color: 'amber' },
                                                { id: 'apartmentWash', label: 'Apt Multi-Wash', icon: Building2, color: 'emerald' }
                                            ].map(service => (
                                                <div key={service.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center text-${service.color}-500 shadow-sm group-hover:scale-110 transition-transform`}>
                                                            <service.icon size={20} />
                                                        </div>
                                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">{service.label}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            services: {
                                                                ...formData.services,
                                                                [service.id]: { ...formData.services[service.id], enabled: !formData.services[service.id].enabled }
                                                            }
                                                        })}
                                                        className={`w-12 h-7 rounded-full transition-all relative ${formData.services[service.id].enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                                    >
                                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${formData.services[service.id].enabled ? 'left-6' : 'left-1'}`} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Globe size={14} className="text-indigo-500" /> Spatial Mapping</label>
                                            <button onClick={handleLocateMe} className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1 hover:underline"><Navigation size={12} /> Synchronize to GPS</button>
                                        </div>

                                        <div className="h-[400px] rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-inner relative">
                                            {isLoaded ? (
                                                <>
                                                    <div className="absolute top-4 left-4 right-4 z-10">
                                                        <Autocomplete onLoad={setAutocomplete} onPlaceChanged={onPlaceChanged}>
                                                            <div className="relative">
                                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                                <input className="w-full h-12 pl-12 pr-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl outline-none focus:border-indigo-500 transition-all text-xs font-bold" placeholder="Locate specific address cluster..." />
                                                            </div>
                                                        </Autocomplete>
                                                    </div>
                                                    <GoogleMap
                                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                                        center={mapCenter}
                                                        zoom={13}
                                                        onClick={(e) => {
                                                            const lat = e.latLng.lat();
                                                            const lng = e.latLng.lng();
                                                            setMapCenter({ lat, lng });
                                                            fetchAddressDetails(lat, lng);
                                                        }}
                                                        options={{
                                                            disableDefaultUI: true,
                                                            zoomControl: true,
                                                            styles: [
                                                                { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                                                                { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] }
                                                            ]
                                                        }}
                                                    >
                                                        <Marker position={mapCenter} draggable onDragEnd={(e) => {
                                                            const lat = e.latLng.lat();
                                                            const lng = e.latLng.lng();
                                                            setMapCenter({ lat, lng });
                                                            fetchAddressDetails(lat, lng);
                                                        }} />
                                                    </GoogleMap>
                                                </>
                                            ) : <div className="w-full h-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">Synchronizing Map Engine...</div>}
                                        </div>
                                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                                            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">Important: Operational geometry is currently defined as a 10km radial cluster around the primary beacon marker.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 border-t border-slate-50 flex justify-end gap-4 bg-slate-50/30">
                                <button onClick={() => setShowForm(false)} className="h-14 px-8 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">Abort Deployment</button>
                                <button onClick={handleSaveZone} className="h-14 px-12 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-amber-500 hover:text-slate-900 transition-all">{selectedZone ? 'Apply Parameters' : 'Authorize Deployment'}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

export default ZoneManagement;
