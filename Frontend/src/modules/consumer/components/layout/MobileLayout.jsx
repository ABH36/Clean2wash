import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Gift, User } from 'lucide-react';

const NAV_ITEMS = [
    { id: 'home', to: '/', icon: Home, label: 'Home' },
    { id: 'refer', to: '/refer', icon: Gift, label: 'Referral' },
    { id: 'profile', to: '/profile', icon: User, label: 'Profile' }
];

const MobileLayout = ({ children, hideNav = false }) => {
    return (
        <div className="mobile-container bg-[#FAFAFA]">
            <main className="flex-1 pb-10">
                {children}
            </main>

            {!hideNav && (
                <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-8 py-1.5 pb-4 flex items-center justify-between z-[100]">
                    {NAV_ITEMS.map((tab) => (
                        <NavLink
                            key={tab.id}
                            to={tab.to}
                            end={tab.to === '/'}
                            className={({ isActive }) => `flex flex-col items-center gap-1 relative ${isActive ? 'text-brand' : 'text-content-subtle'}`}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-brand text-white shadow-lg shadow-brand/20 scale-105' : 'text-content-subtle'}`}>
                                        <tab.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                    <span className={`text-[8px] font-[900] uppercase tracking-wider ${isActive ? 'text-brand' : 'text-content-subtle'}`}>
                                        {tab.label}
                                    </span>
                                    {tab.id === 'refer' && !isActive && (
                                        <div className="absolute -top-1 -right-4 bg-purple-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-lg shadow-purple-500/20 whitespace-nowrap">
                                            Free Petrol
                                        </div>
                                    )}
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
