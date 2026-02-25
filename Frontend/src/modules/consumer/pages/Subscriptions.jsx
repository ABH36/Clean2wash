import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ChevronDown, ChevronRight, Car,
    Star, Shield, Check, Crown, Zap, Clock, Info, ArrowRight, Sparkles, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';

const Subscriptions = () => {
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState('monthly'); // monthly or annual
    const [openFaq, setOpenFaq] = useState(null);

    const renderHeader = () => (
        <header className="px-6 pt-6 pb-2 flex items-center justify-between bg-white sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                    <Crown size={20} className="text-[#F29F05]" />
                </div>
                <div className="text-left">
                    <span className="text-[14px] font-[900] text-black uppercase tracking-tight">HOORA PASS</span>
                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest leading-none mt-1">Select A Plan</p>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                <div className="text-right">
                    <span className="text-[11px] font-black text-black leading-none uppercase">Baleno</span>
                    <p className="text-[8px] font-bold text-black/40 uppercase mt-1">Active</p>
                </div>
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Car size={18} className="text-[#F29F05]" />
                </div>
            </div>
        </header>
    );

    const renderHero = () => (
        <section className="px-5 py-6">
            <div className="bg-black rounded-2xl overflow-hidden relative h-[210px] shadow-2xl group border border-white/5">
                {/* Visual Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#F29F05]/20 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -ml-10 -mb-10" />

                <div className="absolute top-8 left-8 z-20">
                    <div className="bg-[#F29F05] text-black text-[9px] font-[900] px-3 py-1 rounded-full uppercase tracking-[0.2em] mb-3 w-fit">Recommended</div>
                    <h2 className="text-[32px] font-[900] text-white leading-none uppercase italic tracking-tighter">
                        HOORA<br />
                        <span className="text-[#F29F05]">PRIME</span>
                    </h2>
                    <p className="text-white/40 text-[10px] font-bold uppercase mt-2 tracking-widest max-w-[150px]">
                        The Ultimate Freedom For Your Car Care
                    </p>
                </div>

                <div className="absolute bottom-[-10%] right-[-10%] h-[110%] z-10">
                    <img
                        src="/assets/carwashsubscription/7.png"
                        className="h-full object-contain drop-shadow-[0_20px_30px_rgba(242,159,5,0.3)] animate-float"
                        alt="Subscription Pass"
                    />
                </div>
            </div>
        </section>
    );

    const renderUsageDashboard = () => (
        <section className="px-5 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[11px] font-[900] text-black/40 uppercase tracking-widest">Active Credits</h3>
                    <div className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Free Trial</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-black/[0.03]">
                        <p className="text-[20px] font-black text-black leading-none">02/05</p>
                        <p className="text-[9px] font-bold text-black/30 uppercase mt-2 tracking-tighter">Washes Left</p>
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-black/[0.03]">
                        <p className="text-[20px] font-black text-black leading-none">14 Days</p>
                        <p className="text-[9px] font-bold text-black/30 uppercase mt-2 tracking-tighter">Plan Expiry</p>
                    </div>
                </div>

                <div className="mt-5 pt-5 border-t border-black/5 flex items-center justify-between">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                                <Star size={10} className="text-[#F29F05]" />
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-black/60 uppercase tracking-tighter italic">Join 50k+ Prime Members</span>
                </div>
            </div>
        </section>
    );

    const renderAddOns = () => (
        <section className="px-5 mb-10">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-[13px] font-black text-black uppercase tracking-widest italic">Precision Add-ons</h3>
                <span className="text-orange-500 text-[10px] font-black uppercase tracking-widest">View All</span>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
                {[
                    { label: 'Rain Repellent', price: '₹99', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Odor Neutralizer', price: '₹149', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Engine Waxing', price: '₹249', icon: Shield, color: 'text-green-500', bg: 'bg-green-50' },
                    { label: 'Glass Polishing', price: '₹199', icon: Star, color: 'text-indigo-500', bg: 'bg-indigo-50' }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        whileTap={{ scale: 0.95 }}
                        className="flex-shrink-0 w-40 bg-white p-4 rounded-2xl border border-black/5 shadow-sm"
                    >
                        <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                            <item.icon size={18} />
                        </div>
                        <h4 className="text-[11px] font-black text-black uppercase leading-tight mb-2">{item.label}</h4>
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-black text-black italic">{item.price}</span>
                            <div className="bg-black text-white p-1 rounded-lg">
                                <ArrowRight size={12} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );

    const renderReferralPromo = () => (
        <section className="px-5 mb-12">
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/refer')}
                className="bg-indigo-600 rounded-2xl p-6 relative overflow-hidden shadow-2xl group cursor-pointer"
            >
                <div className="relative z-10">
                    <div className="bg-white/20 w-fit px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-white mb-3">Limited Offer</div>
                    <h3 className="text-white text-[20px] font-black leading-tight uppercase italic">GET 1 MONTH FREE<br />PER REFERRAL</h3>
                    <p className="text-white/60 text-[10px] font-bold mt-2 uppercase tracking-widest leading-none">Locked for prime members only</p>
                </div>
                <div className="absolute right-[-5%] bottom-[-20%] opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <User size={120} className="text-white" />
                </div>
            </motion.div>
        </section>
    );

    const renderFAQ = () => (
        <section className="px-5 mb-12">
            <h3 className="text-[13px] font-black text-black uppercase tracking-widest mb-6 italic text-center">Frequently Asked Questions</h3>
            <div className="space-y-3">
                {[
                    { q: 'Can I swap my vehicle anytime?', a: 'Yes! Prime members can switch their primary vehicle once every billing cycle for free.' },
                    { q: 'What is Ceramic Shield Coat?', a: 'It is a specialized liquid polymer that provides a hydrophobic layer and enhances paint depth.' },
                    { q: 'Are there any cancellation fees?', a: 'Absolutely not. You can cancel your Hoora Pass at any time with zero hidden charges.' },
                    { q: 'Do washes carry over to next month?', a: 'Unused credits do not carry over, but you get priority slots for your next cycle!' }
                ].map((item, i) => (
                    <div key={i} className="bg-white rounded-xl border border-black/5 overflow-hidden">
                        <button
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            className="w-full p-4 flex items-center justify-between text-left"
                        >
                            <span className="text-[11px] font-black text-black uppercase tracking-tight">{item.q}</span>
                            <ChevronDown size={14} className={`text-black/40 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {openFaq === i && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-4 pb-4"
                                >
                                    <p className="text-[10px] font-bold text-black/40 uppercase leading-relaxed tracking-tighter">{item.a}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </section>
    );

    const renderPlans = () => (
        <section className="px-5 py-4 mb-10">
            {/* Tab Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-8 border border-gray-200/50">
                <button
                    onClick={() => setSelectedTab('monthly')}
                    className={`flex-1 py-3 text-[11px] font-[900] uppercase tracking-widest rounded-lg transition-all ${selectedTab === 'monthly' ? 'bg-white text-black shadow-md' : 'text-black/40'}`}
                >
                    Monthly
                </button>
                <button
                    onClick={() => setSelectedTab('annual')}
                    className={`flex-1 py-3 text-[11px] font-[900] uppercase tracking-widest rounded-lg transition-all relative ${selectedTab === 'annual' ? 'bg-white text-black shadow-md' : 'text-black/40'}`}
                >
                    Annual
                    <span className="absolute -top-2 right-0 bg-red-600 text-white text-[7px] px-2 py-0.5 rounded-full">Save 40%</span>
                </button>
            </div>

            <div className="space-y-6">
                {[
                    {
                        name: 'Hoora Lite',
                        price: selectedTab === 'monthly' ? '299' : '2499',
                        subtitle: 'Perfect for busy urban life',
                        color: 'bg-white',
                        accent: 'text-orange-500',
                        features: ['2 Doorstep Washes', 'Standard Interior Clean', 'Priority Booking']
                    },
                    {
                        name: 'Hoora Pro',
                        price: selectedTab === 'monthly' ? '599' : '4999',
                        subtitle: 'Our best-selling care plan',
                        color: 'bg-black',
                        accent: 'text-[#F29F05]',
                        features: ['4 Premium Washes', 'Interior Vacuuming', 'Underbody Cleaning', 'Dedicated Captain']
                    },
                    {
                        name: 'Hoora Ultra',
                        price: selectedTab === 'monthly' ? '999' : '8999',
                        subtitle: 'Luxury care for luxury cars',
                        color: 'bg-[#FFF6E9]',
                        accent: 'text-black',
                        features: ['Unlimited Washes', 'Ceramic Shield Coat', 'Full Detailing (Monthly)', 'VIP Support', 'Zero Travel Fee']
                    }
                ].map((plan, i) => (
                    <motion.div
                        key={i}
                        whileTap={{ scale: 0.98 }}
                        className={`${plan.color} px-7 py-8 rounded-2xl border ${plan.color === 'bg-black' ? 'border-white/10' : 'border-gray-100'} shadow-xl relative overflow-hidden group`}
                    >
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className={`text-[12px] font-[900] ${plan.color === 'bg-black' ? 'text-white/40' : 'text-black/40'} uppercase tracking-[0.2em] mb-1`}>{plan.name}</h3>
                                    <p className={`text-[16px] font-black ${plan.color === 'bg-black' ? 'text-white' : 'text-black'} tracking-tight`}>{plan.subtitle}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[10px] font-bold ${plan.color === 'bg-black' ? 'text-[#F29F05]' : 'text-gray-400'} uppercase`}>Starting at</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-[32px] font-[900] ${plan.color === 'bg-black' ? 'text-white' : 'text-black'} italic tracking-tighter`}>₹{plan.price}</span>
                                        <span className={`text-[10px] font-bold ${plan.color === 'bg-black' ? 'text-white/20' : 'text-black/20'} uppercase`}>/{selectedTab === 'monthly' ? 'mo' : 'yr'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                {plan.features.map((feat, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full ${plan.color === 'bg-black' ? 'bg-white/10' : 'bg-gray-100'} flex items-center justify-center`}>
                                            <Check size={10} className={plan.color === 'bg-black' ? 'text-[#F29F05]' : 'text-green-500'} strokeWidth={4} />
                                        </div>
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${plan.color === 'bg-black' ? 'text-white/60' : 'text-black/60'}`}>{feat}</span>
                                    </div>
                                ))}
                            </div>

                            <button className={`w-full py-4 rounded-xl font-[900] uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 ${plan.color === 'bg-black' ? 'bg-[#F29F05] text-black' : 'bg-black text-white'}`}>
                                Choose {plan.name}
                                <ArrowRight size={16} />
                            </button>
                        </div>

                        {/* Background Text Overlay */}
                        <span className={`absolute -bottom-10 -right-10 text-[100px] font-black italic select-none pointer-events-none ${plan.color === 'bg-black' ? 'text-white/[0.03]' : 'text-black/[0.03]'}`}>
                            {plan.name.split(' ')[1]}
                        </span>
                    </motion.div>
                ))}
            </div>
        </section>
    );

    const renderHooraPromise = () => (
        <section className="px-5 py-12 pb-32">
            <div className="text-center mb-10">
                <h3 className="text-[20px] font-[900] text-black uppercase leading-none italic tracking-tighter mb-2">WHY HOORA PASS?</h3>
                <p className="text-[10px] font-black text-black/20 uppercase tracking-widest leading-none">Designed For Modern Speed</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { title: 'Zero Fees', sub: 'No travel or studio charges ever.', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
                    { title: 'Fixed Pricing', sub: 'Locked rates for the entire year.', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { title: 'Insta Swap', sub: 'Change vehicle anytime for free.', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { title: 'VIP Support', sub: 'Direct line to your studio mgr.', icon: Star, color: 'text-indigo-500', bg: 'bg-indigo-50' }
                ].map((item, i) => (
                    <div key={i} className={`${item.bg} p-6 rounded-2xl border border-black/5`}>
                        <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm ${item.color}`}>
                            <item.icon size={20} />
                        </div>
                        <h4 className="text-[12px] font-black text-black uppercase leading-tight mb-2 tracking-tight">{item.title}</h4>
                        <p className="text-[9px] font-bold text-black/30 uppercase leading-snug tracking-tighter">{item.sub}</p>
                    </div>
                ))}
            </div>
        </section>
    );

    return (
        <MobileLayout hideNav={false}>
            <div className="flex flex-col bg-[#F8F9FB] min-h-screen font-outfit">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
                    .font-outfit { font-family: 'Outfit', sans-serif; }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                `}} />

                {renderHeader()}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    {renderHero()}
                    {renderUsageDashboard()}
                    {renderPlans()}
                    {renderAddOns()}
                    {renderReferralPromo()}
                    {renderFAQ()}
                    {renderHooraPromise()}
                </div>
            </div>
        </MobileLayout>
    );
};

export default Subscriptions;
