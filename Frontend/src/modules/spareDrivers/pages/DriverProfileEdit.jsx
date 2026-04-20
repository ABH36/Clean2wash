import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Loader2, User, Mail, MapPin, CreditCard, Globe, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';

const DriverProfileEdit = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [driver, setDriver] = useState(null);
    const [form, setForm] = useState({
        name: '',
        email: '',
        city: '',
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        upiId: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await spareDriverAPI.getProfile();
                const driverData = res?.data?.driver;
                setDriver(driverData);
                
                setForm({
                    name: driverData?.name || '',
                    email: driverData?.email || '',
                    city: driverData?.address?.city || '',
                    accountName: driverData?.bankDetails?.accountName || '',
                    accountNumber: driverData?.bankDetails?.accountNumber || '',
                    ifscCode: driverData?.bankDetails?.ifscCode || '',
                    bankName: driverData?.bankDetails?.bankName || '',
                    upiId: driverData?.bankDetails?.upiId || ''
                });
            } catch (error) {
                toast.error('Failed to load profile');
                navigate('/spare-driver/profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const validateIFSC = (ifsc) => {
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
    };

    const handleSave = async () => {
        // Validation
        if (!form.name.trim()) {
            toast.error('Name is required');
            return;
        }

        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            toast.error('Invalid email format');
            return;
        }

        if (form.ifscCode && !validateIFSC(form.ifscCode)) {
            toast.error('Invalid IFSC code format');
            return;
        }

        setSaving(true);
        try {
            const updateData = {
                name: form.name.trim(),
                email: form.email.trim(),
                address: {
                    city: form.city.trim()
                },
                bankDetails: {
                    accountName: form.accountName.trim(),
                    accountNumber: form.accountNumber.trim(),
                    ifscCode: form.ifscCode.trim().toUpperCase(),
                    bankName: form.bankName.trim(),
                    upiId: form.upiId.trim()
                }
            };

            await spareDriverAPI.updateProfile(updateData);
            toast.success('Profile updated successfully');
            navigate('/spare-driver/profile');
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DriverLayout title="Edit Profile">
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-brand" />
                </div>
            </DriverLayout>
        );
    }

    return (
        <DriverLayout title="Edit Profile">
            <div className="px-6 py-6 space-y-6 pb-24">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/spare-driver/profile')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <X size={20} />
                        <span className="text-sm font-bold">Cancel</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-brand text-black rounded-xl font-bold disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {/* Personal Information */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5"
                >
                    <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                                Full Name *
                            </label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Enter your full name"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="your@email.com"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                                City
                            </label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    placeholder="Your city"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand transition-colors"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-600">
                                <strong>Note:</strong> Phone number cannot be changed. Contact support if you need to update it.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Bank Details */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5"
                >
                    <h3 className="text-lg font-bold text-gray-900">Bank Details</h3>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                                    Account Holder Name
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={form.accountName}
                                        onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                                        placeholder="As per bank account"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                                    Account Number
                                </label>
                                <div className="relative">
                                    <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={form.accountNumber}
                                        onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })}
                                        placeholder="Bank account number"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                                    IFSC Code
                                </label>
                                <div className="relative">
                                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={form.ifscCode}
                                        onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                                        placeholder="HDFC0001234"
                                        maxLength={11}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand transition-colors uppercase"
                                    />
                                </div>
                                {form.ifscCode && !validateIFSC(form.ifscCode) && (
                                    <p className="text-xs text-red-500 mt-1">Invalid IFSC format</p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                                    Bank Name
                                </label>
                                <div className="relative">
                                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={form.bankName}
                                        onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                                        placeholder="Bank name"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                                UPI ID (Optional)
                            </label>
                            <div className="relative">
                                <Zap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={form.upiId}
                                    onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                                    placeholder="yourname@upi"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand transition-colors"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-3">
                            <p className="text-xs text-blue-700">
                                <strong>Important:</strong> Ensure bank details are accurate. All payouts will be processed to this account.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Save Button (Bottom) */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/spare-driver/profile')}
                        className="flex-1 py-4 border border-gray-200 rounded-xl font-bold text-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-4 bg-brand text-black rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </DriverLayout>
    );
};

export default DriverProfileEdit;