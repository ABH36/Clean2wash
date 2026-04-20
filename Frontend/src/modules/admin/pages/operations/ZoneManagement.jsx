import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Power, Search, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../../utils/adminApi';

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
                    coordinates: [[[77.0, 28.4], [77.4, 28.4], [77.4, 28.8], [77.0, 28.8], [77.0, 28.4]]]
                },
                center: {
                    type: 'Point',
                    coordinates: [77.2090, 28.6139]
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
        if (!window.confirm('Are you sure you want to delete this zone?')) return;

        try {
            await adminAPI.deleteZone(zoneId);
            toast.success('Zone deleted successfully');
            fetchZones();
        } catch (error) {
            console.error('Failed to delete zone:', error);
            toast.error('Failed to delete zone');
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
        <div className='p-6 max-w-7xl mx-auto'>
            <div className='mb-6'>
                <h1 className='text-2xl font-bold text-gray-900 mb-2'>Service Zone Management</h1>
                <p className='text-sm text-gray-600'>Control where your app is available and operational</p>
            </div>

            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6'>
                <div className='flex items-center justify-between gap-4'>
                    <div className='flex items-center gap-3 flex-1'>
                        <div className='relative flex-1 max-w-md'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={18} />
                            <input
                                type='text'
                                placeholder='Search zones...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                        >
                            <option value='all'>All Status</option>
                            <option value='active'>Active</option>
                            <option value='inactive'>Inactive</option>
                            <option value='maintenance'>Maintenance</option>
                            <option value='coming_soon'>Coming Soon</option>
                        </select>
                        <button
                            onClick={fetchZones}
                            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                            title='Refresh'
                        >
                            <RefreshCw size={18} className='text-gray-600' />
                        </button>
                    </div>
                    <button
                        onClick={handleCreateZone}
                        className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                    >
                        <Plus size={18} />
                        Create Zone
                    </button>
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-gray-600'>Total Zones</p>
                            <p className='text-2xl font-bold text-gray-900'>{zones.length}</p>
                        </div>
                        <MapPin className='text-blue-600' size={32} />
                    </div>
                </div>
                <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-gray-600'>Active Zones</p>
                            <p className='text-2xl font-bold text-green-600'>{zones.filter(z => z.status === 'active').length}</p>
                        </div>
                        <CheckCircle className='text-green-600' size={32} />
                    </div>
                </div>
                <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-gray-600'>Inactive Zones</p>
                            <p className='text-2xl font-bold text-gray-600'>{zones.filter(z => z.status === 'inactive').length}</p>
                        </div>
                        <XCircle className='text-gray-600' size={32} />
                    </div>
                </div>
                <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-gray-600'>Maintenance</p>
                            <p className='text-2xl font-bold text-orange-600'>{zones.filter(z => z.status === 'maintenance').length}</p>
                        </div>
                        <AlertTriangle className='text-orange-600' size={32} />
                    </div>
                </div>
            </div>

            <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
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
                            <thead className='bg-gray-50 border-b border-gray-200'>
                                <tr>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Zone</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Code</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Location</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Status</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Services</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-200'>
                                {filteredZones.map((zone) => {
                                    const statusBadge = getStatusBadge(zone.status);
                                    return (
                                        <tr key={zone._id} className='hover:bg-gray-50 transition-colors'>
                                            <td className='px-6 py-4'>
                                                <div className='flex items-center gap-2'>
                                                    <MapPin size={16} className='text-gray-400' />
                                                    <div>
                                                        <p className='font-medium text-gray-900'>{zone.displayName}</p>
                                                        <p className='text-sm text-gray-500'>{zone.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4'>
                                                <span className='font-mono text-sm text-gray-600'>{zone.code}</span>
                                            </td>
                                            <td className='px-6 py-4'>
                                                <p className='text-sm text-gray-900'>{zone.metadata?.city || 'N/A'}</p>
                                                <p className='text-xs text-gray-500'>{zone.metadata?.state}</p>
                                            </td>
                                            <td className='px-6 py-4'>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                                                    {statusBadge.label}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4'>
                                                <div className='flex gap-1'>
                                                    {zone.services?.spareDriver?.enabled && (
                                                        <span className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded'>Driver</span>
                                                    )}
                                                    {zone.services?.carWash?.enabled && (
                                                        <span className='px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded'>Wash</span>
                                                    )}
                                                    {zone.services?.apartmentWash?.enabled && (
                                                        <span className='px-2 py-1 text-xs bg-green-100 text-green-800 rounded'>Apt</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='px-6 py-4'>
                                                <div className='flex items-center gap-2'>
                                                    <button
                                                        onClick={() => handleToggleStatus(zone._id, zone.status)}
                                                        className='p-2 hover:bg-gray-100 rounded transition-colors'
                                                        title={zone.status === 'active' ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <Power size={16} className={zone.status === 'active' ? 'text-green-600' : 'text-gray-400'} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteZone(zone._id)}
                                                        className='p-2 hover:bg-gray-100 rounded transition-colors'
                                                        title='Delete'
                                                    >
                                                        <Trash2 size={16} className='text-red-600' />
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
        </div>
    );
};

export default ZoneManagement;
