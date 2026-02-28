import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Heart, ShoppingCart, User, Gift, Zap, Truck, ShoppingBag } from 'lucide-react';
import { useCart } from '../../../../context/CartContext';

const SHOP_NAV_ITEMS = [
    { id: 'shop', to: '/e-shop', icon: Home, label: 'Shop' },
    { id: 'wishlist', to: '/e-shop', icon: Heart, label: 'Wishlist' },
    { id: 'cart', to: '/cart', icon: ShoppingCart, label: 'Cart' },
    { id: 'account', to: '/profile', icon: User, label: 'Account' }
];

const MAIN_NAV_ITEMS = [
    { id: 'home', to: '/', icon: Home, label: 'Home' },
    { id: 'instant', to: '/instant-wash', icon: Zap, label: 'Instant' },
    { id: 'pickup', to: '/full-wash-booking', icon: Truck, label: 'Pickup' },
    { id: 'products', to: '/e-shop', icon: ShoppingBag, label: 'Products' },
    { id: 'profile', to: '/profile', icon: User, label: 'Profile' }
];

const MobileLayout = ({ children, hideNav = false }) => {
    const { cartCount } = useCart();
    const location = useLocation();

    // Determine if we are in the shop flow
    const isShopFlow = useMemo(() => {
        const path = location.pathname;
        return path.startsWith('/e-shop') || path === '/cart';
    }, [location.pathname]);

    const items = isShopFlow ? SHOP_NAV_ITEMS : MAIN_NAV_ITEMS;

    return (
        <div className="mobile-container bg-[#FAFAFA]">
            <main className="flex-1 pb-10">
                {children}
            </main>

            {!hideNav && (
                <nav className={`fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t px-4 py-3 pb-4 flex items-center justify-between z-[100] transition-colors duration-300 ${isShopFlow ? 'bg-white/95 border-gray-100' : 'bg-[#FFF5EE] border-[#FFE4D1]'
                    }`}>
                    {items.map((tab) => (
                        <NavLink
                            key={tab.id}
                            to={tab.to}
                            end={tab.to === '/'}
                            className={({ isActive }) => `flex flex-col items-center gap-1.5 relative transition-all active:scale-95 ${isActive ? 'text-brand' : (isShopFlow ? 'text-[#A0A0A0]' : 'text-[#8E7E74]')
                                }`}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="relative">
                                        <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />

                                        {/* Shop: Cart Badge */}
                                        {isShopFlow && tab.id === 'cart' && cartCount > 0 && (
                                            <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-brand text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                                {cartCount}
                                            </span>
                                        )}

                                    </div>
                                    <span className={`text-[9px] font-[1000] uppercase tracking-widest ${isActive ? 'text-brand' : (isShopFlow ? 'text-[#A0A0A0]' : 'text-[#8E7E74]')
                                        }`}>
                                        {tab.label}
                                    </span>
                                    {isShopFlow && isActive && (
                                        <motion.div layoutId="nav-dot-global" className="absolute -bottom-2 w-1 h-1 bg-brand rounded-full" />
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
