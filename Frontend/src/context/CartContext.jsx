import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export const SHOP_PRODUCTS = [
    {
        id: 'PROD-01',
        name: 'CarWash 2-in-1 Wireless Adapter',
        category: 'Electronics',
        description: 'Plug & play CarPlay and Android Auto adapter. No wires, works with all OEM head units.',
        price: 4999,
        salePrice: 3499,
        rating: 4.8,
        reviews: 1243,
        badge: 'Bestseller',
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&q=80',
        inStock: true,
    },
    {
        id: 'PROD-02',
        name: 'CarWash 3D Carbon Fiber Tape',
        category: 'Accessories',
        description: 'Anti-scratch, weatherproof 3D carbon fiber protection tape. 1.5m roll.',
        price: 899,
        salePrice: 599,
        rating: 4.5,
        reviews: 876,
        badge: '-33%',
        image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&q=80',
        inStock: true,
    },
    {
        id: 'PROD-03',
        name: 'CarWash All-in-One Wet & Dry Vacuum',
        category: 'Cleaning',
        description: '10L capacity, 1200W motor, HEPA filter. Perfect for deep interior cleaning.',
        price: 7999,
        salePrice: 5499,
        rating: 4.9,
        reviews: 2104,
        badge: 'Top Rated',
        image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500&q=80',
        inStock: true,
    },
    {
        id: 'PROD-04',
        name: 'Premium Car Wash Kit',
        category: 'Cleaning',
        description: 'Complete 8-piece cleaning kit: foam cannon, microfiber towels, soap, wax & more.',
        price: 2499,
        salePrice: 1999,
        rating: 4.7,
        reviews: 654,
        badge: 'Save ₹500',
        image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=500&q=80',
        inStock: true,
    },
    {
        id: 'PROD-05',
        name: 'CarWash Smart GPS Tracker',
        category: 'Electronics',
        description: 'Real-time GPS tracking, geofencing & anti-theft alerts. 30-day battery.',
        price: 3999,
        salePrice: 2499,
        rating: 4.6,
        reviews: 432,
        badge: 'New',
        image: 'https://images.unsplash.com/photo-1580672154843-44f2221d41b1?w=500&q=80',
        inStock: false,
    },
    {
        id: 'PROD-06',
        name: 'Microfiber Detailing Towels (10 pack)',
        category: 'Cleaning',
        description: '800 GSM ultra-soft, lint-free towels. Safe on all finishes including ceramic coated.',
        price: 999,
        salePrice: 699,
        rating: 4.4,
        reviews: 3201,
        badge: '-30%',
        image: 'https://images.unsplash.com/photo-1558618042-fc7e8d1e10d8?w=500&q=80',
        inStock: true,
    },
    {
        id: 'PROD-07',
        name: 'CarWash Dash Cam Pro 4K',
        category: 'Electronics',
        description: '4K UHD front & rear dashcam, night vision, 140° wide angle, loop recording.',
        price: 6999,
        salePrice: 4999,
        rating: 4.7,
        reviews: 891,
        badge: '-28%',
        image: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=500&q=80',
        inStock: true,
    },
    {
        id: 'PROD-08',
        name: 'CarWash Seat Cover Set',
        category: 'Accessories',
        description: 'Universal fit, premium PU leather, full 5-seat cover set with headrest covers.',
        price: 3499,
        salePrice: 2799,
        rating: 4.3,
        reviews: 567,
        badge: 'Popular',
        image: 'https://images.unsplash.com/photo-1547244730-de8d0958b4e0?w=500&q=80',
        inStock: true,
    },
    {
        id: 'PROD-09',
        name: 'Niche Oud Car Perfume (Limited Edition)',
        category: 'Accessories',
        description: 'Handcrafted luxury oud fragrance for your cabin. Long-lasting, alcohol-free formula.',
        price: 3499,
        salePrice: 2499,
        rating: 5.0,
        reviews: 312,
        badge: 'Exclusive',
        image: 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?w=500&q=80',
        inStock: true,
    },
    {
        id: 'PROD-10',
        name: 'Hygiene Guard Interior Antimicrobial Kit',
        category: 'Cleaning',
        description: '99.9% protection against bacteria and viruses. Medical grade surface disinfectant for car interiors.',
        price: 1499,
        salePrice: 999,
        rating: 4.8,
        reviews: 876,
        badge: 'Bestseller',
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&q=80',
        inStock: true,
    },
    {
        id: 'PROD-11',
        name: 'Traveler Fleet Hygiene Hub (Bulk Pack)',
        category: 'Cleaning',
        description: 'Specialized bulk kit for traveler/bus fleets. Industrial strength cleaning agents.',
        price: 12999,
        salePrice: 8999,
        rating: 4.9,
        reviews: 45,
        badge: 'Fleet Only',
        image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&q=80',
        inStock: true,
    },
];

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = localStorage.getItem('carwash_cart');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('carwash_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = useCallback((product, qty = 1) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
            }
            return [...prev, { ...product, qty }];
        });
    }, []);

    const removeFromCart = useCallback((productId) => {
        setCartItems(prev => prev.filter(i => i.id !== productId));
    }, []);

    const updateQty = useCallback((productId, qty) => {
        if (qty <= 0) {
            setCartItems(prev => prev.filter(i => i.id !== productId));
        } else {
            setCartItems(prev => prev.map(i => i.id === productId ? { ...i, qty } : i));
        }
    }, []);

    const clearCart = useCallback(() => setCartItems([]), []);

    const isInCart = useCallback((productId) => cartItems.some(i => i.id === productId), [cartItems]);

    const cartCount = cartItems.reduce((a, i) => a + i.qty, 0);
    const cartTotal = cartItems.reduce((a, i) => a + i.salePrice * i.qty, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQty,
            clearCart,
            isInCart,
            cartCount,
            cartTotal,
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used inside CartProvider');
    return ctx;
};
