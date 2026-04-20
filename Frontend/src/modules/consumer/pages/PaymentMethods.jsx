import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Plus,
    CreditCard,
    Wallet,
    ChevronRight,
    Trash2,
    ShieldCheck,
    Smartphone,
    CheckCircle2,
    Lock,
    ArrowRight
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { toast } from 'react-hot-toast';

const PaymentMethods = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const {
        paymentMethods = [],
        methodsLoading,
        loadPaymentMethods,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod
    } = useAuth();

    React.useEffect(() => {
        loadPaymentMethods();
    }, [loadPaymentMethods]);

    const handleAddCard = async () => {
        const brand = prompt('Enter card brand (e.g. Visa, MasterCard):');
        const last4 = prompt('Enter last 4 digits:');
        const expiry = prompt('Enter expiry (MM/YY):');
        if (brand && last4 && expiry) {
            await addPaymentMethod({ type: 'Card', brand, last4, expiry, isDefault: (paymentMethods?.length || 0) === 0 });
            toast.success('Card added');
        }
    };

    const handleAddUPI = async () => {
        const brand = prompt('Enter UPI app (e.g. GPay, PhonePe):');
        const handle = prompt('Enter UPI handle (e.g. user@vpa):');
        if (brand && handle) {
            await addPaymentMethod({ type: 'UPI', brand, handle, isDefault: (paymentMethods?.length || 0) === 0 });
            toast.success('UPI linked');
        }
    };

    return (
        <MobileLayout>
            <div className={`min-h-screen font-sans pb-32 transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                {/* ── Compact Header ── */}
                <header className={`px-5 pt-8 pb-4 sticky top-0 z-[60] border-b backdrop-blur-xl transition-all ${
                    isDarkMode ? 'bg-[#0A0F0D]/80 border-white/05' : 'bg-white/80 border-black/10'
                }`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className={`w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
                            isDarkMode ? 'bg-white/[0.05]' : 'bg-black/[0.05]'
                        }`}>
                            <ChevronLeft size={22} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
                        </button>
                        <div>
                            <h1 className={`text-[20px] font-bold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Payment methods</h1>
                            <p className="text-[11px] text-slate-400 font-medium mt-1.5 leading-none">Manage billing options</p>
                        </div>
                    </div>
                </header>

                <div className="px-5 pt-6 space-y-6">
                    {/* ── Saved Methods ── */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className={`text-[11px] font-bold uppercase tracking-widest leading-none ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Saved methods ({paymentMethods?.length || 0})</h3>
                            {methodsLoading && <div className="w-3 h-3 border-[2px] border-slate-100 border-t-[#F59E0B] rounded-full animate-spin" />}
                        </div>

                        {(paymentMethods?.length || 0) === 0 && !methodsLoading ? (
                            <div className={`rounded-[2rem] border border-dashed p-12 text-center ${
                                isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white border-black/10'
                            }`}>
                                <CreditCard size={32} className={`mx-auto mb-3 ${isDarkMode ? 'text-white/10' : 'text-black/10'}`} />
                                <p className={`text-[12px] font-bold ${isDarkMode ? 'text-white/20' : 'text-black/20'}`}>No payment methods found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paymentMethods?.map((method) => (
                                    <motion.div
                                        key={method._id}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => !method.isDefault && setDefaultPaymentMethod(method._id)}
                                        className={`rounded-[2rem] p-5 border transition-all flex items-center gap-4 relative group cursor-pointer ${
                                            method.isDefault 
                                                ? 'border-[#F59E0B]/40 bg-[#F59E0B]/05' 
                                                : isDarkMode ? 'bg-white/[0.03] border-white/05 hover:border-white/10' : 'bg-white border-black/05 hover:border-black/10 shadow-sm'
                                        }`}
                                    >
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                                            method.isDefault ? 'bg-[#F59E0B] text-black' : isDarkMode ? 'bg-white/05 text-white/40' : 'bg-black/05 text-black/40'
                                        }`}>
                                            {method.type === 'Card' ? <CreditCard size={18} /> : <Smartphone size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className={`text-[14px] font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                                    {method.type === 'Card' ? `${method.brand} •••• ${method.last4}` : method.brand}
                                                </h4>
                                                {method.isDefault && <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-lg font-bold border border-emerald-500/20">Default</span>}
                                            </div>
                                            <p className={`text-[11px] font-medium ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
                                                {method.type === 'Card' ? `Expires ${method.expiry}` : method.handle}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Remove this payment method?')) {
                                                    removePaymentMethod(method._id);
                                                    toast.success('Method removed');
                                                }
                                            }}
                                            className={`transition-colors p-2 ${isDarkMode ? 'text-white/20 hover:text-rose-500' : 'text-black/20 hover:text-rose-600'}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Add New ── */}
                    <div className="space-y-3">
                        <h3 className={`text-[11px] font-bold uppercase tracking-widest leading-none px-1 ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>Add new</h3>
                        <button onClick={handleAddCard} className={`w-full h-15 flex items-center justify-between px-6 border border-dashed rounded-[1.8rem] transition-all active:scale-98 ${
                            isDarkMode ? 'bg-white/[0.03] border-white/10 text-white/40 hover:text-[#F59E0B] hover:border-[#F59E0B]/40' : 'bg-white border-black/10 text-black/40 hover:text-[#F59E0B] hover:border-[#F59E0B]/40 shadow-sm'
                        }`}>
                            <div className="flex items-center gap-3 text-[12px] font-bold">
                                <Plus size={18} /> Add credit or debit card
                            </div>
                            <ChevronRight size={16} />
                        </button>
                        <button onClick={handleAddUPI} className={`w-full h-15 flex items-center justify-between px-6 border border-dashed rounded-[1.8rem] transition-all active:scale-98 ${
                            isDarkMode ? 'bg-white/[0.03] border-white/10 text-white/40 hover:text-[#F59E0B] hover:border-[#F59E0B]/40' : 'bg-white border-black/10 text-black/40 hover:text-[#F59E0B] hover:border-[#F59E0B]/40 shadow-sm'
                        }`}>
                            <div className="flex items-center gap-3 text-[12px] font-bold">
                                <Plus size={18} /> Link UPI ID
                            </div>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* ── Security ── */}
                    <div className={`p-6 rounded-[2.5rem] border flex items-center gap-5 transition-all ${
                        isDarkMode ? 'bg-white/[0.03] border-white/05 shadow-black/20' : 'bg-white border-black/05 shadow-sm'
                    }`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0 border transition-all ${
                             isDarkMode ? 'bg-white/05 border-white/10 shadow-inner' : 'bg-emerald-50 border-emerald-100 shadow-sm transition-all'
                        }`}>
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h4 className={`text-[13px] font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                <Lock size={12} className={isDarkMode ? 'text-white/20' : 'text-black/20'} /> Secure vault technology
                            </h4>
                            <p className="text-[11px] font-medium text-slate-400 leading-relaxed mt-1">Your data is encrypted according to PCI-DSS standards.</p>
                        </div>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};

export default PaymentMethods;

