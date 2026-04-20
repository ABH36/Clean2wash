import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ShoppingCart, Star, ChevronLeft, Filter, X,
    Zap, ShieldCheck, Package, Sparkles, SlidersHorizontal, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { productAPI } from '../../../utils/api';

const CATEGORIES = ['All', 'Electronics', 'Accessories', 'Cleaning'];
const SORT_OPTIONS = [
    { label: 'Featured', value: 'featured' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Best Rated', value: 'rating' },
];

const ShopPage = () => {
    const navigate = useNavigate();
    const { addToCart, isInCart, cartCount } = useCart();
    const { registeredUsers = {} } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('featured');
    const [showSort, setShowSort] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await productAPI.getProducts({
                    category: activeCategory === 'All' ? undefined : activeCategory,
                    search: searchQuery
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
        fetchProducts();
    }, [activeCategory, searchQuery]);

    const showToast = (name) => {
        setToast(name);
        setTimeout(() => setToast(null), 2200);
    };

    const handleAddToCart = (product) => {
        addToCart(product);
        showToast(product.name);
    };

    const filteredProducts = useMemo(() => {
        let list = [...products];
        switch (sortBy) {
            case 'price_asc': list.sort((a, b) => a.salePrice - b.salePrice); break;
            case 'price_desc': list.sort((a, b) => b.salePrice - a.salePrice); break;
            case 'rating': list.sort((a, b) => b.rating - a.rating); break;
            default: break;
        }
        return list;
    }, [products, sortBy]);

    if (loading) return (
        <MobileLayout>
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
        </MobileLayout>
    );

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="sticky top-0 z-50 bg-white/5 border-b border-white/5">
                <div className="px-4 pt-10 pb-3">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate(-1)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/5">
                                <ChevronLeft size={18} className="text-content" />
                            </button>
                            <div>
                                <h1 className="text-base font-black text-content tracking-tight leading-none">Auto-Care Shop</h1>
                                <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest mt-0.5">
                                    {filteredProducts.length} Products
                                </p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/cart')}
                            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-brand/10">
                            <ShoppingCart size={18} className="text-brand" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-subtle" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full h-11 bg-white/[0.02] border border-white/5 rounded-xl pl-10 pr-4 text-[12px] font-bold text-content outline-none focus:border-brand/40 transition-colors"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                <X size={14} className="text-content-subtle" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat
                                ? 'bg-brand text-white shadow-2xl shadow-black/40 shadow-brand/20'
                                : 'bg-white/[0.05] text-content-muted'
                                }`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            <div className="px-4 pb-32 pt-3">
                {/* Sort Bar */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest">
                        {filteredProducts.length} results
                    </p>
                    <div className="relative">
                        <button onClick={() => setShowSort(!showSort)}
                            className="flex items-center gap-2 bg-white/5 border border-white/5 shadow-soft px-3 py-1.5 rounded-xl text-[10px] font-black text-content-muted uppercase tracking-widest">
                            <SlidersHorizontal size={12} />
                            {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                        </button>
                        <AnimatePresence>
                            {showSort && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                    className="absolute right-0 top-10 bg-white/5 border border-white/5 shadow-2xl shadow-black/50 rounded-2xl overflow-hidden z-50 min-w-[180px]"
                                >
                                    {SORT_OPTIONS.map(o => (
                                        <button key={o.value} onClick={() => { setSortBy(o.value); setShowSort(false); }}
                                            className={`w-full flex items-center justify-between px-4 py-3 text-[11px] font-bold text-left hover:bg-white/[0.02] transition-colors ${sortBy === o.value ? 'text-brand' : 'text-content'}`}>
                                            {o.label}
                                            {sortBy === o.value && <Check size={12} />}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Featured Banner */}
                {activeCategory === 'All' && !searchQuery && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl overflow-hidden mb-5 relative h-36 shadow-lg"
                    >
                        <img src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80"
                            alt="Banner" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                        <div className="absolute inset-0 p-5 flex flex-col justify-center">
                            <span className="text-[8px] font-black text-brand uppercase tracking-[0.2em] mb-1">Limited Time</span>
                            <h2 className="text-white text-xl font-black tracking-tighter leading-tight">Up to 35% OFF<br />on Auto Accessories</h2>
                            <div className="flex items-center gap-1 mt-2">
                                <Zap size={10} className="text-yellow-400" fill="currentColor" />
                                <p className="text-yellow-400 text-[9px] font-black uppercase tracking-widest">Flash Sale — Ends Today</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Products Grid */}
                <AnimatePresence mode="wait">
                    {filteredProducts.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                            <Package size={40} className="text-gray-200 mx-auto mb-3" />
                            <p className="font-black text-content-subtle text-sm">No products found</p>
                            <p className="text-content-muted text-[11px] mt-1">Try changing your filters</p>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
                            {filteredProducts.map((product, i) => {
                                const pId = product._id || product.id;
                                return (
                                    <ProductCard
                                        key={pId}
                                        product={product}
                                        index={i}
                                        inCart={isInCart(pId)}
                                        onAddToCart={() => handleAddToCart(product)}
                                        onViewCart={() => navigate('/cart')}
                                    />
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Cart FAB */}
            {cartCount > 0 && (
                <motion.div
                    initial={{ y: 100 }} animate={{ y: 0 }}
                    className="fixed bottom-24 left-4 right-4 z-50"
                >
                    <button onClick={() => navigate('/cart')}
                        className="w-full bg-brand text-white py-4 rounded-2xl font-black text-sm flex items-center justify-between px-5 shadow-2xl shadow-black/50 shadow-brand/30">
                        <div className="flex items-center gap-2">
                            <span className="bg-white/20 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black">
                                {cartCount}
                            </span>
                            <span>View Cart</span>
                        </div>
                        <span className="font-black">Go to Cart →</span>
                    </button>
                </motion.div>
            )}

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 40, x: '-50%' }}
                        className="fixed bottom-36 left-1/2 z-[100] bg-content text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 whitespace-nowrap"
                    >
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check size={11} strokeWidth={3} />
                        </div>
                        <span className="text-[11px] font-black">Added to cart!</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </MobileLayout>
    );
};

const ProductCard = ({ product, index, inCart, onAddToCart, onViewCart }) => {
    const navigate = useNavigate();
    const pId = product._id || product.id;
    const discount = Math.round(((product.price - product.salePrice) / product.price) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, type: 'spring', damping: 25 }}
            className="bg-white/5 rounded-3xl border border-white/5 shadow-soft overflow-hidden flex flex-col group transition-all"
        >
            <div className="p-2.5">
                <div
                    className="relative aspect-square rounded-2xl overflow-hidden bg-[#f8fafc] cursor-pointer"
                    onClick={() => navigate(`/e-shop/product/${pId}`)}
                >
                    <img src={product.image} alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />

                    {/* Badge */}
                    {product.badge && (
                        <div className="absolute top-3 left-3 z-20">
                            <span className="bg-white/95 backdrop-blur-sm text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-white/5 text-[#0f172a] ">
                                {product.badge}
                            </span>
                        </div>
                    )}

                    {/* Discount */}
                    <div className="absolute bottom-3 right-3 z-20 bg-[#1e293b]/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10 shadow-lg">
                        <span className="text-[9px] font-black text-white">{discount}% off</span>
                    </div>

                    {!product.inStock && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-30">
                            <span className="text-white text-[9px] font-black uppercase tracking-widest bg-red-500 px-3 py-1.5 rounded-xl shadow-lg">Sold Out</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 pb-4 pt-1 flex flex-col flex-1">
                <p className="text-[8px] font-black text-brand uppercase tracking-[0.2em] mb-0.5 opacity-80">{product.category}</p>
                <h3
                    className="text-[13px] font-bold text-[#0f172a] leading-tight mb-2 line-clamp-2 min-h-[34px] group-hover:text-brand transition-colors font-sans cursor-pointer"
                    onClick={() => navigate(`/e-shop/product/${pId}`)}
                >
                    {product.name}
                </h3>

                <div className="flex items-baseline gap-1.5 mb-4">
                    <span className="text-lg font-black text-[#0f172a] tracking-tight">₹{product.salePrice?.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 line-through font-bold opacity-50">₹{product.price?.toLocaleString()}</span>
                </div>

                {/* Refined Action Button */}
                {product.inStock ? (
                    inCart ? (
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={onViewCart}
                            className="w-full py-2.5 bg-green-500/10 border border-green-500/30 text-green-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                        >
                            <Check size={12} strokeWidth={3} /> In Cart
                        </motion.button>
                    ) : (
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={onAddToCart}
                            className="w-full py-3 bg-[#0f172a] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:bg-[#1e293b] active:brightness-90 transition-all"
                        >
                            <ShoppingCart size={13} fill="white" />
                            <span>Add to cart</span>
                        </motion.button>
                    )
                ) : (
                    <button disabled className="w-full py-3 bg-white/[0.02] text-gray-300 rounded-xl text-[9px] font-bold uppercase tracking-widest cursor-not-allowed border border-white/5">
                        Out of Stock
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default ShopPage;
