import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
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
    const {
        paymentMethods,
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
            await addPaymentMethod({ type: 'Card', brand, last4, expiry, isDefault: paymentMethods.length === 0 });
            toast.success('Card added');
        }
    };

    const handleAddUPI = async () => {
        const brand = prompt('Enter UPI app (e.g. GPay, PhonePe):');
        const handle = prompt('Enter UPI handle (e.g. user@vpa):');
        if (brand && handle) {
            await addPaymentMethod({ type: 'UPI', brand, handle, isDefault: paymentMethods.length === 0 });
            toast.success('UPI linked');
        }
    };

    return (
        <MobileLayout>
            <div className="min-h-screen bg-slate-50 font-sans pb-32">
                {/* ── Compact Header ── */}
                <header className="px-5 pt-8 pb-4 bg-white sticky top-0 z-[60] border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                            <ChevronLeft size={22} className="text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">Payment methods</h1>
                            <p className="text-[11px] text-slate-400 font-medium mt-1.5">Manage billing options</p>
                        </div>
                    </div>
                </header>

                <div className="px-5 pt-6 space-y-6">
                    {/* ── Saved Methods ── */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest leading-none">Saved methods ({paymentMethods.length})</h3>
                            {methodsLoading && <div className="w-3 h-3 border-[2px] border-slate-100 border-t-brand rounded-full animate-spin" />}
                        </div>

                        {paymentMethods.length === 0 && !methodsLoading ? (
                            <div className="bg-white rounded-[2rem] border border-dashed border-gray-200 p-12 text-center">
                                <CreditCard size={32} className="text-slate-100 mx-auto mb-3" />
                                <p className="text-[12px] font-bold text-slate-300">No payment methods found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paymentMethods.map((method) => (
                                    <motion.div
                                        key={method._id}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => !method.isDefault && setDefaultPaymentMethod(method._id)}
                                        className={`bg-white rounded-[2rem] p-5 border transition-all flex items-center gap-4 relative group cursor-pointer ${method.isDefault ? 'border-brand/40 shadow-sm bg-brand/[0.02]' : 'border-gray-100 hover:border-slate-200 shadow-sm'}`}
                                    >
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${method.isDefault ? 'bg-brand text-slate-900' : 'bg-slate-50 text-slate-300'}`}>
                                            {method.type === 'Card' ? <CreditCard size={18} /> : <Smartphone size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-[14px] font-bold text-slate-900 truncate">
                                                    {method.type === 'Card' ? `${method.brand} •••• ${method.last4}` : method.brand}
                                                </h4>
                                                {method.isDefault && <span className="text-[9px] bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded-lg font-bold">Default</span>}
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-400">
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
                                            className="text-slate-200 hover:text-rose-500 transition-colors p-2"
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
                        <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest leading-none px-1">Add new</h3>
                        <button onClick={handleAddCard} className="w-full h-15 flex items-center justify-between px-6 bg-white border border-dashed border-slate-200 rounded-[1.8rem] text-slate-400 hover:border-brand/40 hover:text-brand transition-all active:scale-98">
                            <div className="flex items-center gap-3 text-[12px] font-bold">
                                <Plus size={18} /> Add credit or debit card
                            </div>
                            <ChevronRight size={16} />
                        </button>
                        <button onClick={handleAddUPI} className="w-full h-15 flex items-center justify-between px-6 bg-white border border-dashed border-slate-200 rounded-[1.8rem] text-slate-400 hover:border-brand/40 hover:text-brand transition-all active:scale-98">
                            <div className="flex items-center gap-3 text-[12px] font-bold">
                                <Plus size={18} /> Link UPI ID
                            </div>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* ── Security ── */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex items-center gap-5 shadow-sm">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0 border border-slate-100 shadow-inner">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                                <Lock size={12} className="text-slate-300" /> Secure vault technology
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
