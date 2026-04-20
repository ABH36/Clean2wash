import React from 'react';
import { Crown, Edit2, Plus, RefreshCw, Trash2 } from 'lucide-react';

const SubscriptionsSection = ({
    fetchChauffeurPlans,
    openPlanEditor,
    plansLoading,
    chauffeurPlans,
    handlePlanDelete
}) => (
    <div className="space-y-3">
        <div className="bg-white/5 border border-white/5 rounded-[1rem] px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div>
                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Chauffeur Subscription Desk</p>
                <h3 className="text-[14px] font-black text-white uppercase">Spare-driver-only plans for consumer subscription flow</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={fetchChauffeurPlans}
                    className="flex items-center gap-2 h-9 px-4 border border-white/10 rounded-lg text-[10px] font-black text-black/50 uppercase hover:border-black hover:text-white transition-colors"
                >
                    <RefreshCw size={13} />
                    Refresh Plans
                </button>
                <button
                    onClick={() => openPlanEditor()}
                    className="flex items-center gap-2 h-9 px-4 bg-black text-white rounded-lg text-[10px] font-black uppercase hover:bg-brand hover:text-white transition-colors"
                >
                    <Plus size={13} />
                    New Plan
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {plansLoading ? (
                <div className="xl:col-span-2 bg-white/5 border border-white/5 rounded-lg py-16 flex items-center justify-center">
                    <div className="w-5 h-5 border-white/5 border-brand/30 border-t-brand rounded-full animate-spin" />
                </div>
            ) : chauffeurPlans.length === 0 ? (
                <div className="xl:col-span-2 bg-white/5 border border-white/5 rounded-lg py-16 text-center">
                    <Crown size={32} className="mx-auto text-black/10 mb-3" />
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No spare driver subscription plans configured yet</p>
                </div>
            ) : chauffeurPlans.map((plan) => (
                <div key={plan._id} className="bg-white/5 border border-white/5 rounded-[1rem] p-4 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[12px] font-black text-white uppercase">{plan.name}</p>
                                <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${plan.status === 'Live' ? 'bg-green-50 text-green-700' : 'bg-white/[0.05] text-white/60'}`}>
                                    {plan.status || 'Live'}
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-white/40 mt-1">
                                Scope: spare driver only
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => openPlanEditor(plan)}
                                className="h-9 w-9 bg-black text-white rounded-lg flex items-center justify-center hover:bg-brand hover:text-white transition-colors"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => handlePlanDelete(plan._id)}
                                className="h-9 w-9 border border-red-100 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div className="border border-white/5 rounded-lg p-2.5">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Plan Price</p>
                            <p className="text-[14px] font-black text-white">Rs {plan.price || 0}</p>
                        </div>
                        <div className="border border-white/5 rounded-lg p-2.5">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Credits</p>
                            <p className="text-[13px] font-black text-white">{plan.credits || 0}</p>
                        </div>
                        <div className="border border-white/5 rounded-lg p-2.5">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Interval</p>
                            <p className="text-[13px] font-black text-white">{plan.interval || 'Monthly'}</p>
                        </div>
                        <div className="border border-white/5 rounded-lg p-2.5">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Max Vehicles</p>
                            <p className="text-[13px] font-black text-white">{plan.maxVehicles || 1}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="border border-white/5 rounded-lg p-2.5">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Rollover</p>
                            <p className="text-[12px] font-black text-white">{plan.rollover || 0}</p>
                        </div>
                        <div className="border border-white/5 rounded-lg p-2.5">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Applicable Services</p>
                            <p className="text-[10px] font-black text-black/55 uppercase">
                                {(plan.applicableServices || []).join(', ') || 'SPARE_DRIVER'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">Plan Features</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {(plan.features || []).length ? plan.features.map((feature) => (
                                <span key={feature} className="px-2 py-1 bg-white/[0.02] text-[9px] font-black text-white/60 uppercase rounded-lg border border-white/5">
                                    {feature}
                                </span>
                            )) : (
                                <span className="text-[10px] font-bold text-black/30">No features configured</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default SubscriptionsSection;
