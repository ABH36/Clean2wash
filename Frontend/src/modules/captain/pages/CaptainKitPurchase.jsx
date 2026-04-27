import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, ChevronLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import CaptainLayout from '../components/CaptainLayout';
import { captainAPI } from '../../../utils/captainApi';
import { useTheme } from '../../../context/ThemeContext';

const DEFAULT_KIT_CONFIG = {
    title: 'Starter Captain Kit',
    subtitle: 'Complete payment to unlock your apartment wash dashboard.',
    kitPrice: 1499,
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

const CaptainKitPurchase = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [captain, setCaptain] = useState(null);
    const [kitConfig, setKitConfig] = useState(DEFAULT_KIT_CONFIG);

    const refresh = async () => {
        setLoading(true);
        try {
            const [profileRes, configRes] = await Promise.all([
                captainAPI.getProfile(),
                captainAPI.getKitConfig()
            ]);
            setCaptain(profileRes?.data?.captain || null);
            const config = configRes?.data || {};
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
            const keyRes = await captainAPI.getKitPaymentKey();
            const orderRes = await captainAPI.createKitPaymentOrder();

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
                    name: 'Captain Kit',
                    description: 'Captain Starter Kit',
                    order_id: orderData.order_id,
                    prefill: {
                        name: captain?.name || '',
                        email: captain?.email || '',
                        contact: captain?.phone || ''
                    },
                    theme: { color: '#FACD15' },
                    handler: async (response) => {
                        try {
                            await captainAPI.verifyKitPayment(response);
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
            await refresh();
            navigate('/captain');
        } catch (error) {
            toast.error(error.message || 'Could not complete kit payment');
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <CaptainLayout hideNav>
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 size={26} className="animate-spin text-brand" />
                </div>
            </CaptainLayout>
        );
    }

    const status = captain?.status?.toLowerCase();
    const isUnderReview = status === 'kit_payment_pending' || status === 'kit_payment_under_review';
    const isActive = status === 'active';
    const isPaymentRequired = status === 'verified_pending_kit' || (captain?.profile?.kit?.status === 'NOT_PURCHASED' && status !== 'pending');
    const isProfilePending = status === 'pending';

    return (
        <CaptainLayout hideNav>
            <div className={`min-h-screen px-6 pt-10 pb-28 ${isDarkMode ? 'text-white' : 'text-content'}`}>
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/captain')}
                        className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/5 border-white/5 text-content '}`}
                    >
                        <ChevronLeft size={18} strokeWidth={2.5} />
                    </button>
                    <div className="text-center">
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-content-subtle'}`}>Activation Desk</p>
                        <h1 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-content'}`}>Captain Kit</h1>
                    </div>
                    <div className="w-10" />
                </div>

                <div className={`rounded-[2.5rem] border p-6 mb-6 ${isDarkMode ? 'bg-[#1E293B] border-white/5 shadow-2xl shadow-black/30' : 'bg-white border-white/5 shadow-soft'}`}>
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-2">Activation Gear</p>
                    <h2 className="text-2xl font-black uppercase tracking-tight leading-tight mb-2">{kitConfig.title}</h2>
                    <p className={`text-[11px] font-bold ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>{kitConfig.subtitle}</p>
                </div>

                {Array.isArray(kitConfig.imageUrls) && kitConfig.imageUrls.length > 0 && (
                    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-6 no-scrollbar">
                        {kitConfig.imageUrls.map((imageUrl, index) => (
                            <div key={`${imageUrl}-${index}`} className="snap-start shrink-0 w-[85%] rounded-[2rem] overflow-hidden border border-white/5 shadow-xl">
                                <img src={imageUrl} alt={`Kit visual ${index + 1}`} className="w-full h-48 object-cover" loading="lazy" />
                            </div>
                        ))}
                    </div>
                )}

                <div className={`rounded-[2rem] border p-5 mb-8 space-y-4 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-white/5 shadow-soft'}`}>
                    <div className="flex items-center justify-between">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-content-subtle'}`}>One-time Activation Fee</p>
                        <p className="text-xl font-black text-brand">₹{captain?.profile?.kit?.price || kitConfig.kitPrice}</p>
                    </div>
                    <div className={`h-px w-full ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`} />
                    <p className={`text-[10px] font-bold leading-relaxed ${isDarkMode ? 'text-white/40' : 'text-content-subtle'}`}>
                        This kit includes premium wash equipment and branded gear required to start your apartment wash service missions.
                    </p>
                </div>

                <div className="space-y-4">
                    {isPaymentRequired && (
                        <button
                            onClick={handleKitRazorpay}
                            disabled={paying}
                            className="w-full h-14 rounded-2xl bg-brand text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand/20 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {paying ? <Loader2 size={18} className="animate-spin" /> : 'Pay ₹' + (captain?.profile?.kit?.price || kitConfig.kitPrice) + ' & Activate'}
                        </button>
                    )}

                    {isUnderReview && (
                        <div className="rounded-[2rem] border border-yellow-500/20 bg-yellow-500/5 p-5 text-center">
                            <Loader2 size={24} className="animate-spin text-yellow-500 mx-auto mb-3" />
                            <p className="text-[11px] font-black text-yellow-500 uppercase tracking-widest">Verification in Progress</p>
                            <p className={`text-[11px] font-bold mt-2 ${isDarkMode ? 'text-white/60' : 'text-content-subtle'}`}>
                                Your payment is being verified by our operations team. This usually takes 2-4 hours.
                            </p>
                        </div>
                    )}

                    {isProfilePending && (
                        <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/5 p-5 text-center">
                            <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-2">Documents Under Review</p>
                            <p className={`text-[11px] font-bold ${isDarkMode ? 'text-white/60' : 'text-content-subtle'}`}>
                                Once your documents are verified by the admin, you'll be able to purchase the kit and activate your account.
                            </p>
                        </div>
                    )}

                    {isActive && (
                        <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
                            <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-3" />
                            <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Account Active</p>
                            <p className={`text-[11px] font-bold mt-2 ${isDarkMode ? 'text-white/60' : 'text-content-subtle'}`}>
                                Kit purchased and verified. You are now ready to accept wash missions.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/captain')}
                        className={`w-full h-14 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-white/5 text-content shadow-soft'}`}
                    >
                        Return to Hub
                    </button>
                </div>
            </div>
        </CaptainLayout>
    );
};

export default CaptainKitPurchase;
