import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'react-hot-toast';
import { motion as m } from 'framer-motion';
import { 
    Car, Search, RefreshCw, CheckCircle, XCircle, Clock, FileText, Shield, AlertCircle,
    Eye, Edit, Tag, MapPin, Calendar, User, Phone, Settings, Filter, Download,
    Wrench, AlertTriangle, Info, X, Upload, Paperclip, ChevronDown, ShieldCheck,
    BarChart3, Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageShell, { 
    SectionCard, FilterBar, SearchBox, StatusTabs, EmptyState, PageLoader 
} from '../components/PageShell';

const AdminVehicleManagement = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [showAdvancedView, setShowAdvancedView] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = () => {
        setLoading(true);
        setTimeout(() => {
            setVehicles([
                {
                    id: 'VEH001',
                    vehicleNumber: 'KA-01-AB-1234',
                    model: 'Honda City',
                    year: 2020,
                    color: 'White',
                    driverName: 'Rajesh Kumar',
                    driverPhone: '+91 98765 43210',
                    status: 'PENDING',
                    submittedDate: '2024-04-10',
                    notes: 'RC verification pending',
                    classification: 'SEDAN',
                    specialInstructions: 'Handle with care - premium vehicle',
                    documents: {
                        rc: { status: 'PENDING', url: '', expiryDate: '2025-03-15' },
                        insurance: { status: 'VERIFIED', url: '', expiryDate: '2024-12-20' },
                        puc: { status: 'VERIFIED', url: '', expiryDate: '2024-08-10' }
                    },
                    issues: [
                        { id: 1, type: 'DOCUMENT', description: 'RC copy not clear', status: 'OPEN', reportedAt: '2024-04-10' }
                    ],
                    adminNotes: 'Waiting for clearer RC document'
                },
                {
                    id: 'VEH002',
                    vehicleNumber: 'MH-02-CD-5678',
                    model: 'Maruti Swift',
                    year: 2019,
                    color: 'Silver',
                    driverName: 'Amit Sharma',
                    driverPhone: '+91 98765 43211',
                    status: 'APPROVED',
                    submittedDate: '2024-04-08',
                    notes: 'All documents verified',
                    classification: 'HATCHBACK',
                    specialInstructions: 'Standard vehicle - no special requirements',
                    documents: {
                        rc: { status: 'VERIFIED', url: '', expiryDate: '2025-06-20' },
                        insurance: { status: 'VERIFIED', url: '', expiryDate: '2025-01-15' },
                        puc: { status: 'VERIFIED', url: '', expiryDate: '2024-10-05' }
                    },
                    issues: [],
                    adminNotes: 'Approved - all documents in order'
                },
                {
                    id: 'VEH003',
                    vehicleNumber: 'DL-03-EF-9012',
                    model: 'Hyundai Verna',
                    year: 2021,
                    color: 'Blue',
                    driverName: 'Vikram Singh',
                    driverPhone: '+91 98765 43212',
                    status: 'PENDING',
                    submittedDate: '2024-04-12',
                    notes: 'Insurance expiry check needed',
                    classification: 'SEDAN',
                    specialInstructions: 'New vehicle - priority processing',
                    documents: {
                        rc: { status: 'VERIFIED', url: '', expiryDate: '2026-01-10' },
                        insurance: { status: 'EXPIRING_SOON', url: '', expiryDate: '2024-04-25' },
                        puc: { status: 'VERIFIED', url: '', expiryDate: '2024-09-15' }
                    },
                    issues: [
                        { id: 2, type: 'INSURANCE', description: 'Insurance expires soon', status: 'OPEN', reportedAt: '2024-04-12' }
                    ],
                    adminNotes: 'Insurance renewal required before approval'
                },
                {
                    id: 'VEH004',
                    vehicleNumber: 'TN-04-GH-3456',
                    model: 'Toyota Innova',
                    year: 2018,
                    color: 'Black',
                    driverName: 'Suresh Patel',
                    driverPhone: '+91 98765 43213',
                    status: 'REJECTED',
                    submittedDate: '2024-04-05',
                    notes: 'Invalid insurance documents',
                    classification: 'SUV',
                    specialInstructions: 'Large vehicle - check parking requirements',
                    documents: {
                        rc: { status: 'VERIFIED', url: '', expiryDate: '2025-08-30' },
                        insurance: { status: 'REJECTED', url: '', expiryDate: '2024-02-10' },
                        puc: { status: 'EXPIRED', url: '', expiryDate: '2024-01-20' }
                    },
                    issues: [
                        { id: 3, type: 'DOCUMENT', description: 'Insurance document is fake', status: 'RESOLVED', reportedAt: '2024-04-05' },
                        { id: 4, type: 'DOCUMENT', description: 'PUC certificate expired', status: 'OPEN', reportedAt: '2024-04-05' }
                    ],
                    adminNotes: 'Rejected due to fraudulent insurance document'
                },
                {
                    id: 'VEH005',
                    vehicleNumber: 'KA-05-IJ-7890',
                    model: 'Tata Nexon',
                    year: 2022,
                    color: 'Red',
                    driverName: 'Arjun Reddy',
                    driverPhone: '+91 98765 43214',
                    status: 'APPROVED',
                    submittedDate: '2024-04-09',
                    notes: 'Verified and active',
                    classification: 'SUV',
                    specialInstructions: 'Electric vehicle - special charging requirements',
                    documents: {
                        rc: { status: 'VERIFIED', url: '', expiryDate: '2027-02-15' },
                        insurance: { status: 'VERIFIED', url: '', expiryDate: '2025-03-10' },
                        puc: { status: 'VERIFIED', url: '', expiryDate: '2024-11-20' }
                    },
                    issues: [],
                    adminNotes: 'Premium EV - approved for high-value bookings'
                }
            ]);
            setLoading(false);
        }, 800);
    };

    const handleApprove = (vehicleId) => {
        setVehicles(prev => prev.map(v => 
            v.id === vehicleId ? { ...v, status: 'APPROVED', notes: 'Approved by admin' } : v
        ));
        toast.success('Vehicle Approved', {
            style: { borderRadius: '12px', background: '#0F172A', color: '#fff' }
        });
    };

    const handleReject = (vehicleId) => {
        setVehicles(prev => prev.map(v => 
            v.id === vehicleId ? { ...v, status: 'REJECTED', notes: 'Rejected by admin' } : v
        ));
        toast.error('Vehicle Rejected', {
            style: { borderRadius: '12px', background: '#0F172A', color: '#fff' }
        });
    };

    const openVehicleDetails = (vehicle) => {
        setSelectedVehicle(vehicle);
        setShowVehicleModal(true);
    };

    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.driverName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'ALL' || v.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <PageShell
            title="Fleet Intelligence"
            subtitle="Central registry for vehicle authorization and compliance"
            icon={Car}
            accent="slate"
            badge="Protocol Live"
            actions={
                <div className="flex items-center gap-3">
                    <button 
                        onClick={loadVehicles}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="adm-btn adm-btn-primary h-10 px-4 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                        <Download size={14} /> Export Registry
                    </button>
                </div>
            }
        >
            <div className="space-y-8">
                {/* ── FLEET ANALYTICS OVERVIEW ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Fleet', value: vehicles.length, icon: Car, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
                        { label: 'Pending Audit', value: vehicles.filter(v => v.status === 'PENDING').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                        { label: 'Active Service', value: vehicles.filter(v => v.status === 'APPROVED').length, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                        { label: 'Critical Faults', value: vehicles.reduce((acc, v) => acc + (v.issues?.filter(i => i.status === 'OPEN').length || 0), 0), icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' }
                    ].map((stat, i) => (
                        <div key={i} className={`p-6 rounded-[2rem] border ${stat.border} ${stat.bg} relative overflow-hidden group`}>
                            <div className="relative z-10">
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${stat.color}`}>{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                            </div>
                            <stat.icon className={`absolute -bottom-4 -right-4 w-20 h-20 opacity-[0.05] transition-transform group-hover:scale-110 ${stat.color}`} />
                        </div>
                    ))}
                </div>

                {/* ── FLEET REGISTRY TABLE ── */}
                <SectionCard 
                    title="Registry Entries" 
                    icon={Activity}
                    actions={
                        <FilterBar className="!border-0 !p-0 !bg-transparent">
                            <SearchBox 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                placeholder="Query registry..." 
                            />
                            <div className="h-6 w-[1px] bg-slate-100 hidden md:block" />
                            <StatusTabs 
                                tabs={[
                                    { label: 'Omni', value: 'ALL' },
                                    { label: 'Pending', value: 'PENDING' },
                                    { label: 'Active', value: 'APPROVED' },
                                    { label: 'Revoked', value: 'REJECTED' }
                                ]}
                                active={filterStatus}
                                onChange={setFilterStatus}
                            />
                        </FilterBar>
                    }
                >
                    <div className="overflow-x-auto">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Vehicle Identification</th>
                                    <th>Operator Link</th>
                                    <th className="text-center">Audit Status</th>
                                    <th className="text-center">Classification</th>
                                    <th className="text-center">Fault Index</th>
                                    <th className="text-right">Action Protocol</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        <tr><td colSpan={6}><PageLoader /></td></tr>
                                    ) : filteredVehicles.length === 0 ? (
                                        <tr><td colSpan={6}><EmptyState icon={Car} title="No Records" subtitle="System registry is currently clear." /></td></tr>
                                    ) : (
                                        filteredVehicles.map((vehicle) => (
                                            <m.tr 
                                                key={vehicle.id} 
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="group"
                                            >
                                                <td>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-500 flex items-center justify-center shadow-lg border border-slate-800 transition-transform group-hover:scale-110">
                                                            <Car size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{vehicle.vehicleNumber}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{vehicle.model}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{vehicle.driverName}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: {vehicle.id}</span>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <div className={`adm-badge mx-auto ${
                                                        vehicle.status === 'APPROVED' ? 'adm-badge-success' :
                                                        vehicle.status === 'REJECTED' ? 'adm-badge-error' :
                                                        'adm-badge-warning'
                                                    }`}>
                                                        {vehicle.status}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <div className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest inline-flex ${
                                                        vehicle.classification === 'SUV' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        vehicle.classification === 'SEDAN' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                        {vehicle.classification}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <div className={`text-[10px] font-black inline-flex items-center gap-2 ${
                                                        vehicle.issues?.filter(i => i.status === 'OPEN').length > 0
                                                            ? 'text-rose-500'
                                                            : 'text-emerald-500'
                                                    }`}>
                                                        <AlertCircle size={12} />
                                                        {vehicle.issues?.filter(i => i.status === 'OPEN').length || 0}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => openVehicleDetails(vehicle)}
                                                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all border border-slate-100"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        {vehicle.status === 'PENDING' && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleApprove(vehicle.id)}
                                                                    className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                                >
                                                                    <CheckCircle size={18} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleReject(vehicle.id)}
                                                                    className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                                >
                                                                    <XCircle size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </m.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </SectionCard>
            </div>

            {/* ── INSPECTION PROTOCOL MODAL ── */}
            <AnimatePresence>
                {showVehicleModal && selectedVehicle && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
                        <m.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowVehicleModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <m.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-5xl max-h-full rounded-[2.5rem] shadow-2xl relative z-10 border border-slate-100 flex flex-col overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-amber-500 flex items-center justify-center shadow-xl border border-slate-800">
                                        <Car size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedVehicle.vehicleNumber}</h2>
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mt-1">Registry Audit Node</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowVehicleModal(false)}
                                    className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="px-8 bg-white border-b border-slate-50 flex gap-8">
                                {[
                                    { id: 'overview', label: 'Technical Specs', icon: Info },
                                    { id: 'documents', label: 'Compliance Docs', icon: FileText },
                                    { id: 'issues', label: 'Incident Log', icon: AlertTriangle }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 py-6 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                                            activeTab === tab.id
                                                ? 'text-slate-900 border-slate-900'
                                                : 'text-slate-400 border-transparent hover:text-slate-600'
                                        }`}
                                    >
                                        <tab.icon size={16} /> {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/30">
                                {activeTab === 'overview' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">Machine Parameters</h3>
                                            <div className="space-y-5">
                                                {[
                                                    { label: 'Model Specification', val: selectedVehicle.model },
                                                    { label: 'Manufacture Epoch', val: selectedVehicle.year },
                                                    { label: 'Chromatic Tone', val: selectedVehicle.color },
                                                    { label: 'Load Classification', val: selectedVehicle.classification }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center py-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                                        <span className="text-sm font-black text-slate-800 uppercase">{item.val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">Operator Linkage</h3>
                                            <div className="space-y-5">
                                                {[
                                                    { label: 'Primary Operator', val: selectedVehicle.driverName },
                                                    { label: 'Communication Link', val: selectedVehicle.driverPhone },
                                                    { label: 'Registry Submission', val: selectedVehicle.submittedDate },
                                                    { label: 'Current Status', val: selectedVehicle.status, badge: true }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center py-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                                        {item.badge ? (
                                                            <div className={`adm-badge ${selectedVehicle.status === 'APPROVED' ? 'adm-badge-success' : 'adm-badge-warning'}`}>{item.val}</div>
                                                        ) : (
                                                            <span className="text-sm font-black text-slate-800 uppercase">{item.val}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'documents' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {Object.entries(selectedVehicle.documents || {}).map(([type, doc]) => (
                                            <div key={type} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col group hover:border-slate-900 transition-all">
                                                <div className="flex items-start justify-between mb-8">
                                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-amber-500 transition-all">
                                                        <FileText size={28} />
                                                    </div>
                                                    <div className={`adm-badge ${doc.status === 'VERIFIED' ? 'adm-badge-success' : 'adm-badge-warning'}`}>{doc.status}</div>
                                                </div>
                                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-2">{type} PROTOCOL</h4>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-8">EXPIRY: {doc.expiryDate}</p>
                                                <button className="mt-auto adm-btn h-12 text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2">
                                                    <Search size={14} /> Scan Registry
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'issues' && (
                                    <div className="space-y-6">
                                        {selectedVehicle.issues && selectedVehicle.issues.length > 0 ? (
                                            selectedVehicle.issues.map((issue) => (
                                                <div key={issue.id} className="bg-white p-8 rounded-[2rem] border-l-4 border-l-rose-500 shadow-sm flex items-center justify-between border border-slate-100">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm">
                                                            <Wrench size={28} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{issue.type} VIOLATION</h4>
                                                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase leading-relaxed">{issue.description}</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">LOGGED AT: {issue.reportedAt}</p>
                                                        </div>
                                                    </div>
                                                    <div className="adm-badge adm-badge-error">{issue.status}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-100 border-dashed">
                                                <ShieldCheck className="text-emerald-500 mb-6" size={64} />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Integrity Optimal</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex items-center justify-end gap-4">
                                <button 
                                    onClick={() => setShowVehicleModal(false)}
                                    className="adm-btn bg-white h-12 px-8 text-[11px] font-black uppercase tracking-widest"
                                >
                                    Dismiss Panel
                                </button>
                                {selectedVehicle.status === 'PENDING' && (
                                    <>
                                        <button 
                                            onClick={() => { handleReject(selectedVehicle.id); setShowVehicleModal(false); }}
                                            className="adm-btn adm-btn-error h-12 px-8 text-[11px] font-black uppercase tracking-widest"
                                        >
                                            Deny Entry
                                        </button>
                                        <button 
                                            onClick={() => { handleApprove(selectedVehicle.id); setShowVehicleModal(false); }}
                                            className="adm-btn adm-btn-primary h-12 px-8 text-[11px] font-black uppercase tracking-widest shadow-xl"
                                        >
                                            Authorize Registry
                                        </button>
                                    </>
                                )}
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </PageShell>
    );
};

export default AdminVehicleManagement;
