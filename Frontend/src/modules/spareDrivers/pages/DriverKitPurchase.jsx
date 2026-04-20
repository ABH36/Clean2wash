import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';

const DEFAULT_KIT_CONFIG = {
    title: 'Starter Driver Kit',
    subtitle: 'Complete payment to unlock your chauffeur dashboard.',
    kitPrice: 1499,
    monthlyDeductionAmount: 199,
    monthlyDeductionMonths: 2,
    imageUrls: []
};

const loadRazorpayScript = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);

    const existingScript = document.querySelector('script[data-razorpay-sdk="true"]');
    if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Razorpay checkout script')), { once: true });
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpaySdk = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
});

const DriverKitPurchase = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [driver, setDriver] = useState(null);
    const [kitConfig, setKitConfig] = useState(DEFAULT_KIT_CONFIG);

    const refresh = async () => {
        setLoading(true);
        try {
            const [profileRes, configRes] = await Promise.all([
                spareDriverAPI.getProfile(),
                spareDriverAPI.getKitConfig()
            ]);
            setDriver(profileRes?.data?.driver || null);
            const config = configRes?.data?.kitConfig || {};
            setKitConfig((prev) => ({
                ...prev,
                ...config,
                imageUrls: Array.isArray(config?.imageUrls) ? config.imageUrls : prev.imageUrls
            }));
        } catch (err) {
            toast.error(err.message || 'Could not load kit purchasing');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const handleKitRazorpay = async () => {
        setPaying(true);
        try {
            await loadRazorpayScript();
            const keyRes = await spareDriverAPI.getKitPaymentKey();
            const orderRes = await spareDriverAPI.createKitPaymentOrder();

            const keyId = keyRes?.data?.key_id;
            const orderData = orderRes?.data;

            if (!keyId || !orderData?.order_id) {
                throw new Error('Could not initialize kit payment');
            }

            await new Promise((resolve, reject) => {
                const razorpay = new window.Razorpay({
                    key: keyId,
                    amount: orderData.amount,
                    currency: orderData.currency || 'INR',
                    name: 'Spare Driver',
                    description: 'Spare Driver Starter Kit',
                    order_id: orderData.order_id,
                    prefill: {
                        name: driver?.name || '',
                        email: driver?.email || '',
                        contact: driver?.phone || ''
                    },
                    theme: { color: '#FACD15' },
                    handler: async (response) => {
                        try {
                            await spareDriverAPI.verifyKitPayment(response);
                            resolve(true);
                        } catch (verificationError) {
                            reject(verificationError);
                        }
                    },
                    modal: {
                        ondismiss: () => reject(new Error('Kit payment checkout was cancelled'))
                    }
                });

                razorpay.on('payment.failed', (event) => {
                    reject(new Error(event?.error?.description || 'Kit payment failed'));
                });

                razorpay.open();
            });

            toast.success('Kit payment submitted successfully');
            sessionStorage.removeItem('spare_driver_kit_popup_dismissed');
            await refresh();
        } catch (error) {
            toast.error(error.message || 'Could not complete kit payment');
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <DriverLayout title="Kit Purchasing">
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 size={26} className="animate-spin text-brand" />
                </div>
            </DriverLayout>
        );
    }

    const isUnderReview = driver?.status === 'kit_payment_pending';
    const isActive = driver?.status === 'active';
    const isPaymentRequired = driver?.status === 'verified_pending_kit';

    return (
        <DriverLayout title="Kit Purchasing">
            <div className="px-6 py-6 pb-28 space-y-5">
                <div className="rounded-[2rem] border border-black/[0.05] bg-white/5 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[9px] font-black text-brand uppercase tracking-widest">Driver Activation</p>
                    <h2 className="text-[20px] font-black text-white uppercase tracking-tight leading-tight mt-2">{kitConfig.title || 'Starter Driver Kit'}</h2>
                    <p className="text-[10px] font-black text-black/35 uppercase tracking-wider mt-2">{kitConfig.subtitle}</p>
                </div>

                {Array.isArray(kitConfig.imageUrls) && kitConfig.imageUrls.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1">
                        {kitConfig.imageUrls.map((imageUrl, index) => (
                            <div key={`${imageUrl}-${index}`} className="snap-start shrink-0 w-[84%] rounded-[1.2rem] overflow-hidden border border-black/[0.06] bg-white/5">
                                <img src={imageUrl} alt={`Kit visual ${index + 1}`} className="w-full h-40 object-cover" loading="lazy" />
                            </div>
                        ))}
                    </div>
                )}

                <div className="rounded-[1.5rem] border border-brand/20 bg-yellow-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Payable Now</p>
                        <p className="text-[18px] font-black text-white">₹{driver?.kit?.price || kitConfig.kitPrice || 1499}</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Monthly Recovery</p>
                        <p className="text-[10px] font-black text-white uppercase">₹{kitConfig.monthlyDeductionAmount || 0} x {kitConfig.monthlyDeductionMonths || 0}</p>
                    </div>
                </div>

                {isPaymentRequired && (
                    <button
                        onClick={handleKitRazorpay}
                        disabled={paying}
                        className="w-full h-12 rounded-xl bg-black text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        {paying ? <Loader2 size={16} className="animate-spin" /> : 'Pay with Razorpay'}
                    </button>
                )}

                {isUnderReview && (
                    <div className="rounded-[1.3rem] border border-yellow-200 bg-yellow-50 p-4">
                        <p className="text-[10px] font-black text-yellow-800 uppercase tracking-widest">Payment Under Review</p>
                        <p className="text-[10px] font-black text-yellow-700 uppercase tracking-wider mt-2">Admin verification in progress. Dashboard will unlock after approval.</p>
                    </div>
                )}

                {isActive && (
                    <div className="rounded-[1.3rem] border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Kit activated. Your account is live.</p>
                    </div>
                )}

                <button
                    onClick={() => navigate('/spare-driver/dashboard')}
                    className="w-full h-11 border border-white/10 rounded-xl text-[10px] font-black text-black/55 uppercase"
                >
                    Back to Dashboard
                </button>
            </div>
        </DriverLayout>
    );
};

export default DriverKitPurchase;
