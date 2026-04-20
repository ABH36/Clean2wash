import React from 'react';
import { User, Shield, AlertTriangle } from 'lucide-react';
import DriverLaneGrid from './DriverLaneGrid';

const VerificationSection = ({
    lanes,
    driverLane,
    laneCounts,
    onSelectLane,
    loading,
    verificationDrivers,
    statusConfig,
    openDriverReview,
    driverRiskProfiles = {} // New prop for fraud detection
}) => (
    <div className="space-y-3">
        <div className="bg-white/5 border border-white/5 rounded-[1rem] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/5">
                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Driver verification desk</p>
                <h3 className="text-[14px] font-black text-white uppercase">Approve new spare drivers and review flagged accounts</h3>
            </div>

            <div className="px-4 py-3.5 border-b border-white/5 bg-[#FFF8EF]">
                <DriverLaneGrid
                    lanes={lanes}
                    driverLane={driverLane}
                    laneCounts={laneCounts}
                    onSelect={onSelectLane}
                />
            </div>

            {loading ? (
                <div className="py-16 flex items-center justify-center">
                    <div className="w-5 h-5 border-white/5 border-brand/30 border-t-brand rounded-full animate-spin" />
                </div>
            ) : verificationDrivers.length === 0 ? (
                <div className="py-16 text-center">
                    <User size={32} className="mx-auto text-black/10 mb-3" />
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No drivers match this sub-section right now</p>
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

                        // Fraud detection integration
                        const riskProfile = driverRiskProfiles[driver._id];
                        const hasFraudAlerts = riskProfile && riskProfile.totalAlerts > 0;
                        const isHighRisk = riskProfile && ['HIGH', 'CRITICAL'].includes(riskProfile.riskLevel);

                        return (
                            <div key={driver._id} className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr_0.7fr_auto] gap-3 px-4 py-3.5 items-center hover:bg-white/[0.02]/60 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[11px] font-black text-white uppercase">{driver.name}</p>
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-black uppercase ${cfg.color}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            {cfg.label}
                                        </span>
                                        {/* Fraud Alert Badge */}
                                        {hasFraudAlerts && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[8px] font-black uppercase ${
                                                isHighRisk ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                <AlertTriangle size={10} />
                                                {riskProfile.totalAlerts} Alert{riskProfile.totalAlerts > 1 ? 's' : ''}
                                            </span>
                                        )}
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
                                    <p className="text-[9px] font-black text-black/25 uppercase tracking-widest">
                                        {hasFraudAlerts ? 'Risk Status' : 'Status Note'}
                                    </p>
                                    {hasFraudAlerts ? (
                                        <div className="space-y-1">
                                            <p className={`text-[10px] font-black uppercase ${
                                                riskProfile.riskLevel === 'CRITICAL' ? 'text-red-600' :
                                                riskProfile.riskLevel === 'HIGH' ? 'text-orange-600' :
                                                riskProfile.riskLevel === 'MEDIUM' ? 'text-yellow-600' :
                                                'text-blue-600'
                                            }`}>
                                                {riskProfile.riskLevel} RISK
                                            </p>
                                            <p className="text-[9px] font-bold text-black/45">
                                                Score: {riskProfile.averageRiskScore}/100
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-bold text-black/45">
                                            {driver.adminNote || (driver.status === 'pending_docs' ? 'Waiting for full documents upload' : 'Ready for admin action')}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center xl:justify-end gap-2">
                                    {hasFraudAlerts && (
                                        <a
                                            href={`/admin/fraud?driverId=${driver._id}`}
                                            className="h-9 px-3.5 bg-red-50 text-red-700 text-[10px] font-black uppercase rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5"
                                            title="View fraud alerts"
                                        >
                                            <Shield size={12} />
                                            Fraud
                                        </a>
                                    )}
                                    <button
                                        onClick={() => openDriverReview(driver)}
                                        className="h-9 px-3.5 bg-black text-white text-[10px] font-black uppercase rounded-lg hover:bg-brand hover:text-white transition-colors"
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
