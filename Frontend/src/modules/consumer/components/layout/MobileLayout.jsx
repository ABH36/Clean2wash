import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, MapPin, User, Bell } from 'lucide-react';

const NAV_ITEMS = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/services', icon: ClipboardList, label: 'Wash' },
    { to: '/map', icon: MapPin, label: 'Track' },
    { to: '/bookings', icon: Bell, label: 'Bookings' },
    { to: '/profile', icon: User, label: 'Profile' },
];

const MobileLayout = ({ children, hideNav = false }) => {
    return (
        <div className="mobile-container bg-background">
            <main className="flex-1">
                {children}
            </main>

            {!hideNav && (
                <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 px-4 pt-2.5 pb-5 flex justify-between items-end safe-area-bottom z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                    {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} end={to === '/'}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'text-brand' : 'text-content-subtle'}`
                            }>
                            {({ isActive }) => (
                                <>
                                    <div className={`relative p-2 rounded-xl transition-all ${isActive ? 'bg-brand/10' : ''}`}>
                                        <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                                        {isActive && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand rounded-full border-2 border-white" />
                                        )}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${isActive ? 'text-brand' : 'text-content-subtle'}`}>
                                        {label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            )}
        </div>
    );
};

export default MobileLayout;
