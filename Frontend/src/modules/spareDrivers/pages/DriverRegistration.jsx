import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, ChevronRight, FileText, Camera, ShieldCheck, CheckCircle2, Loader2, AlertCircle, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { spareDriverAPI } from '../../../utils/spareDriverApi';

const STEPS = { REGISTER: 0, UPLOAD_DOCS: 1, VERIFYING: 2, SUCCESS: 3 };

// ── Defined OUTSIDE to prevent re-mount on every keystroke ──
const Field = ({ label, icon: Icon, type, value, onChange, placeholder, required = true }) => (
    <div>
        <label className="block text-[9px] font-black text-black/30 uppercase tracking-widest mb-1.5">{label}</label>
        <div className="flex items-center gap-3 h-11 border border-gray-200 rounded-md px-3 focus-within:border-black transition-colors bg-white">
            <Icon size={14} className="text-black/20 shrink-0" />
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="flex-1 text-[12px] font-bold text-black placeholder:text-black/15 outline-none bg-transparent"
            />
        </div>
    </div>
);

// File input with live image preview
const DocUpload = ({ label, icon: Icon, file, onChange }) => {
    const preview = file ? URL.createObjectURL(file) : null;
    return (
        <div className="border border-gray-100 rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <Icon size={13} className="text-black/30" />
                    <span className="text-[9px] font-black text-black/50 uppercase tracking-widest">{label}</span>
                </div>
                {file
                    ? <span className="text-[8px] font-black text-[#F29F05] uppercase">Selected</span>
                    : <span className="text-[8px] font-black bg-gray-200 text-black/30 px-1.5 py-0.5 rounded uppercase">Required</span>
                }
            </div>
            <label className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                {preview
                    ? <img src={preview} alt="preview" className="w-14 h-14 object-cover rounded border border-gray-200" />
                    : <div className="w-14 h-14 bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center text-black/20">
                        <Icon size={20} />
                    </div>
                }
                <div>
                    <p className="text-[10px] font-black text-black uppercase">{file ? file.name : 'Tap to select image'}</p>
                    <p className="text-[8px] font-black text-black/25 uppercase tracking-wider mt-0.5">JPG, PNG, WEBP — max 5MB</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={onChange} />
            </label>
        </div>
    );
};

