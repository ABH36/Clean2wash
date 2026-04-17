import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Car, MapPin, Clock, Calendar, Map, Save, Power, 
    RefreshCw, Zap, DollarSign, Users, TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../../utils/adminApi';

const AdminSpareDriverServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(null);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getSpareDriverServices();
            if (res.status === 'success') {
                setServices(res.data.services);
            }
        } catch (error) {
            console.error('Failed to load services:', error);
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const initializeServices = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.initializeSpareDriverServices();
            if (res.status === 'success') {
                toast.success('Services initialized successfully');
                loadServices();
            }
        } catch (error) {
            console.error('Failed to initialize services:', error);
            toast.error(error.message || 'Failed to initialize services');
        } finally {
            setLoading(false);
        }
    };

    const updateService = async (type, data) => {
        setSaving(type);
        try {
            const res = await adminAPI.updateSpareDriverService(type, data);
            if (res.status === 'success') {
                toast.success('Service updated successfully');
                loadServices();
            }
        } catch (error) {
            console.error('Failed to update service:', error);
            toast.error('Failed to update service');
        } finally {
            setSaving(null);
        }
    };

    const toggleService = async (type) => {
        try {
            const res = await adminAPI.toggleSpareDriverService(type);
            if (res.status === 'success') {
                toast.success(res.message);
                loadServices();
            }
        } catch (error) {
            console.error('Failed to toggle service:', error);
            toast.error('Failed to toggle service');
        }
    };

    const getServiceIcon = (type) => {
        switch (type) {
            case 'point': return <MapPin size={24} />;
            case 'hourly': return <Clock size={24} />;
            case 'full_day': return <Calendar size={24} />;
            case 'outstation': return <Map size={24} />;
            default: return <Car size={24} />;
        }
    };

    const ServiceCard = ({ service }) => {
        const [formData, setFormData] = useState({
            basePrice: service.basePrice,
            hourlyRate: service.hourlyRate,
            subscriberHourlyRate: service.subscriberHourlyRate,
            overtimeRate: service.overtimeRate,
            includedHours: service.includedHours,
            vehicleMultipliers: service.vehicleMultipliers
        });

        const handleSave = () => {
            updateService(service.type, formData);
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`admin-card ${!service.isActive ? 'opacity-60' : ''}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            service.isActive ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'bg-gray-100 text-gray-400'
                        }`}>
                            {getServiceIcon(service.type)}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => toggleService(service.type)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            service.isActive
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <Power size={14} />
                        {service.isActive ? 'Active' : 'Inactive'}
                    </button>
                </div>

                {/* Pricing Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Base Price (₹)
                        </label>
                        <input
                            type="number"
                            value={formData.basePrice}
                            onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                            className="admin-input"
                        />
                    </div>

                    {service.type === 'hourly' && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Hourly Rate (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.hourlyRate}
                                    onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                                    className="admin-input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Subscriber Rate (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.subscriberHourlyRate}
                                    onChange={(e) => setFormData({ ...formData, subscriberHourlyRate: parseFloat(e.target.value) })}
                                    className="admin-input"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Included Hours
                        </label>
                        <input
                            type="number"
                            value={formData.includedHours}
                            onChange={(e) => setFormData({ ...formData, includedHours: parseFloat(e.target.value) })}
                            className="admin-input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Overtime Rate (₹/hour)
                        </label>
                        <input
                            type="number"
                            value={formData.overtimeRate}
                            onChange={(e) => setFormData({ ...formData, overtimeRate: parseFloat(e.target.value) })}
                            className="admin-input"
                        />
                    </div>
                </div>

                {/* Vehicle Multipliers */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Vehicle Multipliers
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(formData.vehicleMultipliers).map(([type, value]) => (
                            <div key={type}>
                                <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                                    {type}
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={value}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        vehicleMultipliers: {
                                            ...formData.vehicleMultipliers,
                                            [type]: parseFloat(e.target.value)
                                        }
                                    })}
                                    className="admin-input text-sm"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Features
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {service.features.map((feature, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                            >
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving === service.type}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                >
                    {saving === service.type ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Save Changes
                        </>
                    )}
                </button>
            </motion.div>
        );
    };

    if (loading && services.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw size={32} className="animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10 max-w-full mx-auto px-4 bg-[var(--bg)] min-h-screen">
            {/* Header */}
            <div className="admin-card">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Spare Driver Services</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Configure service types, pricing, and vehicle multipliers
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadServices}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        {services.length === 0 && (
                            <button
                                onClick={initializeServices}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Zap size={16} />
                                Initialize Services
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            {services.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Services', value: services.length, icon: <Car size={18} />, color: 'blue' },
                        { label: 'Active', value: services.filter(s => s.isActive).length, icon: <Power size={18} />, color: 'emerald' },
                        { label: 'Inactive', value: services.filter(s => !s.isActive).length, icon: <Power size={18} />, color: 'gray' },
                        { label: 'Avg Base Price', value: `₹${Math.round(services.reduce((acc, s) => acc + s.basePrice, 0) / services.length)}`, icon: <DollarSign size={18} />, color: 'purple' }
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="admin-card-compact"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center text-${stat.color}-600`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Service Cards */}
            {services.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {services.map((service) => (
                        <ServiceCard key={service.type} service={service} />
                    ))}
                </div>
            ) : (
                <div className="admin-card text-center py-16">
                    <Car size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Found</h3>
                    <p className="text-gray-600 mb-6">Initialize default services to get started</p>
                    <button
                        onClick={initializeServices}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Zap size={16} />
                        Initialize Services
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminSpareDriverServices;
