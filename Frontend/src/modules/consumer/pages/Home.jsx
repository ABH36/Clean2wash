import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, ChevronDown, Bell, ChevronRight, Star, Clock,
    ShieldCheck, Droplets, Zap, ArrowRight, Phone, Car, Percent,
    ShoppingCart, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/layout/MobileLayout';
import { useCart, SHOP_PRODUCTS } from '../../../context/CartContext';

const IMAGES = {
    heroCar: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    foamWash: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&q=80',
    interiorClean: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80',
    tireshine: 'https://images.unsplash.com/photo-1611455600759-99abfc83e9c4?w=600&q=80',
    captain1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    captain2: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    captain3: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
};

const Home = () => {
    const navigate = useNavigate();
    const { addToCart, isInCart, cartCount } = useCart();
    const [toast, setToast] = useState(null);

    const featuredProducts = SHOP_PRODUCTS.slice(0, 6);

    const handleAddToCart = (product) => {
        addToCart(product);
        setToast(product.name);
        setTimeout(() => setToast(null), 2000);
    };

    return (
        <MobileLayout>
            {/* ── Header ── */}
            <header className="px-4 pt-10 pb-3 bg-white sticky top-0 z-50 border-b border-gray-100">
                <div className="flex justify-between items-center">
                    <button className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center">
                            <MapPin size={15} className="text-brand" strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                            <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest leading-none">Delivering To</p>
                            <p className="text-sm font-black text-content flex items-center gap-1 mt-0.5">
                                HSR Layout <ChevronDown size={11} className="text-brand" strokeWidth={3} />
                            </p>
                        </div>
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/cart')}
                            className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <ShoppingCart size={16} className="text-content-muted" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand text-white text-[8px] font-black rounded-full flex items-center justify-center">{cartCount}</span>
                            )}
                        </button>
                        <button
                            onClick={() => navigate('/notifications')}
                            className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <Bell size={16} className="text-content-muted" />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand rounded-full" />
                        </button>
                        <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-xl overflow-hidden border-2 border-brand/20">
                            <img src={IMAGES.captain1} alt="User" className="w-full h-full object-cover" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="pb-24 px-4 space-y-4 pt-4">

                {/* ── Hero ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl overflow-hidden relative shadow-soft border border-gray-100"
                    style={{ height: 280 }}
                >
                    <img src={IMAGES.heroCar} alt="Car Wash" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

                    <div className="absolute inset-0 p-5 flex flex-col justify-between">
                        <div className="self-start flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-white text-[9px] font-black uppercase tracking-widest">Captains Nearby</span>
                        </div>
                        <div>
                            <p className="text-white/60 text-[9px] font-black uppercase tracking-widest mb-1">Smart Vehicle 360°</p>
                            <h1 className="text-white text-3xl font-black leading-tight tracking-tighter mb-4">
                                Spotless.<br />At Your <span className="text-brand">Doorstep.</span>
                            </h1>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/services')}
                                className="flex items-center gap-2 bg-brand text-white px-5 py-3 rounded-xl font-black text-sm shadow-lg shadow-brand/30"
                            >
                                Book a Wash
                                <div className="bg-white/20 p-1 rounded-lg"><ArrowRight size={13} strokeWidth={3} /></div>
                            </motion.button>
                        </div>
                    </div>
                    <div className="absolute top-4 right-4 bg-white rounded-xl px-3 py-2 shadow-lg flex items-center gap-1.5">
                        <Clock size={12} className="text-brand" />
                        <span className="text-[10px] font-black text-content">ETA 20 min</span>
                    </div>
                </motion.div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: '2.5M+', sub: 'Downloads' },
                        { label: '4.8★', sub: 'Rating' },
                        { label: '60+', sub: 'Cities' },
                    ].map((s) => (
                        <div key={s.label} className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-soft">
                            <p className="text-lg font-black text-content tracking-tight leading-none">{s.label}</p>
                            <p className="text-[9px] font-bold text-content-subtle uppercase tracking-wider mt-1">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ── Services ── */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-black tracking-tight text-content">Our Services</h2>
                        <button onClick={() => navigate('/services')} className="flex items-center gap-1 text-brand text-[10px] font-black uppercase tracking-widest">
                            View All <ChevronRight size={11} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Hero service card */}
                    <motion.div
                        whileTap={{ scale: 0.98 }} onClick={() => navigate('/map?type=captain&service=eco')}
                        className="rounded-2xl overflow-hidden relative shadow-soft border border-gray-100 mb-3 cursor-pointer"
                        style={{ height: 160 }}
                    >
                        <img src={IMAGES.foamWash} alt="Eco Wash" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                        <div className="absolute inset-0 p-5 flex flex-col justify-center">
                            <div className="inline-flex items-center gap-1.5 bg-brand px-2.5 py-1 rounded-lg self-start mb-2">
                                <Zap size={11} className="text-white" fill="white" />
                                <span className="text-white text-[8px] font-black uppercase tracking-widest">Instant</span>
                            </div>
                            <h3 className="text-white text-xl font-black tracking-tight leading-none mb-1">Eco Doorstep Wash</h3>
                            <p className="text-white/60 text-[10px] font-bold italic mb-3">Captain in 30 min</p>
                            <div className="flex items-center justify-between">
                                <span className="text-white font-black text-base">Starts ₹299</span>
                                <div className="bg-white/20 p-2 rounded-lg"><ArrowRight size={14} className="text-white" strokeWidth={2.5} /></div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-3">
                        <MiniCard image={IMAGES.interiorClean} label="Interior Deep Clean" price="₹699" badge="Popular" onClick={() => navigate('/services')} />
                        <MiniCard image={IMAGES.tireshine} label="Tire & Rim Shine" price="₹199" badge="New" onClick={() => navigate('/services')} />
                    </div>
                </div>

                {/* ── Auto-Care Shop ── */}
                <div>
                    {/* Section Header */}
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-content leading-tight">Auto-Care Shop</h2>
                            <p className="text-[9px] font-bold text-content-subtle uppercase tracking-widest mt-0.5">Products & Accessories</p>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/shop')}
                            className="flex items-center gap-1.5 border border-gray-200 text-content-muted px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest"
                        >
                            Visit Store <ArrowRight size={11} strokeWidth={3} />
                        </motion.button>
                    </div>

                    {/* Category Chips — refined monochrome */}
                    <div className="flex gap-2 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                        {[
                            { label: 'Electronics', icon: Zap },
                            { label: 'Accessories', icon: ShieldCheck },
                            { label: 'Cleaning', icon: Droplets },
                        ].map(({ label, icon: Icon }) => (
                            <motion.button
                                key={label}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/shop')}
                                className="flex-shrink-0 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 hover:border-brand/30 hover:bg-brand/5 transition-colors group"
                            >
                                <div className="w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center group-hover:border-brand/20 transition-colors">
                                    <Icon size={12} className="text-content-muted group-hover:text-brand transition-colors" />
                                </div>
                                <span className="text-[10px] font-black text-content-muted uppercase tracking-widest group-hover:text-content transition-colors">{label}</span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Products Horizontal Scroll */}
                    <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
                        {featuredProducts.map((product) => {
                            const inCart = isInCart(product.id);
                            const discount = Math.round(((product.price - product.salePrice) / product.price) * 100);
                            return (
                                <motion.div
                                    key={product.id}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex-shrink-0 w-44 bg-white rounded-2xl border border-gray-100 overflow-hidden"
                                    style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
                                >
                                    <div className="relative h-36 overflow-hidden bg-gray-50">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Minimal badge — top left */}
                                        {product.badge && (
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md border border-gray-200">
                                                <span className="text-[8px] font-black text-content uppercase tracking-wider">{product.badge}</span>
                                            </div>
                                        )}
                                        {/* Discount pill — top right */}
                                        <div className="absolute top-2 right-2 bg-content/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                                            <span className="text-[8px] font-black text-white">{discount}% off</span>
                                        </div>
                                        {/* Out of stock */}
                                        {!product.inStock && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                                <span className="text-[9px] font-black text-content-muted bg-white border border-gray-200 px-3 py-1 rounded-lg uppercase tracking-widest">Sold Out</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <p className="text-[8px] font-bold text-content-subtle uppercase tracking-widest mb-0.5">{product.category}</p>
                                        <h3 className="text-[11px] font-black text-content leading-tight mb-2 line-clamp-2 min-h-[28px]">{product.name}</h3>
                                        <div className="flex items-baseline gap-1.5 mb-2.5">
                                            <span className="text-sm font-black text-content">₹{product.salePrice.toLocaleString()}</span>
                                            <span className="text-[9px] text-content-subtle line-through opacity-60">₹{product.price.toLocaleString()}</span>
                                        </div>
                                        {inCart ? (
                                            <button
                                                onClick={() => navigate('/cart')}
                                                className="w-full py-2 bg-gray-50 border border-gray-200 text-content-muted rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                                            >
                                                <Check size={10} strokeWidth={3} className="text-brand" /> In Cart
                                            </button>
                                        ) : (
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleAddToCart(product)}
                                                disabled={!product.inStock}
                                                className="w-full py-2 bg-content text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 disabled:opacity-40"
                                            >
                                                <ShoppingCart size={10} /> Add to Cart
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                        {/* See All Card */}
                        <motion.div
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/shop')}
                            className="flex-shrink-0 w-28 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer"
                        >
                            <div className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center">
                                <ArrowRight size={16} className="text-content-muted" strokeWidth={2} />
                            </div>
                            <p className="text-[9px] font-black text-content-subtle uppercase tracking-widest text-center leading-tight">See All<br />Products</p>
                        </motion.div>
                    </div>

                    {/* Minimal perks strip */}
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 mt-3">
                        {[
                            { icon: Zap, label: 'Free Delivery', sub: 'Above ₹999' },
                            { icon: ShieldCheck, label: 'Easy Returns', sub: '7-day policy' },
                            { icon: Droplets, label: 'Genuine', sub: '100% authentic' },
                        ].map((perk, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                <perk.icon size={14} className="text-content-muted" />
                                <p className="text-[8px] font-black text-content uppercase tracking-widest leading-none">{perk.label}</p>
                                <p className="text-[8px] font-bold text-content-subtle">{perk.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Offer Banner ── */}
                <div className="bg-content rounded-2xl p-5 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Percent size={12} className="text-accent-yellow" strokeWidth={2.5} />
                            <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">New User Offer</span>
                        </div>
                        <h3 className="text-white text-2xl font-black tracking-tight leading-tight mb-1">
                            Flat <span className="text-brand">₹60 OFF</span> on First Wash
                        </h3>
                        <p className="text-white/40 text-[10px] font-bold mb-4">
                            Code: <span className="text-accent-yellow font-black">CARWASHFIRST</span>
                        </p>
                        <button onClick={() => navigate('/services')} className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-lg">
                            Claim Now <ArrowRight size={13} strokeWidth={3} />
                        </button>
                    </div>
                    <Car size={120} className="absolute -right-6 top-1/2 -translate-y-1/2 text-white/5" />
                </div>

                {/* ── Captains ── */}
                <div>
                    <h2 className="text-lg font-black tracking-tight text-content mb-3">Top Captains Near You</h2>
                    <div className="space-y-2">
                        {[
                            { name: 'Rahul Sharma', rating: 4.9, washes: '2.4k', dist: '0.8 km', img: IMAGES.captain1, badge: 'Elite' },
                            { name: 'Amit Singh', rating: 4.8, washes: '1.8k', dist: '1.2 km', img: IMAGES.captain2, badge: 'Pro' },
                            { name: 'Vikram Das', rating: 4.7, washes: '1.1k', dist: '2.5 km', img: IMAGES.captain3, badge: null },
                        ].map((c) => <CaptainCard key={c.name} {...c} onClick={() => navigate('/map')} />)}
                    </div>
                </div>

                {/* ── Trust ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
                    <h2 className="text-base font-black tracking-tight text-content mb-4">Why <span className="text-brand">CarWash?</span></h2>
                    <div className="space-y-4">
                        {[
                            { icon: <ShieldCheck size={18} className="text-green-500" />, title: 'Insured Washes', desc: "Covered under CarWash's ₹5L vehicle protection policy." },
                            { icon: <Droplets size={18} className="text-blue-500" />, title: 'Eco-Tech Formula', desc: 'Waterless, OECD-certified, 100% biodegradable products.' },
                            { icon: <Zap size={18} className="text-brand" fill="currentColor" />, title: 'Instant Dispatch', desc: 'AI matching gets a carwash professional at your door in 30 mins.' },
                        ].map((item) => (
                            <div key={item.title} className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">{item.icon}</div>
                                <div>
                                    <h3 className="font-black text-sm text-content tracking-tight">{item.title}</h3>
                                    <p className="text-[10px] font-bold text-content-subtle leading-relaxed mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Support ── */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                    <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Phone size={17} className="text-white" fill="white" />
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-content-subtle uppercase tracking-widest">24/7 Support</p>
                        <p className="text-sm font-black text-content">+91 73509 82181</p>
                    </div>
                    <button className="ml-auto bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest text-content">Call</button>
                </div>

            </div>

            {/* ── Toast Notification ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 48, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 48, x: '-50%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        className="fixed bottom-28 left-1/2 z-[200] bg-content text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-none"
                    >
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check size={11} strokeWidth={3} className="text-white" />
                        </div>
                        <span className="text-[11px] font-black whitespace-nowrap">Added to cart!</span>
                        <button
                            onClick={() => navigate('/cart')}
                            className="text-brand text-[10px] font-black uppercase tracking-widest ml-1 pointer-events-auto"
                        >
                            View →
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </MobileLayout>
    );
};

const MiniCard = ({ image, label, price, badge, onClick }) => (
    <motion.div whileTap={{ scale: 0.97 }} onClick={onClick}
        className="rounded-xl overflow-hidden relative shadow-soft border border-gray-100 cursor-pointer" style={{ height: 130 }}>
        <img src={image} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
        <div className="absolute inset-0 p-3 flex flex-col justify-between">
            {badge && <span className="self-start bg-accent-yellow text-black text-[8px] font-black px-2 py-0.5 rounded-lg">{badge}</span>}
            <div>
                <p className="text-white text-[11px] font-black leading-tight">{label}</p>
                <p className="text-brand-light text-sm font-black">{price}</p>
            </div>
        </div>
    </motion.div>
);

const CaptainCard = ({ name, rating, washes, dist, img, badge, onClick }) => (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick}
        className="w-full bg-white rounded-xl border border-gray-100 shadow-soft px-4 py-3 flex items-center gap-3 text-left group hover:border-brand/20 transition-colors">
        <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100">
                <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <h3 className="font-black text-sm text-content tracking-tight truncate">{name}</h3>
                {badge && <span className="bg-brand/10 text-brand text-[8px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0">{badge}</span>}
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1"><Star size={10} className="text-yellow-500" fill="currentColor" /><span className="text-[10px] font-black text-content">{rating}</span></div>
                <span className="text-content-subtle text-[9px] font-bold">{washes} washes</span>
                <span className="text-brand text-[9px] font-black">{dist}</span>
            </div>
        </div>
        <ChevronRight size={14} strokeWidth={2.5} className="text-gray-300 group-hover:text-brand flex-shrink-0" />
    </motion.button>
);

export default Home;
