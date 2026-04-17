import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    AlertTriangle,
    Building2,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    ChevronUp,
    Crown,
    Edit2,
    Loader2,
    MapPin,
    Plus,
    RefreshCw,
    Save,
    Trash2,
    Users,
    User,
    Search,
    Activity,
    Shield,
    TrendingUp,
    Zap,
    Terminal,
    ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../utils/adminApi';

const APARTMENT_SERVICE_KEY = 'APARTMENT_WASH';

const SECTION_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'apartments', label: 'Apartment registry' },
    { id: 'captains', label: 'Captain mapping' },
    { id: 'subscriptions', label: 'Subscription hub' },
    { id: 'liveops', label: 'Live ops' },
    { id: 'service', label: 'Service control' }
];

const SECTION_META = {
    overview: {
        title: 'Ops overview',
        description: 'Watch approvals, apartment capacity, and the current service contract from one place.',
        icon: Building2
    },
    apartments: {
        title: 'Apartment registry',
        description: 'Manage apartment locations, parking hierarchy, manager details, and capacity setup.',
        icon: Building2
    },
    captains: {
        title: 'Captain mapping',
        description: 'Assign verified captains to apartment bases and balance operational coverage.',
        icon: Users
    },
    plans: {
        title: 'Plan desk',
        description: 'Create apartment-wash-only subscription plans. Global passes do not apply here.',
        icon: Crown
    },
    subscriptions: {
        title: 'Subscription hub',
        description: 'Manage apartment-only plans and track live member subscriptions from this cockpit.',
        icon: Crown
    },
    liveops: {
        title: 'Live ops',
        description: 'Monitor active apartment jobs, route visibility, slot pressure, and captain assignment.',
        icon: AlertTriangle
    },
    service: {
        title: 'Service control',
        description: 'Control the apartment service contract, slots, visibility, features, and operating rules.',
        icon: CheckCircle2
    }
};

const STATUS_STYLES = {
    active: 'bg-emerald-50 text-emerald-700',
    paused: 'bg-yellow-50 text-yellow-700',
    completed: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-yellow-50 text-yellow-700',
    accepted: 'bg-[var(--primary-light)] text-[var(--primary)]',
    confirmed: 'bg-[var(--primary-light)] text-[var(--primary)]',
    assigned: 'bg-[var(--primary-light)] text-[var(--primary)]',
    in_progress: 'bg-purple-50 text-purple-700',
    washing: 'bg-purple-50 text-purple-700',
    cancelled: 'bg-red-50 text-red-600',
    expired: 'bg-gray-100 text-gray-600'
};

const parseLines = (value = '') => value.split('\n').map((entry) => entry.trim()).filter(Boolean);

const parseSlots = (value = '') => parseLines(value).map((line, index) => {
    const [id, label, time] = line.split('|').map((part) => part.trim());
    return { id: id || `slot-${index + 1}`, label: label || id || `Slot ${index + 1}`, time: time || '' };
});

const formatCurrency = (amount = 0) => `Rs ${Number(amount || 0).toLocaleString('en-IN')}`;

const formatDate = (value) => {
    if (!value) return 'Not scheduled';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not scheduled';
    return date.toLocaleString('en-IN');
};

const getBadgeClass = (status = '') => STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';

const getRouteLabel = (item = {}) => {
    const details = item.parkingDetails || item.subscription?.parkingDetails || {};
    const parts = [details.basement, details.block, details.pillar].filter(Boolean);
    return parts.length ? parts.join(' -> ') : 'Parking route pending';
};

const getVehicleLabel = (item = {}) => {
    const vehicle = item.vehicle || {};
    const parts = [vehicle.brand, vehicle.model, vehicle.plate || item.parkingDetails?.carNumber].filter(Boolean);
    return parts.length ? parts.join(' ') : 'Vehicle pending';
};

const toHubFormState = (hub = null) => ({
    name: hub?.name || '',
    city: hub?.city || '',
    manager: hub?.manager || '',
    address: hub?.location?.address || '',
    status: hub?.status || 'Online',
    load: hub?.load || 'Moderate',
    blocksText: Array.isArray(hub?.metadata?.blocks) ? hub.metadata.blocks.join('\n') : '',
    parkingLevelsText: Array.isArray(hub?.metadata?.parkingLevels) ? hub.metadata.parkingLevels.join('\n') : '',
    pillarMin: hub?.metadata?.pillarRange?.min || 1,
    pillarMax: hub?.metadata?.pillarRange?.max || 100
});

const toPlanFormState = (plan = null) => ({
    name: plan?.name || '',
    price: plan?.price || '',
    interval: plan?.interval || 'Monthly',
    status: plan?.status || 'Live',
    credits: plan?.credits || 30,
    maxVehicles: plan?.maxVehicles || 1,
    rollover: plan?.rollover || 0,
    accent: plan?.accent || 'brand',
    featuresText: Array.isArray(plan?.features) ? plan.features.join('\n') : ''
});

const toServiceFormState = (service = null) => ({
    title: service?.title || 'Apartment Wash',
    description: service?.description || '',
    price: service?.price || '',
    estimatedTime: service?.estimatedTime || '',
    badge: service?.metadata?.badge || 'Recurring',
    sortOrder: service?.sortOrder || 2,
    isActive: service?.isActive ?? true,
    featuresText: Array.isArray(service?.metadata?.features) ? service.metadata.features.join('\n') : '',
    rulesText: Array.isArray(service?.metadata?.rules) ? service.metadata.rules.join('\n') : '',
    slotsText: Array.isArray(service?.metadata?.slots)
        ? service.metadata.slots.map((slot) => [slot.id, slot.label, slot.time].filter(Boolean).join(' | ')).join('\n')
        : ''
});

