import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Search, Menu, ShoppingCart, Heart, User, Home,
    ChevronRight, Zap, RefreshCw, Truck, ArrowLeft,
    Star, Plus, ShoppingBag, Youtube, Mail, Bell, X, Check, Crown, Sparkles, MessageCircle
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

    const [trendingProducts, setTrendingProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [metadata, setMetadata] = useState({ banners: [], categories: [], settings: {} });

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await productAPI.getTrendingProducts();
                if (res.status === 'success') setTrendingProducts(res.data.products);
            } catch (err) {}
        };
        fetchTrending();
    }, []);

    const CATEGORIES_DATA = [
        { title: 'Vehicle accessories', key: 'Accessories', image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80' },
        { title: 'Safety & protection', key: 'Electronics', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80' },
        { title: 'Car & bike care', key: 'Cleaning', image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80' },
        { title: 'Style & appearance', key: 'Enhancement', image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metaRes, prodRes] = await Promise.all([
                    productAPI.getEshopMetadata(),
                    productAPI.getProducts({ category: activeCategory === 'All' ? undefined : activeCategory, search: searchQuery || undefined })
                ]);
                if (metaRes.status === 'success') setMetadata(metaRes.data);
                if (prodRes.status === 'success') setProducts(prodRes.data.products);
            } catch (err) {} finally { setLoading(false); }
        };
        const timeoutId = setTimeout(fetchData, searchQuery ? 500 : 0);
        return () => clearTimeout(timeoutId);
    }, [activeCategory, searchQuery]);

    const handleAddToCart = (product) => {
        addToCart(product);
        setToast(product.name);
        setTimeout(() => setToast(null), 2000);
    };

    return (
        <MobileLayout>
            <div className="bg-slate-50 min-h-screen font-sans pb-32">
                {/* ── Compact Header ── */}
                <header className="sticky top-0 z-[60] bg-white px-5 pt-8 pb-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                            <ArrowLeft size={20} className="text-slate-900" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-slate-900 font-bold">C</div>
                            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight">Clean2wash</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsSearching(!isSearching)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                            <Search size={18} className={isSearching ? "text-brand" : "text-slate-400"} />
                        </button>
                        <button onClick={() => navigate('/cart')} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center relative active:scale-95 transition-all">
                            <ShoppingBag size={18} className="text-slate-400" />
                            {cartCount > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-brand text-slate-900 text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-slate-50">{cartCount}</span>}
                        </button>
                    </div>

                    <AnimatePresence>
                        {isSearching && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-5 shadow-xl">
                                <div className="relative">
                                    <input autoFocus type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-12 bg-slate-50 rounded-2xl px-5 py-2.5 text-[14px] font-bold text-slate-900 outline-none focus:border-brand/40" />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"><X size={16} /></button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </header>

                <div className="space-y-6">
                    {/* ── Banners ── */}
                    {!searchQuery && activeCategory === 'All' && (
                        <div className="px-5 pt-6">
                            {(metadata.banners?.length > 0 ? metadata.banners : [ { title: "Flash sale\n10% Off", subtitle: "Grand Launch", cta: "Shop now", theme: 'dark' } ]).map((banner, idx) => (
                                <div key={idx} className={`rounded-[2.5rem] p-8 min-h-[180px] relative overflow-hidden flex flex-col justify-between shadow-xl shadow-slate-900/10 ${banner.theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-brand text-slate-900'}`}>
                                    <div className="relative z-10">
                                        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/10 mb-3 inline-block">{banner.subtitle || 'Limited offer'}</span>
                                        <h3 className="text-[28px] font-bold leading-tight tracking-tight whitespace-pre-line">{banner.title}</h3>
                                    </div>
                                    <button onClick={() => navigate(banner.path || '#')} className="relative z-10 w-fit mt-6 px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold text-[12px] shadow-xl active:scale-95 transition-all">
                                        {banner.cta || 'Explore'}
                                    </button>
                                    <ShoppingBag size={120} className={`absolute -bottom-6 -right-6 opacity-5 rotate-12 ${banner.theme === 'dark' ? 'text-white' : 'text-slate-900'}`} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Features ── */}
                    <div className="px-5 flex gap-3">
                        <div className="flex-1 bg-white p-4 rounded-[1.8rem] border border-gray-100 flex items-center gap-3 shadow-sm">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-brand shrink-0"><Truck size={18} /></div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-900 leading-none mb-1">Fast delivery</p>
                                <p className="text-[9px] font-medium text-slate-400">On all orders</p>
                            </div>
                        </div>
                        <div className="flex-1 bg-white p-4 rounded-[1.8rem] border border-gray-100 flex items-center gap-3 shadow-sm">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-brand shrink-0"><RefreshCw size={18} /></div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-900 leading-none mb-1">Quick refunds</p>
                                <p className="text-[9px] font-medium text-slate-400">In C2W points</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Categories ── */}
                    <div className="space-y-4">
                        <div className="px-5 flex items-center justify-between">
                            <h2 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest leading-none">Explore categories</h2>
                        </div>
                        <div className="flex gap-2 px-5 overflow-x-auto no-scrollbar pb-2">
                            {['All', ...CATEGORIES_DATA.map(c => c.key)].map((catKey) => {
                                const isActive = activeCategory === catKey;
                                const cat = CATEGORIES_DATA.find(c => c.key === catKey) || { title: 'All' };
                                return (
                                    <button key={catKey} onClick={() => setActiveCategory(catKey)}
                                        className={`flex-shrink-0 px-6 py-2.5 rounded-full text-[12px] font-bold transition-all border ${isActive ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-white border-slate-100 text-slate-400'}`}>
                                        {cat.title}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Trending ── */}
                    {!searchQuery && trendingProducts.length > 0 && (
                        <div className="space-y-4">
                            <div className="px-5 flex items-center justify-between">
                                <h2 className="text-[17px] font-bold text-slate-900 tracking-tight leading-none">Trending now</h2>
                                <div className="flex items-center gap-1.5 bg-brand/10 px-3 py-1 rounded-full text-[9px] font-bold text-slate-900">
                                    <Sparkles size={10} className="fill-current" /> Hot picks
                                </div>
                            </div>
                            <div className="flex gap-4 px-5 overflow-x-auto no-scrollbar pb-2">
                                {trendingProducts.map((item, i) => (
                                    <motion.div key={item._id} whileTap={{ scale: 0.99 }} onClick={() => navigate(`/e-shop/product/${item._id}`)}
                                        className="flex-shrink-0 w-64 bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm flex items-center gap-4 group cursor-pointer transition-all hover:border-slate-200">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                                            <img src={item.image} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[8px] font-bold text-brand uppercase tracking-widest leading-none mb-1 block">{item.badge || 'New'}</span>
                                            <h4 className="text-[13px] font-bold text-slate-900 truncate mb-1">{item.name}</h4>
                                            <p className="text-[14px] font-bold text-slate-900">₹{item.salePrice}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Products ── */}
                    <div className="px-5">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block mb-1">{activeCategory} collection</span>
                                <h2 className="text-[17px] font-bold text-slate-900 tracking-tight leading-none">Premium picks</h2>
                            </div>
                            <p className="text-[11px] font-bold text-slate-300">{products.length} items</p>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(n => <div key={n} className="h-64 bg-white rounded-[2rem] border border-gray-100 animate-pulse" />)}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="py-16 bg-white rounded-[2rem] border border-dashed border-gray-200 text-center px-8">
                                <ShoppingBag size={32} className="text-slate-100 mx-auto mb-3" />
                                <p className="text-[12px] font-bold text-slate-400 mb-6 font-sans">No products found in this category.</p>
                                <button onClick={() => { setActiveCategory('All'); setSearchQuery(''); }} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-bold active:scale-95 transition-all">Browse all items</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {products.map((prod, i) => {
                                    const pId = prod._id || prod.id;
                                    const inCart = isInCart(pId);
                                    const inWishlist = isInWishlist(pId);
                                    const disc = Math.round(((prod.price - prod.salePrice) / prod.price) * 100);
                                    return (
                                        <motion.div key={pId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            className="bg-white rounded-[2.2rem] p-3 border border-gray-100 shadow-sm group">
                                            <div className="relative aspect-square rounded-[1.8rem] overflow-hidden bg-slate-50 mb-3 cursor-pointer" onClick={() => navigate(`/e-shop/product/${pId}`)}>
                                                <img src={prod.image} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" alt="" />
                                                {disc > 0 && <span className="absolute top-3 left-3 bg-brand text-slate-900 text-[8px] font-bold px-2 py-1 rounded-lg">-{disc}%</span>}
                                                <button onClick={(e) => { e.stopPropagation(); toggleWishlist(prod); }} className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all">
                                                    <Heart size={14} className={inWishlist ? 'text-rose-500 fill-current' : 'text-slate-300'} />
                                                </button>
                                            </div>
                                            <div className="px-1 space-y-2">
                                                <h4 className="text-[12px] font-bold text-slate-900 leading-tight line-clamp-2 min-h-[32px] cursor-pointer" onClick={() => navigate(`/e-shop/product/${pId}`)}>{prod.name}</h4>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 font-bold">
                                                        <span className={`text-[15px] ${isBlackPassMember ? 'text-brand' : 'text-slate-900'}`}>₹{(isBlackPassMember ? (prod.salePrice * 0.7) : prod.salePrice)?.toLocaleString()}</span>
                                                        {disc > 0 && <span className="text-[10px] text-slate-300 line-through">₹{prod.price?.toLocaleString()}</span>}
                                                    </div>
                                                </div>
                                                {isBlackPassMember && (
                                                    <div className="bg-slate-900 text-white p-1 rounded-lg px-2 w-fit flex items-center gap-1.5 shadow-xl shadow-brand/10 border border-brand/20">
                                                        <Crown size={10} className="text-brand fill-current" />
                                                        <span className="text-[8px] font-bold text-brand uppercase tracking-widest">Member price</span>
                                                    </div>
                                                )}
                                                <button onClick={() => inCart ? navigate('/cart') : handleAddToCart(prod)} disabled={!(prod.stock > 0 || prod.inStock)}
                                                    className={`w-full mt-2 h-10 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${inCart ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-slate-900 text-white'}`}>
                                                    {!(prod.stock > 0 || prod.inStock) ? 'Out of stock' : inCart ? 'In cart' : 'Add to cart'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Newsletter ── */}
                    {!searchQuery && (
                        <div className="px-5 pb-10 space-y-4">
                            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                                <h3 className="text-[20px] font-bold leading-tight mb-2 relative z-10">{metadata.settings?.newsletter?.title || "Join our community"}</h3>
                                <p className="text-[11px] font-medium text-white/50 leading-relaxed mb-6 relative z-10">{metadata.settings?.newsletter?.desc || "Get the latest deals and care tips delivered to your inbox."}</p>
                                <button className="relative z-10 px-6 py-3 bg-brand text-slate-900 rounded-2xl font-bold text-[12px] flex items-center gap-2 active:scale-95 transition-all">
                                    <Mail size={16} /> Subscribe now
                                </button>
                                <MessageCircle size={100} className="absolute -bottom-10 -right-10 text-white/5 opacity-40 -rotate-12" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Toast */}
                <AnimatePresence>
                    {toast && (
                        <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 50, x: '-50%' }}
                            className="fixed bottom-32 left-1/2 z-[100] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
                            <Check size={16} className="text-emerald-500" />
                            <p className="text-[11px] font-bold">Added <span className="text-brand">{toast.substring(0, 15)}...</span> to cart</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Back to Booking */}
                <AnimatePresence>
                    {fromBooking && (
                        <div className="fixed bottom-24 inset-x-5 z-[70]">
                            <button onClick={() => navigate(fromBooking === 'studio-wash' ? '/full-wash-booking?back=shop' : '/instant-wash?back=shop')}
                                className="w-full h-15 bg-slate-900 text-white rounded-[1.8rem] font-bold text-[13px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                                <ArrowLeft size={18} /> Back to {fromBooking === 'studio-wash' ? 'studio wash' : 'booking'}
                                <span className="bg-brand text-slate-900 w-6 h-6 rounded-lg flex items-center justify-center text-[10px]">{cartCount}</span>
                            </button>
                        </div>
                    )}
                </AnimatePresence>

                {/* WhatsApp */}
                {!toast && (
                    <a href="https://wa.me/919876543210" className="fixed bottom-24 right-5 w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-all z-[60]">
                        <MessageCircle size={24} />
                    </a>
                )}
            </div>
        </MobileLayout>
    );
};

export default EShop;
