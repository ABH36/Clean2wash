import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, ShoppingBag, Trash2, ArrowLeft,
    ChevronRight, ShoppingCart, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';

const Wishlist = () => {
    const navigate = useNavigate();
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart, isInCart } = useCart();

    const handleMoveToCart = (item) => {
        addToCart(item);
        removeFromWishlist(item.id);
    };

    return (
        <MobileLayout>
            <div className="bg-[#FAFAFA] min-h-screen pb-28">
                {/* ── HEADER ── */}
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-5 py-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
                            <ArrowLeft size={20} className="text-content" />
                        </button>
                        <div>
                            <h1 className="text-base font-[1000] text-content uppercase tracking-tight italic">Wishlist</h1>
                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest leading-none mt-0.5">{wishlistItems.length} Saved Items</p>
                        </div>
                    </div>
                    <div className="w-9 h-9 bg-white/[0.02] rounded-lg flex items-center justify-center border border-white/5">
                        <Heart size={18} className="text-brand fill-brand" />
                    </div>
                </header>

                {wishlistItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 px-10 text-center">
                        <div className="w-16 h-16 bg-white/[0.02] rounded-xl flex items-center justify-center mb-6 border border-white/5">
                            <Heart size={28} className="text-gray-200" />
                        </div>
                        <h2 className="text-base font-[1000] text-content uppercase tracking-tight italic leading-tight">Your Wishlist is Empty</h2>
                        <p className="text-content-subtle text-[10px] font-bold uppercase tracking-widest mt-2 mb-8 max-w-[200px] mx-auto">Save items you love to find them easily later.</p>
                        <button onClick={() => navigate('/e-shop')}
                            className="px-10 py-4 bg-brand text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-black/50 shadow-brand/20 active:scale-95 transition-all">
                            Explore Shop
                        </button>
                    </div>
                ) : (
                    <div className="px-5 pt-6 space-y-4">
                        <AnimatePresence>
                            {wishlistItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white/5 rounded-xl border border-white/5 p-3  flex gap-4"
                                >
                                    {/* Image Section */}
                                    <div className="w-24 h-24 bg-white/[0.02] rounded-lg overflow-hidden flex-shrink-0 border border-gray-50 relative group">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-110" />
                                        {item.badge && (
                                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-brand text-white text-[7px] font-black rounded uppercase tracking-tighter italic">
                                                {item.badge}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Section */}
                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                        <div>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <span className="text-[8px] font-black text-brand uppercase tracking-widest leading-none">{item.category}</span>
                                                    <h4 className="text-[11px] font-[1000] text-content uppercase tracking-tight leading-tight mt-1 line-clamp-2 pr-2">{item.name}</h4>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Star size={8} className="text-orange-400 fill-orange-400" />
                                                        <span className="text-[8px] font-black text-content-subtle">{item.rating}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFromWishlist(item.id)}
                                                    className="p-1.5 bg-white/[0.02] rounded-md text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-[1000] text-content italic leading-none">₹{item.salePrice.toLocaleString()}</span>
                                                {item.price > item.salePrice && (
                                                    <span className="text-[9px] font-bold text-content-subtle line-through">₹{item.price.toLocaleString()}</span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleMoveToCart(item)}
                                                className="flex items-center gap-2 bg-content text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                            >
                                                <ShoppingCart size={12} strokeWidth={3} />
                                                Move to Cart
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Summary Info */}
                        <div className="bg-brand/5 border border-brand/10 rounded-xl p-4 flex items-center gap-4 mt-8">
                            <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center">
                                <ShoppingBag size={20} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-content uppercase tracking-tight">Ready to Checkout?</p>
                                <p className="text-[8px] font-bold text-brand uppercase tracking-widest mt-0.5">All your favorites in one place</p>
                            </div>
                            <button onClick={() => navigate('/cart')} className="bg-white/5 p-2 rounded-lg ">
                                <ChevronRight size={16} className="text-brand" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </MobileLayout>
    );
};

export default Wishlist;
