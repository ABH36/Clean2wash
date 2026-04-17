import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowDownLeft, ArrowUpRight, Download, Loader2, Wallet, ShieldCheck, Zap } from 'lucide-react';
import DriverLayout from '../components/DriverLayout';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { motion } from 'framer-motion';

const DriverEarnings = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        balance: 0,
        transactions: [],
        monthlyEarnings: 0,
        jobsDone: 0
    });

    useEffect(() => {
        const load = async () => {
            try {
                const [p, t] = await Promise.all([spareDriverAPI.getProfile(), spareDriverAPI.getTransactions()]);
                const txs = t.data.transactions || [];
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                
                setData({
                    balance: p.data.driver?.wallet?.balance || 0,
                    transactions: txs,
                    monthlyEarnings: txs.filter(x => x.type === 'credit' && new Date(x.createdAt) >= start).reduce((a, b) => a + b.amount, 0),
                    jobsDone: txs.filter(x => x.category === 'SERVICE_BOOKING' && x.type === 'credit').length
                });
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        load();
    }, []);

    if (loading) return <DriverLayout title="Finance"><div className="flex h-[60vh] items-center justify-center font-black text-brand uppercase tracking-[0.4em] animate-pulse">Syncing Vault...</div></DriverLayout>;

    return (
        <DriverLayout title="Finance Console">
            <div className="px-6 py-6 space-y-6 pb-24">
                {/* ── Yield Matrix ── */}
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-black rounded-[2.8rem] p-8 shadow-2xl relative overflow-hidden text-center border border-white/5 transition-colors duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[60px]" />
                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-4">Secured Balance</p>
                    <h2 className="text-5xl font-black text-white tracking-tighter leading-none mb-8">₹{data.balance}</h2>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button className="h-14 bg-brand text-black rounded-2xl font-black text-[12px] uppercase tracking-widest active:scale-95 transition-all">Withdraw</button>
                        <button className="h-14 bg-white/5 border border-white/5 text-white/40 rounded-2xl flex items-center justify-center active:scale-95"><Download size={20} /></button>
                    </div>
                </motion.div>

                {/* ── Telemetry ── */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface border border-content/[0.04] p-6 rounded-[2rem] shadow-sm transition-colors duration-500">
                        <p className="text-[9px] font-black text-content/20 uppercase tracking-widest mb-2">Monthly Cycle</p>
                        <p className="text-2xl font-black text-content tracking-tight">₹{data.monthlyEarnings}</p>
                        <div className="flex items-center gap-1.5 mt-2 bg-brand/10 w-fit px-3 py-1 rounded-full">
                            <Zap size={10} className="text-brand fill-brand" />
                            <span className="text-[8px] font-black uppercase text-brand">Peak Yield</span>
                        </div>
                    </div>
                    <div className="bg-surface border border-content/[0.04] p-6 rounded-[2rem] shadow-sm transition-colors duration-500">
                        <p className="text-[9px] font-black text-content/20 uppercase tracking-widest mb-2">Missions Log</p>
                        <p className="text-2xl font-black text-content tracking-tight">{data.jobsDone}</p>
                        <div className="flex items-center gap-1.5 mt-2 bg-content/[0.05] w-fit px-3 py-1 rounded-full">
                            <ShieldCheck size={10} className="text-content/30" />
                            <span className="text-[8px] font-black uppercase text-content/30">Verified</span>
                        </div>
                    </div>
                </div>

                {/* ── Archive ── */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-content/30 uppercase tracking-[0.3em] px-2">Operational Ledger</p>
                    <div className="bg-surface border border-content/[0.04] rounded-[2.2rem] overflow-hidden shadow-sm divide-y divide-content/[0.04] transition-colors duration-500">
                        {data.transactions.length > 0 ? data.transactions.map((tx, i) => (
                            <div key={i} className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-brand/10 text-brand' : 'bg-content/[0.05] text-content/20'}`}>
                                        {tx.type === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-content uppercase leading-none mb-1">{tx.description || tx.category}</p>
                                        <p className="text-[8px] font-black text-content/20 uppercase tracking-widest">{new Date(tx.createdAt).toLocaleDateString()} • {tx._id.slice(-6).toUpperCase()}</p>
                                    </div>
                                </div>
                                <p className={`text-sm font-black ${tx.type === 'credit' ? 'text-content' : 'text-content/40'}`}>
                                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                                </p>
                            </div>
                        )) : (
                           <div className="py-20 text-center opacity-20 text-content"><Wallet size={32} className="mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">No Logs Found</p></div>
                        )}
                    </div>
                </div>
            </div>
        </DriverLayout>
    );
};

export default DriverEarnings;
