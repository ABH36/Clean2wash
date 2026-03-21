import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Wallet, User, LogOut, Bell, MapPin } from 'lucide-react';
import LocationIndicator from '../../../components/Location/LocationIndicator';
import { spareDriverAPI } from '../../../utils/spareDriverApi';
import { socketService } from '../../../utils/socket';

const DriverLayout = ({ children, title = 'Dashboard' }) => {
    const navigate = useNavigate();

    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        // 1. Initial Fetch
        spareDriverAPI.getNotifications({ isRead: false, limit: 1 })
            .then(res => setUnreadCount(res.data.unreadCount || 0))
            .catch(() => { });

        // 2. Real-time Listen
        const socket = socketService.getSocket();
        if (socket) {
            socket.on('new_spare_driver_notification', () => {
                setUnreadCount(prev => prev + 1);
            });
        }
        return () => {
            if (socket) socket.off('new_spare_driver_notification');
        };
    }, []);

    const navItems = [
        { icon: LayoutDashboard, label: 'Home', path: '/spare-driver/dashboard' },
        { icon: Calendar, label: 'Bookings', path: '/spare-driver/bookings' },
        { icon: Wallet, label: 'Earnings', path: '/spare-driver/earnings' },
        { icon: User, label: 'Profile', path: '/spare-driver/profile' },
    ];

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans pb-20" style={{ maxWidth: 430, margin: '0 auto' }}>

            {/* ── Header ── */}
            <header className="px-5 pt-8 pb-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-[60]">
                <div className="flex items-center gap-3">
                    <div>
                        <span className="text-[9px] font-black text-[#F29F05] uppercase tracking-[0.25em] block mb-0.5">Chauffeur</span>
                        <h1 className="text-sm font-black text-black uppercase tracking-tight leading-none">{title}</h1>
                    </div>
                    <div className="w-[1px] h-4 bg-gray-100" />
                    <LocationIndicator variant="minimal" />
                </div>
                <div className="flex items-center gap-4">
                    <NavLink to="/spare-driver/notifications" className="relative p-2 text-black/40 hover:text-black transition-colors">
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </NavLink>
                    <button
                        onClick={() => { localStorage.removeItem('chauffeur_token'); navigate('/spare-driver/register'); }}
                        className="p-2 text-black/30 hover:text-red-500 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* ── Content ── */}
            <main className="flex-1">{children}</main>

            {/* ── Bottom Nav ── */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-16 flex items-center justify-around z-50"
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
                                <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isActive ? 'bg-[#F29F05]' : 'bg-transparent'}`}>
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
