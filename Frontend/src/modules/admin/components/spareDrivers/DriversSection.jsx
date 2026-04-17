import React from 'react';
import { Eye, RefreshCw, User } from 'lucide-react';
import DriverLaneGrid from './DriverLaneGrid';

const DriversSection = ({
    lanes,
    driverLane,
    laneCounts,
    onSelectLane,
    refreshAll,
    loading,
    directoryDrivers,
    statusConfig,
    openDriverReview
}) => (
    <div className="space-y-3">
        <DriverLaneGrid
            lanes={lanes}
            driverLane={driverLane}
            laneCounts={laneCounts}
            onSelect={onSelectLane}
        />

        <div className="flex items-center justify-end gap-3 flex-wrap">
            <button
                onClick={refreshAll}
                className="flex items-center gap-2 h-9 px-4 border border-gray-200 dark:border-white/15 rounded-lg text-[10px] font-black text-black/50 dark:text-white/70 uppercase hover:border-black dark:hover:border-white/40 hover:text-black dark:hover:text-white transition-colors"
            >
                <RefreshCw size={13} />
                Refresh
            </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-[1rem] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 dark:border-white/10">
                <p className="text-[9px] font-black text-black/30 dark:text-white/45 uppercase tracking-widest mb-1">Driver directory</p>
                <h3 className="text-[14px] font-black text-black dark:text-white uppercase">All spare drivers with filterable status and review access</h3>
            </div>
            <div className="grid grid-cols-12 px-4 py-3 border-b border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-slate-800/55">
                <span className="col-span-4 text-[9px] font-black text-black/30 dark:text-white/45 uppercase tracking-widest">Driver</span>
                <span className="col-span-3 text-[9px] font-black text-black/30 dark:text-white/45 uppercase tracking-widest">Contact</span>
                <span className="col-span-2 text-[9px] font-black text-black/30 dark:text-white/45 uppercase tracking-widest">Status</span>
                <span className="col-span-2 text-[9px] font-black text-black/30 dark:text-white/45 uppercase tracking-widest">Docs</span>
                <span className="col-span-1 text-[9px] font-black text-black/30 dark:text-white/45 uppercase tracking-widest">Action</span>
            </div>

            {loading ? (
                <div className="py-16 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                </div>
            ) : directoryDrivers.length === 0 ? (
                <div className="py-16 text-center">
                    <User size={32} className="mx-auto text-black/10 dark:text-white/20 mb-3" />
                    <p className="text-[10px] font-black text-black/20 dark:text-white/35 uppercase tracking-widest">No drivers found for this filter</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-50 dark:divide-white/10">
                    {directoryDrivers.map((driver) => {
                        const cfg = statusConfig[driver.status] || statusConfig.pending_docs;
                        const docsCount = [
                            driver.documents?.aadhaarCard?.frontUrl,
                            driver.documents?.aadhaarCard?.backUrl,
                            driver.documents?.panCard?.url,
                            driver.documents?.drivingLicense?.url,
                            driver.documents?.selfie?.url
                        ].filter(Boolean).length;

                        return (
                            <div key={driver._id} className="grid grid-cols-12 px-4 py-3.5 items-center hover:bg-gray-50/60 dark:hover:bg-slate-800/45 transition-colors">
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-[0.6rem] bg-gray-100 dark:bg-white/10 flex items-center justify-center text-black/30 dark:text-white/50">
                                        <User size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-black dark:text-white uppercase">{driver.name}</p>
                                        <p className="text-[8px] font-bold text-black/25 dark:text-white/45 uppercase mt-0.5">
                                            {new Date(driver.createdAt).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                </div>

                                <div className="col-span-3">
                                    <p className="text-[10px] font-black text-black/60 dark:text-white/75">{driver.phone}</p>
                                    <p className="text-[9px] font-bold text-black/25 dark:text-white/45 truncate">{driver.email}</p>
                                </div>

                                <div className="col-span-2 space-y-1">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-black uppercase ${cfg.color}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                        {cfg.label}
                                    </span>
                                    <p className={`text-[8px] font-black uppercase ${driver.isOnline ? 'text-green-600 dark:text-green-400' : 'text-black/25 dark:text-white/45'}`}>
                                        {driver.isOnline ? 'Online' : 'Offline'}
                                    </p>
                                </div>

                                <div className="col-span-2">
                                    <span className={`text-[10px] font-black ${docsCount === 5 ? 'text-green-600 dark:text-green-400' : 'text-black/30 dark:text-white/50'}`}>
                                        {docsCount}/5 uploaded
                                    </span>
                                </div>

                                <div className="col-span-1">
                                    <button
                                        onClick={() => openDriverReview(driver)}
                                        className="flex items-center gap-1 text-[9px] font-black text-black/40 dark:text-white/55 uppercase hover:text-black dark:hover:text-white transition-colors"
                                    >
                                        <Eye size={13} />
                                        Review
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
);

export default DriversSection;
