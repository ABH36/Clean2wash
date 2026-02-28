import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState(() => {
        try {
            const saved = localStorage.getItem('carwash_wishlist');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('carwash_wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    const toggleWishlist = useCallback((product) => {
        setWishlistItems(prev => {
            const isExist = prev.some(item => item.id === product.id);
            if (isExist) {
                return prev.filter(item => item.id !== product.id);
            }
            return [...prev, product];
        });
    }, []);

    const removeFromWishlist = useCallback((productId) => {
        setWishlistItems(prev => prev.filter(item => item.id !== productId));
    }, []);

    const isInWishlist = useCallback((productId) => {
        return wishlistItems.some(item => item.id === productId);
    }, [wishlistItems]);

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            toggleWishlist,
            removeFromWishlist,
            isInWishlist,
            wishlistCount: wishlistItems.length
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
    return ctx;
};