const DriverRegistration = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(STEPS.REGISTER);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
    const [docs, setDocs] = useState({ aadhaarCard: null, drivingLicense: null, selfie: null });

    useEffect(() => {
        if (!localStorage.getItem('chauffeur_token')) return;
        spareDriverAPI.getProfile()
            .then(res => {
                const s = res.data.driver.status;
                if (s === 'onboarding') setStep(STEPS.UPLOAD_DOCS);
                else if (s === 'pending_verification') setStep(STEPS.VERIFYING);
                else if (s === 'active') setStep(STEPS.SUCCESS);
            }).catch(() => { });
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await spareDriverAPI.register(form);
            setStep(STEPS.UPLOAD_DOCS);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const handleUpload = async () => {
        if (!docs.aadhaarCard || !docs.drivingLicense || !docs.selfie) {
            setError('Please upload all three documents'); return;
        }
        setLoading(true); setError('');
        try {
            const formData = new FormData();
            formData.append('aadhaarCard', docs.aadhaarCard);
            formData.append('drivingLicense', docs.drivingLicense);
            formData.append('selfie', docs.selfie);
            await spareDriverAPI.uploadDocs(formData);
            setStep(STEPS.VERIFYING);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    // ── Step 0: Register ──
    if (step === STEPS.REGISTER) return (
        <div className="min-h-screen bg-white px-5 pt-12 pb-10" style={{ maxWidth: 430, margin: '0 auto' }}>
            <div className="mb-8">
                <span className="text-[9px] font-black text-[#F29F05] uppercase tracking-widest block mb-1">Chauffeur Elite</span>
                <h1 className="text-2xl font-black text-black uppercase tracking-tight leading-tight">Driver Registration</h1>
                <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mt-1">Create your account to get started</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
                <Field label="Full Name" icon={User} type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Rahul Sharma" />
                <Field label="Email Address" icon={Mail} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="rahul@email.com" />
                <Field label="Phone Number" icon={Phone} type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                <Field label="Password" icon={Lock} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />

                {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-md px-3 py-2.5">
                        <AlertCircle size={13} className="text-red-400 shrink-0" />
                        <p className="text-[10px] font-black text-red-500 uppercase">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-md flex items-center justify-center gap-2 mt-2"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : (
                        <> Proceed to Documents <ChevronRight size={15} strokeWidth={3} /> </>
                    )}
                </button>
            </form>

            <p className="text-center text-[9px] font-black text-black/20 uppercase tracking-widest mt-8">
                Already a driver?{' '}
                <button onClick={() => navigate('/spare-driver/dashboard')} className="text-black underline">
                    Go to Dashboard
                </button>
            </p>
        </div>
    );

    // ── Step 1: Upload Docs ──
    if (step === STEPS.UPLOAD_DOCS) return (
        <div className="min-h-screen bg-white px-5 pt-12 pb-10" style={{ maxWidth: 430, margin: '0 auto' }}>
            <div className="mb-8">
                <span className="text-[9px] font-black text-[#F29F05] uppercase tracking-widest block mb-1">Step 2 of 3</span>
                <h1 className="text-2xl font-black text-black uppercase tracking-tight leading-tight">Identity Proof</h1>
                <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mt-1">Government issued documents required</p>
            </div>

            <div className="border border-[#F29F05]/30 bg-[#FFFBF0] rounded-md px-4 py-3 flex items-center gap-3 mb-6">
                <ShieldCheck size={16} className="text-[#F29F05] shrink-0" />
                <p className="text-[9px] font-black text-black/50 uppercase leading-relaxed">
                    Your documents are encrypted and stored securely.
                </p>
            </div>

            <div className="space-y-3">
                <DocUpload label="Aadhaar Card" icon={FileText} file={docs.aadhaarCard} onChange={e => setDocs({ ...docs, aadhaarCard: e.target.files[0] })} />
                <DocUpload label="Driving License" icon={MapPin} file={docs.drivingLicense} onChange={e => setDocs({ ...docs, drivingLicense: e.target.files[0] })} />
                <DocUpload label="Live Selfie" icon={Camera} file={docs.selfie} onChange={e => setDocs({ ...docs, selfie: e.target.files[0] })} />
            </div>

            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-md px-3 py-2.5 mt-4">
                    <AlertCircle size={13} className="text-red-400 shrink-0" />
                    <p className="text-[10px] font-black text-red-500 uppercase">{error}</p>
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full h-11 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-md flex items-center justify-center gap-2 mt-6"
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Submit for Verification'}
            </button>
        </div>
    );

    // ── Step 2: Verifying ──
    if (step === STEPS.VERIFYING) return (
        <div className="min-h-screen bg-white px-5 pt-16 pb-10 flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
            <div className="flex-1 flex flex-col justify-center">
                <div className="mb-8">
                    <span className="text-[9px] font-black text-[#F29F05] uppercase tracking-widest block mb-1">Step 3 of 3</span>
                    <h1 className="text-2xl font-black text-black uppercase tracking-tight leading-tight">Under Review</h1>
                    <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mt-1">Our team is verifying your documents</p>
                </div>

                <div className="border border-gray-100 rounded-md divide-y divide-gray-50">
                    {[
                        { label: 'Profile Created', done: true },
                        { label: 'Documents Uploaded', done: true },
                        { label: 'Verification Pending', done: false },
                    ].map(({ label, done }, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                            <div className={`w-5 h-5 rounded flex items-center justify-center ${done ? 'bg-[#F29F05]' : 'bg-gray-100'}`}>
                                {done
                                    ? <CheckCircle2 size={12} className="text-black" />
                                    : <Clock size={11} className="text-black/30 animate-pulse" />}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wide ${done ? 'text-black' : 'text-black/30'}`}>{label}</span>
                        </div>
                    ))}
                </div>

                <p className="text-[9px] font-black text-black/20 uppercase tracking-widest text-center mt-8">
                    Usually takes 2–4 hours
                </p>
            </div>

            <button onClick={() => navigate('/')} className="text-[9px] font-black text-black/20 uppercase tracking-widest underline text-center">
                Back to Home
            </button>
        </div>
    );

    // ── Step 3: Success ──
    return (
        <div className="min-h-screen bg-white px-5 pt-16 pb-10 flex flex-col" style={{ maxWidth: 430, margin: '0 auto' }}>
            <div className="flex-1 flex flex-col justify-center space-y-6">
                <div className="w-12 h-12 bg-[#F29F05] rounded-md flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-black" strokeWidth={3} />
                </div>

                <div>
                    <h1 className="text-2xl font-black text-black uppercase tracking-tight leading-tight">Account Activated</h1>
                    <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mt-1">You are now a verified driver</p>
                </div>

                <div className="border border-gray-100 rounded-md divide-y divide-gray-50">
                    <div className="flex items-center justify-between px-4 py-3.5">
                        <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">Status</span>
                        <span className="text-[10px] font-black text-[#F29F05] uppercase">Available</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3.5">
                        <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">Rank</span>
                        <span className="text-[10px] font-black text-black uppercase">New Driver</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/spare-driver/dashboard')}
                    className="w-full h-11 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-md"
                >
                    Open Dashboard
                </button>
            </div>
        </div>
    );
};

export default DriverRegistration;
