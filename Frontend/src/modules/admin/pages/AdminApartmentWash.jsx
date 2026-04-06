import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    Building2,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    Crown,
    Edit2,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    Trash2,
    Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../utils/adminApi';

const APARTMENT_SERVICE_KEY = 'APARTMENT_WASH';

const SECTION_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'apartments', label: 'Apartment Registry' },
    { id: 'captains', label: 'Captain Mapping' },
    { id: 'plans', label: 'Plan Desk' },
    { id: 'subscriptions', label: 'Live Subscriptions' },
    { id: 'liveops', label: 'Live Ops' },
    { id: 'service', label: 'Service Control' }
];

const STATUS_STYLES = {
    active: 'bg-emerald-50 text-emerald-700',
    paused: 'bg-yellow-50 text-yellow-700',
    completed: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-yellow-50 text-yellow-700',
    accepted: 'bg-blue-50 text-blue-700',
    confirmed: 'bg-blue-50 text-blue-700',
    assigned: 'bg-blue-50 text-blue-700',
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
    const [activeSection, setActiveSection] = useState('overview');
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
        setReviewingSubscriptionId(subscription._id);
        try {
            const response = await adminAPI.reviewApartmentSubscription(subscription._id, action);
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
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-content-subtle">Loading Apartment Ops</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8 pb-16">
                <section className="rounded-[2.5rem] border border-gray-100 bg-white p-6 sm:p-8 shadow-soft">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                                    <Building2 size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand/70">Apartment Wash Ops</p>
                                    <h1 className="text-2xl font-black uppercase tracking-tight text-content">Single Control Desk</h1>
                                </div>
                            </div>
                            <p className="max-w-3xl text-sm font-bold leading-6 text-content-subtle">
                                Apartment wash ke liye service control, society registry, captain mapping, subscriptions,
                                aur live monitoring ab isi ek desk ke andar managed honge.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => fetchConsole({ silent: true })}
                                className="inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-content transition-all hover:border-brand hover:text-brand"
                            >
                                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                                Refresh Ops
                            </button>
                            <button
                                onClick={openCreateHub}
                                className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand"
                            >
                                <Plus size={14} />
                                Add Apartment
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2 rounded-[1.5rem] bg-gray-50 p-2">
                        {SECTION_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id)}
                                className={`rounded-[1.1rem] px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                    activeSection === tab.id ? 'bg-white text-brand shadow-sm' : 'text-content-subtle hover:bg-white hover:text-content'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </section>

                {activeSection === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard icon={<Building2 size={18} />} label="Societies" value={stats.societies || 0} />
                            <StatCard icon={<Users size={18} />} label="Mapped Captains" value={stats.mappedCaptains || 0} />
                            <StatCard icon={<AlertTriangle size={18} />} label="Pending Approvals" value={stats.pendingApprovals || 0} />
                            <StatCard icon={<CalendarClock size={18} />} label="Today Jobs" value={stats.todayBookings || 0} />
                        </div>

                        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                            <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-soft">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand/70">Risk Monitor</p>
                                <h2 className="mt-1 text-lg font-black uppercase tracking-tight text-content">Capacity Risk Apartments</h2>
                                    </div>
                                    <div className="rounded-2xl bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-600">
                                        {stats.capacityRiskHubs || 0} flagged
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {riskHubs.length ? riskHubs.map((hub) => (
                                        <div key={hub._id} className="rounded-[1.5rem] border border-red-100 bg-red-50/60 p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-black uppercase tracking-tight text-content">{hub.name}</p>
                                                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-content-subtle">
                                                        {hub.city} • {hub.liveSubscriptionsCount} active cars • {hub.liveBookingsCount} live jobs
                                                    </p>
                                                </div>
                                                <div className="rounded-2xl bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-600">
                                                    Gap {hub.captainGap}
                                                </div>
                                            </div>
                                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                                <MiniMetric label="Mapped" value={hub.mappedCaptainCount || 0} />
                                                <MiniMetric label="Recommended" value={hub.recommendedCaptains || 1} />
                                                <MiniMetric label="Slot Cap" value={`${(hub.recommendedCaptains || 1) * 10} cars`} />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5 text-sm font-bold text-emerald-700">
                                            Abhi kisi apartment me captain capacity gap detect nahi ho raha.
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-soft">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand/70">Service Snapshot</p>
                                <h2 className="mt-1 text-lg font-black uppercase tracking-tight text-content">Apartment Service Contract</h2>
                                <div className="mt-5 space-y-4">
                                    <InfoRow label="Service" value={service?.title || 'Apartment Wash'} />
                                    <InfoRow label="Base Price" value={formatCurrency(service?.price)} />
                                    <InfoRow label="Estimated Time" value={`${service?.estimatedTime || 0} min`} />
                                    <InfoRow label="Badge" value={service?.metadata?.badge || 'Recurring'} />
                                    <InfoRow label="Status" value={service?.isActive ? 'Live' : 'Hidden'} />
                                </div>
                            </section>
                        </div>

                        <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-soft">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand/70">Approval Queue</p>
                                    <h2 className="mt-1 text-lg font-black uppercase tracking-tight text-content">Pending User Requests</h2>
                                </div>
                                <div className="rounded-2xl bg-yellow-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-700">
                                    {pendingSubscriptions.length} pending
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                {pendingSubscriptions.length ? pendingSubscriptions.slice(0, 4).map((subscription) => {
                                    const hub = hubs.find((item) => String(item._id) === String(subscription.hub?._id || subscription.hub));
                                    const canApprove = (hub?.mappedCaptainCount || 0) > 0;
                                    const isReviewing = reviewingSubscriptionId === subscription._id;
                                    return (
                                        <div key={subscription._id} className="rounded-[1.5rem] border border-yellow-100 bg-yellow-50/50 p-4">
                                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                                <div>
                                                    <p className="text-sm font-black uppercase tracking-tight text-content">{subscription.user?.name || 'Subscriber'}</p>
                                                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-content-subtle">
                                                        {subscription.hub?.name || 'Apartment pending'} • {subscription.slot || 'slot pending'} • {getRouteLabel(subscription)}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => handleSubscriptionReview(subscription, 'approve')}
                                                        disabled={!canApprove || isReviewing}
                                                        className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand disabled:opacity-40"
                                                    >
                                                        {isReviewing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleSubscriptionReview(subscription, 'reject')}
                                                        disabled={isReviewing}
                                                        className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-content transition-all hover:border-red-200 hover:text-red-600 disabled:opacity-40"
                                                    >
                                                        <Trash2 size={14} />
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                                <MiniMetric label="Plan" value={subscription.plan || 'Plan pending'} />
                                                <MiniMetric label="Mapped Captains" value={hub?.mappedCaptainCount || 0} />
                                                <MiniMetric label="Verification" value={canApprove ? 'Captain-ready' : 'Map captain first'} />
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5 text-sm font-bold text-emerald-700">
                                        Abhi koi apartment subscription request admin verification ke liye pending nahi hai.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {activeSection === 'apartments' && (
                    <div className="space-y-6">
                        <SectionToolbar
                            title="Apartment Registry"
                            description="Society setup, parking hierarchy, captain need aur live apartment load ek hi desk me."
                            searchValue={hubSearch}
                            onSearchChange={setHubSearch}
                            searchPlaceholder="Search apartment, city, manager..."
                            actionLabel="New Apartment"
                            onAction={openCreateHub}
                        />

                        <div className="grid gap-5 xl:grid-cols-2">
                            {filteredHubs.map((hub) => (
                                <article key={hub._id} className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-soft">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-lg font-black uppercase tracking-tight text-content">{hub.name}</p>
                                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-content-subtle">
                                                {hub.city} • {hub.manager || 'Ops lead pending'}
                                            </p>
                                            {hub.metadata?.pendingApproval && (
                                                <p className="mt-2 inline-flex rounded-2xl bg-yellow-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-700">
                                                    Consumer-requested apartment
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditHub(hub)} className="rounded-2xl border border-gray-100 px-3 py-2 text-content-subtle transition-all hover:border-brand hover:text-brand">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteHub(hub)} className="rounded-2xl border border-gray-100 px-3 py-2 text-content-subtle transition-all hover:border-red-200 hover:text-red-600">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                        <MiniMetric label="Mapped Captains" value={hub.mappedCaptainCount || 0} />
                                        <MiniMetric label="Active Subs" value={hub.liveSubscriptionsCount || 0} />
                                        <MiniMetric label="Live Jobs" value={hub.liveBookingsCount || 0} />
                                    </div>

                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        <InfoPill label="Blocks" value={(hub.metadata?.blocks || []).join(', ') || 'Not mapped'} />
                                        <InfoPill label="Parking Levels" value={(hub.metadata?.parkingLevels || []).join(', ') || 'Not mapped'} />
                                        <InfoPill label="Pillar Range" value={`${hub.metadata?.pillarRange?.min || 1}-${hub.metadata?.pillarRange?.max || 100}`} />
                                        <InfoPill label="Captain Need" value={`${hub.recommendedCaptains || 1} recommended`} />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'captains' && (
                    <div className="space-y-6">
                        <SectionToolbar
                            title="Apartment Captain Mapping"
                            description="Yahin se apartment-specific captain pool map karo. Same apartment ke andar multiple captains assign kiye ja sakte hain."
                            searchValue={captainSearch}
                            onSearchChange={setCaptainSearch}
                            searchPlaceholder="Search captain, phone, mapped apartment..."
                        />

                        <div className="grid gap-5 xl:grid-cols-2">
                            {filteredCaptains.map((captain) => {
                                const draftHub = mappingDrafts[captain._id] ?? '';
                                const isSaving = mappingSavingId === captain._id;
                                return (
                                    <article key={captain._id} className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-soft">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-lg font-black uppercase tracking-tight text-content">{captain.name || 'Captain'}</p>
                                                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-content-subtle">
                                                    {captain.phone} • {captain.profile?.city || 'City pending'}
                                                </p>
                                            </div>
                                            <div className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${captain.isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                                {captain.isVerified ? 'Verified' : 'Review Needed'}
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                            <MiniMetric label="Online" value={captain.isOnline ? 'Yes' : 'No'} />
                                            <MiniMetric label="Rating" value={Number(captain.rating || 0).toFixed(1)} />
                                            <MiniMetric label="Mapped Hub" value={captain.mappedHub || 'Unmapped'} />
                                        </div>

                                        <div className="mt-5 rounded-[1.5rem] bg-gray-50 p-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">Assign Apartment</label>
                                            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                                                <select
                                                    value={draftHub}
                                                    onChange={(event) => setMappingDrafts((current) => ({ ...current, [captain._id]: event.target.value }))}
                                                    className="h-12 flex-1 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-content outline-none focus:border-brand"
                                                >
                                                    <option value="">Unmapped</option>
                                                    {hubs.map((hub) => (
                                                        <option key={hub._id} value={hub.name}>{hub.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => handleCaptainMapSave(captain)}
                                                    disabled={isSaving}
                                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand disabled:opacity-60"
                                                >
                                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                    Save Mapping
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeSection === 'plans' && (
                    <div className="space-y-6">
                        <SectionToolbar
                            title="Apartment Plan Desk"
                            description="Apartment wash subscription plans yahin se create, update aur hide karo."
                            actionLabel="New Plan"
                            onAction={openCreatePlan}
                        />

                        <div className="grid gap-5 xl:grid-cols-3">
                            {plans.map((plan) => (
                                <article key={plan._id} className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-soft">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-lg font-black uppercase tracking-tight text-content">{plan.name}</p>
                                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-content-subtle">{plan.interval} • {plan.credits} washes</p>
                                        </div>
                                        <div className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${plan.status === 'Live' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {plan.status}
                                        </div>
                                    </div>

                                    <div className="mt-4 text-3xl font-black tracking-tight text-content">{formatCurrency(plan.price)}</div>

                                    <div className="mt-4 space-y-2">
                                        {(plan.features || []).slice(0, 4).map((feature) => (
                                            <div key={feature} className="flex items-center gap-2 text-sm font-bold text-content-subtle">
                                                <CheckCircle2 size={14} className="text-brand" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                        <MiniMetric label="Credits" value={plan.credits || 0} />
                                        <MiniMetric label="Vehicles" value={plan.maxVehicles || 1} />
                                        <MiniMetric label="Rollover" value={plan.rollover || 0} />
                                    </div>

                                    <div className="mt-5 flex gap-2">
                                        <button onClick={() => openEditPlan(plan)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-100 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-content transition-all hover:border-brand hover:text-brand">
                                            <Edit2 size={14} />
                                            Edit
                                        </button>
                                        <button onClick={() => handleDeletePlan(plan)} className="inline-flex items-center justify-center rounded-2xl border border-gray-100 px-4 py-3 text-content-subtle transition-all hover:border-red-200 hover:text-red-600">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'subscriptions' && (
                    <div className="space-y-6">
                        <SectionToolbar
                            title="Live Subscription Base"
                            description="Kaunse apartment me kitne active plans chal rahe hain, kis slot me hain, aur kis gaadi par valid hain."
                        />

                        <div className="space-y-4">
                            {subscriptions.map((subscription) => (
                                <article key={subscription._id} className={`rounded-[1.75rem] border bg-white p-5 shadow-soft ${subscription.status === 'pending' ? 'border-yellow-200' : 'border-gray-100'}`}>
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <p className="text-base font-black uppercase tracking-tight text-content">{subscription.user?.name || 'Subscriber'}</p>
                                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-content-subtle">
                                                {subscription.user?.phone || 'Phone pending'} • {subscription.hub?.name || 'Apartment pending'}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${getBadgeClass(subscription.status)}`}>
                                                {subscription.status}
                                            </span>
                                            <span className="rounded-2xl bg-gray-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">
                                                {subscription.slot || 'slot pending'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        <InfoPill label="Plan" value={subscription.plan || 'Plan pending'} />
                                        <InfoPill label="Vehicle" value={getVehicleLabel(subscription)} />
                                        <InfoPill label="Parking" value={getRouteLabel(subscription)} />
                                        <InfoPill label="Valid Till" value={formatDate(subscription.endDate)} />
                                    </div>

                                    {subscription.status === 'pending' && (() => {
                                        const hub = hubs.find((item) => String(item._id) === String(subscription.hub?._id || subscription.hub));
                                        const canApprove = (hub?.mappedCaptainCount || 0) > 0;
                                        const isReviewing = reviewingSubscriptionId === subscription._id;
                                        return (
                                            <div className="mt-4 flex flex-col gap-3 rounded-[1.5rem] border border-yellow-100 bg-yellow-50/60 p-4 lg:flex-row lg:items-center lg:justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-700">Admin Verification Pending</p>
                                                    <p className="mt-1 text-sm font-bold text-content">
                                                        Captain assign karke approve karo. Approval ke baad hi daily wash jobs generate hongi.
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => handleSubscriptionReview(subscription, 'approve')}
                                                        disabled={!canApprove || isReviewing}
                                                        className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand disabled:opacity-40"
                                                    >
                                                        {isReviewing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                        Approve Request
                                                    </button>
                                                    <button
                                                        onClick={() => handleSubscriptionReview(subscription, 'reject')}
                                                        disabled={isReviewing}
                                                        className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-content transition-all hover:border-red-200 hover:text-red-600 disabled:opacity-40"
                                                    >
                                                        <Trash2 size={14} />
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </article>
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'liveops' && (
                    <div className="space-y-6">
                        <SectionToolbar
                            title="Apartment Live Ops"
                            description="Daily apartment jobs, assigned captains, slot pressure aur parking-route visibility yahin se monitor karo."
                            searchValue={liveSearch}
                            onSearchChange={setLiveSearch}
                            searchPlaceholder="Search user, captain, apartment, vehicle..."
                        />

                        <div className="space-y-4">
                            {filteredLiveBookings.map((booking) => (
                                <article key={booking._id} className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-soft">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                        <div>
                                            <p className="text-base font-black uppercase tracking-tight text-content">
                                                {booking.consumer?.name || 'Customer'} • {getVehicleLabel(booking)}
                                            </p>
                                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-content-subtle">
                                                {booking.location?.hubId?.name || 'Apartment pending'} • {formatDate(booking.schedule?.date)}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${getBadgeClass(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                            <span className="rounded-2xl bg-gray-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">
                                                {booking.schedule?.slot || 'slot pending'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        <InfoPill label="Captain" value={booking.provider?.id?.name || 'Unassigned'} />
                                        <InfoPill label="Parking Route" value={getRouteLabel(booking)} />
                                        <InfoPill label="Address" value={booking.location?.address?.street || booking.location?.address?.formattedAddress || 'Location pending'} />
                                        <InfoPill label="Fare" value={formatCurrency(booking.pricing?.totalAmount || booking.price || 0)} />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                )}

                {activeSection === 'service' && (
                    <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-soft">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand/70">Service Control</p>
                                <h2 className="mt-1 text-lg font-black uppercase tracking-tight text-content">Apartment Wash Contract</h2>
                            </div>
                            <div className={`rounded-2xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${serviceForm.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                {serviceForm.isActive ? 'Live' : 'Hidden'}
                            </div>
                        </div>

                        <form className="mt-6 space-y-6" onSubmit={handleServiceSave}>
                            <div className="grid gap-4 xl:grid-cols-2">
                                <TextField label="Service Title" value={serviceForm.title} onChange={(value) => setServiceForm((current) => ({ ...current, title: value }))} />
                                <TextField label="Badge" value={serviceForm.badge} onChange={(value) => setServiceForm((current) => ({ ...current, badge: value }))} />
                                <TextField label="Base Price" type="number" value={serviceForm.price} onChange={(value) => setServiceForm((current) => ({ ...current, price: value }))} />
                                <TextField label="Estimated Time (min)" type="number" value={serviceForm.estimatedTime} onChange={(value) => setServiceForm((current) => ({ ...current, estimatedTime: value }))} />
                                <TextField label="Sort Order" type="number" value={serviceForm.sortOrder} onChange={(value) => setServiceForm((current) => ({ ...current, sortOrder: value }))} />
                                <label className="block rounded-[1.5rem] border border-gray-200 bg-gray-50 px-4 py-4">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">Visibility</span>
                                    <div className="mt-3 flex items-center gap-3">
                                        <input type="checkbox" checked={serviceForm.isActive} onChange={(event) => setServiceForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand" />
                                        <span className="text-sm font-bold text-content">Keep apartment wash live in consumer catalog</span>
                                    </div>
                                </label>
                            </div>

                            <TextAreaField label="Description" rows={3} value={serviceForm.description} onChange={(value) => setServiceForm((current) => ({ ...current, description: value }))} />

                            <div className="grid gap-4 xl:grid-cols-3">
                                <TextAreaField label="Features" hint="One feature per line" value={serviceForm.featuresText} onChange={(value) => setServiceForm((current) => ({ ...current, featuresText: value }))} />
                                <TextAreaField label="Rules" hint="One SOP rule per line" value={serviceForm.rulesText} onChange={(value) => setServiceForm((current) => ({ ...current, rulesText: value }))} />
                                <TextAreaField label="Slots" hint="Use: id | label | time" value={serviceForm.slotsText} onChange={(value) => setServiceForm((current) => ({ ...current, slotsText: value }))} />
                            </div>

                            <div className="flex justify-end">
                                <button type="submit" disabled={serviceSaving} className="inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand disabled:opacity-60">
                                    {serviceSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Save Service Control
                                </button>
                            </div>
                        </form>
                    </section>
                )}
            </div>
            {hubModalOpen && (
                <ModalShell title={editingHub ? 'Edit Apartment Registry' : 'Create Apartment Registry'} onClose={() => setHubModalOpen(false)}>
                    <form className="space-y-4" onSubmit={handleSaveHub}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextField label="Apartment Name" value={hubForm.name} onChange={(value) => setHubForm((current) => ({ ...current, name: value }))} required />
                            <TextField label="City" value={hubForm.city} onChange={(value) => setHubForm((current) => ({ ...current, city: value }))} required />
                            <TextField label="Manager" value={hubForm.manager} onChange={(value) => setHubForm((current) => ({ ...current, manager: value }))} required />
                            <TextField label="Address" value={hubForm.address} onChange={(value) => setHubForm((current) => ({ ...current, address: value }))} />
                            <SelectField label="Status" value={hubForm.status} options={['Online', 'Offline']} onChange={(value) => setHubForm((current) => ({ ...current, status: value }))} />
                            <SelectField label="Load" value={hubForm.load} options={['Low', 'Moderate', 'High', 'Peak']} onChange={(value) => setHubForm((current) => ({ ...current, load: value }))} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextAreaField label="Blocks" hint="One block per line" value={hubForm.blocksText} onChange={(value) => setHubForm((current) => ({ ...current, blocksText: value }))} />
                            <TextAreaField label="Parking Levels" hint="One level per line" value={hubForm.parkingLevelsText} onChange={(value) => setHubForm((current) => ({ ...current, parkingLevelsText: value }))} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextField label="Pillar Min" type="number" value={hubForm.pillarMin} onChange={(value) => setHubForm((current) => ({ ...current, pillarMin: value }))} />
                            <TextField label="Pillar Max" type="number" value={hubForm.pillarMax} onChange={(value) => setHubForm((current) => ({ ...current, pillarMax: value }))} />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setHubModalOpen(false)} className="rounded-2xl border border-gray-200 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">
                                Cancel
                            </button>
                            <button type="submit" disabled={hubSaving} className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-brand disabled:opacity-60">
                                {hubSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Registry
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
    <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand/70">{title}</p>
                <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-content-subtle">{description}</p>
            </div>

            <div className="flex flex-wrap gap-3">
                {typeof searchValue === 'string' && (
                    <input
                        value={searchValue}
                        onChange={(event) => onSearchChange?.(event.target.value)}
                        placeholder={searchPlaceholder}
                        className="h-12 min-w-[260px] rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-content outline-none focus:border-brand"
                    />
                )}
                {actionLabel && (
                    <button onClick={onAction} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-black px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-brand">
                        <Plus size={14} />
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    </section>
);

const StatCard = ({ icon, label, value }) => (
    <div className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">{icon}</div>
            <ChevronRight size={16} className="text-content-subtle" />
        </div>
        <div className="mt-4 text-3xl font-black tracking-tight text-content">{value}</div>
        <div className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-content-subtle">{label}</div>
    </div>
);

const MiniMetric = ({ label, value }) => (
    <div className="rounded-[1.2rem] bg-gray-50 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-tight text-content">{value}</p>
        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-content-subtle">{label}</p>
    </div>
);

const InfoPill = ({ label, value }) => (
    <div className="rounded-[1.2rem] bg-gray-50 px-4 py-3">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-content-subtle">{label}</p>
        <p className="mt-2 text-sm font-bold leading-5 text-content">{value}</p>
    </div>
);

const InfoRow = ({ label, value }) => (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">{label}</span>
        <span className="text-sm font-bold text-content">{value}</span>
    </div>
);

const TextField = ({ label, value, onChange, required = false, type = 'text' }) => (
    <label className="block rounded-[1.5rem] border border-gray-200 bg-gray-50 px-4 py-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">{label}</span>
        <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-3 w-full bg-transparent text-sm font-bold text-content outline-none" />
    </label>
);

const SelectField = ({ label, value, onChange, options = [] }) => (
    <label className="block rounded-[1.5rem] border border-gray-200 bg-gray-50 px-4 py-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">{label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-3 w-full bg-transparent text-sm font-bold text-content outline-none">
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
    </label>
);

const TextAreaField = ({ label, value, onChange, rows = 6, hint = '' }) => (
    <label className="block rounded-[1.5rem] border border-gray-200 bg-gray-50 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-content-subtle">{label}</span>
            {hint ? <span className="text-[9px] font-black uppercase tracking-[0.18em] text-content-subtle">{hint}</span> : null}
        </div>
        <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="mt-3 w-full resize-none bg-transparent text-sm font-bold leading-6 text-content outline-none" />
    </label>
);

const ModalShell = ({ title, children, onClose }) => (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand/70">Apartment Wash</p>
                    <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-content">{title}</h3>
                </div>
                <button onClick={onClose} className="rounded-2xl border border-gray-100 px-3 py-2 text-content-subtle transition-all hover:border-brand hover:text-brand">
                    Close
                </button>
            </div>
            {children}
        </div>
    </div>
);

export default AdminApartmentWash;
