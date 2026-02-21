import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Briefcase, BarChart2, User } from 'lucide-react';

const NAV = [
    { to: '/captain', icon: Home, label: 'Home' },
    { to: '/captain/job', icon: Briefcase, label: 'Jobs' },
    { to: '/captain/earnings', icon: BarChart2, label: 'Earnings' },
    { to: '/captain/profile', icon: User, label: 'Profile' },
];

const CaptainLayout = ({ children, hideNav = false }) => (
    <div className="mobile-container bg-gray-50">
        <main className="flex-1">{children}</main>
        {!hideNav && (
            <nav className="fixed bottom-0 w-full max-w-md bg-content border-t border-white/5 px-4 pt-2.5 pb-5 flex justify-between items-end z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
                {NAV.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} end={to === '/captain'}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-brand' : 'text-white/30'}`
                        }>
                        {({ isActive }) => (
                            <>
                                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-brand/15' : ''}`}>
                                    <Icon size={19} strokeWidth={isActive ? 2.5 : 1.5} />
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${isActive ? 'text-brand' : 'text-white/30'}`}>
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

export default CaptainLayout;
