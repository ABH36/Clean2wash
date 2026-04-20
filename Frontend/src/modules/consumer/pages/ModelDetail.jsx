import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building, Sparkles, Briefcase, ArrowRight,
    ChevronDown, Zap, ShieldCheck, Clock,
    CheckCircle2, Users, ClipboardCheck,
    Landmark, PieChart, Verified, Camera, Award, Star, Truck, Activity, X, Phone, User, Mail, MessageSquare, MapPin, Gift, FileText, ShoppingCart, ShoppingBag
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';

const ModelDetail = () => {
    const { type } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [activeFlow, setActiveFlow] = useState(null); // 'onboarding' | 'active'
    const [flowStep, setFlowStep] = useState(0);
    const [showInquiry, setShowInquiry] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        org: '',
        phone: user?.phone || '',
        message: ''
    });

    const modelData = {
        apartment: {
            id: 'apartment',
            title: 'Apartment Model',
            tag: 'Society Specialized',
            heroTitle: 'COMMUNITY',
            heroAccent: 'CLEANING',
            desc: 'Specialized care for high-rise residents & communities.',
            icon: Building,
            color: 'indigo',
            accent: '#4F46E9',
            bg: 'bg-indigo-50',
            image: '/assets/carwash/2.png',
            placeholder: 'SOCIETY NAME (e.g. Prestige)',
            cta: 'Initiate Onboarding',
            steps: [
                { label: 'Society Onboarding', icon: Building, desc: 'Register society hierarchy & premises' },
                { label: 'Resident Mapping', icon: Users, desc: 'Sync resident data & parking bays' },
                { label: 'Route Clustering', icon: MapPin, desc: 'AI-optimized cleaning pathways' },
                { label: 'Dedicated Captain Slots', icon: Clock, desc: 'Fixed scheduling for residents' }
            ],
            features: [
                { icon: Users, title: 'Bulk Discount', desc: 'Group bookings rates', bg: 'bg-blue-50', color: 'text-blue-600' },
                { icon: ClipboardCheck, title: 'Safety First', desc: 'Verified staff only', bg: 'bg-emerald-50', color: 'text-emerald-600' },
                { icon: Clock, title: 'Fixed Slots', desc: 'Society visits', bg: 'bg-purple-50', color: 'text-purple-600' },
                { icon: ShieldCheck, title: 'Premium Care', desc: 'Studio quality @ home', bg: 'bg-indigo-50', color: 'text-indigo-600' },
            ]
        },
        showroom: {
            id: 'showroom',
            title: 'Showroom Model',
            tag: 'PDI & Detailing',
            heroTitle: 'SHOWROOM',
            heroAccent: 'PRECISION',
            desc: 'Deliver your cars with the ultimate mirror-finish.',
            icon: Sparkles,
            color: 'purple',
            accent: '#9333EA',
            bg: 'bg-purple-50',
            image: '/assets/carwash/7.png',
            placeholder: 'DEALERSHIP NAME (e.g. BMW)',
            cta: 'Request PDI Audit',
            steps: [],
            features: [
                { icon: Camera, title: 'PDI Reports', desc: 'Pre-delivery inspection', bg: 'bg-rose-50', color: 'text-rose-600' },
                { icon: Award, title: 'Mirror Finish', desc: 'Showroom grade shine', bg: 'bg-amber-50', color: 'text-amber-600' },
                { icon: ShieldCheck, title: 'Ceramic Pro', desc: 'Ultimate protection', bg: 'bg-purple-50', color: 'text-purple-600' },
                { icon: Star, title: 'VIP Support', desc: 'Priority dealer assistance', bg: 'bg-blue-50', color: 'text-blue-600' },
            ]
        },
        corporate: {
            id: 'corporate',
            title: 'Corporate Model',
            tag: 'B2B & Fleet Care',
            heroTitle: 'EFFICIENT',
            heroAccent: 'FLEET CARE',
            desc: 'Smart car care management for modern workspaces & fleets.',
            icon: Briefcase,
            color: 'amber',
            accent: '#D97706',
            bg: 'bg-amber-50',
            image: '/assets/carwash/1.png',
            placeholder: 'COMPANY NAME (e.g. Google)',
            cta: 'Setup Corporate Mode',
            steps: [
                { label: 'Corporate Account', icon: Landmark, desc: 'GST & organizational hierarchy' },
                { label: 'Fleet Mapping', icon: Truck, desc: 'Upload inventory & asset logs' },
                { label: 'Employee Benefit Mode', icon: Gift, desc: 'Employee perk configuration' },
                { label: 'Monthly Invoicing', icon: FileText, desc: 'Automated billing & payments' },
                { label: 'SLA Dashboard', icon: PieChart, desc: 'Contract monitoring & metrics' }
            ],
            features: [
                { icon: Landmark, title: 'GST Billing', desc: 'Easy tax deductions', bg: 'bg-emerald-50', color: 'text-emerald-600' },
                { icon: PieChart, title: 'Fleet Analytics', desc: 'Track maintenance data', bg: 'bg-blue-50', color: 'text-blue-600' },
                { icon: Clock, title: 'Priority Dispatch', desc: 'Minimal downtime', bg: 'bg-amber-50', color: 'text-amber-600' },
                { icon: Verified, title: 'Custom Plans', desc: 'Tailored for employees', bg: 'bg-orange-50', color: 'text-orange-600' },
            ]
        },
        eshop: {
            id: 'eshop',
            title: 'E-Shop Model',
            tag: 'Strategic Commerce',
            heroTitle: 'HYPERLOCAL',
            heroAccent: 'SHOPPING',
            desc: 'Advanced commerce hub with vendor syndication & priority brands.',
            icon: ShoppingBag,
            color: 'emerald',
            accent: '#10B981',
            bg: 'bg-emerald-50',
            image: '/assets/carwash/3.png',
            placeholder: 'FIRM NAME (e.g. Shine Labs)',
            cta: 'Partner as Vendor',
            customFlows: [
                {
                    title: 'Customer Experience',
                    icon: ShoppingCart,
                    items: [
                        { label: 'Browse', desc: 'Premium Catalog' },
                        { label: 'Add to Cart', desc: 'Basket Logic' },
                        { label: 'Checkout', desc: 'Hyper Payments' },
                        { label: '1hr Delivery', desc: 'Logistics Node' }
                    ]
                },
                {
                    title: 'Vendor Flow',
                    icon: Users,
                    items: [
                        { label: 'Upload', desc: 'Digital Shelf' },
                        { label: 'Stock Mgr', desc: 'Live Telemetry' },
                        { label: 'Packing', desc: 'Quality Check' },
                        { label: 'Dispatch', desc: 'Captain Sync' }
                    ]
                },
                {
                    title: 'Own Brand Flow',
                    icon: Award,
                    items: [
                        { label: 'Admin Inv', desc: 'Global Control' },
                        { label: 'Priority', desc: 'Ad Engine Boost' },
                        { label: 'Margins', desc: 'Strategic ROAS' }
                    ]
                }
            ],
            features: [
                { icon: Truck, title: '1hr Delivery', desc: 'Hyperlocal speed', bg: 'bg-orange-50', color: 'text-orange-600' },
                { icon: ShoppingBag, title: 'Own Brand', desc: 'High-margin logic', bg: 'bg-blue-50', color: 'text-blue-600' },
                { icon: Zap, title: 'Bidding', desc: 'Priority listings', bg: 'bg-amber-50', color: 'text-amber-600' },
                { icon: Verified, title: 'Escrow', desc: 'Safe vendor payouts', bg: 'bg-green-50', color: 'text-green-600' },
            ]
        }
    };

    const data = modelData[type] || modelData.apartment;
    const related = Object.values(modelData).filter(m => m.id !== data.id);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 1500));
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
            setIsSuccess(false);
            setShowInquiry(false);
            if (data.steps.length > 0) setActiveFlow('onboarding');
        }, 1500);
    };

    const nextStep = () => {
        if (flowStep < data.steps.length - 1) {
            setFlowStep(prev => prev + 1);
        } else {
            setActiveFlow('active');
        }
    };

    return (
        <MobileLayout hideNav={false}>
            <div className="bg-[#FBFCFF] min-h-screen font-outfit pb-12">
                <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap'); .font-outfit { font-family: 'Outfit', sans-serif; }` }} />

                {/* Header */}
                <header className="px-6 pt-6 pb-2 flex items-center justify-between bg-white/5 sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-gray-100`}>
                            <data.icon size={20} style={{ color: data.accent }} />
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-1">
                                <span className="text-[13px] font-black text-white uppercase tracking-tight">{data.title}</span>
                                <ChevronDown size={14} style={{ color: data.accent }} />
                            </div>
                            <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest leading-none mt-1">{data.tag}</p>
                        </div>
                    </div>
                    <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/[0.02] rounded-xl flex items-center justify-center border border-white/5">
                        <ArrowRight size={18} className="text-white rotate-180" />
                    </button>
                </header>

                {/* Conditionally Render Flow or Intro */}
                {!activeFlow ? (
                    <>
                        {/* Hero */}
                        <section className="px-5 py-6">
                            <div className={`${data.bg} rounded-2xl overflow-hidden relative h-[300px] shadow-2xl shadow-black/50 border border-white/5 group`}>
                                <div className="absolute top-0 right-0 w-40 h-40 opacity-20 rounded-full blur-3xl -mr-10 -mt-10" style={{ backgroundColor: data.accent }} />

                                <div className="absolute top-10 left-8 z-20">
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                        <h2 className="text-[14px] font-black uppercase tracking-widest mb-2 italic" style={{ color: data.accent }}>Exclusive Model</h2>
                                        <h1 className="text-[32px] font-black text-white leading-[0.8] uppercase italic tracking-tighter">
                                            {data.heroTitle}<br />
                                            <span style={{ color: data.accent }}>{data.heroAccent}</span>
                                        </h1>
                                        <p className="text-white/40 text-[10px] font-bold uppercase mt-4 tracking-widest leading-relaxed max-w-[170px]">
                                            {data.desc}
                                        </p>
                                    </motion.div>

                                    <motion.button
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => setShowInquiry(true)}
                                        className="mt-8 text-white px-6 py-3 rounded-xl flex items-center gap-3 font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-black/50"
                                        style={{ backgroundColor: data.accent, boxShadow: `0 10px 20px ${data.accent}33` }}
                                    >
                                        Initiate Now
                                        <ArrowRight size={14} />
                                    </motion.button>
                                </div>

                                <div className="absolute bottom-[-5%] right-[-10%] h-[75%] z-10 pointer-events-none">
                                    <img src={data.image} className="h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-700" alt={data.title} />
                                </div>
                            </div>
                        </section>

                        {/* Features Grid */}
                        <section className="px-5 mb-8">
                            <h3 className="text-[12px] font-black text-white uppercase tracking-widest italic mb-5">Enterprise Advantages</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {data.features.map((f, i) => (
                                    <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5  flex flex-col gap-3">
                                        <div className={`w-10 h-10 ${f.bg} ${f.color} rounded-xl flex items-center justify-center`}>
                                            <f.icon size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-white uppercase leading-tight">{f.title}</h4>
                                            <p className="text-[9px] font-bold text-black/30 uppercase mt-1 leading-tight tracking-tight">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Explorer: Related Models */}
                        <section className="px-5 mb-10">
                            <h3 className="text-[12px] font-black text-white uppercase tracking-widest italic mb-5">Explore Other Models</h3>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                                {related.map(m => (
                                    <motion.div
                                        key={m.id}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate(`/specialized-model/${m.id}`)}
                                        className="min-w-[200px] bg-white/5 p-5 rounded-3xl border border-white/5  relative overflow-hidden group"
                                    >
                                        <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center`} style={{ backgroundColor: m.accent + '11', color: m.accent }}>
                                            <m.icon size={20} />
                                        </div>
                                        <h4 className="text-[11px] font-black text-white uppercase">{m.title}</h4>
                                        <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest mt-1">{m.tag}</p>
                                        <div className="mt-4 flex items-center gap-2 text-brand font-black text-[9px] uppercase tracking-widest">
                                            View Details <ArrowRight size={10} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* Final Footer CTA */}
                        <div className="px-5 mb-12">
                            <div className="bg-black p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-black/20">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ background: `linear-gradient(to bottom right, ${data.accent}, transparent)` }} />
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white mb-6 border border-white/5">
                                        <data.icon size={24} />
                                    </div>
                                    <h3 className="text-white text-2xl font-black italic uppercase leading-none tracking-tight">Ready to Partner?</h3>
                                    <p className="text-white/40 text-[10px] font-bold mt-4 uppercase tracking-[0.2em] leading-relaxed max-w-[200px]">
                                        Join 50+ {data.tag.split(' ')[0]}s already using Spare Driver.
                                    </p>
                                    <button
                                        onClick={() => setShowInquiry(true)}
                                        className="mt-8 bg-white/5 py-4 px-10 rounded-2xl text-white font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-black/50 shadow-white/5 active:scale-95 transition-all flex items-center gap-3"
                                    >
                                        {data.cta}
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : activeFlow === 'onboarding' ? (
                    <div className="px-5 py-6">
                        {/* Onboarding Progress Header */}
                        <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5  mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Pipeline Phase {flowStep + 1}/{data.steps.length}</span>
                                <span className="px-3 py-1 bg-brand/10 text-brand text-[8px] font-black uppercase rounded-full">ACTIVE NODE</span>
                            </div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">{data.steps[flowStep].label}</h2>
                            <p className="text-[10px] font-bold text-black/30 uppercase tracking-[0.1em]">{data.steps[flowStep].desc}</p>

                            <div className="mt-6 h-1 w-full bg-white/[0.02] rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: `${((flowStep + 1) / data.steps.length) * 100}%` }}
                                    className="h-full bg-brand"
                                />
                            </div>
                        </div>

                        {/* Interactive Step Content */}
                        <motion.div
                            key={flowStep}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="bg-white/5 rounded-[2.5rem] border border-white/5 shadow-2xl shadow-black/50 overflow-hidden"
                        >
                            <div className="p-8">
                                {data.id === 'apartment' ? (
                                    <div className="space-y-6">
                                        {flowStep === 0 && (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-4">
                                                    <Building size={24} className="text-indigo-600" />
                                                    <div className="flex-1 text-[10px] font-black text-indigo-900/60 uppercase">Primary Complex Entry Registered: {form.org}</div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['Tower A', 'Tower B', 'Tower C', 'Podium'].map(t => (
                                                        <div key={t} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-[9px] font-black text-white/40 uppercase text-center">{t}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {flowStep === 1 && (
                                            <div className="space-y-4 text-center py-6">
                                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4 animate-pulse">
                                                    <Users size={32} />
                                                </div>
                                                <h4 className="text-[12px] font-black text-white uppercase italic">Resident Mapping active</h4>
                                                <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest">Scanning 420+ Unit Records...</p>
                                            </div>
                                        )}
                                        {flowStep === 2 && (
                                            <div className="bg-content p-6 rounded-[2rem] relative overflow-hidden">
                                                <div className="absolute inset-0 bg-brand/5" />
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <MapPin size={40} className="text-brand mb-4" />
                                                    <div className="w-full space-y-2">
                                                        <div className="h-1 bg-white/10 rounded-full w-full"><div className="h-full bg-brand w-3/4 rounded-full" /></div>
                                                        <div className="h-1 bg-white/10 rounded-full w-full"><div className="h-full bg-brand w-2/3 rounded-full" /></div>
                                                        <div className="h-1 bg-white/10 rounded-full w-full"><div className="h-full bg-brand w-1/2 rounded-full" /></div>
                                                    </div>
                                                    <span className="mt-4 text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">AI Cluster Generation</span>
                                                </div>
                                            </div>
                                        )}
                                        {flowStep === 3 && (
                                            <div className="space-y-3">
                                                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black text-white uppercase italic">Primary Captain Node</p>
                                                        <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">Assigned: Rajesh Kumar</p>
                                                    </div>
                                                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-brand ">
                                                        <User size={18} />
                                                    </div>
                                                </div>
                                                {['Morning Slot (6AM-8AM)', 'Resident Slot (9AM-12PM)', 'Evening Slot (4PM-7PM)'].map(s => (
                                                    <div key={s} className="p-4 border-white/5 border-dashed border-white/5 rounded-2xl flex items-center justify-between group hover:border-brand/40 transition-all">
                                                        <span className="text-[10px] font-black text-white/40 uppercase italic group-hover:text-white">{s}</span>
                                                        <Clock size={14} className="text-gray-200" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {data.customFlows ? (
                                            <div className="space-y-8">
                                                {data.customFlows.map((flow, fi) => (
                                                    <div key={fi} className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <flow.icon size={16} className="text-brand" />
                                                            <h4 className="text-[12px] font-black uppercase tracking-widest text-white">{flow.title}</h4>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {flow.items.map((item, ii) => (
                                                                <div key={ii} className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex flex-col gap-1 hover:border-brand/30 transition-all cursor-pointer">
                                                                    <p className="text-[10px] font-black text-white uppercase leading-none italic">{item.label}</p>
                                                                    <p className="text-[7px] font-bold text-black/30 uppercase tracking-widest">{item.desc}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <>
                                                {flowStep === 0 && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600"><Landmark size={24} /></div>
                                                            <div>
                                                                <h4 className="text-[13px] font-black text-white uppercase italic">{form.org}</h4>
                                                                <p className="text-[8px] font-bold text-black/30 uppercase tracking-widest leading-none mt-1">GST Verified: 23AABCC1234F1Z1</p>
                                                            </div>
                                                        </div>
                                                        <div className="h-2 w-full bg-white/[0.02] rounded-full" />
                                                    </div>
                                                )}
                                                {flowStep === 1 && (
                                                    <div className="space-y-3">
                                                        <div className="p-4 bg-gray-900 rounded-2xl flex items-center gap-4 text-white">
                                                            <Truck size={20} className="text-brand" />
                                                            <div className="flex-1">
                                                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Fleet Sync</p>
                                                                <p className="text-[11px] font-black uppercase">CSV Upload: fleet_data.csv</p>
                                                            </div>
                                                        </div>
                                                        <button className="w-full h-12 border-white/5 border-dashed border-white/5 rounded-2xl text-[9px] font-black text-black/30 uppercase tracking-widest">+ Add Manual Asset</button>
                                                    </div>
                                                )}
                                                {flowStep === 2 && (
                                                    <div className="bg-[#FFF6E9] p-6 rounded-[2rem] border border-orange-100">
                                                        <div className="flex justify-between items-center mb-6">
                                                            <h4 className="text-[11px] font-black text-white uppercase italic">Employee Benefit Mode</h4>
                                                            <div className="w-12 h-6 bg-brand rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white/5 rounded-full" /></div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="p-4 bg-white/60 rounded-xl border border-orange-100">
                                                                <span className="text-[8px] font-black text-orange-900/40 uppercase tracking-widest">Global Policy</span>
                                                                <p className="text-[10px] font-black text-white uppercase mt-1">Flat 25% Off for all verified employees</p>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="p-3 bg-white/40 rounded-xl border border-orange-50 text-center">
                                                                    <p className="text-lg font-black text-brand">450+</p>
                                                                    <p className="text-[7px] font-black text-black/30 uppercase">Employees</p>
                                                                </div>
                                                                <div className="p-3 bg-white/40 rounded-xl border border-orange-50 text-center">
                                                                    <p className="text-lg font-black text-green-600">₹1.2K</p>
                                                                    <p className="text-[7px] font-black text-black/30 uppercase">Avg Savings</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {flowStep === 3 && (
                                                    <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <FileText size={24} className="text-blue-600" />
                                                            <h4 className="text-[11px] font-black text-white uppercase italic">Monthly Invoicing</h4>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="p-4 bg-white/5 rounded-xl border border-blue-50">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-[8px] font-black text-black/30 uppercase tracking-widest">Billing Cycle</span>
                                                                    <span className="text-[9px] font-black text-blue-600">Monthly</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[8px] font-black text-black/30 uppercase tracking-widest">Auto Debit</span>
                                                                    <span className="text-[9px] font-black text-green-600">Enabled</span>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="p-3 bg-white/5 rounded-xl border border-blue-50 text-center">
                                                                    <p className="text-lg font-black text-blue-600">15th</p>
                                                                    <p className="text-[7px] font-black text-black/30 uppercase">Billing Day</p>
                                                                </div>
                                                                <div className="p-3 bg-white/5 rounded-xl border border-blue-50 text-center">
                                                                    <p className="text-lg font-black text-green-600">GSTR</p>
                                                                    <p className="text-[7px] font-black text-black/30 uppercase">Tax Mode</p>
                                                                </div>
                                                            </div>
                                                            <div className="p-3 bg-blue-100 rounded-xl border border-blue-200">
                                                                <p className="text-[8px] font-black text-blue-700 text-center">Next invoice: ₹45,000 (Dec 15, 2024)</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {flowStep === 4 && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {[
                                                            { l: 'Quality SLA', v: '99.8%', color: 'text-green-500' },
                                                            { l: 'Response SLA', v: '08 MINS', color: 'text-blue-500' },
                                                            { l: 'Fleet Uptime', v: '97.2%', color: 'text-amber-500' },
                                                            { l: 'Satisfaction', v: '4.8⭐', color: 'text-purple-500' }
                                                        ].map(m => (
                                                            <div key={m.l} className="p-5 bg-white/5 border border-gray-50 rounded-2xl  text-center">
                                                                <p className="text-[8px] font-black text-black/30 uppercase mb-2 leading-none">{m.l}</p>
                                                                <span className={`text-xl font-black italic ${m.color}`}>{m.v}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={nextStep}
                                    className="w-full h-16 bg-black text-white rounded-[1.25rem] font-black text-[12px] uppercase tracking-[0.2em] italic shadow-2xl flex items-center justify-center gap-4 mt-8"
                                >
                                    {flowStep < data.steps.length - 1 ? 'Compute & Next' : 'Launch Module Dashboard'}
                                    <ArrowRight size={20} />
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <div className="px-5 py-6">
                        {/* Final Dashboard State */}
                        <div className="bg-content p-8 rounded-[2.5rem] shadow-2xl border border-gray-800 relative overflow-hidden mb-6">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-3xl -mr-10 -mt-10" />
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-brand rounded-3xl flex items-center justify-center text-white mb-6 border-4 border-white/10 shadow-2xl shadow-black/50 shadow-brand/20">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">{data.title}<br />Active Node</h2>
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[200px]">Module successfully deployed for {form.org}.</p>

                                <div className="mt-8 grid grid-cols-2 gap-3 w-full">
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-sm">
                                        <p className="text-[8px] font-black text-white/20 uppercase mb-2">Assets Sync</p>
                                        <span className="text-white text-lg font-black italic">1,240+</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-sm">
                                        <p className="text-[8px] font-black text-white/20 uppercase mb-2">Contract Life</p>
                                        <span className="text-white text-lg font-black italic">12 MOS</span>
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => navigate('/')}
                                    className="w-full mt-8 h-14 bg-white/5 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-black/50 active:scale-95 transition-all"
                                >
                                    Return to Command
                                </motion.button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Inquiry Bottom Sheet */}
                <AnimatePresence>
                    {showInquiry && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
                                onClick={() => setShowInquiry(false)}
                            />
                            <motion.div
                                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed bottom-0 left-0 right-0 bg-white/5 rounded-t-[3rem] z-[101] p-8 pb-14 shadow-2xl overflow-hidden"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 w-12 h-1.5 bg-white/[0.05] rounded-full" />

                                <div className="absolute top-0 right-0 p-8">
                                    <button onClick={() => setShowInquiry(false)} className="bg-white/[0.05]/50 p-2.5 rounded-full text-gray-400 hover:text-white transition-all"><X size={20} /></button>
                                </div>

                                {isSuccess ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16 flex flex-col items-center text-center">
                                        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-8 border-4 border-white shadow-2xl shadow-black/50">
                                            <CheckCircle2 size={48} strokeWidth={2.5} />
                                        </div>
                                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Lead Captured</h3>
                                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-4 max-w-[220px] leading-relaxed">Our Growth Node will sync with you within 4 hours.</p>
                                    </motion.div>
                                ) : (
                                    <div className="mt-4">
                                        <div className="mb-10">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-2 py-0.5 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded">B2B NODE</span>
                                                <div className="h-px flex-1 bg-white/[0.05]" />
                                            </div>
                                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">Inquire for {data.title}</h3>
                                            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest leading-relaxed">{data.desc}</p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="relative group">
                                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                                                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="YOUR FULL NAME" className="w-full h-16 bg-white/[0.02] border border-transparent rounded-[1.25rem] pl-14 pr-6 text-[11px] font-black uppercase tracking-widest focus:bg-white/5 focus:border-brand/30 transition-all outline-none" />
                                                </div>
                                                <div className="relative group">
                                                    <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                                                    <input required value={form.org} onChange={e => setForm({ ...form, org: e.target.value })} placeholder={data.placeholder} className="w-full h-16 bg-white/[0.02] border border-transparent rounded-[1.25rem] pl-14 pr-6 text-[11px] font-black uppercase tracking-widest focus:bg-white/5 focus:border-brand/30 transition-all outline-none" />
                                                </div>
                                                <div className="relative group">
                                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                                                    <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="PRIMARY CONTACT" className="w-full h-16 bg-white/[0.02] border border-transparent rounded-[1.25rem] pl-14 pr-6 text-[11px] font-black uppercase tracking-widest focus:bg-white/5 focus:border-brand/30 transition-all outline-none" />
                                                </div>
                                                <div className="relative group">
                                                    <MessageSquare className="absolute left-5 top-6 text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                                                    <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="OPTIONAL MESSAGE / REQUIREMENTS" className="w-full h-28 bg-white/[0.02] border border-transparent rounded-[1.25rem] pl-14 pr-6 pt-6 text-[11px] font-black uppercase tracking-widest focus:bg-white/5 focus:border-brand/30 transition-all outline-none resize-none" />
                                                </div>
                                            </div>

                                            <motion.button
                                                whileTap={{ scale: 0.97 }}
                                                disabled={isSubmitting}
                                                type="submit"
                                                className="w-full h-16 bg-black text-white rounded-[1.25rem] font-black text-[12px] uppercase tracking-[0.2em] italic shadow-2xl flex items-center justify-center gap-4 group overflow-hidden relative"
                                            >
                                                {isSubmitting ? (
                                                    <Activity size={20} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <span className="relative z-10">{data.cta}</span>
                                                        <ArrowRight size={20} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                                                        <div className="absolute inset-0 bg-brand/0 group-hover:bg-brand/10 transition-colors" />
                                                    </>
                                                )}
                                            </motion.button>
                                        </form>
                                        <div className="mt-8 flex items-center justify-center gap-4 text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">
                                            <span className="flex items-center gap-1"><ShieldCheck size={10} /> ISO CERTIFIED</span>
                                            <div className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="flex items-center gap-1"><Verified size={10} /> SLA BACKED</span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};

export default ModelDetail;
