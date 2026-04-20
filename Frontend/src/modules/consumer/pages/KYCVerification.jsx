import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, ShieldCheck, Upload, CheckCircle2, 
    FileText, CreditCard, User, AlertCircle, Info, Loader2, XCircle, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import MobileLayout from '../components/layout/MobileLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { authAPI } from '../../../utils/api';

const KYCVerification = () => {
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();
    const { isDarkMode } = useTheme();
    const [idType, setIdType] = useState('aadhaar'); // aadhaar, pan, dl, voter
    const [documentId, setDocumentId] = useState('');
    const [files, setFiles] = useState({ front: null, back: null });
    const [loading, setLoading] = useState(false);
    
    // Status management
    const isPending = user?.kyc?.status === 'pending';
    const isRejected = user?.kyc?.status === 'rejected';
    const isVerified = user?.kyc?.status === 'verified';
    
    const [isSubmitted, setIsSubmitted] = useState(isPending);

    // If rejected, allow user to re-fill the form
    const handleRetry = () => {
        setIsSubmitted(false);
        // Pre-fill with old data if possible
        if (user?.kyc?.documentId) setDocumentId(user.kyc.documentId);
        if (user?.kyc?.idType) setIdType(user.kyc.idType);
    };

    const handleFileUpload = (e, side) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFiles(prev => ({ ...prev, [side]: { name: file.name, data: reader.result } }));
                toast.success(`${side.toUpperCase()} side uploaded`, { icon: '📎' });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!files.front || (idType !== 'pan' && !files.back)) {
            toast.error('Please upload all required documents');
            return;
        }

        if (!documentId) {
            toast.error('Please enter your Document ID Number');
            return;
        }

        setLoading(true);
        try {
            const res = await authAPI.submitKYC({
                idType,
                documentId,
                documents: {
                    front: files.front.data,
                    back: files.back ? files.back.data : ''
                }
            });
            
            if (res.status === 'success') {
                setIsSubmitted(true);
                toast.success('KYC Documents Submitted for Verification!', {
                    icon: '🚀',
                    style: { background: '#0F172A', color: '#fff' }
                });
                
                if (updateProfile) {
                    await updateProfile({ kyc: res.data.kyc });
                }
            }
        } catch (error) {
            console.error('KYC Submission Error:', error);
            toast.error(error.message || 'Submission failed. Retry later.');
        } finally {
            setLoading(false);
        }
    };

    if (isVerified) {
        return (
            <MobileLayout hideNav>
                <div className="bg-[#0A0F0D] min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 relative shadow-2xl shadow-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 size={48} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase italic">Verified Elite</h2>
                        <p className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-[0.2em]">Authenticity Protocol Confirmed</p>
                    </div>
                    <button onClick={() => navigate('/compliance')} className="w-full h-14 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-white/10 transition-all">
                        Back to Hub
                    </button>
                </div>
            </MobileLayout>
        );
    }

    if (isSubmitted && !isRejected) {
        return (
            <MobileLayout hideNav>
                <div className="bg-[#0A0F0D] min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="w-24 h-24 bg-[#F59E0B]/10 rounded-full flex items-center justify-center text-[#F59E0B] relative border border-[#F59E0B]/20 shadow-2xl shadow-[#F59E0B]/10">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-white/5 border-dashed border-[#F59E0B]/50 rounded-full"
                        />
                        <Loader2 size={40} className="animate-spin opacity-20 absolute" />
                        <ShieldCheck size={40} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase italic leading-none">Protocol Active</h2>
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Awaiting Admin Authentication</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full space-y-4 text-left shadow-2xl">
                        {[
                            { label: 'Document Type', value: (user?.kyc?.idType || idType).toUpperCase() },
                            { label: 'Status', value: 'PEN-AUTH-REQUESTED', color: 'text-[#F59E0B]' },
                            { label: 'ETA', value: '12-24 Business Hours' }
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight pb-3 last:pb-0 last:border-0 border-b border-white/5">
                                <span className="text-white/40">{item.label}</span>
                                <span className={item.color || 'text-white'}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-full h-14 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-white/10 transition-all"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout hideNav>
            <div className={`min-h-screen pb-10 transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D]' : 'bg-[#FAF6EB]'}`}>
                <header className={`sticky top-0 z-50 border-b px-5 py-6 flex items-center gap-3 backdrop-blur-xl transition-all ${
                    isDarkMode ? 'bg-[#0A0F0D]/90 border-white/5' : 'bg-white/90 border-black/5'
                }`}>
                    <button onClick={() => navigate(-1)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-90 ${
                        isDarkMode ? 'bg-white/5 text-white' : 'bg-black/5 text-black'
                    }`}>
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div>
                        <h1 className={`text-base font-black uppercase tracking-tight italic ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>KYC Verification</h1>
                        <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5 ${isDarkMode ? 'text-orange-400' : 'text-[#FF9900]'}`}>identity trust protocol</p>
                    </div>
                </header>

                <div className="px-5 py-8 space-y-8">
                    {/* Rejection Alert */}
                    {isRejected && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-3">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                                    <AlertCircle size={20} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[11px] font-black text-red-900 uppercase">Verification Failed</h4>
                                    <p className="text-[10px] font-bold text-red-600 uppercase leading-relaxed tracking-tight">
                                        Reason: {user?.kyc?.rejectionReason || 'Invalid documents provided. Please upload clear, original photos.'}
                                    </p>
                                </div>
                            </div>
                            <p className="text-[9px] text-red-400 font-bold uppercase italic">* Please correct the issues and re-submit your protocol.</p>
                        </motion.div>
                    )}

                    {/* Info Card */}
                    {!isRejected && (
                        <div className="bg-[#FF9900]/5 border border-[#FF9900]/10 rounded-2xl p-5 flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-[#FF9900]/10 rounded-xl flex items-center justify-center text-[#FF9900]">
                                <Info size={20} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase">Trusted Ecosystem</h4>
                                <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed tracking-tight">Identity verification ensures safety for both you and our detailing captains. Verified accounts get exclusive priority access.</p>
                            </div>
                        </div>
                    )}

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
                                    className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all ${idType === type.id ? 'bg-white/5 border-[#FF9900] shadow-lg shadow-[#FF9900]/10 text-[#FF9900]' : 'bg-white/5 border-white/5 text-slate-400'}`}
                                >
                                    <type.icon size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-tight">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Document ID Input */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Number</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF9900] transition-colors">
                                <FileText size={18} />
                            </div>
                            <input 
                                type="text"
                                value={documentId}
                                onChange={(e) => setDocumentId(e.target.value)}
                                placeholder={`Enter ${idType.toUpperCase()} number`}
                                className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#FF9900] focus:ring-4 focus:ring-brand/5 transition-all "
                            />
                        </div>
                    </div>

                    {/* Upload Section */}
                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload Documents</label>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <div className="relative group">
                                <input type="file" onChange={(e) => handleFileUpload(e, 'front')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <div className={`h-40 rounded-2xl border-dashed flex flex-col items-center justify-center gap-4 transition-all ${files.front ? 'bg-green-500/10 border-green-500/30' : isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                                    {files.front ? (
                                        <>
                                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white"><CheckCircle2 size={24} /></div>
                                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">{files.front.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-white/[0.05] text-white/40' : 'bg-white text-black/40 shadow-sm'}`}><Upload size={24} /></div>
                                            <p className={`text-[11px] font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Front Side Image</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {idType !== 'pan' && (
                                <div className="relative group">
                                    <input type="file" onChange={(e) => handleFileUpload(e, 'back')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    <div className={`h-40 rounded-2xl border-dashed flex flex-col items-center justify-center gap-4 transition-all ${files.back ? 'bg-green-500/10 border-green-500/30' : isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                                        {files.back ? (
                                            <>
                                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white"><CheckCircle2 size={24} /></div>
                                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">{files.back.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-white/[0.05] text-white/40' : 'bg-white text-black/40 shadow-sm'}`}><Upload size={24} /></div>
                                                <p className={`text-[11px] font-black uppercase ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>Back Side Image</p>
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
                        className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                        <span>{isRejected ? 'Re-Submit Protocol' : 'Submit Protocol'}</span>
                    </button>
                </div>
            </div>
        </MobileLayout>
    );
};

export default KYCVerification;
