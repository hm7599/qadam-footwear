import { FlipCartButton } from '../components/common/FlipCartButton';
import { applyMeta } from '../utils/seo';
import { recentlyViewed } from '../utils/recent';
import { imgUrl, imgSrcSet } from '../utils/img';
import React, { useState, useEffect, useRef } from 'react';
import { displaySizes, DEFAULT_SIZE, sizeLabel, sizeLabelFull, pickDefaultSize } from '../utils/sizes';
import { StockAlertForm, PriceAlertButton, isSoldOut } from '../components/shop/AlertForms';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useCurrency } from '../context/CurrencyContext';
import { ProductCard } from '../components/shop/ProductCard';
import {
  Heart, ShoppingBag, Truck, RotateCcw, ShieldCheck, Layers,
  ChevronLeft, ChevronRight, ZoomIn, X, Check, Star, Camera,
  Ruler, Sparkles, HelpCircle, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductDetailsPageProps {
  products: Product[];
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({ products }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<number>(DEFAULT_SIZE);
  const [sizeError, setSizeError] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const flipTimer = React.useRef<number | undefined>(undefined);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'materials' | 'delivery'>('specs');

  // Review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const { addToCart, setIsCheckoutOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCompare, isInCompare } = useCompare();
  const { formatPrice, convertPrice } = useCurrency();
  const [qty, setQty] = useState(1);
  const [recent, setRecent] = useState<string[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchDetails() {
      if (!slug) return;
      setLoading(true);
      try {
        const found = await api.getProduct(slug);
        setProduct(found);
        setSelectedColor(found.colors[0]?.name || '');
        setSelectedSize(pickDefaultSize(found.sizes));
      } catch {
        const fallback = products.find(p => p.slug === slug || p.id === slug);
        if (fallback) {
          setProduct(fallback);
          setSelectedColor(fallback.colors[0]?.name || '');
          setSelectedSize(pickDefaultSize(fallback.sizes));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [slug, products]);

  // SEO + "recently viewed" for this product
  useEffect(() => {
    if (!product) return;
    setQty(1);
    setRecent(recentlyViewed.list().filter(sl => sl !== product.slug));
    recentlyViewed.add(product.slug);
    const price = product.salePrice || product.price;
    const inStock = !product.sizeStock || Object.values(product.sizeStock).some(v => Number(v) > 0);
    applyMeta({
      title: product.name,
      description: product.description || product.tagline,
      image: product.images?.[0],
      type: 'product',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: (product.images || []).map(i => new URL(i, location.origin).href),
        description: product.description || product.tagline,
        sku: product.id,
        brand: { '@type': 'Brand', name: product.brand || 'QADAM' },
        category: product.category,
        offers: {
          '@type': 'Offer',
          url: location.href,
          priceCurrency: 'PKR',
          price: convertPrice(price),
          availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
        ...(product.reviewCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount } } : {}),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24 bg-white">
        <div className="flex flex-col items-center gap-3 font-tech">
          <div className="h-7 w-7 animate-spin border-2 border-neutral-200 border-t-black" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
            Loading…
          </span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center pt-24 text-center bg-white px-4">
        <h2 className="font-display text-xl font-bold text-neutral-900 uppercase tracking-widest">
          Product Not Found
        </h2>
        <p className="font-tech text-xs text-neutral-500 mt-2 uppercase tracking-wider">
          This product is no longer available.
        </p>
        <Link
          to="/shop"
          className="mt-6 bg-black px-8 py-3.5 font-tech text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-colors"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const currentColorObj = product.colors.find(c => c.name === selectedColor) || product.colors[0];
  const displayImage = currentColorObj?.previewImage || product.images[activeImageIdx] || product.images[0];
  const price = product.salePrice || product.price;
  const soldOut = !!selectedSize && isSoldOut(product, selectedSize);

  const handleAddToCart = (e?: React.MouseEvent<HTMLElement>) => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    if (soldOut) return;
    setSizeError(false);
    // Fly from the photo if it's on screen, otherwise from the button that was tapped
    const stage = stageRef.current;
    const r = stage?.getBoundingClientRect();
    const stageVisible = !!r && r.bottom > 80 && r.top < window.innerHeight - 80;
    addToCart(product, selectedColor, selectedSize, qty, stageVisible ? stage : (e?.currentTarget ?? stage));
    setAddedToCart(true);
    window.clearTimeout(flipTimer.current);
    flipTimer.current = window.setTimeout(() => setAddedToCart(false), 6000);
  };

  const goToCheckout = () => {
    window.clearTimeout(flipTimer.current);
    setAddedToCart(false);
    setIsCheckoutOpen(true);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    if (soldOut) return;
    setSizeError(false);
    addToCart(product, selectedColor, selectedSize, qty, null);
    setIsCheckoutOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !reviewComment) return;
    try {
      const updated = await api.submitReview(product.id, {
        author: reviewAuthor || 'QADAM Customer',
        rating: reviewRating,
        title: reviewTitle || 'Great quality',
        comment: reviewComment,
      });
      setProduct(updated);
      setReviewSuccess(true);
      setTimeout(() => {
        setIsReviewModalOpen(false);
        setReviewSuccess(false);
        setReviewComment('');
        setReviewAuthor('');
        setReviewTitle('');
      }, 1600);
    } catch (err) {
      console.warn('Review error:', err);
    }
  };

  const relatedProducts = products
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const prevImage = () => setActiveImageIdx(i => (i - 1 + product.images.length) % product.images.length);
  const nextImage = () => setActiveImageIdx(i => (i + 1) % product.images.length);

  const discountPct = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0;
  const hasEuSizes = product.sizes.some(s => s >= 30);
  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.src.includes('formal_oxford_set3_3.jpg')) img.src = '/images/atelier/formal_oxford_set3_3.jpg';
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] pt-28 sm:pt-32 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* ── BREADCRUMBS ── */}
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
          <Link to="/" className="hover:text-neutral-900 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/shop" className="hover:text-neutral-900 transition-colors">Shop</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-neutral-700">{product.name}</span>
        </nav>

        {/* ── MAIN PRODUCT STAGE ── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-14">

          {/* LEFT: Gallery */}
          <div className="lg:col-span-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row lg:sticky lg:top-28">
              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto sm:max-h-[520px] sm:flex-col sm:overflow-y-auto sm:overflow-x-visible">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      onMouseEnter={() => setActiveImageIdx(idx)}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white transition-all sm:h-[72px] sm:w-[72px] ${
                        activeImageIdx === idx ? 'ring-2 ring-neutral-900 ring-offset-2 ring-offset-[#FAFAF9]' : 'ring-1 ring-neutral-200 opacity-70 hover:opacity-100'
                      }`}
                      aria-label={`Photo ${idx + 1}`}
                    >
                      <img src={imgUrl(img, 1200)} srcSet={imgSrcSet(img, [640, 960, 1200, 1600])} sizes="(min-width: 1024px) 50vw, 100vw" fetchPriority="high" decoding="async" alt="" className="h-full w-full object-cover" onError={onImgError} />
                    </button>
                  ))}
                </div>
              )}

              {/* Main photo */}
              <div
                ref={stageRef}
                className="group relative aspect-square w-full max-h-[520px] overflow-hidden rounded-3xl bg-white ring-1 ring-neutral-200/70 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)]"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`${activeImageIdx}-${selectedColor}`}
                    src={imgUrl(product.images[activeImageIdx] || displayImage, 200)} decoding="async" loading="lazy"
                    alt={product.name}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => setIsZoomed(true)}
                    onError={onImgError}
                    className="h-full w-full cursor-zoom-in object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </AnimatePresence>

                {/* Badges */}
                <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5">
                  {product.isNewArrival && <span className="rounded-full bg-neutral-950 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">New</span>}
                  {discountPct > 0 && <span className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold text-white">-{discountPct}%</span>}
                  {product.isLimitedEdition && <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-800 ring-1 ring-neutral-200">Limited</span>}
                </div>

                {/* Zoom */}
                <button
                  onClick={() => setIsZoomed(true)}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-black"
                  title="Zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>

                {/* Arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/80 px-2.5 py-1.5 backdrop-blur">
                      {product.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImageIdx(i)}
                          aria-label={`Photo ${i + 1}`}
                          className={`h-1.5 rounded-full transition-all ${i === activeImageIdx ? 'w-5 bg-neutral-900' : 'w-1.5 bg-neutral-400'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Details */}
          <div className="lg:col-span-6">
            <div className="space-y-6 lg:sticky lg:top-28">
              {/* Category + rating */}
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#F3E6D8] px-3 py-1 text-[11px] font-semibold capitalize text-[#7A4E30]">
                  {product.category.replace('-', ' ')}
                </span>
                <a href="#reviews" className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-black">
                  <span className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
                    ))}
                  </span>
                  <span className="font-semibold">{product.rating}</span>
                  <span className="text-neutral-400">({product.reviewCount})</span>
                </a>
              </div>

              {/* Title */}
              <div>
                <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-neutral-950 sm:text-4xl">{product.name}</h1>
                {product.tagline && <p className="mt-2 text-base text-neutral-500">{product.tagline}</p>}
              </div>

              {/* Price */}
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-3xl font-bold tracking-tight text-neutral-950">{formatPrice(price)}</span>
                {product.salePrice && (
                  <>
                    <span className="pb-1 text-base text-neutral-400 line-through">{formatPrice(product.price)}</span>
                    <span className="mb-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600">Save {discountPct}%</span>
                  </>
                )}
              </div>

              {/* Colour */}
              {product.colors.length > 0 && (
                <div>
                  <p className="mb-2.5 text-sm text-neutral-600">
                    Colour: <span className="font-semibold text-neutral-950">{selectedColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map(c => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c.name)}
                        title={c.name}
                        className={`h-9 w-9 rounded-full transition-all ${
                          selectedColor === c.name ? 'ring-2 ring-neutral-900 ring-offset-2 ring-offset-[#FAFAF9]' : 'ring-1 ring-neutral-300 hover:ring-neutral-500'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size */}
              <div>
                <div className="mb-2.5 flex items-center justify-between text-sm">
                  <span className={sizeError ? 'font-semibold text-red-600' : 'text-neutral-600'}>
                    {sizeError ? 'Please choose a size' : <>Size: <span className="font-semibold text-neutral-950">{sizeLabelFull(selectedSize)}</span></>}
                  </span>
                  <button onClick={() => setIsSizeGuideOpen(true)} className="flex items-center gap-1 text-xs text-neutral-500 underline-offset-2 hover:text-black hover:underline">
                    <Ruler className="h-3.5 w-3.5" /> Size guide
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {displaySizes(product.sizes).map(sz => {
                    const available = !hasEuSizes || product.sizes.includes(sz);
                    const active = selectedSize === sz;
                    const out = available && isSoldOut(product, sz);
                    return (
                      <button
                        key={sz}
                        disabled={!available}
                        onClick={() => { setSelectedSize(sz); setSizeError(false); }}
                        title={!available ? 'Not available' : out ? 'Sold out – tap to get notified' : undefined}
                        className={`relative h-12 overflow-hidden rounded-xl text-sm font-medium transition-all ${
                          !available
                            ? 'cursor-not-allowed bg-neutral-100 text-neutral-300'
                            : active
                            ? out ? 'bg-neutral-200 text-neutral-500 ring-2 ring-neutral-950' : 'bg-neutral-950 text-white shadow-md'
                            : out
                            ? 'bg-neutral-50 text-neutral-400 ring-1 ring-dashed ring-neutral-200 hover:ring-neutral-500 cursor-pointer'
                            : sizeError
                            ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                            : 'bg-white text-neutral-800 ring-1 ring-neutral-200 hover:ring-neutral-900 cursor-pointer'
                        }`}
                      >
                        {sizeLabel(sz)}
                        {out && <span className="absolute inset-x-0 bottom-0.5 text-[9px] font-medium uppercase tracking-wide text-neutral-400">Sold out</span>}
                        {!available && <span className="absolute left-1/2 top-1/2 h-px w-[120%] -translate-x-1/2 -translate-y-1/2 -rotate-[20deg] bg-neutral-300" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Back-in-stock sign-up for a sold-out size */}
              {soldOut && <StockAlertForm product={product} size={selectedSize} color={selectedColor} />}

              {/* Quantity */}
              {!soldOut && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-600">Quantity</span>
                  <div className="inline-flex items-center rounded-full ring-1 ring-neutral-300">
                    <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer">−</button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
                    <button type="button" onClick={() => setQty(q => Math.min(10, q + 1))} disabled={qty >= 10} aria-label="Increase quantity" className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer">+</button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  {!soldOut && (
                    <FlipCartButton
                      flipped={addedToCart}
                      onAdd={handleAddToCart}
                      onCheckout={goToCheckout}
                      className="h-14 flex-1"
                    />
                  )}
                  <button
                    onClick={handleBuyNow}
                    className={`${soldOut ? 'hidden' : 'flex'} h-14 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-sm font-semibold transition-all bg-gradient-to-r from-[#E5B56D] to-[#C9A46A] text-[#2A1A10] shadow-md shadow-[#C9A46A]/30 hover:shadow-lg`}
                  >
                    Buy Now <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleWishlist(product)}
                    title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 transition-all ${
                      isInWishlist(product.id) ? 'bg-red-50 text-red-500 ring-red-200' : 'bg-white text-neutral-600 ring-neutral-200 hover:ring-neutral-900'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => addToCompare(product)}
                    title="Compare"
                    className={`hidden h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 transition-all sm:flex ${
                      isInCompare(product.id) ? 'bg-neutral-950 text-white ring-neutral-950' : 'bg-white text-neutral-600 ring-neutral-200 hover:ring-neutral-900'
                    }`}
                  >
                    <Layers className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <PriceAlertButton product={product} size={selectedSize || undefined} />

              {/* Description */}
              {product.description && (
                <p className="text-sm leading-relaxed text-neutral-600">{product.description}</p>
              )}

              {/* Trust */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Truck, title: 'Free delivery', text: 'Cash on delivery' },
                  { icon: RotateCcw, title: 'Easy returns', text: '30-day exchange' },
                  { icon: ShieldCheck, title: '100% original', text: 'Quality checked' },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex flex-col items-center gap-1 rounded-2xl bg-white p-3 text-center ring-1 ring-neutral-200/70">
                    <Icon className="h-5 w-5 text-[#7A4E30]" />
                    <span className="text-xs font-semibold text-neutral-900">{title}</span>
                    <span className="text-[11px] text-neutral-500">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── TECHNICAL SPECS & DETAILS TABS ── */}
        <div className="mt-20 border-t border-neutral-200 pt-16">
          <div className="flex items-center gap-3 border-b border-neutral-200 mb-8 font-tech text-xs uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 font-bold transition-all border-b-2 ${
                activeTab === 'specs' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`pb-3 font-bold transition-all border-b-2 ${
                activeTab === 'materials' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'
              }`}
            >
              Materials
            </button>
            <button
              onClick={() => setActiveTab('delivery')}
              className={`pb-3 font-bold transition-all border-b-2 ${
                activeTab === 'delivery' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'
              }`}
            >
              Delivery
            </button>
          </div>

          {activeTab === 'specs' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-tech">
              {[
                { label: 'Weight', value: product.specs.weight },
                { label: 'Cushioning', value: product.specs.cushioning },
                { label: 'Heel Drop', value: product.specs.heelDrop },
                { label: 'Upper Material', value: product.specs.upperMaterial },
                { label: 'Outsole', value: product.specs.soleMaterial },
                { label: 'Fit', value: product.specs.fit },
              ].map(({ label, value }) => (
                <div key={label} className="border border-neutral-200 bg-neutral-50/50 p-4">
                  <span className="text-[9px] uppercase tracking-widest text-neutral-400 block">{label}</span>
                  <p className="mt-1.5 text-xs sm:text-sm font-bold text-neutral-900 leading-tight">{value}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
              <div className="border border-neutral-200 p-6 bg-white space-y-2">
                <span className="font-tech text-[9px] uppercase tracking-widest text-neutral-400 block">LAYER 01</span>
                <h4 className="font-display text-base font-bold text-neutral-900">Real Italian Leather</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Soft, strong and breathable leather from Italy. It shapes to your foot the more you wear it.
                </p>
              </div>
              <div className="border border-neutral-200 p-6 bg-white space-y-2">
                <span className="font-tech text-[9px] uppercase tracking-widest text-neutral-400 block">LAYER 02</span>
                <h4 className="font-display text-base font-bold text-neutral-900">Soft Cushioned Sole</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  A light, bouncy sole that keeps your feet comfortable all day and does not flatten over time.
                </p>
              </div>
              <div className="border border-neutral-200 p-6 bg-white space-y-2">
                <span className="font-tech text-[9px] uppercase tracking-widest text-neutral-400 block">LAYER 03</span>
                <h4 className="font-display text-base font-bold text-neutral-900">Supportive Inner Plate</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  A light inner plate supports your arch and helps every step feel easy.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="border border-neutral-200 p-8 bg-neutral-50/60 max-w-3xl space-y-4 font-tech text-xs text-neutral-600">
              <div className="flex items-center gap-3 text-neutral-950 font-bold uppercase">
                <Truck className="h-5 w-5 text-black" />
                <span>Delivery Times</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="border border-neutral-200 bg-white p-4">
                  <span className="text-[10px] font-bold text-black uppercase block">All Over Pakistan</span>
                  <p className="text-[10px] text-neutral-500 mt-1">1–3 working days by TCS · Cash on Delivery available</p>
                </div>
                <div className="border border-neutral-200 bg-white p-4">
                  <span className="text-[10px] font-bold text-black uppercase block">Lahore & Karachi</span>
                  <p className="text-[10px] text-neutral-500 mt-1">Same-day or next-day delivery</p>
                </div>
                <div className="border border-neutral-200 bg-white p-4">
                  <span className="text-[10px] font-bold text-black uppercase block">Outside Pakistan</span>
                  <p className="text-[10px] text-neutral-500 mt-1">2–4 working days by DHL, with tracking</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── CUSTOMER REVIEWS SECTION ── */}
        {(() => {
          const reviews = product.reviews || [];
          const count = reviews.length;
          const avg = count ? reviews.reduce((n, r) => n + r.rating, 0) / count : (product.rating || 0);
          const dist = [5, 4, 3, 2, 1].map(st => ({ st, n: reviews.filter(r => Math.round(r.rating) === st).length }));
          return (
            <div id="reviews" className="mt-20 scroll-mt-28 border-t border-[#EDE1CF] pt-14">
              <div className="mb-8 text-center sm:text-left">
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A8824C]">Customer reviews</span>
                <h3 className="mt-1 font-serif text-2xl text-[#2A1A10] sm:text-3xl">What our customers say</h3>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Summary */}
                <div className="rounded-3xl border border-[#EDE1CF] bg-gradient-to-br from-white via-[#FDF9F3] to-[#F6EBDA] p-6 lg:col-span-4 lg:self-start">
                  <div className="flex items-center gap-4">
                    <span className="font-serif text-5xl leading-none text-[#2A1A10]">{avg.toFixed(1)}</span>
                    <div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.round(avg) ? 'fill-[#E5A93C] text-[#E5A93C]' : 'text-[#E5D3B5]'}`} />
                        ))}
                      </div>
                      <p className="mt-1 text-sm text-[#8A6A52]">{count} {count === 1 ? 'review' : 'reviews'}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-1.5">
                    {dist.map(d => (
                      <div key={d.st} className="flex items-center gap-2 text-xs text-[#8A6A52]">
                        <span className="w-3 text-right">{d.st}</span>
                        <Star className="h-3 w-3 fill-[#E5A93C] text-[#E5A93C]" />
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EDE1CF]">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#C9A46A] to-[#E5A93C]" style={{ width: `${count ? (d.n / count) * 100 : 0}%` }} />
                        </div>
                        <span className="w-4 text-right">{d.n}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3B2618] to-[#5A3A24] text-sm font-semibold text-white shadow-md shadow-[#3B2618]/25 transition hover:shadow-lg"
                  >
                    <Star className="h-4 w-4 text-[#E5B56D]" />
                    Write a review
                  </button>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-8">
                  {count > 0 ? (
                    reviews.map(rev => (
                      <div key={rev.id} className="rounded-2xl border border-[#EDE1CF] bg-white p-5 transition hover:border-[#C9A46A] hover:shadow-[0_16px_32px_-20px_rgba(59,38,24,0.3)]">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3B2618] font-serif text-sm text-[#F3D9A4]">
                            {(rev.author || '?').trim().charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#2A1A10]">{rev.author}</p>
                            <p className="text-xs text-[#A8907A]">{rev.date}</p>
                          </div>
                          <div className="flex shrink-0 gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < rev.rating ? 'fill-[#E5A93C] text-[#E5A93C]' : 'text-[#E5D3B5]'}`} />
                            ))}
                          </div>
                        </div>
                        {rev.title && <h4 className="mt-4 font-serif text-base text-[#2A1A10]">{rev.title}</h4>}
                        <p className="mt-1.5 text-sm leading-relaxed text-[#6E5442]">{rev.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5D3B5] bg-white/60 p-10 text-center md:col-span-2">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F6EFE4]">
                        <Star className="h-6 w-6 text-[#A8824C]" />
                      </span>
                      <p className="mt-4 font-serif text-lg text-[#2A1A10]">No reviews yet</p>
                      <p className="mt-1 text-sm text-[#8A6A52]">Be the first to review this shoe.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── RELATED PRODUCTS ── */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t border-neutral-200 pt-16">
            <span className="font-tech text-[9px] uppercase tracking-[0.35em] text-neutral-500 block mb-3">
              YOU MAY ALSO LIKE
            </span>
            <h3 className="font-display text-2xl font-black text-neutral-950 mb-8 tracking-tight">
              Similar Shoes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-5">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* ── RECENTLY VIEWED ── */}
        {(() => {
          const items = recent.map(sl => products.find(p => p.slug === sl)).filter((p): p is Product => !!p).slice(0, 4);
          if (!items.length) return null;
          return (
            <section className="mt-16 border-t border-neutral-200 pt-12" aria-labelledby="recent-heading">
              <h2 id="recent-heading" className="mb-6 font-serif text-2xl text-neutral-950">Recently viewed</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-4">
                {items.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          );
        })()}
      </div>

      {/* ── FULLSCREEN ZOOM LIGHTBOX ── */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setIsZoomed(false)}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-5 right-5 h-10 w-10 border border-white/20 bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              title="Close Zoom"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={imgUrl(product.images[activeImageIdx] || displayImage, 200)} decoding="async" loading="lazy"
              alt={product.name}
              className="max-h-[90vh] max-w-[90vw] object-contain drop-shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INTERACTIVE SIZE GUIDE MODAL ── */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSizeGuideOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white border border-neutral-200 p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="font-tech text-[9px] uppercase tracking-[0.25em] text-neutral-500 mb-1">
                SIZE CHART
              </div>
              <h3 className="font-display text-2xl font-black uppercase text-neutral-950 mb-4">
                Find Your Size
              </h3>
              <p className="font-sans text-xs text-neutral-600 mb-6">
                Choose your normal shoe size. If you are between two sizes, pick the bigger one.
              </p>

              {/* Conversion Table */}
              <div className="overflow-x-auto border border-neutral-200 mb-6 font-tech text-xs">
                <table className="w-full text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">US Men</th>
                      <th className="p-3">UK</th>
                      <th className="p-3">EU</th>
                      <th className="p-3">CM</th>
                      <th className="p-3">Inches</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-neutral-800">
                    {[
                      { us: 7, uk: 6.5, eu: 40, cm: 25.0, in: 9.8 },
                      { us: 7.5, uk: 7, eu: 40.5, cm: 25.5, in: 10.0 },
                      { us: 8, uk: 7.5, eu: 41, cm: 26.0, in: 10.2 },
                      { us: 8.5, uk: 8, eu: 42, cm: 26.5, in: 10.4 },
                      { us: 9, uk: 8.5, eu: 42.5, cm: 27.0, in: 10.6 },
                      { us: 9.5, uk: 9, eu: 43, cm: 27.5, in: 10.8 },
                      { us: 10, uk: 9.5, eu: 44, cm: 28.0, in: 11.0 },
                      { us: 10.5, uk: 10, eu: 44.5, cm: 28.5, in: 11.2 },
                      { us: 11, uk: 10.5, eu: 45, cm: 29.0, in: 11.4 },
                      { us: 12, uk: 11.5, eu: 46, cm: 30.0, in: 11.8 },
                    ].map(row => (
                      <tr key={row.us} className="hover:bg-neutral-50">
                        <td className="p-3 font-bold text-black">{row.us}</td>
                        <td className="p-3">{row.uk}</td>
                        <td className="p-3">{row.eu}</td>
                        <td className="p-3">{row.cm} cm</td>
                        <td className="p-3">{row.in}&quot;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="bg-black text-white px-6 py-2.5 font-tech text-xs uppercase font-bold tracking-wider hover:bg-neutral-800"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── WRITE REVIEW MODAL ── */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-md border border-neutral-200 bg-white p-8 shadow-2xl"
            >
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="font-display text-lg font-bold text-black mb-1 uppercase tracking-wide">
                Share Your Experience
              </h3>
              <p className="font-tech text-[10px] text-neutral-500 mb-6 uppercase tracking-wider">
                Reviewing: {product.name}
              </p>

              {reviewSuccess ? (
                <div className="py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center bg-emerald-100 mx-auto mb-3">
                    <Check className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="font-tech text-xs font-bold text-emerald-700 uppercase tracking-widest">
                    Thank you for your review!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4 font-tech text-xs">
                  <div>
                    <label className="block font-bold text-neutral-600 mb-1.5 uppercase tracking-wider text-[10px]">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Julian Vance"
                      value={reviewAuthor}
                      onChange={e => setReviewAuthor(e.target.value)}
                      className="w-full border border-neutral-300 p-3 outline-none focus:border-black font-sans"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-600 mb-1.5 uppercase tracking-wider text-[10px]">
                      Review Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Very comfortable and stylish"
                      value={reviewTitle}
                      onChange={e => setReviewTitle(e.target.value)}
                      className="w-full border border-neutral-300 p-3 outline-none focus:border-black font-sans"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-600 mb-1.5 uppercase tracking-wider text-[10px]">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setReviewRating(r)}
                          className={`h-8 w-8 border transition-all ${
                            reviewRating >= r ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-400 hover:border-black'
                          }`}
                        >
                          <Star className="h-3.5 w-3.5 mx-auto" />
                        </button>
                      ))}
                      <span className="text-neutral-500 text-[10px] ml-1">{reviewRating} / 5</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-600 mb-1.5 uppercase tracking-wider text-[10px]">Evaluation Comments</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="How was the fit, comfort and quality?"
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      className="w-full border border-neutral-300 p-3 outline-none focus:border-black resize-none font-sans"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-black py-3.5 font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors text-[11px]"
                    >
                      Submit Review
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(false)}
                      className="border border-neutral-300 px-5 py-3.5 text-neutral-600 hover:bg-neutral-50 transition-colors text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STICKY ADD TO CART BAR ON MOBILE ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 py-3 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-display text-xs font-bold text-neutral-950 truncate">{product.name}</p>
            <p className="font-tech text-[10px] text-neutral-500 font-bold">{formatPrice(price)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSizeGuideOpen(true)}
              className="border border-neutral-300 p-2 text-neutral-600"
              title="Size Guide"
            >
              <Ruler className="h-4 w-4" />
            </button>
            <FlipCartButton
              flipped={addedToCart}
              onAdd={handleAddToCart}
              onCheckout={goToCheckout}
              className="h-11 w-[150px] shrink-0"
              textClassName="font-tech text-[11px] font-bold uppercase tracking-wider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