const AdminApartmentWash = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const querySection = searchParams.get('section') || 'overview';
    const [activeSection, setActiveSection] = useState(querySection);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [consoleData, setConsoleData] = useState({
        stats: {},
        service: null,
        hubs: [],
        captains: [],
        plans: [],
        subscriptions: [],
        bookings: []
    });
    const [hubModalOpen, setHubModalOpen] = useState(false);
    const [editingHub, setEditingHub] = useState(null);
    const [hubSaving, setHubSaving] = useState(false);
    const [hubForm, setHubForm] = useState(toHubFormState());
    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planSaving, setPlanSaving] = useState(false);
    const [planForm, setPlanForm] = useState(toPlanFormState());
    const [serviceSaving, setServiceSaving] = useState(false);
    const [serviceForm, setServiceForm] = useState(toServiceFormState());
    const [mappingDrafts, setMappingDrafts] = useState({});
    const [mappingSavingId, setMappingSavingId] = useState('');
    const [reviewingSubscriptionId, setReviewingSubscriptionId] = useState('');
    const [hubSearch, setHubSearch] = useState('');
    const [captainSearch, setCaptainSearch] = useState('');
    const [selectedCaptainsForApproval, setSelectedCaptainsForApproval] = useState({});
    const [liveSearch, setLiveSearch] = useState('');

    const fetchConsole = async ({ silent = false } = {}) => {
        if (silent) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await adminAPI.getApartmentWashConsole();
            const data = res?.data || {};
            setConsoleData({
                stats: data.stats || {},
                service: data.service || null,
                hubs: data.hubs || [],
                captains: data.captains || [],
                plans: data.plans || [],
                subscriptions: data.subscriptions || [],
                bookings: data.bookings || []
            });
            setMappingDrafts((data.captains || []).reduce((acc, captain) => {
                acc[captain._id] = captain.mappedHub || '';
                return acc;
            }, {}));
            setServiceForm(toServiceFormState(data.service || null));
        } catch (error) {
            console.error('Failed to load apartment wash console:', error);
            toast.error(error.message || 'Failed to load apartment wash console');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchConsole();
    }, []);

    useEffect(() => {
        const querySection = searchParams.get('section');
        if (querySection && querySection !== activeSection) {
            setActiveSection(querySection);
        }
    }, [searchParams]);

    const handleSectionChange = (sectionId) => {
        const params = new URLSearchParams(searchParams);
        params.set('section', sectionId);
        setSearchParams(params);
        setActiveSection(sectionId);
    };

    const stats = consoleData.stats || {};
    const hubs = consoleData.hubs || [];
    const captains = consoleData.captains || [];
    const plans = consoleData.plans || [];
    const subscriptions = consoleData.subscriptions || [];
    const bookings = consoleData.bookings || [];
    const service = consoleData.service;

    const filteredHubs = useMemo(() => {
        const query = hubSearch.trim().toLowerCase();
        if (!query) return hubs;
        return hubs.filter((hub) => [hub.name, hub.city, hub.manager].filter(Boolean).some((entry) => entry.toLowerCase().includes(query)));
    }, [hubSearch, hubs]);

    const filteredCaptains = useMemo(() => {
        const query = captainSearch.trim().toLowerCase();
        if (!query) return captains;
        return captains.filter((captain) => [captain.name, captain.phone, captain.profile?.hub].filter(Boolean).some((entry) => entry.toLowerCase().includes(query)));
    }, [captainSearch, captains]);

    const liveBookings = useMemo(() => bookings.filter((booking) => !['completed', 'cancelled', 'refunded'].includes(booking.status)), [bookings]);
    const pendingSubscriptions = useMemo(() => subscriptions.filter((subscription) => subscription.status === 'pending'), [subscriptions]);
    const nonPendingSubscriptions = useMemo(() => subscriptions.filter((subscription) => subscription.status !== 'pending'), [subscriptions]);
    const rejectedSubscriptions = useMemo(() => subscriptions.filter((subscription) => subscription.status === 'rejected'), [subscriptions]);
    const activeSubscriptions = useMemo(() => subscriptions.filter((subscription) => subscription.status === 'active'), [subscriptions]);
    const filteredLiveBookings = useMemo(() => {
        const query = liveSearch.trim().toLowerCase();
        if (!query) return liveBookings;
        return liveBookings.filter((booking) => {
            const searchable = [
                booking.consumer?.name,
                booking.consumer?.phone,
                booking.provider?.id?.name,
                booking.location?.hubId?.name,
                booking.location?.address?.street,
                booking.location?.address?.formattedAddress,
                booking.parkingDetails?.carNumber
            ].filter(Boolean).join(' ').toLowerCase();
            return searchable.includes(query);
        });
    }, [liveBookings, liveSearch]);

    const riskHubs = useMemo(() => hubs.filter((hub) => hub.captainGap > 0), [hubs]);
    const unmappedHubs = useMemo(() => hubs.filter((hub) => (hub.mappedCaptainCount || 0) === 0), [hubs]);
    const activeSectionMeta = SECTION_META[activeSection] || SECTION_META.overview;

    const openCreateHub = () => {
        setEditingHub(null);
        setHubForm(toHubFormState());
        setHubModalOpen(true);
    };

    const openEditHub = (hub) => {
        setEditingHub(hub);
        setHubForm(toHubFormState(hub));
        setHubModalOpen(true);
    };

    const openCreatePlan = () => {
        setEditingPlan(null);
        setPlanForm(toPlanFormState());
        setPlanModalOpen(true);
    };

    const openEditPlan = (plan) => {
        setEditingPlan(plan);
        setPlanForm(toPlanFormState(plan));
        setPlanModalOpen(true);
    };

    const handleSaveHub = async (event) => {
        event.preventDefault();
        setHubSaving(true);
        const payload = {
            name: hubForm.name.trim(),
            city: hubForm.city.trim(),
            manager: hubForm.manager.trim() || 'Apartment Ops Lead',
            status: hubForm.status,
            load: hubForm.load,
            type: 'Hub',
            location: { address: hubForm.address.trim() },
            serviceTags: [APARTMENT_SERVICE_KEY],
            metadata: {
                isSociety: true,
                pendingApproval: false,
                blocks: parseLines(hubForm.blocksText),
                parkingLevels: parseLines(hubForm.parkingLevelsText),
                pillarRange: {
                    min: Number(hubForm.pillarMin || 1),
                    max: Number(hubForm.pillarMax || 100)
                }
            }
        };

        try {
            if (editingHub?._id) {
                await adminAPI.updateHub(editingHub._id, payload);
                toast.success('Apartment registry updated');
            } else {
                await adminAPI.createHub(payload);
                toast.success('Apartment registry created');
            }
            setHubModalOpen(false);
            fetchConsole({ silent: true });
        } catch (error) {
            console.error('Failed to save apartment hub:', error);
            toast.error(error.message || 'Failed to save apartment registry');
        } finally {
            setHubSaving(false);
        }
    };

    const handleDeleteHub = async (hub) => {
        if (!window.confirm(`Delete apartment registry for ${hub.name}?`)) return;
        try {
            await adminAPI.deleteHub(hub._id);
            toast.success('Apartment registry archived');
            fetchConsole({ silent: true });
        } catch (error) {
            console.error('Failed to delete apartment hub:', error);
            toast.error(error.message || 'Failed to archive apartment registry');
        }
    };

    const handleSavePlan = async (event) => {
        event.preventDefault();
        setPlanSaving(true);
        const payload = {
            name: planForm.name.trim(),
            price: Number(planForm.price || 0),
            interval: planForm.interval,
            status: planForm.status,
            features: parseLines(planForm.featuresText),
            accent: planForm.accent,
            credits: Number(planForm.credits || 0),
            maxVehicles: Number(planForm.maxVehicles || 1),
            rollover: Number(planForm.rollover || 0),
            applicableServices: [APARTMENT_SERVICE_KEY, 'Apartment Wash'],
            moduleScope: 'apartment-wash'
        };

        try {
            if (editingPlan?._id) {
                await adminAPI.updatePlan(editingPlan._id, payload);
                toast.success('Apartment wash plan updated');
            } else {
                await adminAPI.createPlan(payload);
                toast.success('Apartment wash plan created');
            }
            setPlanModalOpen(false);
            fetchConsole({ silent: true });
        } catch (error) {
            console.error('Failed to save apartment plan:', error);
            toast.error(error.message || 'Failed to save apartment plan');
        } finally {
            setPlanSaving(false);
        }
    };

    const handleDeletePlan = async (plan) => {
        if (!window.confirm(`Delete apartment plan "${plan.name}"?`)) return;
        try {
            await adminAPI.deletePlan(plan._id);
            toast.success('Apartment wash plan archived');
            fetchConsole({ silent: true });
        } catch (error) {
            console.error('Failed to delete apartment plan:', error);
            toast.error(error.message || 'Failed to archive apartment plan');
        }
    };

    const handleCaptainMapSave = async (captain) => {
        const nextHub = mappingDrafts[captain._id] ?? '';
        setMappingSavingId(captain._id);
        try {
            await adminAPI.updateUser(captain._id, { hub: nextHub });
            toast.success(nextHub ? `${captain.name} mapped to ${nextHub}` : `${captain.name} unmapped from apartment ops`);
            fetchConsole({ silent: true });
        } catch (error) {
            console.error('Failed to update captain mapping:', error);
            toast.error(error.message || 'Failed to update captain mapping');
        } finally {
            setMappingSavingId('');
        }
    };

    const handleMarkCaptainTestReady = async (captain) => {
        const preferredHub = mappingDrafts[captain._id] || captain.mappedHub || hubs[0]?.name || '';
        if (!preferredHub) {
            toast.error('Create or select an apartment first, then mark captain test-ready');
            return;
        }

        setMappingSavingId(captain._id);
        try {
            await adminAPI.updateUser(captain._id, {
                isActive: true,
                isVerified: true,
                hub: preferredHub
            });
            toast.success(`${captain.name} is now test-ready for apartment flow`);
            fetchConsole({ silent: true });
        } catch (error) {
            console.error('Failed to mark captain test-ready:', error);
            toast.error(error.message || 'Failed to mark captain test-ready');
        } finally {
            setMappingSavingId('');
        }
    };

    const handleDeactivateTestCaptain = async (captain) => {
        setMappingSavingId(captain._id);
        try {
            await adminAPI.updateUser(captain._id, {
                isActive: false,
                isVerified: false,
                hub: ''
            });
            toast.success(`${captain.name} has been deactivated for apartment testing`);
            fetchConsole({ silent: true });
        } catch (error) {
            console.error('Failed to deactivate test captain:', error);
            toast.error(error.message || 'Failed to deactivate test captain');
        } finally {
            setMappingSavingId('');
        }
    };

    const handleServiceSave = async (event) => {
        event.preventDefault();
        if (!service?._id) {
            toast.error('Apartment service config missing');
            return;
        }

        setServiceSaving(true);
        try {
            await adminAPI.updateApartmentWashConfig(service._id, {
                title: serviceForm.title.trim(),
                description: serviceForm.description.trim(),
                price: Number(serviceForm.price || 0),
                estimatedTime: Number(serviceForm.estimatedTime || 0),
                badge: serviceForm.badge.trim(),
                sortOrder: Number(serviceForm.sortOrder || 0),
                isActive: Boolean(serviceForm.isActive),
                features: parseLines(serviceForm.featuresText),
                rules: parseLines(serviceForm.rulesText),
                slots: parseSlots(serviceForm.slotsText)
            });
            toast.success('Apartment wash service control updated');
            fetchConsole({ silent: true });
        } catch (error) {
            console.error('Failed to update apartment service config:', error);
            toast.error(error.message || 'Failed to update service control');
        } finally {
            setServiceSaving(false);
        }
    };

    const handleSubscriptionReview = async (subscription, action) => {
        const hub = hubs.find((item) => String(item._id) === String(subscription.hub?._id || subscription.hub));
        const captainId = selectedCaptainsForApproval[subscription._id] || '';
        const selectedCaptain = captainId ? captains.find((captain) => String(captain._id) === String(captainId)) : null;
        const hasMappedCaptainBase = (hub?.mappedCaptainCount || 0) > 0;
        const hasSelectedEligibleCaptain = Boolean(selectedCaptain?._id && selectedCaptain.isVerified && selectedCaptain.isActive);

        if (action === 'approve' && !hasMappedCaptainBase && !hasSelectedEligibleCaptain) {
            toast.error('Map at least one active verified captain to this apartment before approval');
            return;
        }

        let rejectionReason = '';
        if (action === 'reject') {
            rejectionReason = window.prompt('Enter the rejection reason for this apartment request:', subscription.review?.rejectionReason || '') || '';
            if (!rejectionReason.trim()) {
                toast.error('A rejection reason is required');
                return;
            }
        }

        setReviewingSubscriptionId(subscription._id);
        try {
            const response = await adminAPI.reviewApartmentSubscription(subscription._id, action, rejectionReason.trim(), captainId);
            toast.success(response?.message || (action === 'approve' ? 'Apartment request approved' : 'Apartment request rejected'));
            fetchConsole({ silent: true });
        } catch (error) {
            console.error('Failed to review apartment subscription:', error);
            toast.error(error.message || 'Failed to review apartment request');
        } finally {
            setReviewingSubscriptionId('');
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex items-center gap-3 rounded-3xl border border-gray-100 bg-white px-6 py-4 shadow-soft">
                    <Loader2 size={18} className="animate-spin text-brand" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-content-subtle">Loading apartment ops</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-4 pb-16 pt-6">
                    <div className={activeSection === 'overview' ? "grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-6 items-start" : "space-y-6"}>
                    {/* Persistent Navigation Sidebar - Visible ONLY on Overview for Desktop */}
                    {activeSection === 'overview' && (
                        <div className="space-y-5 xl:sticky xl:top-24 hidden xl:block">
                        <section className="rounded-[2.2rem] border border-slate-200/60 dark:border-white/5 bg-surface p-6 shadow-soft">
                            <div className="flex items-center justify-between gap-3 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-black text-brand flex items-center justify-center shadow-lg">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.2em] opacity-50">Operational</p>
                                        <h2 className="text-[13px] font-black text-content uppercase tracking-tight">Admin menu</h2>
                                    </div>
                                </div>
                            </div>

                            <nav className="space-y-1.5">
                                {SECTION_TABS.map((tab) => {
                                    const meta = SECTION_META[tab.id];
                                    const Icon = meta.icon;
                                    const isActive = activeSection === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => handleSectionChange(tab.id)}
                                            className={`w-full rounded-2xl border px-4 py-3 text-left transition-all group ${
                                                isActive
                                                    ? 'border-brand/30 bg-brand/5 shadow-inner'
                                                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${isActive ? 'bg-brand text-black shadow-lg shadow-brand/20' : 'bg-slate-100 dark:bg-white/5 text-content-subtle group-hover:bg-brand/10 group-hover:text-brand'}`}>
                                                    <Icon size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-content' : 'text-content-subtle opacity-70'}`}>{meta.title}</p>
                                                    <p className={`mt-0.5 text-[9px] font-bold leading-none truncate ${isActive ? 'text-content/60' : 'text-content-subtle/40'}`}>{meta.description.slice(0, 30)}...</p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </nav>
                        </section>

                        <div className="p-6 bg-brand/5 rounded-[2.2rem] border border-brand/20 shadow-inner">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-black text-brand flex items-center justify-center shadow-lg">
                                    <Activity size={14} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-content">Logistic heartbeat</span>
                            </div>
                            <p className="text-[11px] font-black text-content/60 uppercase tracking-tight leading-relaxed">
                                Infrastructure synchronized. {stats.societies || 0} Logistic Nodes active. System reporting <span className="text-emerald-500 font-black">Optimal Throughput</span> across all mapped territories.
                            </p>
                        </div>
                    </div>
                )}

                    <div className="space-y-6">
                        {/* Navigation Hub - Professional Top Tab Bar */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-slate-100 dark:border-white/5 mb-2">
                            {SECTION_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleSectionChange(tab.id)}
                                    className={`whitespace-nowrap px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === tab.id ? 'bg-black text-brand shadow-lg' : 'bg-surface border border-slate-100 dark:border-white/5 text-content-subtle hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                {activeSection === 'overview' && (
                    <div className="space-y-5">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                            <div className="flex items-center gap-5">
                                <div className="w-1.5 h-10 bg-brand rounded-full shadow-[0_0_15px_rgba(242,159,5,0.4)]" />
                                <div>
                                    <h1 className="text-3xl font-black tracking-tighter text-content capitalize">Apartment <span className="text-brand">cockpit</span></h1>
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.25em] mt-1 opacity-60">System health & revenue telemetry</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-10 px-4 bg-surface rounded-xl border border-slate-200/60 dark:border-white/5 flex items-center gap-3 shadow-sm">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase text-content tracking-widest leading-none">{stats.liveBookings || 0} active nodes</span>
                                </div>
                                <button onClick={() => fetchConsole({ silent: true })} disabled={refreshing} className="w-10 h-10 bg-black text-brand rounded-xl flex items-center justify-center hover:brightness-125 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </header>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                                { label: 'Active societies', value: stats.societies, icon: Building2, status: 'Online', color: 'emerald' },
                                { label: 'Verified personnel', value: stats.verifiedCaptains, icon: Users, status: 'Standard', color: 'brand' },
                                { label: 'Yield projection', value: formatCurrency(stats.totalRevenue), icon: CalendarClock, status: 'Monthly', color: 'emerald' },
                                { label: 'Peak capacity', value: `${stats.capacityUsage || 0}%`, icon: Activity, status: 'Normal', color: 'blue' }
                            ].map((stat, i) => (
                                <article key={i} className="bg-surface p-4 rounded-3xl border border-slate-200/60 dark:border-white/5 shadow-sm hover:border-brand/40 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`w-9 h-9 bg-slate-100 dark:bg-white/5 text-content rounded-xl flex items-center justify-center`}><stat.icon size={18} /></div>
                                        <span className={`text-[8px] font-black text-${stat.color}-500 bg-${stat.color}-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest`}>{stat.status}</span>
                                    </div>
                                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest opacity-50">{stat.label}</p>
                                    <p className="text-2xl font-black tracking-tighter text-content tabular-nums mt-1">{stat.value || 0}</p>
                                </article>
                            ))}
                        </div>

                        <div className="grid gap-5 lg:grid-cols-3 items-start">
                            <div className="lg:col-span-2 space-y-5">
                                <section className="bg-surface rounded-3xl border border-slate-200/60 dark:border-white/5 p-6 shadow-sm relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4"><Shield size={160} /></div>
                                    <div className="flex items-center gap-3 mb-6 relative z-10">
                                        <div className="w-1 h-5 bg-brand rounded-full" />
                                        <h2 className="text-sm font-black text-content tracking-tight uppercase">Control hubs</h2>
                                    </div>
                                    <div className="grid gap-3 relative z-10">
                                        {[
                                            { id: 'apartments', icon: Building2, label: 'Society infrastructure', sub: `${hubs.length} Active Society Nodes` },
                                            { id: 'subscriptions', icon: Crown, label: 'Revenue yield management', sub: `${subscriptions.length} Recurring Contracts Managed` },
                                            { id: 'liveops', icon: Activity, label: 'Live operations control', sub: `${stats.liveBookings || 0} Assets In Pipeline` }
                                        ].map((card) => (
                                            <button key={card.id} onClick={() => handleSectionChange(card.id)} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-white/[0.01] rounded-[2rem] border border-slate-200/40 dark:border-white/5 hover:border-brand/40 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-content group-hover:bg-brand group-hover:text-black transition-all shadow-sm"><card.icon size={20} /></div>
                                                    <div className="text-left">
                                                        <p className="text-[13px] font-black text-content uppercase tracking-tight leading-none">{card.label}</p>
                                                        <p className="text-[9px] font-bold text-content-subtle mt-2 opacity-60 uppercase tracking-widest leading-none">{card.sub}</p>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-content-subtle opacity-30 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                                                    <ChevronRight size={18} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <article className="bg-surface rounded-3xl border border-slate-200/60 dark:border-white/5 p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-content">Revenue performance</h3>
                                        </div>
                                        <TrendingUp size={14} className="text-emerald-500" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black tracking-tighter text-content tabular-nums">{formatCurrency(stats.totalRevenue)}</span>
                                        <span className="text-[10px] font-bold text-emerald-500">+{stats.revenueGrowth || 0}%</span>
                                    </div>
                                </article>
                            </div>

                            <aside className="space-y-5">
                                <div className="bg-black rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-brand/10 blur-3xl group-hover:bg-brand/20 transition-all" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-brand mb-6 flex items-center gap-2">
                                        <Activity size={12} /> Resource pulse
                                    </h3>
                                    <div className="space-y-5">
                                        {hubs.slice(0, 3).map((hub) => (
                                            <div key={hub._id} className="space-y-2.5">
                                                <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                                                    <span className="truncate pr-4 opacity-70">{hub.name}</span>
                                                    <span className={(hub.mappedCaptainCount || 0) > 0 ? 'text-emerald-500' : 'text-brand'}>
                                                        {(hub.mappedCaptainCount || 0) > 0 ? 'NOMINAL' : 'VACANT'}
                                                    </span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-brand rounded-full transition-all duration-1000" style={{ width: (hub.mappedCaptainCount || 0) > 0 ? '100%' : '10%' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                )}

                {activeSection === 'apartments' && (
                    <div className="space-y-6">
                        <header className="bg-surface/90 backdrop-blur-xl p-5 rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 shadow-premium flex flex-col md:flex-row gap-6 items-center justify-between sticky top-[4.5rem] z-20">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-black text-brand rounded-2xl flex items-center justify-center border-2 border-black shadow-2xl shrink-0">
                                    <Building2 size={28} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl font-black text-content capitalize tracking-tighter leading-none">Logistic infrastructure</h2>
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-[0.25em] mt-2 opacity-50">Global node registry & asset control</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Scan Registry Nodes..."
                                        value={hubSearch}
                                        onChange={e => setHubSearch(e.target.value)}
                                        className="w-full h-12 bg-background border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 text-[12px] font-black text-content outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-content-subtle/30 shadow-inner uppercase tracking-tight"
                                    />
                                </div>
                                <button
                                    onClick={openCreateHub}
                                    className="h-12 px-8 bg-black text-brand rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl hover:brightness-125 active:scale-95 transition-all shrink-0 border border-black"
                                >
                                    <Plus size={18} /> Deploy asset
                                </button>
                            </div>
                        </header>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredHubs.map((hub) => (
                                <article key={hub._id} className="group bg-surface rounded-[2.75rem] border border-slate-200/60 dark:border-white/5 p-6 shadow-sm hover:shadow-xl hover:border-brand/40 transition-all relative overflow-hidden flex flex-col min-h-[380px]">
                                    {/* Action Deck */}
                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex gap-2 z-10 pointer-events-none group-hover:pointer-events-auto">
                                        <button onClick={() => openEditHub(hub)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-black text-brand shadow-2xl border border-black hover:scale-110 active:scale-90 transition-all">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteHub(hub)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500 text-white shadow-2xl border border-red-600 hover:scale-110 active:scale-90 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex gap-5 items-start relative">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-[1.75rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center text-brand border-2 border-slate-100 dark:border-white/10 group-hover:bg-black group-hover:border-black transition-all duration-700 shadow-sm overflow-hidden">
                                                <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <Building2 size={32} className="relative z-10 group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500 border-4 border-surface flex items-center justify-center">
                                                <Shield size={10} className="text-white" />
                                            </div>
                                        </div>
                                        <div className="min-w-0 pr-10 pt-1">
                                            <h3 className="text-lg font-black text-content uppercase tracking-tighter leading-tight truncate overflow-ellipsis">{hub.name}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest opacity-40">{hub.city}</span>
                                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                <span className="text-[10px] font-black text-brand uppercase tracking-[0.15em]">{hub.manager || 'NO ASSIGNED LEAD'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Personnel', value: hub.mappedCaptainCount || 0, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                            { label: 'Members', value: hub.liveSubscriptionsCount || 0, color: 'text-brand', bg: 'bg-brand/10' },
                                            { label: 'Active Ops', value: hub.liveBookingsCount || 0, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary-light)]' }
                                        ].map((stat, i) => (
                                            <div key={i} className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-slate-100 dark:border-white/10 flex flex-col items-center justify-center text-center group-hover:bg-surface group-hover:shadow-soft transition-all duration-500">
                                                <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-2 opacity-50">{stat.label}</p>
                                                <p className={`text-xl font-black ${stat.color} tabular-nums leading-none tracking-tighter`}>{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Territorial Telemetry */}
                                    <div className="mt-6 p-5 bg-background dark:bg-white/[0.01] rounded-[2rem] border border-slate-100 dark:border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                                                <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest opacity-40">Operating zones</span>
                                            </div>
                                            <span className="text-[11px] font-black text-content uppercase tracking-tight">{(hub.metadata?.blocks || []).join(', ') || 'GLOBAL NODE'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 opacity-40">
                                                    <Terminal size={10} className="text-brand" />
                                                </div>
                                                <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest opacity-40">Pillar matrix</span>
                                            </div>
                                            <div className="px-3 py-1 bg-black rounded-lg text-brand text-[11px] font-black tracking-tight tabular-nums">
                                                {hub.metadata?.pillarRange?.min || 1} <span className="mx-1 opacity-20">/</span> {hub.metadata?.pillarRange?.max || 100}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-50 dark:border-white/[0.03]">
                                        {hub.metadata?.pendingApproval ? (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--warning-light)] rounded-xl border border-[var(--warning)]">
                                                <Zap size={10} className="text-[var(--warning)] animate-pulse" />
                                                <span className="text-[9px] font-black uppercase text-[var(--warning-text)] tracking-[0.2em]">Deployment queue</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand/10 rounded-xl border border-brand/20">
                                                <Crown size={10} className="text-brand" />
                                                <span className="text-[9px] font-black uppercase text-brand tracking-[0.2em]">Premium node</span>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => openEditHub(hub)} 
                                            className="text-[10px] font-black text-content-subtle uppercase tracking-[0.2em] group-hover:text-brand transition-colors flex items-center gap-2"
                                        >
                                            Control node <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </article>
                            ))}
                            {filteredHubs.length === 0 && (
                                <div className="py-32 text-center bg-surface border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3.5rem] lg:col-span-3">
                                    <Building2 size={48} className="mx-auto mb-6 opacity-10" />
                                    <h3 className="text-lg font-black text-content uppercase tracking-tighter">Registry Signal Idle</h3>
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest opacity-40 mt-3 max-w-[240px] mx-auto leading-relaxed">No logistical nodes detected in local scan. Start asset deployment for infrastructure initialization.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeSection === 'captains' && (
                    <div className="space-y-4">
                        <header className="bg-surface/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row gap-4 items-center justify-between sticky top-[4.5rem] mt-4 z-20">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-black text-brand rounded-2xl flex items-center justify-center border border-black shadow-xl">
                                    <Users size={22} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[17px] font-black text-content capitalize tracking-tight leading-none">Captain mapping</h2>
                                    <p className="text-[9px] font-black text-content-subtle capitalize tracking-[0.2em] mt-1.5 opacity-60">Personnel & territory assignment</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 w-full md:w-auto">
                                <div className="relative flex-1 md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle opacity-50" size={13} />
                                    <input
                                        type="text"
                                        placeholder="Find Captains..."
                                        value={captainSearch}
                                        onChange={e => setCaptainSearch(e.target.value)}
                                        className="w-full h-11 bg-background border border-slate-100 dark:border-white/5 rounded-[1.1rem] pl-11 pr-4 text-[11px] font-extrabold text-content outline-none focus:border-brand/50 focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-content-subtle/50 shadow-inner"
                                    />
                                </div>
                                <div className="h-11 px-4 bg-slate-100/50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase text-content tracking-widest opacity-60">{filteredCaptains.length} Live Members</span>
                                </div>
                            </div>
                        </header>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredCaptains.map((captain) => {
                                const draftHub = mappingDrafts[captain._id] ?? (captain.mappedHub || '');
                                const isSaving = mappingSavingId === captain._id;
                                return (
                                    <article key={captain._id} className="bg-surface rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 p-5 shadow-[0_15px_35px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.06)] hover:border-brand/40 transition-all group flex flex-col">
                                        <div className="flex gap-4 items-start">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100/10 dark:bg-white/5 flex items-center justify-center text-brand border border-slate-100/20 dark:border-white/10 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                                                <User size={24} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-[16px] font-black text-content capitalize tracking-tighter leading-tight truncate">{captain.name || 'Anonymous Captain'}</h3>
                                                <p className="text-[9px] font-black text-content-subtle lowercase tracking-tight mt-1 opacity-70 truncate">{captain.email || captain.phone}</p>
                                                <div className="mt-2 text-[10px] font-extrabold text-brand uppercase tracking-widest opacity-80">{(captain.type || 'Standard Member')}</div>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid grid-cols-2 gap-2">
                                            <div className={`px-3 py-2 rounded-2xl border flex flex-col items-center justify-center text-center ${captain.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                                <p className="text-[8px] font-black uppercase opacity-60 leading-none mb-1">Account</p>
                                                <p className="text-[11px] font-bold uppercase tracking-widest">{captain.isActive ? 'Active' : 'Offline'}</p>
                                            </div>
                                            <div className={`px-3 py-2 rounded-2xl border flex flex-col items-center justify-center text-center ${captain.isVerified ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--warning-light)] border-[var(--warning)] text-[var(--warning)]'}`}>
                                                <p className="text-[8px] font-black uppercase opacity-60 leading-none mb-1">Verification</p>
                                                <p className="text-[11px] font-bold uppercase tracking-widest">{captain.isVerified ? 'Verified' : 'Pending'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-5 p-4 bg-slate-100/10 dark:bg-white/[0.03] rounded-3xl border border-dashed border-slate-200/50 dark:border-white/10 space-y-4">
                                            <div>
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-content opacity-50 block mb-3">Territory assignment</label>
                                                <div className="flex gap-2">
                                                    <select
                                                        value={draftHub}
                                                        onChange={(event) => setMappingDrafts((current) => ({ ...current, [captain._id]: event.target.value }))}
                                                        className="h-10 flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-background px-3 text-[11px] font-bold text-content outline-none focus:border-brand shadow-inner"
                                                    >
                                                        <option value="">Unmapped (Global)</option>
                                                        {hubs.map((hub) => (
                                                            <option key={hub._id} value={hub.name}>{hub.name}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleCaptainMapSave(captain)}
                                                        disabled={isSaving}
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-black text-brand hover:brightness-110 shadow-lg shadow-black/10 transition-all disabled:opacity-40"
                                                    >
                                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-100 dark:border-white/5">
                                                <button
                                                    onClick={() => handleMarkCaptainTestReady(captain)}
                                                    disabled={isSaving}
                                                    className="flex-1 h-9 rounded-xl bg-brand/10 border border-brand/20 text-brand text-[9px] font-black uppercase tracking-widest hover:bg-brand hover:text-black transition-all"
                                                >
                                                    Fast Verify
                                                </button>
                                                <button
                                                    onClick={() => handleDeactivateTestCaptain(captain)}
                                                    disabled={isSaving || (!captain.isActive && !captain.isVerified)}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 flex items-center justify-between text-[10px] font-black">
                                            <span className="text-content opacity-30">Active Coverage</span>
                                            <span className={captain.mappedHub ? "text-emerald-500 truncate" : "text-[var(--warning)] truncate"}>
                                                {captain.mappedHub || 'No Hub Assigned'}
                                            </span>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                )}



                {activeSection === 'subscriptions' && (
                    <div className="space-y-6">
                        <header className="flex flex-col md:flex-row gap-6 items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black text-brand rounded-2xl flex items-center justify-center border border-black shadow-xl shrink-0">
                                    <Crown size={24} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl font-black text-content capitalize tracking-tighter leading-none">Subscription hub</h2>
                                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.25em] mt-2 opacity-60">Membership & revenue command</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={openCreatePlan}
                                    className="flex-1 md:flex-none h-11 px-6 bg-brand text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(242,159,5,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <Plus size={16} /> New Asset Plan
                                </button>
                            </div>
                        </header>

                        <div className="grid gap-5 lg:grid-cols-12 items-start">
                            {/* Plans Sidebar */}
                            <aside className="lg:col-span-3 space-y-4 xl:sticky xl:top-[12.5rem]">
                                <section className="bg-surface rounded-3xl border border-slate-200/60 dark:border-white/5 p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-5 px-1">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-content opacity-50">Active inventory</h3>
                                        <span className="text-[9px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-lg border border-brand/20">{plans.length} Live</span>
                                    </div>
                                    <div className="space-y-2">
                                        {plans.map((plan) => (
                                            <div key={plan._id} className="p-3 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5 hover:border-brand/40 transition-all group flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black text-content truncate uppercase tracking-tight leading-none">{plan.name}</p>
                                                    <p className="text-[9px] font-black text-content-subtle mt-1.5 opacity-60">
                                                        {formatCurrency(plan.price)} <span className="mx-1 opacity-20">•</span> {plan.interval}
                                                    </p>
                                                </div>
                                                <button onClick={() => openEditPlan(plan)} className="w-7 h-7 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center text-content-subtle hover:text-brand shadow-sm border border-slate-100 dark:border-white/5 transition-all shrink-0">
                                                    <Edit2 size={11} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div className="p-5 bg-black rounded-3xl text-white overflow-hidden relative group shadow-xl">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand/20 blur-2xl group-hover:bg-brand/30 transition-all" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-brand mb-1 leading-none">Yield Velocity</p>
                                    <p className="text-2xl font-black tracking-tighter tabular-nums whitespace-nowrap mt-2">
                                        {formatCurrency(activeSubscriptions.reduce((acc, sub) => acc + (sub.price || 0), 0))}
                                    </p>
                                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                                            <Activity size={10} className="text-emerald-500" /> Active Recurring
                                        </span>
                                        <span className="text-[10px] font-black text-emerald-500">{activeSubscriptions.length} Units</span>
                                    </div>
                                </div>
                            </aside>

                            <main className="lg:col-span-9 space-y-5">
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-[var(--warning)] shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-content">Pending review queue</h3>
                                        </div>
                                        <span className="text-[10px] font-black text-content-subtle opacity-40 uppercase tracking-widest">{pendingSubscriptions.length} Operational Bottlenecks</span>
                                    </div>

                                {pendingSubscriptions.length > 0 && (
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2 px-2">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Operational queue</h3>
                                        </div>
                                    <div className="space-y-3">
                                        {pendingSubscriptions.map((subscription) => {
                                            const hub = hubs.find((item) => String(item._id) === String(subscription.hub?._id || subscription.hub));
                                            const canApprove = (hub?.mappedCaptainCount || 0) > 0;
                                            const isReviewing = reviewingSubscriptionId === subscription._id;

                                            return (
                                                <article key={subscription._id} className="bg-surface rounded-3xl border border-slate-200/60 dark:border-white/5 p-4 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                                    <div className="grid lg:grid-cols-12 gap-5 items-center">
                                                        <div className="lg:col-span-4 flex items-center gap-4 border-r border-slate-100 dark:border-white/5 pr-4">
                                                            <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-content shrink-0">
                                                                <User size={20} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="text-[14px] font-black text-content truncate uppercase tracking-tight leading-tight">{subscription.user?.name || 'Anonymous'}</h4>
                                                                <div className="flex items-center gap-2 mt-1.5">
                                                                    <span className="text-[9px] font-black text-brand uppercase tracking-widest">{subscription.hub?.name || 'Global'}</span>
                                                                    <span className="text-[9px] font-black text-content-subtle opacity-40 uppercase leading-none px-2 py-0.5 bg-slate-100/50 dark:bg-white/5 rounded-md">{subscription.user?.phone}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="lg:col-span-5 grid grid-cols-3 gap-3">
                                                            <div>
                                                                <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest opacity-40 mb-1">Asset Node</p>
                                                                <p className="text-[10px] font-black text-content truncate uppercase">{getVehicleLabel(subscription)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest opacity-40 mb-1">Parking Pin</p>
                                                                <p className="text-[10px] font-black text-content truncate uppercase">{getRouteLabel(subscription)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest opacity-40 mb-1">Schedule</p>
                                                                <p className="text-[10px] font-black text-brand uppercase">{subscription.slot || 'TBD Slot'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="lg:col-span-3 flex items-center gap-2">
                                                            <div className="relative flex-1">
                                                                <select
                                                                    value={selectedCaptainsForApproval[subscription._id] || ''}
                                                                    onChange={(e) => setSelectedCaptainsForApproval({ ...selectedCaptainsForApproval, [subscription._id]: e.target.value })}
                                                                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-background px-3 text-[10px] font-black text-content focus:border-brand shadow-inner appearance-none transition-all pr-8"
                                                                >
                                                                    <option value="">Auto-Pilot</option>
                                                                    {captains.filter(c => c.isVerified && c.isActive).map(c => (
                                                                        <option key={c._id} value={c._id}>{c.name}</option>
                                                                    ))}
                                                                </select>
                                                                <ChevronUp size={10} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-180 opacity-30 pointer-events-none" />
                                                            </div>
                                                            <button
                                                                onClick={() => handleSubscriptionReview(subscription, 'approve')}
                                                                disabled={isReviewing || !canApprove}
                                                                className="h-10 px-4 bg-black text-brand rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-125 transition-all shadow-lg active:scale-95 disabled:opacity-30 flex items-center gap-2 border border-black"
                                                            >
                                                                {isReviewing ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />} Authorize node
                                                            </button>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                        {pendingSubscriptions.length === 0 && (
                                            <div className="py-12 bg-emerald-500/5 rounded-3xl border border-dashed border-emerald-500/20 text-center">
                                                <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-500 opacity-20" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">All Queue Blocks Cleared</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                                )}
                            </section>

                                <section className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-content">Verified asset base</h3>
                                        </div>
                                        <button className="text-[9px] font-black text-brand uppercase tracking-widest hover:underline decoration-2 underline-offset-4 flex items-center gap-1.5">
                                            Export Registry <ChevronRight size={10} />
                                        </button>
                                    </div>

                                    <div className="bg-surface rounded-3xl border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                                                        <th className="px-5 py-4 text-[9px] font-black text-content-subtle uppercase tracking-widest">Active Member</th>
                                                        <th className="px-5 py-4 text-[9px] font-black text-content-subtle uppercase tracking-widest">Subscription</th>
                                                        <th className="px-5 py-4 text-[9px] font-black text-content-subtle uppercase tracking-widest">Asset Details</th>
                                                        <th className="px-5 py-4 text-[9px] font-black text-content-subtle uppercase tracking-widest text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                                    {nonPendingSubscriptions.map((subscription) => (
                                                        <tr key={subscription._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group">
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-content-subtle group-hover:bg-brand/10 group-hover:text-brand transition-all">
                                                                        <User size={14} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[12px] font-black text-content leading-none truncate uppercase tracking-tight">{subscription.user?.name || 'Standard User'}</p>
                                                                        <p className="text-[9px] font-bold text-content-subtle mt-1.5 opacity-40 uppercase tracking-widest leading-none">{subscription.hub?.name || 'Global'}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md text-[9px] font-black uppercase tracking-widest">{subscription.plan || 'Base Plan'}</span>
                                                                <p className="text-[9px] font-bold text-content-subtle mt-1 opacity-50 uppercase tracking-tight">ID: {subscription._id.slice(-6)}</p>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <p className="text-[11px] font-black text-content uppercase tracking-tight truncate">{getVehicleLabel(subscription)}</p>
                                                                <p className="text-[9px] font-bold text-content-subtle mt-1 opacity-40 uppercase truncate">{getRouteLabel(subscription)}</p>
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                <button className="text-[9px] font-black text-brand uppercase tracking-widest opacity-40 group-hover:opacity-100 hover:underline transition-all">Relocate Unit</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                         {nonPendingSubscriptions.length === 0 && (
                                            <div className="py-20 text-center bg-slate-50/50 dark:bg-white/[0.02]">
                                                <Building2 size={40} className="mx-auto mb-4 opacity-10" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-content-subtle opacity-40">Operational Registry Empty</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </main>
                        </div>
                    </div>
                )}

                {activeSection === 'liveops' && (
                    <div className="space-y-6">
                        <SectionToolbar
                            title="Apartment Live Ops"
                            description="Real-time monitor for daily apartment jobs, assigned personnel, slot pressure, and parking-route telemetry."
                            searchValue={liveSearch}
                            onSearchChange={setLiveSearch}
                            searchPlaceholder="Search user, captain, apartment, vehicle..."
                        />

                        {/* Live Ops HUD Telemetry */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'In-Flight Nodes', value: filteredLiveBookings.filter(b => b.status === 'In Progress').length, icon: Zap, color: 'text-[var(--warning)]', bg: 'bg-[var(--warning-light)]' },
                                { label: 'Standby Queue', value: filteredLiveBookings.filter(b => b.status === 'Pending').length, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                { label: 'Completed Today', value: stats.liveBookings || 0, icon: CheckCircle2, color: 'text-brand', bg: 'bg-brand/10' },
                                { label: 'Critical Variance', value: 0, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' }
                            ].map((met, idx) => (
                                <div key={idx} className="bg-surface p-4 rounded-3xl border border-slate-200/60 dark:border-white/5 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`w-8 h-8 rounded-xl ${met.bg} ${met.color} flex items-center justify-center`}><met.icon size={16} /></div>
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-white/10" />
                                    </div>
                                    <p className="text-2xl font-black tracking-tighter text-content tabular-nums">{met.value}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-content-subtle opacity-40 mt-1">{met.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            {filteredLiveBookings.map((booking) => (
                                <article key={booking._id} className="group bg-surface rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 p-6 shadow-sm hover:shadow-md hover:border-brand/40 transition-all relative overflow-hidden">
                                     {booking.status === 'In Progress' && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--warning-light)] blur-3xl -translate-y-1/2 translate-x-1/2" />
                                     )}
                                    
                                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between relative z-10">
                                        <div className="flex items-start gap-5">
                                            <div className="relative">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${booking.status === 'In Progress' ? 'bg-[var(--warning)] border-black shadow-lg shadow-[var(--warning)]/20' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-content-subtle'}`}>
                                                    <Zap size={24} className={booking.status === 'In Progress' ? 'text-black animate-pulse' : 'opacity-40'} />
                                                </div>
                                                {booking.status === 'In Progress' && (
                                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--warning)] opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--warning)]"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-[17px] font-black text-content uppercase tracking-tight truncate max-w-[200px]">{booking.consumer?.name || 'Asset Owner'}</h3>
                                                    <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                                                    <span className="text-[10px] font-black tracking-[0.2em] text-brand uppercase truncate">{getVehicleLabel(booking)}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 mt-2">
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200/50 dark:border-white/10">
                                                        <MapPin size={10} className="text-content-subtle opacity-40" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-content-subtle">{booking.location?.hubId?.name || 'Global Node'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:border-white/5 rounded-lg border border-slate-100 dark:border-white/10">
                                                        <CalendarClock size={10} className="text-content-subtle opacity-40" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-content-subtle">{formatDate(booking.schedule?.date)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                                            <div className="px-5 py-3 bg-background rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
                                                <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest opacity-40 mb-1 leading-none">Operating Window</p>
                                                <p className="text-xs font-black text-brand uppercase tracking-tighter leading-none">{booking.schedule?.slot || 'TBD Window'}</p>
                                            </div>
                                            <div className={`px-5 py-3 rounded-2xl border transition-all ${booking.status === 'In Progress' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-sm' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-content-subtle opacity-60'}`}>
                                                <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1 leading-none">Process Signal</p>
                                                <p className="text-xs font-black uppercase tracking-tighter leading-none">{booking.status}</p>
                                            </div>
                                            <button className="h-12 w-12 bg-black text-brand rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10">
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-slate-50 dark:border-white/[0.03] grid gap-4 grid-cols-2 lg:grid-cols-4">
                                        <InfoRow label="Assigned Lead" value={booking.provider?.id?.name || 'Deployment Pending'} />
                                        <InfoRow label="Deployment Path" value={getRouteLabel(booking)} />
                                        <InfoRow label="Telemetry Node" value={booking._id?.slice(-8).toUpperCase()} />
                                        <InfoRow label="Yield Node" value={formatCurrency(booking.pricing?.totalAmount || booking.price || 0)} />
                                    </div>
                                </article>
                            ))}
                            {filteredLiveBookings.length === 0 && (
                                <div className="py-24 text-center bg-surface border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem]">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 text-slate-200 dark:text-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Zap size={32} />
                                    </div>
                                    <h3 className="text-lg font-black text-content uppercase tracking-tight">System Signal Idle</h3>
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest opacity-40 mt-3">No active or pending operations detected in current bandwidth.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeSection === 'service' && (
                    <section className="bg-surface rounded-3xl border border-slate-200/60 dark:border-white/5 p-8 shadow-sm">
                        <header className="flex flex-col md:flex-row gap-6 items-start justify-between border-b border-slate-50 dark:border-white/[0.03] pb-8 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black text-brand rounded-2xl flex items-center justify-center border border-black shadow-xl shrink-0">
                                    <Shield size={24} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl font-black text-content capitalize tracking-tighter leading-none">Service manifest control</h2>
                                    <p className="text-[9px] font-black text-content-subtle uppercase tracking-[0.25em] mt-2 opacity-60">Master contract & capability configuration</p>
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border ${serviceForm.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                {serviceForm.isActive ? 'OPERATIONAL' : 'DORMANT'}
                            </div>
                        </header>

                        <form className="space-y-8" onSubmit={handleServiceSave}>
                            <div className="grid gap-6 xl:grid-cols-3">
                                <TextField label="Contract Title" value={serviceForm.title} onChange={(value) => setServiceForm((current) => ({ ...current, title: value }))} />
                                <TextField label="Service Badge" value={serviceForm.badge} onChange={(value) => setServiceForm((current) => ({ ...current, badge: value }))} />
                                <TextField label="Yield Baseline" type="number" value={serviceForm.price} onChange={(value) => setServiceForm((current) => ({ ...current, price: value }))} />
                            </div>

                            <div className="grid gap-6 xl:grid-cols-2">
                                <div className="grid gap-6 grid-cols-2">
                                    <TextField label="SLA Duration (min)" type="number" value={serviceForm.estimatedTime} onChange={(value) => setServiceForm((current) => ({ ...current, estimatedTime: value }))} />
                                    <TextField label="Manifest Priority" type="number" value={serviceForm.sortOrder} onChange={(value) => setServiceForm((current) => ({ ...current, sortOrder: value }))} />
                                </div>
                                <label className="block rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] px-5 py-4 cursor-pointer group hover:border-brand/40 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-content opacity-50">Operational Status</span>
                                            <p className="text-sm font-bold text-content mt-1">Visible in consumer manifest</p>
                                        </div>
                                        <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${serviceForm.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <input 
                                                type="checkbox" 
                                                checked={serviceForm.isActive} 
                                                onChange={(e) => setServiceForm((current) => ({ ...current, isActive: e.target.checked }))} 
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                            />
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${serviceForm.isActive ? 'left-7' : 'left-1'}`} />
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <TextAreaField label="Contract Detailed Description" rows={4} value={serviceForm.description} onChange={(value) => setServiceForm((current) => ({ ...current, description: value }))} />

                            <div className="grid gap-6 xl:grid-cols-3">
                                <TextAreaField label="Service Features" hint="One node per line" value={serviceForm.featuresText} onChange={(value) => setServiceForm((current) => ({ ...current, featuresText: value }))} />
                                <TextAreaField label="SOP Protocols" hint="One rule per line" value={serviceForm.rulesText} onChange={(value) => setServiceForm((current) => ({ ...current, rulesText: value }))} />
                                <TextAreaField label="Operational Windows" hint="id | label | time" value={serviceForm.slotsText} onChange={(value) => setServiceForm((current) => ({ ...current, slotsText: value }))} />
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-50 dark:border-white/[0.03]">
                                <button type="submit" disabled={serviceSaving} className="inline-flex h-12 items-center gap-2 rounded-xl bg-black px-8 text-[11px] font-black uppercase tracking-[0.25em] text-brand transition-all hover:brightness-125 disabled:opacity-60 shadow-xl shadow-black/10 active:scale-95">
                                    {serviceSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Sync manifest control
                                </button>
                            </div>
                        </form>
                    </section>
                )}
            </div>
        </div>
    </div>
</div>

            {hubModalOpen && (
                <ModalShell 
                    title={editingHub ? 'Modify logistic node' : 'Initialize new asset base'} 
                    onClose={() => setHubModalOpen(false)}
                    maxWidth="max-w-4xl"
                >
                    <form className="space-y-8 p-2" onSubmit={handleSaveHub}>
                        {/* Block 1: Infrastructure Identity */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-4 bg-brand rounded-full" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-content opacity-50">Infrastructure identity</h4>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <TextField label="Logistic Node Name" placeholder="e.g. Prestige Heights" value={hubForm.name} onChange={(value) => setHubForm((current) => ({ ...current, name: value }))} required />
                                <TextField label="Geographic City" placeholder="e.g. Mumbai" value={hubForm.city} onChange={(value) => setHubForm((current) => ({ ...current, city: value }))} required />
                                <TextField label="Territory Lead" placeholder="Manager Name" value={hubForm.manager} onChange={(value) => setHubForm((current) => ({ ...current, manager: value }))} required />
                            </div>
                        </div>

                        {/* Block 2: Operational Parameters */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-4 bg-[var(--primary)] rounded-full" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-content opacity-50">Operational parameters</h4>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="lg:col-span-1">
                                    <TextField label="Central Dispatch Address" placeholder="Full physical address" value={hubForm.address} onChange={(value) => setHubForm((current) => ({ ...current, address: value }))} />
                                </div>
                                <SelectField label="Network Status" value={hubForm.status} options={['Online', 'Offline']} onChange={(value) => setHubForm((current) => ({ ...current, status: value }))} />
                                <SelectField label="Traffic Load" value={hubForm.load} options={['Low', 'Moderate', 'High', 'Peak']} onChange={(value) => setHubForm((current) => ({ ...current, load: value }))} />
                            </div>
                        </div>

                        {/* Block 3: Territorial Mapping (Parking) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-content opacity-50">Territorial mapping</h4>
                            </div>
                            <div className="grid gap-5 lg:grid-cols-12">
                                <div className="lg:col-span-4">
                                    <TextAreaField label="Operating Zones (Blocks)" rows={3} hint="Register one zone per line (e.g. Wing A)" value={hubForm.blocksText} onChange={(value) => setHubForm((current) => ({ ...current, blocksText: value }))} />
                                </div>
                                <div className="lg:col-span-4">
                                    <TextAreaField label="Parking Levels" rows={3} hint="Register one level per line (e.g. Basement 1)" value={hubForm.parkingLevelsText} onChange={(value) => setHubForm((current) => ({ ...current, parkingLevelsText: value }))} />
                                </div>
                                <div className="lg:col-span-4 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-200/60 dark:border-white/5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle block mb-4">Pillar Matrix Range</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <TextField label="Global Min" type="number" placeholder="1" value={hubForm.pillarMin} onChange={(value) => setHubForm((current) => ({ ...current, pillarMin: value }))} />
                                        <TextField label="Global Max" type="number" placeholder="500" value={hubForm.pillarMax} onChange={(value) => setHubForm((current) => ({ ...current, pillarMax: value }))} />
                                    </div>
                                    <p className="mt-4 text-[9px] font-bold text-content-subtle opacity-40 uppercase tracking-tight leading-relaxed">Defines the pillar numbering scale for parking route calculation.</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Control */}
                        <div className="flex justify-end items-center gap-4 pt-8 border-t border-slate-100 dark:border-white/5 mt-6">
                            <button 
                                type="button" 
                                onClick={() => setHubModalOpen(false)} 
                                className="px-8 h-12 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] text-content/40 hover:text-content hover:bg-slate-50 transition-all"
                            >
                                Abort Initialization
                            </button>
                            <button 
                                type="submit" 
                                disabled={hubSaving} 
                                className="inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-black px-10 text-[11px] font-black uppercase tracking-[0.2em] text-brand hover:brightness-125 transition-all disabled:opacity-60 shadow-xl shadow-black/10 active:scale-95"
                            >
                                {hubSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {editingHub ? 'Sync Registry Changes' : 'Commit Asset Deployment'}
                            </button>
                        </div>
                    </form>
                </ModalShell>
            )}

            {planModalOpen && (
                <ModalShell title={editingPlan ? 'Edit Apartment Plan' : 'Create Apartment Plan'} onClose={() => setPlanModalOpen(false)}>
                    <form className="space-y-4" onSubmit={handleSavePlan}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextField label="Plan Name" value={planForm.name} onChange={(value) => setPlanForm((current) => ({ ...current, name: value }))} required />
                            <TextField label="Price" type="number" value={planForm.price} onChange={(value) => setPlanForm((current) => ({ ...current, price: value }))} required />
                            <SelectField label="Interval" value={planForm.interval} options={['Monthly', 'Quarterly', 'Annual']} onChange={(value) => setPlanForm((current) => ({ ...current, interval: value }))} />
                            <SelectField label="Status" value={planForm.status} options={['Live', 'Hidden']} onChange={(value) => setPlanForm((current) => ({ ...current, status: value }))} />
                            <TextField label="Credits" type="number" value={planForm.credits} onChange={(value) => setPlanForm((current) => ({ ...current, credits: value }))} />
                            <TextField label="Max Vehicles" type="number" value={planForm.maxVehicles} onChange={(value) => setPlanForm((current) => ({ ...current, maxVehicles: value }))} />
                            <TextField label="Rollover" type="number" value={planForm.rollover} onChange={(value) => setPlanForm((current) => ({ ...current, rollover: value }))} />
                            <TextField label="Accent" value={planForm.accent} onChange={(value) => setPlanForm((current) => ({ ...current, accent: value }))} />
                        </div>

                        <TextAreaField label="Features" hint="One feature per line" value={planForm.featuresText} onChange={(value) => setPlanForm((current) => ({ ...current, featuresText: value }))} />

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setPlanModalOpen(false)} className="rounded-2xl border border-gray-200 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">
                                Cancel
                            </button>
                            <button type="submit" disabled={planSaving} className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-brand disabled:opacity-60">
                                {planSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Plan
                            </button>
                        </div>
                    </form>
                </ModalShell>
            )}
        </>
    );
};

const SectionToolbar = ({ title, description, searchValue, onSearchChange, searchPlaceholder, actionLabel, onAction }) => (
    <section className="bg-surface rounded-3xl border border-slate-200/60 dark:border-white/5 p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">{title}</p>
                <p className="mt-2 max-w-2xl text-[11px] font-bold leading-relaxed text-content-subtle opacity-70 uppercase tracking-tight">{description}</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
                {typeof searchValue === 'string' && (
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-subtle opacity-40 group-focus-within:text-brand transition-colors" size={13} />
                        <input
                            value={searchValue}
                            onChange={(event) => onSearchChange?.(event.target.value)}
                            placeholder={searchPlaceholder}
                            className="h-11 min-w-[300px] rounded-xl border border-slate-200 dark:border-white/10 bg-background pl-11 pr-4 text-[11px] font-black text-content outline-none focus:border-brand shadow-inner transition-all placeholder:text-content-subtle/30"
                        />
                    </div>
                )}
                {actionLabel && (
                    <button onClick={onAction} className="inline-flex h-11 items-center gap-2 rounded-xl bg-black px-6 text-[10px] font-black uppercase tracking-widest text-brand transition-all hover:brightness-125 shadow-lg active:scale-95">
                        <Plus size={14} />
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    </section>
);

const StatCard = ({ icon, label, value }) => (
    <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 bg-surface p-6 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-inner group-hover:scale-110 transition-transform">{icon}</div>
            <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="mt-5 text-3xl font-black tracking-tighter text-content tabular-nums">{value}</div>
        <div className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-content-subtle opacity-50">{label}</div>
    </div>
);

const MiniMetric = ({ label, value }) => (
    <div className="rounded-[1.2rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 px-4 py-3 transition-colors">
        <p className="text-[11px] font-black uppercase tracking-tight text-content">{value}</p>
        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-content-subtle opacity-50">{label}</p>
    </div>
);

const InfoPill = ({ label, value }) => (
    <div className="rounded-[1.5rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 px-5 py-4 transition-colors">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-content-subtle opacity-50">{label}</p>
        <p className="mt-2 text-[13px] font-black leading-none text-content uppercase tracking-tight">{value}</p>
    </div>
);

const InfoRow = ({ label, value }) => (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] px-4 py-2.5 border border-slate-100 dark:border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-content-subtle opacity-60">{label}</span>
        <span className="text-[11px] font-black text-content uppercase tracking-tight">{value}</span>
    </div>
);

const TextField = ({ label, value, onChange, required = false, type = 'text' }) => (
    <label className="block rounded-xl border border-slate-200 dark:border-white/10 bg-background px-4 py-2.5 shadow-inner">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-content opacity-50">{label}</span>
        <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full bg-transparent text-sm font-bold text-content outline-none placeholder:text-content/30" />
    </label>
);

const SelectField = ({ label, value, onChange, options = [] }) => (
    <label className="block rounded-xl border border-slate-200 dark:border-white/10 bg-background px-4 py-2.5 shadow-inner">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-content opacity-50">{label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full bg-transparent text-sm font-bold text-content outline-none">
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
    </label>
);

const TextAreaField = ({ label, value, onChange, rows = 3, hint = '' }) => (
    <label className="block rounded-xl border border-slate-200 dark:border-white/10 bg-background px-4 py-2.5 shadow-inner">
        <div className="flex items-center justify-between gap-3">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-content opacity-50">{label}</span>
            {hint ? <span className="text-[8px] font-black uppercase tracking-[0.18em] text-content opacity-30">{hint}</span> : null}
        </div>
        <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full resize-none bg-transparent text-sm font-bold leading-5 text-content outline-none" />
    </label>
);

const ModalShell = ({ title, children, onClose }) => (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-md">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[2.5rem] bg-surface border border-slate-200 dark:border-white/10 p-7 shadow-[0_35px_100px_rgba(0,0,0,0.5)]">
            <div className="mb-7 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand text-black rounded-2xl flex items-center justify-center border border-black/10 shadow-lg shadow-brand/20">
                        <Edit2 size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-brand">Apartment Registry</p>
                        <h3 className="mt-1 text-2xl font-black uppercase tracking-tight text-content leading-none">{title}</h3>
                    </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-xl bg-background border border-slate-200 dark:border-white/10 text-content flex items-center justify-center hover:border-brand hover:text-brand transition-all">
                    <Plus size={20} className="rotate-45" />
                </button>
            </div>
            {children}
        </div>
    </div>
);

export default AdminApartmentWash;

