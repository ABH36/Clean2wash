import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ShoppingCart, Heart, Star, Share2,
    ShieldCheck, Truck, RefreshCw, ChevronRight,
    Zap, ShoppingBag, Check, Plus, Minus, MessageCircle,
    Package
} from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import { useCart } from '../../../context/CartContext';
import { Crown } from 'lucide-react';

import { useWishlist } from '../../../context/WishlistContext';
import { productAPI } from '../../../utils/api';
import VerifiedBadge from '../components/ui/VerifiedBadge';
import { useGeoLocation } from '../../../hooks/useGeoLocation';
import { useAuth } from '../../../context/AuthContext';




const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, isInCart, cartCount } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [toast, setToast] = useState(false);
    const { user } = useAuth();
    const { selectedAddress } = useGeoLocation();
    const isBlackPassMember = user?.subscription?.plan === 'black';
    const [deliveryEta, setDeliveryEta] = useState('2-3 Days');

    useEffect(() => {
        if (product && selectedAddress) {
            // Simple distance-based ETA logic
            // In a real app, this would use OSRM or Google Maps API
            setDeliveryEta('Delivering in 24-48 Hours');
        }
    }, [product, selectedAddress]);


    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await productAPI.getProduct(id);
                if (res.status === 'success') {
                    setProduct(res.data.product);
                } else {
                    navigate('/e-shop');
                }
            } catch (err) {
                console.error("Failed to fetch product:", err);
                navigate('/e-shop');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate]);

    useEffect(() => {
        if (activeTab === 'reviews') {
            fetchReviews();
        }
    }, [activeTab, id]);

    const fetchReviews = async () => {
        try {
            setReviewsLoading(true);
            const res = await productAPI.getProductReviews(id);
            if (res.status === 'success') {
                setReviews(res.data.reviews);
            }
        } catch (err) {
            console.error("Failed to fetch reviews:", err);
        } finally {
            setReviewsLoading(false);
        }
    };

    if (loading) return (
        <MobileLayout hideNav={true}>
            <div className="bg-white min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
        </MobileLayout>
    );

    if (!product) return null;

    const pId = product._id || product.id;
    const inCart = isInCart(pId);
    const inWishlist = isInWishlist(pId);
    const discount = Math.round(((product.price - product.salePrice) / product.price) * 100);

    const handleAddToCart = () => {
        addToCart(product, quantity);
        setToast(true);
        setTimeout(() => setToast(false), 2000);
    };

    return (
        <MobileLayout hideNav={true}>
            <div className="bg-white min-h-screen pb-32">
                {/* ── STICKY TOP NAV ── */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl px-5 pt-8 pb-4 flex items-center justify-between border-b border-black/[0.03]">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-content shadow-sm active:scale-90 transition-transform"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => toggleWishlist(product)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-transform ${inWishlist ? 'bg-brand/10 text-brand' : 'bg-gray-50 text-content-subtle'}`}
                        >
                            <Heart size={20} className={inWishlist ? 'fill-brand' : ''} />
                        </button>
                        <button
                            onClick={() => navigate('/cart')}
                            className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-content relative shadow-sm active:scale-90 transition-transform"
                        >
                            <ShoppingCart size={20} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── PRODUCT IMAGE SECTION ── */}
                <div className="pt-24 px-5">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square rounded-3xl bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center p-8 group"
                    >
                        {/* Subtle Glow like Home Page Expansion Banner */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand/5 via-transparent to-brand/10 opacity-60 group-hover:scale-110 transition-transform duration-700" />
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                        />

                        {/* Status Badges */}
                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                            {product.badge && (
                                <span className="bg-brand text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-brand/20">
                                    {product.badge}
                                </span>
                            )}
                            <span className="bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-black/10">
                                {discount}% OFF
                            </span>
                        </div>

                        {/* Share Button */}
                        <button className="absolute bottom-6 right-6 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-content-subtle shadow-lg active:scale-95 transition-all border border-gray-100">
                            <Share2 size={18} />
                        </button>
                    </motion.div>
                </div>

                {/* ── PRODUCT INFO SECTION ── */}
                <div className="px-5 mt-8 space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-brand font-black text-[10px] uppercase tracking-[0.3em]">{product.category}</span>
                            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                                <Star size={10} className="text-amber-500 fill-amber-500" />
                                <span className="text-[10px] font-black text-amber-700">{product.ratingsAverage?.toFixed(1) || '0.0'}</span>
                                <span className="text-[10px] font-bold text-amber-900/40">({product.ratingsQuantity || 0})</span>
                            </div>
                        </div>
                        <h1 className="text-2xl font-[1000] text-content leading-tight uppercase tracking-tight">{product.name}</h1>
                    </div>

                    <div className="flex items-center justify-between py-6 border-y border-gray-50">
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-3">
                                <span className={`text-4xl font-[1000] tracking-tighter ${isBlackPassMember ? 'text-brand' : 'text-content'}`}>
                                    ₹{(isBlackPassMember ? (product.salePrice * 0.7) : product.salePrice)?.toLocaleString()}
                                </span>
                                <span className="text-sm font-bold text-content-subtle line-through opacity-40">₹{product.price.toLocaleString()}</span>
                            </div>
                            {isBlackPassMember && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="px-2 py-1 bg-black rounded-lg flex items-center gap-1.5 shadow-lg shadow-black/10">
                                        <Crown size={10} className="text-brand" fill="currentColor" />
                                        <span className="text-[9px] font-black text-brand uppercase tracking-widest">Exclusive Member Price</span>
                                    </div>
                                </div>
                            )}
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">Inclusive of all taxes</p>
                        </div>

                        <div className="flex items-center h-12 bg-gray-50 rounded-2xl p-1 border border-gray-100">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-full flex items-center justify-center text-content-subtle active:scale-90 transition-transform"
                            >
                                <Minus size={16} />
                            </button>
                            <span className="w-8 text-center text-sm font-black tabular-nums">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-full flex items-center justify-center text-content-subtle active:scale-90 transition-transform"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col items-center text-center gap-2">
                            <Truck size={18} className="text-content-subtle" />
                            <span className="text-[8px] font-black text-content uppercase tracking-widest leading-none mx-[-10px]">
                                {deliveryEta.split(' ')[0]}<br />{deliveryEta.split(' ').slice(1).join(' ')}
                            </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col items-center text-center gap-2">
                            <RefreshCw size={18} className="text-content-subtle" />
                            <span className="text-[8px] font-black text-content uppercase tracking-widest leading-none">7 Days<br />Refund</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col items-center text-center gap-2">
                            <ShieldCheck size={18} className="text-content-subtle" />
                            <span className="text-[8px] font-black text-content uppercase tracking-widest leading-none">Safe<br />Payment</span>
                        </div>
                    </div>


                    {/* Tabs Section */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-6 border-b border-gray-100">
                            {['description', 'specifications', 'reviews'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-3 text-[10px] font-[1000] uppercase tracking-widest relative transition-colors ${activeTab === tab ? 'text-content' : 'text-content-subtle'}`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div layoutId="detailTab" className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-brand rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-[100px]">
                            {activeTab === 'description' && (
                                <p className="text-sm font-bold text-content-subtle leading-relaxed">
                                    {product.description} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                                </p>
                            )}
                             {activeTab === 'specifications' && (
                                <div className="space-y-3">
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Model Number</span>
                                        <span className="text-[10px] font-black text-content uppercase tracking-widest">{product._id?.substring(0, 8) || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-50">
                                        <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest">Category</span>
                                        <span className="text-[10px] font-black text-content uppercase tracking-widest">{product.category}</span>
                                    </div>
                                    {product.specifications?.length > 0 ? (
                                        product.specifications.map((spec, i) => (
                                            <div key={i} className="flex justify-between py-2 border-b border-gray-50">
                                                <span className="text-[10px] font-black text-content-subtle uppercase tracking-widest">{spec.key}</span>
                                                <span className="text-[10px] font-black text-content uppercase tracking-widest">{spec.value}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[10px] font-bold text-content-subtle py-4">No detailed specifications provided.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'delivery' && (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100"><Zap size={18} /></div>
                                        <div>
                                            <p className="text-[11px] font-[1000] text-content uppercase tracking-tight">Priority Delivery Available</p>
                                            <p className="text-[10px] font-bold text-content-subtle">Get it delivered within 24-48 hours in Indore.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 border border-green-100"><Package size={18} /></div>
                                        <div>
                                            <p className="text-[11px] font-[1000] text-content uppercase tracking-tight">Eco-Safe Packaging</p>
                                            <p className="text-[10px] font-bold text-content-subtle">100% biodegradable and zero plastic waste used.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'reviews' && (
                                <div className="space-y-6">
                                    {reviewsLoading ? (
                                        <div className="flex justify-center py-10">
                                            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : reviews.length === 0 ? (
                                        <div className="text-center py-10">
                                            <p className="text-[10px] font-black text-content-subtle uppercase tracking-widest leading-none">Identity Check: No Reviews Found</p>
                                        </div>
                                    ) : (
                                        reviews.map((rev, i) => (
                                            <div key={i} className="space-y-3 pb-6 border-b border-gray-50 last:border-none">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand font-black text-[10px]">
                                                            {rev.user?.name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-[11px] font-[1000] text-content uppercase tracking-tight">{rev.user?.name}</p>
                                                                {rev.isVerifiedPurchase && <VerifiedBadge type="purchase" />}
                                                            </div>
                                                            <div className="flex gap-0.5">
                                                                {[1, 2, 3, 4, 5].map(s => (
                                                                    <Star key={s} size={8} className={s <= rev.rating ? 'text-gold-500 fill-gold-500' : 'text-onyx-200'} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[8px] font-bold text-content-subtle lowercase">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs font-medium text-onyx-600 leading-relaxed pl-1">{rev.comment}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Support Section */}
                    <div className="bg-black text-white rounded-3xl p-6 relative overflow-hidden group">
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-tight leading-none mb-1">Need Help?</h3>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Talk to our experts</p>
                            </div>
                            <button className="bg-brand text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl shadow-brand/20 active:scale-95 transition-transform">
                                <MessageCircle size={24} />
                            </button>
                        </div>
                        <div className="absolute right-[-10%] bottom-[-20%] opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <ShoppingBag size={120} />
                        </div>
                    </div>
                </div>

                {/* ── STICKY FOOTER CTA ── */}
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-3xl px-5 py-6 flex items-center gap-4 border-t border-gray-100/50">
                    <button
                        onClick={() => {
                            addToCart(product, quantity);
                            navigate('/cart');
                        }}
                        className="flex-[0.4] h-14 bg-gray-50 border border-gray-100 rounded-2xl text-content text-[11px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        Buy Now
                    </button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddToCart}
                        className="flex-1 h-14 bg-brand text-white rounded-2xl text-[11px] font-[1000] uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-brand/20"
                    >
                        {inCart ? (
                            <><Check size={18} strokeWidth={3} /> Added to cart</>
                        ) : (
                            <><ShoppingCart size={18} fill="white" /> Add to cart</>
                        )}
                    </motion.button>
                </div>

                {/* Toast Notification */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: 50, x: '-50%' }}
                            className="fixed bottom-32 left-1/2 z-[100] bg-content text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 whitespace-nowrap border border-white/10"
                        >
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Check size={14} strokeWidth={3} />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[11px] font-black uppercase tracking-tight leading-none">Item Added to Cart</p>
                                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Ready for checkout</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MobileLayout>
    );
};

export default ProductDetail;
