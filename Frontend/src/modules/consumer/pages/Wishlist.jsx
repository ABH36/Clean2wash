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
import { useTheme } from '../../../context/ThemeContext';

const Wishlist = () => {
    const navigate = useNavigate();
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart, isInCart } = useCart();
    const { isDarkMode } = useTheme();

    const handleMoveToCart = (item) => {
        addToCart(item);
        removeFromWishlist(item.id);
    };

    return (
        <MobileLayout>
            <div className={`min-h-screen pb-28 transition-colors duration-300 ${isDarkMode ? 'bg-[#0A0F0D] text-white' : 'bg-[#FAF6EB] text-[#0F172A]'}`}>
                {/* ── HEADER ── */}
                <header className={`sticky top-0 z-50 px-5 py-6 border-b transition-colors ${isDarkMode ? 'bg-[#0A0F0D] border-white/5' : 'bg-[#FAF6EB] border-black/5'}`}>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className={`p-1 -ml-1 transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className={`text-base font-[1000] uppercase tracking-tight italic ${isDarkMode ? 'text-white' : 'text-black'}`}>Wishlist</h1>
                            <p className={`text-[9px] font-black uppercase tracking-widest leading-none mt-0.5 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>{wishlistItems.length} Saved Items</p>
                        </div>
                    </div>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-black/05 border-black/5'}`}>
                        <Heart size={18} className="text-[#F59E0B] fill-[#F59E0B]" />
                    </div>
                </header>

                {wishlistItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 px-10 text-center">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-black/05 border-black/5'}`}>
                            <Heart size={28} className={isDarkMode ? 'text-white/20' : 'text-black/10'} />
                        </div>
                        <h2 className={`text-base font-[1000] uppercase tracking-tight italic leading-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Your Wishlist is Empty</h2>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 mb-8 max-w-[200px] mx-auto ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>Save items you love to find them easily later.</p>
                        <button onClick={() => navigate('/e-shop')}
                            className="px-10 py-4 bg-[#F59E0B] text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">
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
                                    className={`rounded-xl border p-3 flex gap-4 transition-colors ${
                                        isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5 shadow-sm'
                                    }`}
                                >
                                    {/* Image Section */}
                                    <div className={`w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border relative group transition-colors ${
                                        isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.02] border-black/5'
                                    }`}>
                                        <img src={item.image} alt={item.name} className={`w-full h-full object-contain transition-transform group-hover:scale-110 ${!isDarkMode && 'mix-blend-multiply'}`} />
                                        {item.badge && (
                                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#F59E0B] text-black text-[7px] font-black rounded uppercase tracking-tighter italic">
                                                {item.badge}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Section */}
                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                        <div>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <span className="text-[8px] font-black text-[#F59E0B] uppercase tracking-widest leading-none">{item.category}</span>
                                                    <h4 className={`text-[11px] font-[1000] uppercase tracking-tight leading-tight mt-1 line-clamp-2 pr-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.name}</h4>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Star size={8} className="text-[#F59E0B] fill-[#F59E0B]" />
                                                        <span className={`text-[8px] font-black ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>{item.rating}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFromWishlist(item.id)}
                                                    className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'bg-white/5 text-white/30 hover:text-red-500' : 'bg-black/05 text-black/20 hover:text-red-500'}`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className={`flex items-center justify-between mt-3 pt-3 border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                                            <div className="flex flex-col">
                                                <span className={`text-[14px] font-[1000] italic leading-none ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{item.salePrice.toLocaleString()}</span>
                                                {item.price > item.salePrice && (
                                                    <span className={`text-[9px] font-bold line-through ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>₹{item.price.toLocaleString()}</span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleMoveToCart(item)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all ${
                                                    isDarkMode ? 'bg-[#F59E0B] text-black' : 'bg-black text-white'
                                                }`}
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
                        <div className={`rounded-xl p-4 flex items-center gap-4 mt-8 border ${
                            isDarkMode ? 'bg-[#F59E0B]/10 border-[#F59E0B]/20' : 'bg-black/05 border-black/10'
                        }`}>
                            <div className="w-10 h-10 bg-[#F59E0B] rounded-lg flex items-center justify-center">
                                <ShoppingBag size={20} className="text-black" />
                            </div>
                            <div className="flex-1">
                                <p className={`text-[10px] font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Ready to Checkout?</p>
                                <p className="text-[8px] font-bold text-[#F59E0B] uppercase tracking-widest mt-0.5">All your favorites in one place</p>
                            </div>
                            <button onClick={() => navigate('/cart')} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/05 hover:bg-black/10'}`}>
                                <ChevronRight size={16} className="text-[#F59E0B]" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </MobileLayout>
    );
};

export default Wishlist;
