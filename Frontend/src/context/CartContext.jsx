import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = localStorage.getItem('clean2wash_cart');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('clean2wash_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = useCallback((product, qty = 1) => {
        if (!product) return;
        const pId = product._id || product.id;

        setCartItems(prev => {
            const existing = prev.find(i => (i._id || i.id) === pId);
            if (existing) {
                return prev.map(i => (i._id || i.id) === pId ? { ...i, qty: i.qty + qty } : i);
            }
            return [...prev, { ...product, qty }];
        });
    }, []);

    const removeFromCart = useCallback((productId) => {
        setCartItems(prev => prev.filter(i => (i._id || i.id) !== productId));
    }, []);

    const updateQty = useCallback((productId, qty) => {
        if (qty <= 0) {
            setCartItems(prev => prev.filter(i => (i._id || i.id) !== productId));
        } else {
            setCartItems(prev => prev.map(i => (i._id || i.id) === productId ? { ...i, qty } : i));
        }
    }, []);

    const clearCart = useCallback(() => setCartItems([]), []);

    const isInCart = useCallback((productId) => {
        return cartItems.some(i => (i._id || i.id) === productId);
    }, [cartItems]);

    const { isBlackPassMember } = useAuth();

    const cartCount = cartItems.reduce((a, i) => a + i.qty, 0);
    const cartTotal = cartItems.reduce((a, i) => a + i.salePrice * i.qty, 0);
    
    const discountedTotal = isBlackPassMember 
        ? cartItems.reduce((a, i) => {
            const itemPrice = i.salePrice || i.price || 0;
            // Only discount services, or everything? Let's assume everything for "Black" pass unless it's the pass itself
            const isSubscription = i.type === 'subscription';
            return a + (isSubscription ? itemPrice : itemPrice * 0.7) * i.qty;
          }, 0)
        : cartTotal;

    return (
        <CartContext.Provider value={{
            cartItems,
            setCartItems,
            addToCart,
            removeFromCart,
            updateQty,
            clearCart,
            isInCart,
            cartCount,
            cartTotal,
            discountedTotal
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
