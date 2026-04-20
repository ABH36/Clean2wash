import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';

const DEFAULT_PREMIUM_CONFIG = {
    title: 'Premium Driver Program',
    subtitle: 'Police-verified chauffeurs get premium trust and booking visibility.',
    benefits: [
        'Premium badge on profile and operational identity',
        'Priority visibility for high-trust customer trips',
        'Higher confidence score during manual assignment'
    ]
};

const DriverPremium = () => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [driver, setDriver] = useState(null);
    const [config, setConfig] = useState(DEFAULT_PREMIUM_CONFIG);
    const [pvrFile, setPvrFile] = useState(null);
    const [pvrNumber, setPvrNumber] = useState('');

    const refresh = async () => {
        setLoading(true);
        try {
            const [profileRes, configRes] = await Promise.all([
                spareDriverAPI.getProfile(),
                spareDriverAPI.getPremiumConfig()
            ]);
            const driverData = profileRes?.data?.driver || null;
            setDriver(driverData);
            const premiumConfig = configRes?.data?.premiumConfig || {};
            setConfig((prev) => ({
                ...prev,
                ...premiumConfig,
                benefits: Array.isArray(premiumConfig?.benefits) ? premiumConfig.benefits : prev.benefits
            }));
            setPvrNumber(driverData?.documents?.policeVerification?.number || '');
        } catch (err) {
            toast.error(err.message || 'Could not load premium section');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const handleSubmit = async () => {
        if (!pvrFile) {
            toast.error('Please upload police verification document');
            return;
        }

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('pvrFile', pvrFile);
            fd.append('pvrNumber', pvrNumber);
            await spareDriverAPI.uploadPoliceVerification(fd);
            toast.success('Premium verification submitted');
            await refresh();
        } catch (err) {
            toast.error(err.message || 'Could not submit premium verification');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <DriverLayout title="Premium Driver">
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 size={26} className="animate-spin text-brand" />
                </div>
            </DriverLayout>
        );
    }

    const policeStatus = driver?.verification?.policeStatus || 'pending';
    const isApproved = policeStatus === 'approved';

    return (
        <DriverLayout title="Premium Driver">
            <div className="px-6 py-6 pb-28 space-y-5">
                <div className="rounded-[2rem] border border-black/[0.05] bg-white/5 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[9px] font-black text-brand uppercase tracking-widest">Premium Program</p>
                    <h2 className="text-[20px] font-black text-white uppercase tracking-tight leading-tight mt-2">{config.title}</h2>
                    <p className="text-[10px] font-black text-black/35 uppercase tracking-wider mt-2">{config.subtitle}</p>
                </div>

                <div className="rounded-[1.5rem] border border-brand/20 bg-yellow-50/50 p-4 space-y-3">
                    {(config.benefits || []).map((benefit) => (
                        <div key={benefit} className="flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                            <p className="text-[10px] font-black text-white uppercase leading-relaxed">{benefit}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-[1.3rem] border border-black/[0.05] bg-white/5 p-4 space-y-3">
                    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Police Verification Status</p>
                    <div className="flex items-center justify-between">
                        <p className="text-[12px] font-black text-white uppercase">{policeStatus}</p>
                        {isApproved && <ShieldCheck size={16} className="text-green-600" />}
                    </div>
                </div>

                {!isApproved && (
                    <>
                        <div className="space-y-2">
                            <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest">Verification Number</label>
                            <input
                                value={pvrNumber}
                                onChange={(event) => setPvrNumber(event.target.value)}
                                placeholder="Enter reference number"
                                className="w-full h-11 border border-white/10 rounded-xl px-3 text-[11px] font-black text-white outline-none focus:border-black"
                            />
                        </div>

                        <label className="w-full h-20 rounded-xl border-white/5 border-dashed border-gray-300 flex items-center justify-center gap-2 text-[10px] font-black text-black/55 uppercase cursor-pointer">
                            <Upload size={16} />
                            {pvrFile ? pvrFile.name : 'Upload police verification document'}
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(event) => setPvrFile(event.target.files?.[0] || null)}
                            />
                        </label>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full h-11 rounded-xl bg-black text-white text-[10px] font-black uppercase flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Submit for Premium Verification'}
                        </button>
                    </>
                )}

                {isApproved && (
                    <div className="rounded-[1.3rem] border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Premium badge active. Benefits are now applied.</p>
                    </div>
                )}
            </div>
        </DriverLayout>
    );
};

export default DriverPremium;
