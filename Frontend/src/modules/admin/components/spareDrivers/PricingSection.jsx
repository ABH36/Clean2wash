import React from 'react';
import { IndianRupee, RefreshCw } from 'lucide-react';

const PricingSection = ({
    fetchChauffeurServices,
    pricingLoading,
    chauffeurServices,
    openPricingEditor
}) => (
    <div className="space-y-3">
        <div className="bg-white border border-gray-100 rounded-[1rem] px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div>
                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Chauffeur Pricing Desk</p>
                <h3 className="text-[14px] font-black text-black uppercase">Consumer spare driver services and live selling prices</h3>
            </div>
            <button
                onClick={fetchChauffeurServices}
                className="flex items-center gap-2 h-9 px-4 border border-gray-200 rounded-lg text-[10px] font-black text-black/50 uppercase hover:border-black hover:text-black transition-colors"
            >
                <RefreshCw size={13} />
                Refresh Pricing
            </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {pricingLoading ? (
                <div className="xl:col-span-2 bg-white border border-gray-100 rounded-lg py-16 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                </div>
            ) : chauffeurServices.length === 0 ? (
                <div className="xl:col-span-2 bg-white border border-gray-100 rounded-lg py-16 text-center">
                    <IndianRupee size={32} className="mx-auto text-black/10 mb-3" />
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">No chauffeur services found in master data</p>
                </div>
            ) : chauffeurServices.map((service) => (
                <div key={service._id} className="bg-white border border-gray-100 rounded-[1rem] p-4 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[12px] font-black text-black uppercase">{service.title}</p>
                                <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${service.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {service.isActive ? 'Live' : 'Hidden'}
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-black/40 mt-1">{service.description || 'No description set'}</p>
                        </div>
                        <button
                            onClick={() => openPricingEditor(service)}
                            className="h-9 px-3.5 bg-black text-white text-[10px] font-black uppercase rounded-lg hover:bg-brand hover:text-black transition-colors"
                        >
                            Edit Config
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div className="border border-gray-100 rounded-lg p-2.5">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Base Price</p>
                            <p className="text-[14px] font-black text-black">₹{service.price || 0}</p>
                        </div>
                        <div className="border border-gray-100 rounded-lg p-2.5">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Duration</p>
                            <p className="text-[13px] font-black text-black">{service.estimatedTime || 0} min</p>
                        </div>
                        <div className="border border-gray-100 rounded-lg p-2.5">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Service Key</p>
                            <p className="text-[10px] font-black text-black/55 uppercase">{service.metadata?.id || service.key}</p>
                        </div>
                        <div className="border border-gray-100 rounded-lg p-2.5">
                            <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-1">Badge</p>
                            <p className="text-[10px] font-black text-black/55 uppercase">{service.metadata?.badge || 'None'}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-[8px] font-black text-black/25 uppercase tracking-widest mb-2">Consumer Features</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {(service.metadata?.features || []).length ? (service.metadata.features || []).map((feature) => (
                                <span key={feature} className="px-2 py-1 bg-gray-50 text-[9px] font-black text-black/60 uppercase rounded-lg border border-gray-100">
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

export default PricingSection;
