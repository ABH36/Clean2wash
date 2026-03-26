import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Search, Menu, ShoppingCart, Heart, User, Home,
    ChevronRight, Zap, RefreshCw, Truck, ArrowLeft,
    Star, Plus, ShoppingBag, Youtube, Mail, Bell, X, Check, Crown, Sparkles
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { useAuth } from '../../../context/AuthContext';
import { productAPI } from '../../../utils/api';

const EShop = () => {
    const navigate = useNavigate();
    const { addToCart, isInCart, cartCount } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { isBlackPassMember } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [toast, setToast] = useState(null);
    const [fromBooking, setFromBooking] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const from = params.get('from');
        if (from === 'booking' || from === 'studio-wash') {
            setFromBooking(from);
        }
    }, []);

    // Trending State
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [trendingLoading, setTrendingLoading] = useState(true);

    // Products & Metadata State
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [metadata, setMetadata] = useState({ banners: [], categories: [], settings: {} });
    const [metadataLoading, setMetadataLoading] = useState(true);


    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await productAPI.getTrendingProducts();
                if (res.status === 'success') {
                    setTrendingProducts(res.data.products);
                }
            } catch (err) {
                console.error("Failed to fetch trending products:", err);
            } finally {
                setTrendingLoading(false);
            }
        };
        fetchTrending();
    }, []);

    const showToast = (name) => {

        setToast(name);
        setTimeout(() => setToast(null), 2000);
    };

    const CATEGORIES_DATA = [
        { title: 'Vehicle Accessories', key: 'Accessories', image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80' },
        { title: 'Safety & Protection', key: 'Electronics', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80' },
        { title: 'Car & Bike Care Kit', key: 'Cleaning', image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80' },
        { title: 'Appearance & Style', key: 'Enhancement', image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80' },
    ];

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const res = await productAPI.getEshopMetadata();
                if (res.status === 'success') {
                    setMetadata(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch E-Shop metadata:", err);
            } finally {
                setMetadataLoading(false);
            }
        };
        fetchMetadata();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                // Ensure 'All' category sends undefined to fetch all approved products
                const res = await productAPI.getProducts({
                    category: activeCategory === 'All' ? undefined : activeCategory,
                    search: searchQuery || undefined
                });
                if (res.status === 'success') {
                    setProducts(res.data.products);
                }
            } catch (err) {
                console.error("Failed to fetch products:", err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchProducts, searchQuery ? 500 : 0);
        return () => clearTimeout(timeoutId);
    }, [activeCategory, searchQuery]);

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
                    {/* ── DYNAMIC BANNERS ── */}
                    {!searchQuery && activeCategory === 'All' && metadata.banners?.length > 0 && (
                        <div className="px-5 pt-2">
                            {metadata.banners.map((banner, idx) => (
                                <div key={banner.id || idx} className={`rounded-2xl p-6 relative overflow-hidden flex items-center justify-between min-h-[180px] shadow-sm ${banner.theme === 'dark' ? 'bg-[#1A1A1A] text-white' : 'bg-gradient-to-br from-[#FFF9E5] to-[#FFF0D0] text-content'}`}>
                                    <div className="relative z-10 space-y-2">
                                        <div className="inline-block bg-brand/20 px-2 py-0.5 rounded text-[8px] font-black text-brand uppercase tracking-widest">Limited Offer</div>
                                        <h3 className="text-[26px] font-[1000] leading-[1.1] tracking-tighter uppercase whitespace-pre-line">
                                            {banner.title}
                                        </h3>
                                        <button
                                            onClick={() => navigate(banner.path)}
                                            className={`mt-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-transform active:scale-95 shadow-lg ${banner.theme === 'dark' ? 'bg-brand text-white' : 'bg-content text-white'}`}
                                        >
                                            {banner.cta}
                                        </button>
                                    </div>

                                    <div className="relative z-10 text-right h-full flex flex-col justify-between">
                                        <p className={`text-[11px] font-[1000] uppercase tracking-widest leading-tight ${banner.theme === 'dark' ? 'text-white/60' : 'text-content/60'}`}>
                                            {banner.subtitle}
                                        </p>
                                        <div className={`mt-4 border-l-2 pl-4 ${banner.theme === 'dark' ? 'border-brand/40' : 'border-brand'}`}>
                                            <p className={`text-[9px] font-black uppercase tracking-widest ${banner.theme === 'dark' ? 'text-white/40' : 'text-content-subtle'}`}>Special</p>
                                            <h4 className="text-4xl font-[1000] leading-none text-brand">Picks</h4>
                                        </div>
                                    </div>
                                    {banner.image && (
                                        <div className="absolute inset-0 z-0">
                                            <img src={banner.image} className="w-full h-full object-cover opacity-10 grayscale" alt="" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Fallback Banner if no metadata banners */}
                    {!searchQuery && activeCategory === 'All' && (!metadata.banners || metadata.banners.length === 0) && !metadataLoading && (
                        <div className="px-5 pt-2">
                             <div className="bg-gradient-to-br from-[#FFF9E5] to-[#FFF0D0] rounded-2xl p-6 relative overflow-hidden flex items-center justify-between min-h-[180px] shadow-sm">
                                <div className="relative z-10 space-y-2">
                                    <div className="inline-block bg-brand/20 px-2 py-0.5 rounded text-[8px] font-black text-brand uppercase tracking-widest">Grand Launch</div>
                                    <h3 className="text-[32px] font-[1000] text-content leading-none tracking-tighter uppercase italic">FLASH<br />SALE</h3>
                                    <button className="mt-2 bg-content text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">SHOP NOW</button>
                                </div>

                                <div className="relative z-10 text-right">
                                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-none">Big Deals</p>
                                    <p className="text-[12px] font-black text-content uppercase tracking-widest leading-none mb-2">Bigger Savings</p>
                                    <div className="border-l-2 border-brand pl-4">
                                        <p className="text-[10px] font-black text-content-subtle uppercase trekking-tight">Flat</p>
                                        <h4 className="text-4xl font-[1000] text-brand leading-none italic">10%</h4>
                                        <p className="text-[10px] font-black text-content uppercase tracking-widest">Off</p>
                                    </div>
                                </div>
                                <div className="absolute right-0 bottom-0 opacity-5">
                                    <ShoppingBag size={140} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── MICRO FEATURES ── */}
                    <div className="px-5 flex items-center justify-between gap-3">
                        <div className="flex-1 bg-gray-50/50 border border-gray-100 p-3 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-brand"><Truck size={18} /></div>
                            <div>
                                <p className="text-[10px] font-black text-content leading-tight">Fast Delivery</p>
                                <p className="text-[8px] font-bold text-content-subtle uppercase tracking-tighter">On all orders</p>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-50/50 border border-gray-100 p-3 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-brand"><RefreshCw size={18} /></div>
                            <div>
                                <p className="text-[10px] font-black text-content leading-tight">Quick Refunds</p>
                                <p className="text-[8px] font-bold text-content-subtle uppercase tracking-tighter">In C2W Points</p>
                            </div>
                        </div>
                    </div>

                    {/* ── SHOP BY CATEGORY (Pills) ── */}
                    <div className="space-y-4">
                        <div className="px-5 flex items-center justify-between">
                            <h2 className="text-[12px] font-[1000] text-content uppercase tracking-[0.1em]">Explore Categories</h2>
                        </div>

                        <div className="flex gap-2 px-5 overflow-x-auto no-scrollbar pb-2">
                            {['All', ...(metadata.categories?.map(c => c.key) || CATEGORIES_DATA.map(c => c.key))].map((catKey) => {
                                const isAll = catKey === 'All';
                                const catData = isAll ? { title: 'All' } : (metadata.categories?.find(c => c.key === catKey) || CATEGORIES_DATA.find(c => c.key === catKey));
                                const isActive = activeCategory === catKey;

                                return (
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        key={catKey}
                                        onClick={() => setActiveCategory(catKey)}
                                        className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${isActive
                                            ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20'
                                            : 'bg-white border-gray-100 text-content-subtle'
                                            }`}
                                    >
                                        {catData?.title}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── TRENDING NOW ── */}
                    {!searchQuery && trendingProducts.length > 0 && (
                        <div className="space-y-4">
                            <div className="px-5 flex items-center justify-between">
                                <h2 className="text-base font-[1000] text-content uppercase tracking-tight italic">Trending Now</h2>
                                <div className="flex items-center gap-1.5 bg-brand/10 px-2 py-0.5 rounded text-[8px] font-black text-brand uppercase tracking-widest">
                                    <Sparkles size={10} fill="currentColor" /> Hot Picks
                                </div>
                            </div>

                            <div className="flex gap-4 px-5 overflow-x-auto no-scrollbar pb-2">
                                {trendingProducts.map((item, i) => (
                                    <motion.div
                                        whileTap={{ scale: 0.98 }}
                                        key={item._id}
                                        onClick={() => navigate(`/e-shop/product/${item._id}`)}
                                        className="flex-shrink-0 w-64 bg-gray-50 rounded-2xl p-4 border border-gray-100 flex gap-4 items-center group cursor-pointer"
                                    >
                                        <div className="w-20 h-20 rounded-xl bg-white border border-gray-100 overflow-hidden flex-shrink-0">
                                            <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[7px] font-black text-brand uppercase tracking-[0.2em]">{item.badge || 'Trending'}</span>
                                            <h4 className="text-[11px] font-[1000] text-content uppercase tracking-tight mt-0.5 truncate">{item.name}</h4>
                                            <p className="text-sm font-black text-content mt-1 italic">₹{item.salePrice}</p>
                                            <div className="mt-2 text-[9px] font-black text-brand uppercase tracking-widest flex items-center gap-1">
                                                View Details <ChevronRight size={10} strokeWidth={3} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* ── PRODUCTS LIST ── */}
                    <div className="space-y-4">
                        <div className="px-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="inline-block bg-green-50 px-2 py-0.5 rounded text-[8px] font-black text-green-700 uppercase tracking-widest mb-1.5">{activeCategory} Picks</div>
                                    <h2 className="text-base font-[1000] text-content uppercase tracking-tight">Our Premium Collection</h2>
                                </div>
                                <p className="text-[10px] font-black text-content-subtle">{products.length} items</p>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-3 h-[240px] animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {products.map((prod, i) => {
                                        const discounted = Math.round(((prod.price - prod.salePrice) / prod.price) * 100);
                                        const pId = prod._id || prod.id;
                                        const inCart = isInCart(pId);
                                        const inWishlist = isInWishlist(pId);

                                        return (
                                            <motion.div
                                                key={pId}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm group relative"
                                            >
                                                <div
                                                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3 cursor-pointer"
                                                    onClick={() => navigate(`/e-shop/product/${pId}`)}
                                                >
                                                    <img src={prod.image} className="w-full h-full object-contain p-2 mix-blend-multiply group-hover:scale-110 transition-transform duration-500" alt={prod.name} />
                                                    
                                                    {discounted > 0 && (
                                                        <div className="absolute top-2 left-2 bg-brand px-1.5 py-0.5 rounded-lg text-[8px] font-black text-white shadow-lg flex items-center gap-0.5">
                                                            <Zap size={8} fill="currentColor" /> {discounted}% OFF
                                                        </div>
                                                    )}
                                                    
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleWishlist(prod);
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm active:scale-95 transition-all"
                                                    >
                                                        <Heart size={14} className={`${inWishlist ? 'text-brand fill-brand' : 'text-content-subtle'}`} />
                                                    </button>
                                                </div>
                                                <div className="px-1 space-y-1.5">
                                                    <h4
                                                        className="text-[11px] font-black text-content uppercase tracking-tight leading-tight line-clamp-2 min-h-[28px] cursor-pointer"
                                                        onClick={() => navigate(`/e-shop/product/${pId}`)}
                                                    >
                                                        {prod.name}
                                                    </h4>
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1">
                                                            <Star size={8} className="text-amber-400" fill="currentColor" />
                                                            <span className="text-[8px] font-black text-content">{prod.rating || '4.5'}</span>
                                                        </div>
                                                        <div className="text-[8px] font-black text-green-600 uppercase">In Stock</div>
                                                    </div>

                                                    <div className="pt-1 flex flex-col">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`text-sm font-[1000] ${isBlackPassMember ? 'text-brand' : 'text-black'}`}>
                                                                ₹{(isBlackPassMember ? (prod.salePrice * 0.7) : prod.salePrice)?.toLocaleString()}
                                                            </span>
                                                            {discounted > 0 && (
                                                                <span className="text-[9px] font-bold text-content-subtle line-through opacity-40">₹{prod.price?.toLocaleString()}</span>
                                                            )}
                                                        </div>
                                                        {isBlackPassMember && (
                                                            <div className="mt-1 flex items-center gap-1">
                                                                <div className="px-1 py-0.5 bg-black rounded flex items-center gap-0.5">
                                                                    <Crown size={7} className="text-brand" fill="currentColor" />
                                                                    <span className="text-[7px] font-black text-brand uppercase">Member Price</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => inCart ? navigate('/cart') : handleAddToCart(prod)}
                                                        disabled={!(prod.stock > 0 || prod.inStock)}
                                                        className={`w-full mt-2 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${inCart
                                                            ? 'bg-green-50 text-green-600 border border-green-100 flex items-center justify-center gap-1'
                                                            : 'bg-black text-white hover:bg-brand'
                                                            } ${!(prod.stock > 0 || prod.inStock) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                                    >
                                                        {!(prod.stock > 0 || prod.inStock) ? 'Out of Stock' : inCart ? <><Check size={10} strokeWidth={3} /> In Cart</> : 'Add to Cart'}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                </div>
                            )}
                                                 {products.length === 0 && !loading && (
                                <div className="text-center py-12 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 mx-5 mt-4">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <ShoppingBag size={24} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-sm font-black text-content uppercase tracking-widest mb-1">No products found</h3>
                                    <p className="text-[10px] font-bold text-content-subtle uppercase trekking-tight mb-6 px-10">We couldn't find any items in <span className="text-brand">"{activeCategory}"</span> category.</p>
                                    <button 
                                        onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} 
                                        className="px-6 py-2.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-black/10"
                                    >
                                        Browse All Items
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── NEWSLETTER & SOCIAL ── */}
                    {!searchQuery && (
                        <div className="px-5 pb-10 space-y-4">
                            <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-xl space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-base font-[1000] text-content uppercase tracking-tight leading-tight">
                                        {metadata.settings?.newsletter?.title || "Subscribe to our Newsletter"}
                                    </h3>
                                    <p className="text-[9px] font-bold text-content-subtle uppercase trekking-tight leading-relaxed">
                                        {metadata.settings?.newsletter?.desc || "Get weekly deals, valuable health information and more."}
                                    </p>
                                </div>
                                <button
                                    onClick={() => metadata.settings?.newsletter?.link && window.open(metadata.settings.newsletter.link, '_blank')}
                                    className="px-5 py-2.5 border-2 border-content/10 text-content rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-content hover:text-white transition-all flex items-center gap-2"
                                >
                                    <Mail size={14} /> SIGN UP
                                </button>
                            </div>

                            <div className="bg-green-50/50 border border-green-100 p-6 rounded-xl space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-base font-[1000] text-content uppercase tracking-tight leading-tight">
                                        {metadata.settings?.youtube?.title || "Join Our YouTube Community"}
                                    </h3>
                                    <p className="text-[9px] font-bold text-content-subtle uppercase trekking-tight leading-relaxed">
                                        {metadata.settings?.youtube?.desc || "Watch premium car care tutorials and live sessions."}
                                    </p>
                                </div>
                                <button
                                    onClick={() => metadata.settings?.youtube?.link && window.open(metadata.settings.youtube.link, '_blank')}
                                    className="px-5 py-2.5 border-2 border-content/10 text-content rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-content hover:text-white transition-all flex items-center gap-2"
                                >
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

                {/* Back to Booking Float */}
                <AnimatePresence>
                    {fromBooking && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="fixed bottom-24 left-0 right-0 px-5 z-[70]"
                        >
                            <button
                                onClick={() => navigate(fromBooking === 'studio-wash' ? '/full-wash-booking?back=shop' : '/instant-wash?back=shop')}
                                className="w-full bg-black text-white py-4 rounded-2xl font-[1000] uppercase tracking-[0.2em] shadow-2xl shadow-black/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all border border-white/10"
                            >
                                <ArrowLeft size={18} strokeWidth={3} />
                                Back to {fromBooking === 'studio-wash' ? 'Studio Wash' : 'Booking'}
                                <div className="w-6 h-6 bg-brand text-black rounded-lg flex items-center justify-center text-[10px]">
                                    {cartCount}
                                </div>
                            </button>
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
