import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ShieldCheck,
    FileText,
    CheckCircle2,
    Lock,
    Zap,
    ChevronRight,
    HelpCircle,
    Activity,
    AlertCircle,
    UserCheck,
    Briefcase,
    Search,
    RefreshCcw,
    X,
    Camera,
    ChevronDown,
    ShieldAlert
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';

const InsuranceCenter = () => {
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [activeClaimStep, setActiveClaimStep] = useState(0);
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);

    const runSafetyScan = () => {
        setIsScanning(true);
        setScanComplete(false);
        setTimeout(() => {
            setIsScanning(false);
            setScanComplete(true);
        }, 2500);
    };

    const faqs = [
        { q: 'How do I report damage?', a: 'Click on the "Claims Node" and follow our AI-guided reporting wizard to submit photos and details.' },
        { q: 'What is the claim turnaround time?', a: 'Most operational audits are completed within 48 business hours with immediate payout.' },
        { q: 'Is my paint covered?', a: 'Yes, our "Surface Guard" protocol covers paint integrity and chemical reactions.' },
    ];

    return (
        <MobileLayout>
            <div className="flex flex-col bg-[#F8F9FB] min-h-screen pb-32">
                {/* ── Header ── */}
                <header className="px-5 pt-8 pb-5 bg-white/5 sticky top-0 z-50 border-b border-white/5 backdrop-blur-md bg-white/90">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg bg-white/[0.02] flex items-center justify-center text-content hover:bg-brand hover:text-white transition-all">
                                <ArrowLeft size={16} strokeWidth={3} />
                            </button>
                            <div>
                                <h1 className="text-sm font-[1000] text-content uppercase tracking-tight">Insurance <span className="text-brand">Center</span></h1>
                                <p className="text-[7px] font-black text-brand uppercase tracking-[0.2em]">Certified Protective Node</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${scanComplete ? 'bg-green-50 border-green-100 text-green-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${scanComplete ? 'bg-green-500 animate-pulse' : 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]'}`} />
                            <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                                {scanComplete ? 'Status: Verified' : 'Status: Secured'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="px-5 py-6 space-y-6">
                    {/* ── Protection Grade Card (Interactive Scan) ── */}
                    <motion.div
                        className="bg-content rounded-xl p-6 text-white relative overflow-hidden shadow-2xl shadow-black/50 shadow-content/20 border border-white/5"
                    >
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-10 h-10 bg-brand/90 backdrop-blur-md rounded-lg flex items-center justify-center shadow-lg border border-white/10 relative overflow-hidden">
                                    {isScanning && (
                                        <motion.div
                                            animate={{ y: [-40, 40] }}
                                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                            className="absolute inset-0 bg-white/30 h-1"
                                        />
                                    )}
                                    <ShieldCheck size={20} className={isScanning ? 'animate-pulse' : ''} strokeWidth={2.5} />
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={runSafetyScan}
                                    className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10 transition-all"
                                >
                                    <RefreshCcw size={10} className={isScanning ? 'animate-spin' : ''} />
                                    {isScanning ? 'Scanning...' : 'Verify Node'}
                                </motion.button>
                            </div>

                            <div className="space-y-1 mb-8">
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] italic">Underwriting Limit</p>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-3xl font-[1000] italic tracking-tighter leading-none">₹5,00,000</h2>
                                    {scanComplete && (
                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Verified</motion.span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 border border-white/10 p-3 rounded-lg backdrop-blur-sm relative overflow-hidden group">
                                    {isScanning && <motion.div animate={{ x: [-100, 100] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-y-0 w-4 bg-white/10 skew-x-12" />}
                                    <p className="text-white/30 text-[7px] font-black uppercase tracking-widest mb-1">Claim Success</p>
                                    <p className="text-sm font-[1000] italic tracking-tight">99.2%</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-3 rounded-lg backdrop-blur-sm relative overflow-hidden group">
                                    {isScanning && <motion.div animate={{ x: [-100, 100] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="absolute inset-y-0 w-4 bg-white/10 skew-x-12" />}
                                    <p className="text-white/30 text-[7px] font-black uppercase tracking-widest mb-1">Settlement</p>
                                    <p className="text-sm font-[1000] italic tracking-tight">48 Hrs</p>
                                </div>
                            </div>
                        </div>
                        <Lock size={120} className="absolute -bottom-6 -right-6 text-white/[0.02] -rotate-12 pointer-events-none" />
                    </motion.div>

                    {/* ── Coverage Grid ── */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-1">
                            <div className="h-0.5 flex-1 bg-gradient-to-r from-brand/40 to-transparent rounded-full" />
                            <h4 className="text-[9px] font-black text-content uppercase tracking-[0.3em] italic">Coverage Matrix</h4>
                            <div className="h-0.5 w-8 bg-white/[0.05] rounded-full" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: <Zap size={14} />, title: 'Operational', desc: 'Process damage', color: 'text-amber-500', bg: 'bg-amber-50' },
                                { icon: <ShieldCheck size={14} />, title: 'Fleet Security', desc: 'On-site mishaps', color: 'text-indigo-500', bg: 'bg-indigo-50' },
                                { icon: <AlertCircle size={14} />, title: 'Surface Guard', desc: 'Paint integrity', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { icon: <UserCheck size={14} />, title: 'Expert Liability', desc: 'Human errors', color: 'text-rose-500', bg: 'bg-rose-50' },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                     whileTap={{ scale: 0.97 }}
                                     className="bg-white/5 rounded-lg p-3.5 border border-white/5  flex flex-col gap-3 group hover:border-brand/30 transition-all cursor-pointer"
                                     onClick={() => toast.success(`${item.title} protocol is active and verified for your current session.`)}
                                 >
                                    <div className={`w-8 h-8 ${item.bg} ${item.color} rounded-md flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all`}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-content italic uppercase tracking-tight leading-none mb-1">{item.title}</h4>
                                        <p className="text-[8px] font-bold text-content-subtle uppercase tracking-tighter opacity-70 leading-tight">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* ── Interactive Claims Hub ── */}
                    <div className="bg-white/5 rounded-xl p-5 border border-white/5  flex items-center gap-5 group hover:border-brand/20 transition-all relative overflow-hidden">
                        <div className="w-12 h-12 bg-white/[0.02] rounded-lg flex items-center justify-center text-content-subtle shrink-0 group-hover:bg-brand group-hover:text-white transition-all relative z-10 border border-white/5">
                            <FileText size={20} />
                        </div>
                        <div className="flex-1 relative z-10">
                            <h3 className="text-[12px] font-black text-content italic uppercase tracking-tight mb-0.5">Claims Node</h3>
                            <p className="text-[9px] font-bold text-content-subtle uppercase tracking-tight opacity-70 mb-3">Initiate Audit Protocol</p>
                            <button
                                onClick={() => setIsClaimModalOpen(true)}
                                className="h-8 px-4 bg-content text-white rounded-lg font-black text-[8px] uppercase tracking-[0.15em] shadow-lg shadow-content/20 group-hover:bg-brand transition-all flex items-center gap-2 active:scale-95"
                            >
                                Launch Hub <ChevronRight size={12} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* ── Interactive FAQ ── */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1 mb-3">
                            <HelpCircle size={14} className="text-brand" />
                            <h4 className="text-[9px] font-black text-content uppercase tracking-[0.2em]">Operational FAQ</h4>
                        </div>
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-white/5 rounded-lg border border-white/5 overflow-hidden transition-all">
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                    className="w-full px-4 py-3.5 flex items-center justify-between text-left"
                                >
                                    <span className="text-[11px] font-[1000] text-content italic tracking-tight uppercase leading-none">{faq.q}</span>
                                    <ChevronDown size={14} className={`text-content/30 transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {expandedFaq === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-4 pb-4"
                                        >
                                            <p className="text-[10px] font-bold text-content-subtle leading-relaxed border-t border-gray-50 pt-3">{faq.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>

                    {/* ── Security Feed ── */}
                    <div className="bg-gray-900 rounded-xl p-5 border border-white/5 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-brand" />
                                <h4 className="text-[9px] font-black text-white uppercase tracking-[0.2em] italic">Privacy Audit Log</h4>
                            </div>
                            <span className="text-[7px] text-white/30 font-black uppercase">v4.0.1 Secure</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1" />
                                <div>
                                    <p className="text-[9px] font-black text-white/80 uppercase tracking-tighter leading-none">Protection Tunnel Established</p>
                                    <p className="text-[7px] font-bold text-white/30 uppercase mt-1">Status: Operational • 0.04ms</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                                <div>
                                    <p className="text-[9px] font-black text-white/80 uppercase tracking-tighter leading-none">Safety Protocol Handshake</p>
                                    <p className="text-[7px] font-bold text-white/30 uppercase mt-1">Node Verified • ID: CW-991</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 text-center">
                        <p className="text-[7px] font-black text-content-subtle uppercase tracking-[0.4em] opacity-30 italic">© 2026 CW Protective Node. Secured Protocol.</p>
                    </div>
                </div>
            </div>

            {/* ── Claim Wizard Modal ── */}
            <AnimatePresence>
                {isClaimModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="w-full max-w-md bg-white/5 rounded-xl overflow-hidden shadow-2xl relative"
                        >
                            <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-brand/10 text-brand rounded-lg flex items-center justify-center">
                                        <ShieldAlert size={18} />
                                    </div>
                                    <h3 className="text-sm font-[1000] text-content uppercase tracking-tight">Claim Wizard</h3>
                                </div>
                                <button onClick={() => setIsClaimModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/[0.02] flex items-center justify-center text-content-subtle">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Steps Indicator */}
                                <div className="flex gap-2">
                                    {[0, 1, 2].map(s => (
                                        <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= activeClaimStep ? 'bg-brand' : 'bg-white/[0.05]'}`} />
                                    ))}
                                </div>

                                {activeClaimStep === 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-[13px] font-black text-content italic uppercase tracking-tight">Select Incident Type</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Paint Damage', 'Process Error', 'Operational', 'Technician'].map(t => (
                                                <button key={t} onClick={() => setActiveClaimStep(1)} className="p-4 border border-white/5 rounded-lg text-left hover:border-brand transition-all group">
                                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-none mb-1 group-hover:text-brand">{t}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-[8px] font-bold text-content-subtle opacity-50">Node v4</span>
                                                        <ChevronRight size={10} className="text-gray-300" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeClaimStep === 1 && (
                                    <div className="space-y-4">
                                        <h4 className="text-[13px] font-black text-content italic uppercase tracking-tight">Capture Evidence</h4>
                                        <div className="aspect-video bg-white/[0.02] rounded-lg border-white/5 border-dashed border-white/10 flex flex-col items-center justify-center text-content-subtle gap-3 group hover:bg-white/5 hover:border-brand transition-all cursor-pointer">
                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center  group-hover:text-brand">
                                                <Camera size={24} />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest">Tap to Scan Damage</p>
                                        </div>
                                        <button onClick={() => setActiveClaimStep(2)} className="w-full h-12 bg-content text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-black/50 shadow-content/20">Analyze Visuals</button>
                                    </div>
                                )}

                                {activeClaimStep === 2 && (
                                    <div className="space-y-4 py-4 text-center">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20 mb-4">
                                            <CheckCircle2 size={32} strokeWidth={3} />
                                        </motion.div>
                                        <h4 className="text-base font-[1000] text-content italic uppercase tracking-tight">Claim Initialized</h4>
                                        <p className="text-[11px] font-bold text-content-subtle leading-relaxed uppercase tracking-tighter">Incident reported under ID: <span className="text-brand">#INS-9921</span>. Our neural engine is auditing the visuals.</p>
                                        <div className="h-4" />
                                        <button onClick={() => setIsClaimModalOpen(false)} className="w-full h-12 bg-brand text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-black/50 shadow-brand/20">Return to Node</button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </MobileLayout>
    );
};

export default InsuranceCenter;
