import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    CreditCard,
    Wallet,
    ChevronRight,
    Trash2,
    ShieldCheck,
    Smartphone,
    CheckCircle2
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';

const PaymentMethods = () => {
    const navigate = useNavigate();
    const [methods, setMethods] = useState([
        { id: 1, type: 'Card', brand: 'Visa', last4: '4242', expiry: '12/28', default: true },
        { id: 2, type: 'UPI', brand: 'Google Pay', handle: 'aryan@okaxis', default: false },
    ]);

    return (
        <MobileLayout>
            <header className="px-4 pt-10 pb-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-content">
                        <ArrowLeft size={18} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-xl font-black text-content italic tracking-tight uppercase">Payment <span className="text-brand">Methods</span></h1>
                </div>
            </header>

            <div className="px-4 py-6 space-y-6 pb-24">
                {/* Active Methods */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Saved Methods</p>
                    {methods.map((method) => (
                        <div key={method.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft flex items-center gap-4 relative overflow-hidden group">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-content-muted">
                                {method.type === 'Card' ? <CreditCard size={24} /> : <Smartphone size={24} />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-black text-content italic uppercase tracking-tight">
                                        {method.type === 'Card' ? `${method.brand} •••• ${method.last4}` : method.brand}
                                    </h3>
                                    {method.default && (
                                        <span className="bg-brand/10 text-brand text-[8px] font-black px-2 py-0.5 rounded-lg uppercase italic">Default</span>
                                    )}
                                </div>
                                <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
                                    {method.type === 'Card' ? `Expires ${method.expiry}` : method.handle}
                                </p>
                            </div>
                            <button className="text-content-subtle hover:text-red-500 transition-colors p-2">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add New */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Add New</p>
                    <button className="w-full flex items-center justify-between p-5 bg-gray-50 border border-dashed border-gray-200 rounded-3xl text-content-subtle hover:border-brand hover:text-brand transition-all group">
                        <div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest">
                            <Plus size={18} />
                            Add Credit/Debit Card
                        </div>
                        <ChevronRight size={16} />
                    </button>
                    <button className="w-full flex items-center justify-between p-5 bg-gray-50 border border-dashed border-gray-200 rounded-3xl text-content-subtle hover:border-brand hover:text-brand transition-all group">
                        <div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest">
                            <Plus size={18} />
                            Link UPI ID
                        </div>
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Secure Trust */}
                <div className="bg-brand/5 border border-brand/10 rounded-3xl p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand mb-4">
                        <ShieldCheck size={28} />
                    </div>
                    <h4 className="text-brand font-black italic uppercase tracking-tight text-sm">Secure Vault Technology</h4>
                    <p className="text-content-subtle text-[10px] font-bold mt-1 max-w-[200px]">Your payment data is encrypted and stored according to PCI-DSS standards.</p>
                </div>
            </div>
        </MobileLayout>
    );
};

export default PaymentMethods;
