import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Hash, Home, Loader2, MapPin, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import { geocodingService } from '../../../utils/geocoding';

const DriverAddress = () => {
    const navigate = useNavigate();
    const { detectCurrentLocation } = useGeoLocation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [form, setForm] = useState({
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        coordinates: { lat: null, lng: null }
    });

    const loadProfile = async () => {
        try {
            const res = await spareDriverAPI.getProfile();
            const driver = res?.data?.driver || {};
            setForm({
                street: driver?.address?.street || '',
                city: driver?.address?.city || '',
                state: driver?.address?.state || '',
                pincode: driver?.address?.pincode || '',
                country: driver?.address?.country || 'India',
                coordinates: {
                    lat: Number(driver?.address?.coordinates?.lat) || null,
                    lng: Number(driver?.address?.coordinates?.lng) || null
                }
            });
        } catch (error) {
            toast.error(error.message || 'Could not load address');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleDetectAddress = async () => {
        setDetecting(true);
        try {
            const location = await detectCurrentLocation();
            if (!location) throw new Error('Location not available');

            const decoded = await geocodingService.reverse(location.lat, location.lng);
            setForm((prev) => ({
                ...prev,
                street: decoded?.street || prev.street,
                city: decoded?.city || prev.city,
                state: decoded?.state || prev.state,
                pincode: decoded?.pincode || prev.pincode,
                country: 'India',
                coordinates: { lat: location.lat, lng: location.lng }
            }));
            toast.success('Address auto-detected from current location.');
        } catch (error) {
            toast.error('Could not detect current location.');
        } finally {
            setDetecting(false);
        }
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            await spareDriverAPI.updateProfile({ address: form });
            if (Number.isFinite(Number(form.coordinates?.lat)) && Number.isFinite(Number(form.coordinates?.lng))) {
                await spareDriverAPI.updateLocation(Number(form.coordinates.lat), Number(form.coordinates.lng));
            }
            toast.success('Address saved successfully.');
            navigate('/spare-driver/dashboard');
        } catch (error) {
            toast.error(error.message || 'Could not save address');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DriverLayout title="Address">
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 size={26} className="animate-spin text-brand" />
                </div>
            </DriverLayout>
        );
    }

    return (
        <DriverLayout title="Address">
            <div className="px-6 py-6 pb-28 space-y-5">
                <div className="rounded-[2rem] border border-black/[0.05] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/45 mb-3"
                    >
                        <ArrowLeft size={14} />
                        Back
                    </button>
                    <p className="text-[9px] font-black text-brand uppercase tracking-widest">Driver Base</p>
                    <h2 className="text-[20px] font-black text-black uppercase tracking-tight leading-tight mt-2">Set Operational Address</h2>
                    <p className="text-[10px] font-black text-black/35 uppercase tracking-wider mt-2">
                        This address is used as fallback location when GPS is unavailable.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleDetectAddress}
                    disabled={detecting}
                    className="w-full h-12 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                >
                    {detecting ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                    Detect Current Location
                </button>

                <form onSubmit={handleSave} className="rounded-[1.5rem] border border-black/[0.06] bg-white p-4 space-y-3">
                    <label className="block">
                        <span className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Street / Locality</span>
                        <div className="h-11 border border-gray-200 rounded-xl px-3 flex items-center gap-2">
                            <Home size={14} className="text-black/40" />
                            <input
                                value={form.street}
                                onChange={(event) => setForm((prev) => ({ ...prev, street: event.target.value }))}
                                required
                                className="w-full h-full outline-none text-[12px] font-black text-black"
                            />
                        </div>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">City</span>
                            <div className="h-11 border border-gray-200 rounded-xl px-3 flex items-center gap-2">
                                <Globe size={14} className="text-black/40" />
                                <input
                                    value={form.city}
                                    onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                                    required
                                    className="w-full h-full outline-none text-[12px] font-black text-black"
                                />
                            </div>
                        </label>
                        <label className="block">
                            <span className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">Postal Code</span>
                            <div className="h-11 border border-gray-200 rounded-xl px-3 flex items-center gap-2">
                                <Hash size={14} className="text-black/40" />
                                <input
                                    value={form.pincode}
                                    onChange={(event) => setForm((prev) => ({ ...prev, pincode: event.target.value }))}
                                    required
                                    className="w-full h-full outline-none text-[12px] font-black text-black"
                                />
                            </div>
                        </label>
                    </div>

                    <label className="block">
                        <span className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">State</span>
                        <div className="h-11 border border-gray-200 rounded-xl px-3 flex items-center gap-2">
                            <MapPin size={14} className="text-black/40" />
                            <input
                                value={form.state}
                                onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
                                required
                                className="w-full h-full outline-none text-[12px] font-black text-black"
                            />
                        </div>
                    </label>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full h-11 rounded-xl bg-brand text-black text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save Address'}
                    </button>
                </form>
            </div>
        </DriverLayout>
    );
};

export default DriverAddress;
