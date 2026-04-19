import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, ShieldCheck, Upload, CheckCircle2, 
    FileText, CreditCard, User, AlertCircle, Info, Loader2 
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const KYCVerification = () => {
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();
    const [idType, setIdType] = useState('aadhaar'); // aadhaar, pan, dl, voter
    const [files, setFiles] = useState({ front: null, back: null });
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(user?.kyc?.status === 'pending');

    const handleFileUpload = (e, side) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [side]: file }));
            toast.success(`${side.toUpperCase()} side uploaded`, { icon: '📎' });
        }
    };

    const handleSubmit = async () => {
        if (!files.front || (idType !== 'pan' && !files.back)) {
            toast.error('Please upload all required documents');
            return;
        }

        setLoading(true);
        try {
            // Simulated API call - In production, use FormData to send real files
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Update user state to 'pending'
            // await updateProfile({ kyc: { status: 'pending', idType, submittedAt: new Date() } });
            
            setIsSubmitted(true);
            toast.success('KYC Documents Submitted for Verification!', {
                icon: '🚀',
                style: { background: '#0F172A', color: '#fff' }
            });
        } catch (error) {
            toast.error('Submission failed. Retry later.');
        } finally {
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <MobileLayout hideNav>
                <div className="bg-white min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-[#FF9900] relative">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-2 border-dashed border-[#FF9900]/30 rounded-full"
                        />
                        <Loader2 size={40} className="animate-spin opacity-20 absolute" />
                        <ShieldCheck size={40} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-none">Protocol Active</h2>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Admin Authentication</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 w-full space-y-4 shadow-sm text-left">
                        {[
                            { label: 'Document Type', value: idType.toUpperCase() },
                            { label: 'Status', value: 'PEN-AUTH-REQUESTED', color: 'text-orange-500' },
                            { label: 'ETA', value: '12-24 Business Hours' }
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                                <span className="text-slate-400">{item.label}</span>
                                <span className={item.color || 'text-slate-900'}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => navigate('/compliance')}
                        className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20"
                    >
                        Back to Compliance Hub
                    </button>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest max-w-[200px]">You can still book services while verification is in progress.</p>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout hideNav>
            <div className="bg-[#FAFAFA] min-h-screen font-sans pb-10">
                <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-5 py-6 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-1 -ml-1">
                        <ChevronLeft size={20} className="text-slate-900" strokeWidth={2.5} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-900 uppercase tracking-tight italic">KYC Verification</h1>
                        <p className="text-[9px] font-bold text-brand uppercase tracking-[0.2em] mt-0.5">identity trust protocol</p>
                    </div>
                </header>

                <div className="px-5 py-8 space-y-8">
                    {/* Info Card */}
                    <div className="bg-brand/5 border border-brand/10 rounded-2xl p-5 flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
                            <Info size={20} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[11px] font-black text-slate-900 uppercase">Trusted Ecosystem</h4>
                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed tracking-tight">Identity verification ensures safety for both you and our detailing captains. Verified accounts get exclusive priority access.</p>
                        </div>
                    </div>

                    {/* ID Type Selection */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Identity Proof</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'aadhaar', label: 'Aadhaar Card', icon: CreditCard },
                                { id: 'pan', label: 'PAN Card', icon: FileText },
                                { id: 'dl', label: 'Driving License', icon: User },
                                { id: 'voter', label: 'Voter ID', icon: ShieldCheck }
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setIdType(type.id)}
                                    className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${idType === type.id ? 'bg-white border-[#FF9900] shadow-lg shadow-[#FF9900]/10 text-[#FF9900]' : 'bg-white border-gray-100 text-slate-400'}`}
                                >
                                    <type.icon size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-tight">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Upload Section */}
                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload Documents</label>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {/* Front Side */}
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    onChange={(e) => handleFileUpload(e, 'front')}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <div className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${files.front ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                                    {files.front ? (
                                        <>
                                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">{files.front.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-slate-300">
                                                <Upload size={24} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] font-black text-slate-900 uppercase">Front Side Image</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">PNG, JPG up to 5MB</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Back Side (Skip for PAN) */}
                            {idType !== 'pan' && (
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        onChange={(e) => handleFileUpload(e, 'back')}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${files.back ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                                        {files.back ? (
                                            <>
                                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                                                    <CheckCircle2 size={24} />
                                                </div>
                                                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">{files.back.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-slate-300">
                                                    <Upload size={24} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[11px] font-black text-slate-900 uppercase">Back Side Image</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Address Proof Verification</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={20} />
                                <span>Submit Protocol</span>
                            </>
                        )}
                    </button>
                    
                    <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest">Secure 256-bit Document Uplink</p>
                </div>
            </div>
        </MobileLayout>
    );
};

export default KYCVerification;
