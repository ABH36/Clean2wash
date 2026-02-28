import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Search, Menu, ShoppingCart, Heart, User, Home,
    ChevronRight, Zap, RefreshCw, Truck, ArrowLeft,
    Star, Plus, ShoppingBag, Youtube, Mail, Bell, X, Check
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useCart, SHOP_PRODUCTS } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { useAuth } from '../../../context/AuthContext';

const EShop = () => {
    const navigate = useNavigate();
    const { addToCart, isInCart, cartCount } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { registeredUsers } = useAuth();
    const [activeTab, setActiveTab] = useState('shop');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [toast, setToast] = useState(null);

    const showToast = (name) => {
        setToast(name);
        setTimeout(() => setToast(null), 2000);
    };

    const CATEGORIES_DATA = [
        { title: 'Vehicle Accessories', key: 'Accessories', image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80' },
        { title: 'Safety & Protection', key: 'Electronics', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80' },
        { title: 'Car & Bike Care Kit', key: 'Cleaning', image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80' },
    ];

    const allAvailableProducts = useMemo(() => {
        const vendorApproved = [];
        (registeredUsers.vendor || []).forEach(v => {
            if (v.products) {
                v.products.filter(p => p.status === 'Approved').forEach(p => {
                    vendorApproved.push(p);
                });
            }
        });
        return [...SHOP_PRODUCTS, ...vendorApproved];
    }, [registeredUsers.vendor]);

    const filteredProducts = useMemo(() => {
        let list = [...allAvailableProducts];
        if (activeCategory !== 'All') list = list.filter(p => p.category === activeCategory);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
        }
        return list;
    }, [activeCategory, searchQuery, allAvailableProducts]);

    const handleAddToCart = (product) => {
        addToCart(product);
        showToast(product.name);
    };

    return (
        <MobileLayout hideNav={false}>
            <div className="bg-white min-h-screen pb-32">
                {/* ── CUSTOM HEADER ── */}
                <header className="sticky top-0 z-50 bg-[#FFF6E9] px-5 pt-8 pb-4 border-b border-black/[0.03]">
                    <div className="flex items-center justify-between">
                        <button onClick={() => navigate('/')} className="p-2 -ml-2">
                            <ArrowLeft size={20} className="text-content" />
                        </button>

                        <div className="flex items-center gap-1">
                            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-black">H</div>
                            <h1 className="text-xl font-[1000] text-content tracking-tighter uppercase">clean2wash</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsSearching(!isSearching)}>
                                <Search size={20} className={isSearching ? "text-brand" : "text-content-subtle"} />
                            </button>
                            <Menu size={20} className="text-content-subtle" />
                        </div>
                    </div>

                    {/* Search Bar - Animated Presence */}
                    <AnimatePresence>
                        {isSearching && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 px-1"
                            >
                                <div className="relative">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-content outline-none focus:border-brand/30"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <X size={16} className="text-content-subtle" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </header>

                <div className="space-y-6">
                    {/* ── FLASH SALE BANNER ── */}
                    {!searchQuery && activeCategory === 'All' && (
                        <div className="px-5 pt-4">
                            <div className="bg-[#FFF9E5] rounded-xl p-6 relative overflow-hidden flex items-center justify-between min-h-[160px]">
                                <div className="relative z-10 space-y-1">
                                    <h3 className="text-[32px] font-[1000] text-content leading-none tracking-tighter">FLASH<br />SALE</h3>
                                    <button className="mt-3 bg-content text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg">SHOP NOW</button>
                                </div>

                                <div className="relative z-10 text-right">
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-none">Big Deals</p>
                                    <p className="text-[12px] font-black text-content uppercase tracking-widest leading-none mb-2">Bigger Savings</p>
                                    <div className="border-l-2 border-content/10 pl-4">
                                        <p className="text-[10px] font-black text-content-subtle uppercase trekking-tight">Flat</p>
                                        <h4 className="text-4xl font-[1000] text-content leading-none">10%</h4>
                                        <p className="text-[10px] font-black text-content uppercase tracking-widest">Off</p>
                                    </div>
                                </div>
                                <div className="absolute right-0 bottom-0 opacity-10">
                                    <ShoppingBag size={120} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── MICRO FEATURES ── */}
                    <div className="px-5 flex items-center justify-around">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-content-subtle border border-gray-100"><Truck size={14} /></div>
                            <div>
                                <p className="text-[9px] font-black text-content leading-none">Fast Delivery</p>
                                <p className="text-[7px] font-bold text-content-subtle uppercase tracking-tighter">On all orders</p>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-gray-100" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-content-subtle border border-gray-100"><RefreshCw size={14} /></div>
                            <div>
                                <p className="text-[9px] font-black text-content leading-none">Quick Refunds</p>
                                <p className="text-[7px] font-bold text-content-subtle uppercase tracking-tighter">In clean2wash points</p>
                            </div>
                        </div>
                    </div>

                    {/* ── SHOP BY CATEGORY ── */}
                    <div className="space-y-4">
                        <div className="px-5 flex items-center justify-between">
                            <h2 className="text-base font-[1000] text-content uppercase tracking-tight">Shop by Category</h2>
                            <button onClick={() => setActiveCategory('All')} className="text-[10px] font-black text-brand uppercase tracking-widest">View All</button>
                        </div>

                        <div className="flex gap-4 px-5 overflow-x-auto no-scrollbar pb-2">
                            {CATEGORIES_DATA.map((cat, i) => (
                                <motion.div
                                    whileTap={{ scale: 0.98 }}
                                    key={i}
                                    className={`flex-shrink-0 w-44 space-y-2 cursor-pointer transition-opacity ${activeCategory === cat.key ? "opacity-100" : "opacity-60"}`}
                                    onClick={() => setActiveCategory(activeCategory === cat.key ? 'All' : cat.key)}
                                >
                                    <div className={`aspect-[4/3] rounded-xl overflow-hidden border border-gray-100 shadow-sm relative group ${activeCategory === cat.key ? "ring-2 ring-brand" : ""}`}>
                                        <img src={cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={cat.title} />
                                        <div className="absolute inset-0 bg-black/5" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-[10px] font-black uppercase tracking-tight ${activeCategory === cat.key ? "text-brand" : "text-content"}`}>{cat.title}</p>
                                        <ChevronRight size={12} className={activeCategory === cat.key ? "text-brand" : "text-content-subtle"} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* ── PRODUCTS LIST ── */}
                    <div className="space-y-4">
                        <div className="px-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="inline-block bg-green-50 px-2 py-0.5 rounded text-[8px] font-black text-green-700 uppercase tracking-widest mb-1.5">{activeCategory} Picks</div>
                                    <h2 className="text-base font-[1000] text-content uppercase tracking-tight">Our Premium Collection</h2>
                                </div>
                                <p className="text-[10px] font-black text-content-subtle">{filteredProducts.length} items</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {filteredProducts.map((prod, i) => {
                                    const discounted = Math.round(((prod.price - prod.salePrice) / prod.price) * 100);
                                    const inCart = isInCart(prod.id);
                                    const inWishlist = isInWishlist(prod.id);

                                    return (
                                        <motion.div
                                            key={prod.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm group relative"
                                        >
                                            <div
                                                className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 mb-3 cursor-pointer"
                                                onClick={() => navigate(`/e-shop/product/${prod.id}`)}
                                            >
                                                <img src={prod.image} className="w-full h-full object-contain mix-blend-multiply" alt={prod.name} />
                                                <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-black text-content border border-gray-100 flex items-center gap-0.5">
                                                    <Zap size={8} className="text-orange-500" fill="currentColor" /> {discounted}% OFF
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleWishlist(prod);
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm active:scale-95 transition-all"
                                                >
                                                    <Heart size={14} className={`${inWishlist ? 'text-brand fill-brand' : 'text-content-subtle'}`} />
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                <h4
                                                    className="text-[11px] font-[1000] text-content uppercase tracking-tight leading-tight line-clamp-2 min-h-[28px] cursor-pointer"
                                                    onClick={() => navigate(`/e-shop/product/${prod.id}`)}
                                                >
                                                    {prod.name}
                                                </h4>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, starI) => (
                                                        <Star key={starI} size={8} className={starI < Math.floor(prod.rating) ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
                                                    ))}
                                                    <span className="text-[8px] font-bold text-content-subtle">{prod.rating}</span>
                                                </div>
                                                <div className="flex items-baseline gap-1.5 mt-2">
                                                    <span className="text-sm font-[1000] text-content">Rs. {prod.salePrice.toLocaleString()}</span>
                                                    <span className="text-[9px] font-bold text-content-subtle line-through opacity-50">₹{prod.price.toLocaleString()}</span>
                                                </div>

                                                {prod.inStock ? (
                                                    <button
                                                        onClick={() => inCart ? navigate('/cart') : handleAddToCart(prod)}
                                                        className={`w-full mt-3 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${inCart
                                                            ? 'bg-green-500/10 border border-green-500/30 text-green-600 flex items-center justify-center gap-1'
                                                            : 'border-2 border-brand text-brand hover:bg-brand hover:text-white'
                                                            }`}
                                                    >
                                                        {inCart ? <><Check size={10} strokeWidth={3} /> In Cart</> : 'ADD TO CART'}
                                                    </button>
                                                ) : (
                                                    <button disabled className="w-full mt-3 py-2.5 bg-gray-50 border border-gray-100 text-gray-300 rounded-lg font-black text-[9px] uppercase tracking-widest cursor-not-allowed">
                                                        OUT OF STOCK
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {filteredProducts.length === 0 && (
                                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-xs font-black text-content-subtle uppercase tracking-widest">No Products Found</p>
                                    <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="mt-4 text-[10px] font-[1000] text-brand uppercase underline">Clear Filters</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── NEWSLETTER & SOCIAL ── */}
                    {!searchQuery && (
                        <div className="px-5 pb-10 space-y-4">
                            <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-xl space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-base font-[1000] text-content uppercase tracking-tight leading-tight">Subscribe to our<br />Newsletter</h3>
                                    <p className="text-[9px] font-bold text-content-subtle uppercase trekking-tight leading-relaxed">Get weekly deals, valuable health information and more.</p>
                                </div>
                                <button className="px-5 py-2.5 border-2 border-content/10 text-content rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-content hover:text-white transition-all flex items-center gap-2">
                                    <Mail size={14} /> SIGN UP
                                </button>
                            </div>

                            <div className="bg-green-50/50 border border-green-100 p-6 rounded-xl space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-base font-[1000] text-content uppercase tracking-tight leading-tight">Join Our YouTube<br />Community</h3>
                                    <p className="text-[9px] font-bold text-content-subtle uppercase trekking-tight leading-relaxed">Get weekly deals, valuable health information and more.</p>
                                </div>
                                <button className="px-5 py-2.5 border-2 border-content/10 text-content rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-content hover:text-white transition-all flex items-center gap-2">
                                    <Youtube size={14} /> SUBSCRIBE NOW
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Toast Notification */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: 50, x: '-50%' }}
                            className="fixed bottom-32 left-1/2 z-[100] bg-content text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 whitespace-nowrap border border-white/10"
                        >
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Check size={11} strokeWidth={3} />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-tight">
                                Added <span className="text-brand">"{toast.substring(0, 15)}..."</span> to cart
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* WHATSAPP FLOAT */}
            {!toast && (
                <div className="fixed bottom-24 right-5 z-[60]">
                    <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-xl shadow-green-500/30 active:scale-95 transition-transform block">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-4.821 4.754a8.124 8.124 0 01-3.858-.969l-.277-.165-2.865.751.766-2.795-.181-.287a8.12 8.12 0 01-1.248-4.302c0-4.492 3.655-8.147 8.147-8.147 4.492 0 8.147 3.655 8.147 8.147 0 4.492-3.655 8.147-8.147 8.147m0-17.472C6.904-.001.001 6.904.001 15.422c0 2.719.711 5.356 2.056 7.671L0 24l.872-2.73a15.343 15.343 0 0014.55 1.428c4.492 0 8.147-3.655 8.147-8.147 0-8.518-6.903-15.423-15.422-15.423z" />
                        </svg>
                    </a>
                </div>
            )}
        </MobileLayout>
    );
};

export default EShop;
