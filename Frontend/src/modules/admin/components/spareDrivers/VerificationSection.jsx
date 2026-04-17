import React from 'react';
import { User } from 'lucide-react';
import DriverLaneGrid from './DriverLaneGrid';

const VerificationSection = ({
    lanes,
    driverLane,
    laneCounts,
    onSelectLane,
    loading,
    verificationDrivers,
    statusConfig,
    openDriverReview
}) => (
    <div className="space-y-3">
        <div className="bg-white border border-gray-100 rounded-[1rem] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100">
                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Driver verification desk</p>
                <h3 className="text-[14px] font-black text-black uppercase">Approve new spare drivers and review flagged accounts</h3>
            </div>

            <div className="px-4 py-3.5 border-b border-gray-100 bg-[#FFF8EF]">
                <DriverLaneGrid
                    lanes={lanes}
                    driverLane={driverLane}
                    laneCounts={laneCounts}
                    onSelect={onSelectLane}
                />
            </div>

            {loading ? (
                <div className="py-16 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                </div>
            ) : verificationDrivers.length === 0 ? (
                <div className="py-16 text-center">
                    <User size={32} className="mx-auto text-black/10 mb-3" />
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">No drivers match this sub-section right now</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-50">
                    {verificationDrivers.map((driver) => {
                        const cfg = statusConfig[driver.status] || statusConfig.pending_docs;
                        const docsCount = [
                            driver.documents?.aadhaarCard?.frontUrl,
                            driver.documents?.aadhaarCard?.backUrl,
                            driver.documents?.panCard?.url,
                            driver.documents?.drivingLicense?.url,
                            driver.documents?.selfie?.url
                        ].filter(Boolean).length;

                        return (
                            <div key={driver._id} className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr_0.7fr_auto] gap-3 px-4 py-3.5 items-center hover:bg-gray-50/60 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[11px] font-black text-black uppercase">{driver.name}</p>
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-black uppercase ${cfg.color}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-black/45">{driver.phone}</p>
                                    <p className="text-[10px] font-bold text-black/30 truncate">{driver.email || 'Email not available'}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-black/25 uppercase tracking-widest">Documents</p>
                                    <p className={`text-[11px] font-black ${docsCount === 5 ? 'text-green-600' : 'text-black/35'}`}>
                                        {docsCount}/5 uploaded
                                    </p>
                                    <p className="text-[9px] font-bold text-black/25">
                                        Joined {new Date(driver.createdAt).toLocaleDateString('en-IN')}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-black/25 uppercase tracking-widest">Status Note</p>
                                    <p className="text-[10px] font-bold text-black/45">
                                        {driver.adminNote || (driver.status === 'pending_docs' ? 'Waiting for full documents upload' : 'Ready for admin action')}
                                    </p>
                                </div>

                                <div className="flex items-center xl:justify-end gap-2">
                                    <button
                                        onClick={() => openDriverReview(driver)}
                                        className="h-9 px-3.5 bg-black text-white text-[10px] font-black uppercase rounded-lg hover:bg-brand hover:text-black transition-colors"
                                    >
                                        Review driver
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

export default VerificationSection;
