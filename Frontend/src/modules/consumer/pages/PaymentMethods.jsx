import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
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
    const {
        paymentMethods,
        methodsLoading,
        loadPaymentMethods,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod
    } = useAuth();

    const [isAdding, setIsAdding] = useState(false);

    React.useEffect(() => {
        loadPaymentMethods();
    }, [loadPaymentMethods]);

    const handleAddCard = async () => {
        // In a real app, this would be a multi-step form or 
        // a small Verify transaction. For now, we'll prompt.
        const brand = prompt('Enter Card Brand (e.g. Visa, MasterCard):');
        const last4 = prompt('Enter Last 4 Digits:');
        const expiry = prompt('Enter Expiry (MM/YY):');

        if (brand && last4 && expiry) {
            await addPaymentMethod({
                type: 'Card',
                brand,
                last4,
                expiry,
                isDefault: paymentMethods.length === 0
            });
        }
    };

    const handleAddUPI = async () => {
        const brand = prompt('Enter UPI App (e.g. GPay, PhonePe):');
        const handle = prompt('Enter UPI Handle (e.g. user@vpa):');

        if (brand && handle) {
            await addPaymentMethod({
                type: 'UPI',
                brand,
                handle,
                isDefault: paymentMethods.length === 0
            });
        }
    };

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
                    <div className="flex justify-between items-center px-1">
                        <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Saved Methods</p>
                        {methodsLoading && <div className="w-3 h-3 border border-brand/30 border-t-brand rounded-full animate-spin" />}
                    </div>

                    {paymentMethods.length === 0 && !methodsLoading ? (
                        <div className="bg-gray-50 rounded-3xl p-8 border border-dashed border-gray-200 text-center">
                            <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest">No saved methods found</p>
                        </div>
                    ) : (
                        paymentMethods.map((method) => (
                            <div
                                key={method._id}
                                onClick={() => !method.isDefault && setDefaultPaymentMethod(method._id)}
                                className={`bg-white rounded-3xl p-5 border transition-all duration-300 flex items-center gap-4 relative overflow-hidden group cursor-pointer ${method.isDefault ? 'border-brand shadow-lg ring-2 ring-brand/5' : 'border-gray-100 shadow-soft opacity-80'}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${method.isDefault ? 'bg-brand/10 text-brand' : 'bg-gray-50 text-content-muted'}`}>
                                    {method.type === 'Card' ? <CreditCard size={24} /> : <Smartphone size={24} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-black text-content italic uppercase tracking-tight">
                                            {method.type === 'Card' ? `${method.brand} •••• ${method.last4}` : method.brand}
                                        </h3>
                                        {method.isDefault && (
                                            <span className="bg-brand text-white text-[8px] font-black px-2 py-0.5 rounded-lg uppercase italic shadow-sm">Default</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase tracking-widest mt-1">
                                        {method.type === 'Card' ? `Expires ${method.expiry}` : method.handle}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Verify: Remove this payment method?')) {
                                            removePaymentMethod(method._id);
                                        }
                                    }}
                                    className="text-content-subtle hover:text-red-500 transition-colors p-2"
                                >
                                    <Trash2 size={16} />
                                </button>

                                {method.isDefault && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <div className="bg-brand rounded-full p-1 border-2 border-white">
                                            <CheckCircle2 size={10} className="text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Add New */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest px-1">Add New</p>
                    <button
                        onClick={handleAddCard}
                        className="w-full flex items-center justify-between p-5 bg-gray-50 border border-dashed border-gray-200 rounded-3xl text-content-subtle hover:border-brand hover:text-brand transition-all group active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest">
                            <Plus size={18} />
                            Add Credit/Debit Card
                        </div>
                        <ChevronRight size={16} />
                    </button>
                    <button
                        onClick={handleAddUPI}
                        className="w-full flex items-center justify-between p-5 bg-gray-50 border border-dashed border-gray-200 rounded-3xl text-content-subtle hover:border-brand hover:text-brand transition-all group active:scale-[0.98]"
                    >
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
