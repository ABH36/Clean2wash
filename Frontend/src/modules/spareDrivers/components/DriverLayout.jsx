import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Wallet, User, LogOut, Bell } from 'lucide-react';
import LocationIndicator from '../../../components/Location/LocationIndicator';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { socketService } from '../../../utils/socket';

const DriverLayout = ({ children, title = 'Dashboard' }) => {
    const navigate = useNavigate();

    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        const token = localStorage.getItem('chauffeur_token');
        if (!token) {
            setUnreadCount(0);
            return;
        }

        socketService.connect(token);

        // 1. Initial Fetch
        spareDriverAPI.getNotifications({ isRead: false, limit: 1 })
            .then(res => setUnreadCount(res.data.unreadCount || 0))
            .catch(() => { });

        // 2. Real-time Listen
        const socket = socketService.getSocket();
        const syncUnreadCount = (event) => {
            const nextCount = Number(event.detail?.count);
            if (!Number.isNaN(nextCount)) {
                setUnreadCount(nextCount);
            }
        };

        if (socket) {
            socket.on('new_spare_driver_notification', () => {
                setUnreadCount(prev => prev + 1);
            });
        }

        window.addEventListener('spare-driver-unread-sync', syncUnreadCount);
        return () => {
            if (socket) socket.off('new_spare_driver_notification');
            window.removeEventListener('spare-driver-unread-sync', syncUnreadCount);
        };
    }, []);

    const navItems = [
        { icon: LayoutDashboard, label: 'Home', path: '/spare-driver/dashboard' },
        { icon: Calendar, label: 'Bookings', path: '/spare-driver/bookings' },
        { icon: Wallet, label: 'Earnings', path: '/spare-driver/earnings' },
        { icon: User, label: 'Profile', path: '/spare-driver/profile' },
    ];

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#FFF9EF_0%,#FFFFFF_18%,#FFFFFF_100%)] flex flex-col font-sans pb-24" style={{ maxWidth: 430, margin: '0 auto' }}>

            {/* ── Header ── */}
            <header className="px-5 pt-8 pb-4 bg-white/90 backdrop-blur-2xl border-b border-black/[0.04] shadow-[0_12px_30px_rgba(15,23,42,0.05)] flex items-center justify-between sticky top-0 z-[60] relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_right,rgba(242,159,5,0.14),transparent_58%)] pointer-events-none" />
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="text-[9px] font-black text-[#F29F05] uppercase tracking-[0.25em] block mb-0.5">Chauffeur</span>
                        <h1 className="text-sm font-black text-black uppercase tracking-tight leading-none">{title}</h1>
                    </div>
                    <div className="w-[1px] h-4 bg-gray-100" />
                    <LocationIndicator variant="minimal" />
                </div>
                <div className="flex items-center gap-4">
                    <NavLink to="/spare-driver/notifications" className="relative p-2.5 rounded-2xl bg-white border border-black/[0.04] shadow-[0_10px_24px_rgba(15,23,42,0.06)] text-black/40 hover:text-black transition-colors">
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </NavLink>
                    <button
                        onClick={() => {
                            spareDriverAPI.clearToken();
                            socketService.disconnect();
                            navigate('/spare-driver/register');
                        }}
                        className="p-2.5 rounded-2xl bg-white border border-black/[0.04] shadow-[0_10px_24px_rgba(15,23,42,0.06)] text-black/30 hover:text-red-500 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* ── Content ── */}
            <main className="flex-1">{children}</main>

            {/* ── Bottom Nav ── */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/92 backdrop-blur-2xl border border-black/[0.04] h-[74px] flex items-center justify-around z-50 rounded-t-[1.75rem] shadow-[0_-18px_40px_rgba(15,23,42,0.08)]"
                style={{ maxWidth: 430, margin: '0 auto', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
                {navItems.map(({ icon: Icon, label, path }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 w-16 transition-all ${isActive ? 'text-black' : 'text-black/25'}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${isActive ? 'bg-[#F29F05] shadow-[0_14px_30px_rgba(242,159,5,0.28)]' : 'bg-transparent'}`}>
                                    <Icon size={17} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-black' : ''} />
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default DriverLayout;
