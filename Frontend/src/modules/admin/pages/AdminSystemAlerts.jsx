import React from 'react';
import { ShieldAlert, Bell, Filter, Trash2, Activity, Zap, Info } from 'lucide-react';
import PageShell, { SectionCard, FilterBar, EmptyState } from '../components/PageShell';

const AdminSystemAlerts = () => {
    // Mock alerts data - in a real scenario this would come from an API
    const alerts = []; 

    return (
        <PageShell
            title="System Alerts"
            subtitle="Real-time system health and critical operational alerts"
            icon={ShieldAlert}
            accent="rose"
            badge="Health-v4"
            actions={
                <button className="adm-btn adm-btn-ghost flex items-center gap-2">
                    <Trash2 size={16} /> Clear All
                </button>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <SectionCard className="bg-emerald-50/50 border-emerald-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Core Status</p>
                            <h4 className="text-xl font-black text-slate-800 tracking-tighter">OPTIMAL</h4>
                        </div>
                    </div>
                </SectionCard>
                <SectionCard className="bg-amber-50/50 border-amber-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Pending Sync</p>
                            <h4 className="text-xl font-black text-slate-800 tracking-tighter">0 UNITS</h4>
                        </div>
                    </div>
                </SectionCard>
                <SectionCard className="bg-slate-50/50 border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shadow-sm">
                            <Info size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Last Audit</p>
                            <h4 className="text-xl font-black text-slate-800 tracking-tighter">2M AGO</h4>
                        </div>
                    </div>
                </SectionCard>
            </div>

            <FilterBar>
                <div className="flex items-center gap-4">
                    <button className="text-xs font-black text-slate-800 border-b-2 border-amber-500 pb-2 px-1">ALL ALERTS</button>
                    <button className="text-xs font-black text-slate-400 hover:text-slate-600 pb-2 px-1">CRITICAL</button>
                    <button className="text-xs font-black text-slate-400 hover:text-slate-600 pb-2 px-1">WARNINGS</button>
                </div>
                <div className="ml-auto">
                    <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                        <Filter size={18} />
                    </button>
                </div>
            </FilterBar>

            <SectionCard noPad className="mt-6">
                {alerts.length === 0 ? (
                    <div className="py-24">
                        <EmptyState 
                            icon={ShieldAlert} 
                            title="System Fully Operational" 
                            subtitle="No critical alerts or warnings detected in the last audit cycle."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Alert Specification</th>
                                    <th>Severity</th>
                                    <th>Timestamp</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map((alert, i) => (
                                    <tr key={i}>
                                        {/* Row content */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>
        </PageShell>
    );
};

export default AdminSystemAlerts;

