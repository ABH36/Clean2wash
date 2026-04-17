import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageSquareText, Send, Loader2, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const DriverInquiry = () => {
    const [loading, setLoading] = useState(false);
    const [inquiries, setInquiries] = useState([]);
    const [form, setForm] = useState({ subject: '', message: '' });

    const fetch = async () => {
        try {
            const res = await spareDriverAPI.getInquiries();
            setInquiries(res.data.inquiries || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetch(); }, []);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.subject || !form.message) return toast.error("Complete all fields");
        setLoading(true);
        try {
            await spareDriverAPI.createInquiry(form);
            toast.success("Signal transmitted");
            setForm({ subject: '', message: '' });
            fetch();
        } catch (e) { toast.error("Transmission failed"); }
        finally { setLoading(false); }
    };

    return (
        <DriverLayout title="Support Comms">
            <div className="px-6 py-6 space-y-6 pb-24">
                {/* ── Comms Terminal ── */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[40px]" />
                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-4">Tactical Uplink</p>
                    <form onSubmit={submit} className="space-y-4">
                        <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="SUBJECT" className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-[12px] font-black text-white uppercase outline-none focus:border-brand" />
                        <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="MESSAGE" className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-5 text-[12px] font-black text-white uppercase outline-none focus:border-brand resize-none" />
                        <button disabled={loading} className="w-full h-14 bg-brand text-black rounded-xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                            {loading ? <Loader2 className="animate-spin" /> : <>Transmit <Send size={16} /></>}
                        </button>
                    </form>
                </motion.div>

                {/* ── Active Channels ── */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.3em] px-2">Comms Log</p>
                    {inquiries.length > 0 ? inquiries.map((iq, i) => (
                        <div key={i} className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="text-[11px] font-black text-black uppercase">{iq.subject}</h4>
                                <span className="text-[8px] font-black text-brand uppercase bg-brand/10 px-2 py-0.5 rounded-full">{iq.status}</span>
                            </div>
                            <p className="text-[10px] text-black/60 leading-relaxed uppercase">{iq.message}</p>
                            <div className="mt-4 flex items-center gap-2 text-black/20">
                                <Clock size={10} />
                                <span className="text-[8px] font-black uppercase tracking-widest">{new Date(iq.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center opacity-20"><MessageSquareText size={32} className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">No Signals Detected</p></div>
                    )}
                </div>
            </div>
        </DriverLayout>
    );
};

export default DriverInquiry;
