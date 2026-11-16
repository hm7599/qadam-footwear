import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ArrowUpRight, ArrowRight, X, Sparkles, Check, ShoppingBag, Shield, ShieldCheck, Award, RefreshCw, Truck, CheckCircle2, ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { useWishlist } from '../../context/WishlistContext';
import { pickDefaultSize, sizeLabel, sizeLabelFull, SIZE_OPTIONS } from '../../utils/sizes';
import { isSoldOut } from '../shop/AlertForms';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { INITIAL_PRODUCTS } from '../../data/initialProducts';
import { Link } from 'react-router-dom';
import { imgUrl, imgSrcSet } from '../../utils/img';

export interface AtelierPhoto {
  id: string;
  title: string;
  category: 'oxford' | 'loafer' | 'boot' | 'monk' | 'sandal' | 'slide';
  leather: string;
  finish: string;
  image: string;
  edition: string;
  priceRs: number;
  slug: string;
  specs: {
    hide: string;
    construction: string;
    last: string;
    insole: string;
  };
}

export const ATELIER_PHOTOS: AtelierPhoto[] = [
  {
    id: 'oxford-2',
    title: 'QADAM Phantom Oxford Brogue',
    category: 'oxford',
    leather: 'Hand-Selected Box Calfskin',
    finish: 'Artisanal Wingtip Medallion Brogueing',
    image: '/images/shoes/oxford-brogue-transparent.png',
    edition: 'Goodyear Welted',
    priceRs: 110600,
    slug: 'qadam-phantom-01',
    specs: {
      hide: 'Full-Grain Box Calfskin (1.4mm)',
      construction: 'Closed-Channel Goodyear Welt Sole',
      last: 'Elegante D-Width Milanese Last',
      insole: 'Molded Natural Cork Bedding',
    }
  },
  {
    id: 'loafer-formal-italian',
    title: 'QADAM Sovereign Venetian Loafer',
    category: 'loafer',
    leather: 'Hand-Burnished Amber Calfskin',
    finish: 'Deep Glacé Patina with Beveled Waist',
    image: '/images/shoes/formal-italian-loafers.png',
    edition: 'Masterpiece Atelier',
    priceRs: 100800,
    slug: 'qadam-sovereign-venetian-loafer',
    specs: {
      hide: 'Hand-Buffed Venetian Calfskin',
      construction: 'Hand-Welted Oak-Bark Leather Sole',
      last: 'Anatomical Slip-On Loafer Last',
      insole: 'Cushioned Vegetable-Tanned Footbed',
    }
  },
  {
    id: 'boot-1',
    title: 'QADAM Tuscan Chelsea Sovereign',
    category: 'boot',
    leather: 'Tuscan Full-Grain Waxed Leather',
    finish: 'Warm Cognac with Dainite Commando Sole',
    image: '/images/atelier/formal_boot_set2_2.jpg',
    edition: 'Handmade in Milan',
    priceRs: 117600,
    slug: 'qadam-tuscan-chelsea-sovereign',
    specs: {
      hide: 'Waxed Tuscan Box Calfskin',
      construction: 'Storm-Welted Dainite Composite Sole',
      last: 'Curved Ankle Ergonomic Last',
      insole: 'Multi-Density Cork & Tempered Shank',
    }
  },
  {
    id: 'monk-chestnut',
    title: 'QADAM Florentine Double Monkstrap',
    category: 'monk',
    leather: 'Hand-Painted Museum Calfskin',
    finish: 'Chestnut Patina with Palladium Buckles',
    image: '/images/shoes/formal-monkstrap-chestnut.jpg',
    edition: 'Sartoriale Drop',
    priceRs: 107800,
    slug: 'qadam-florentine-double-monkstrap',
    specs: {
      hide: 'Museum Calfskin with Hand Patina',
      construction: '360° Goodyear Welted Leather Sole',
      last: 'Florentine Chiseled Last',
      insole: 'Breathable Arch-Support Bedding',
    }
  },
  {
    id: 'sandal-1',
    title: 'QADAM Artisan Leather Fisherman Sandal',
    category: 'sandal',
    leather: 'Vegetable-Tanned Italian Calfskin',
    finish: 'Crisscross Straps with Antique Brass Buckles',
    image: '/images/shoes/artisan-leather-sandal.jpg',
    edition: 'Summer Atelier',
    priceRs: 68600,
    slug: 'qadam-artisan-leather-sandal',
    specs: {
      hide: 'Hand-Oiled Vegetable-Tanned Calfskin',
      construction: 'Goodyear-Stitched Leather Sole',
      last: 'Ergonomic Open-Air Sandal Last',
      insole: 'Contoured Soft Calfskin Arch',
    }
  },
  {
    id: 'slide-1',
    title: 'QADAM Riviera Woven Leather Slide',
    category: 'slide',
    leather: 'Intrecciato Hand-Woven Calfskin',
    finish: 'Espresso & Nero with Cushioned Arch Bed',
    image: '/images/shoes/luxury-leather-slides.jpg',
    edition: 'Resort Archive',
    priceRs: 61600,
    slug: 'qadam-riviera-woven-leather-slide',
    specs: {
      hide: 'Hand-Interlaced Italian Calfskin',
      construction: 'Beveled Leather Sole with Rubber Inset',
      last: 'Relaxed Milanese Mules Last',
      insole: 'Anatomical Memory Foam Footbed',
    }
  },
  {
    id: 'casual-driving',
    title: 'QADAM Cognac Leather Driving Casual',
    category: 'loafer',
    leather: 'Supple Italian Grain Calfskin',
    finish: 'Hand-Stitched Moccasin Toe & Gommino Sole',
    image: '/images/shoes/cognac-driving-casual.jpg',
    edition: 'Bespoke Casual',
    priceRs: 82600,
    slug: 'qadam-cognac-leather-driving-casual',
    specs: {
      hide: 'Full-Grain Supple Italian Calfskin',
      construction: 'Hand-Lasted Tubular Moccasin',
      last: 'Flexible Driving Last',
      insole: 'Latex Cushioned Full-Leather Insole',
    }
  },
  {
    id: 'oxford-1',
    title: 'QADAM Patina Wholecut Oxford',
    category: 'oxford',
    leather: 'Single-Piece French Box Calf',
    finish: 'Sunburst Golden-Brown Mirror Glaze',
    image: '/images/atelier/formal_oxford_set3_3.jpg',
    edition: 'Limited Edition // 200 Pairs',
    priceRs: 123200,
    slug: 'qadam-patina-wholecut-oxford',
    specs: {
      hide: 'One-Piece Seamless French Calfskin',
      construction: 'Closed-Channel Hand Welt Sole',
      last: 'Sculpted Chisel-Toe Milanese Last',
      insole: 'Custom Moulded Cork Bedding',
    }
  },
  {
    id: 'loafer-horsebit',
    title: 'QADAM Horsebit Loafer',
    category: 'loafer',
    leather: 'Textured Box Calfskin',
    finish: 'Champagne Gold Horsebit Hardware',
    image: '/images/atelier/formal_horsebit_set5_2.jpg',
    edition: 'QADAM Sartoriale',
    priceRs: 105000,
    slug: 'qadam-horsebit-loafer',
    specs: {
      hide: 'Full-Grain Box Calfskin',
      construction: 'Goodyear Welted Beveled Sole',
      last: 'Elegante Loafer Last',
      insole: 'Arch Support Leather Insole',
    }
  },
  {
    id: 'monk-single',
    title: 'QADAM Florentine Single Monkstrap',
    category: 'monk',
    leather: 'Glacé Obsidian Calfskin',
    finish: 'Palladium Buckle with Beveled Waist',
    image: '/images/atelier/formal_prestige_set6_2.jpg',
    edition: 'Cordwainer Series',
    priceRs: 107800,
    slug: 'qadam-single-monk',
    specs: {
      hide: 'Fine-Grained Obsidian Calfskin',
      construction: 'Goodyear Welted Oak-Bark Leather Sole',
      last: 'Classic Florentine D-Last',
      insole: 'Breathable Natural Cork Insole',
    }
  },
  {
    id: 'oxford-derby-tan',
    title: 'QADAM Heritage Casual Derby Tan',
    category: 'oxford',
    leather: 'Hand-Buffed Tuscan Tan Calfskin',
    finish: 'Storm-Welted Open Lacing',
    image: '/images/shoes/formal-derby-tan.jpg',
    edition: 'Heritage Classic',
    priceRs: 91000,
    slug: 'qadam-heritage-casual-derby-tan',
    specs: {
      hide: 'Full-Grain Tuscan Tan Calf',
      construction: 'Storm-Welted Dainite Sole',
      last: 'Comfort Derby Last',
      insole: 'Ergonomic Leather Footbed',
    }
  }
];

export interface AtelierGalleryItem {
  id: string;
  title: string;
  category: 'oxford' | 'loafer' | 'boot' | 'monk' | 'sandal' | 'slide';
  leather: string;
  finish: string;
  image: string;
  edition: string;
  price: number;
  originalPrice?: number;
  slug: string;
  product: Product;
  isAtelierFeatured?: boolean;
  specs: {
    hide: string;
    construction: string;
    last: string;
    insole: string;
  };
}

const CATEGORIES = [
  { id: 'all', label: 'All Shoes' },
  { id: 'oxford', label: 'Oxfords & Brogues' },
  { id: 'loafer', label: 'Loafers & Casuals' },
  { id: 'boot', label: 'Chelsea Boots' },
  { id: 'monk', label: 'Monk Straps' },
  { id: 'sandal', label: 'Sandals & Slides' },
] as const;

export const AtelierPhotoGallery: React.FC<{ products?: Product[] }> = ({ products = INITIAL_PRODUCTS }) => {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [activeItem, setActiveItem] = useState<AtelierGalleryItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<number>(42);
  const [orderVersion, setOrderVersion] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [viewAll, setViewAll] = useState<boolean>(false);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = () => setOrderVersion(v => v + 1);
    window.addEventListener('qadam_products_updated', handleUpdate);
    window.addEventListener('qadam_gallery_order_updated', handleUpdate);
    return () => {
      window.removeEventListener('qadam_products_updated', handleUpdate);
      window.removeEventListener('qadam_gallery_order_updated', handleUpdate);
    };
  }, []);

  const ITEMS_PER_PAGE = 8;

  const { addToCart, setIsCartOpen, setIsCheckoutOpen } = useCart();
  const { formatPrice } = useCurrency();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveItem(null);
    };
    if (activeItem) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeItem]);

  const deletedIds: string[] = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('qadam_deleted_products') || '[]');
    } catch {
      return [];
    }
  }, []);

  const sourceProducts = (products && products.length > 0 ? products : INITIAL_PRODUCTS)
    .filter(p => !deletedIds.includes(p.id) && !deletedIds.includes(p.slug || ''));
  const liveProducts = sourceProducts.filter(p => p.status !== 'draft');

  // Build dynamic gallery items by merging live products with the showcase photos:
  const galleryItems: AtelierGalleryItem[] = React.useMemo(() => {
    // 1. Map existing ATELIER_PHOTOS with live data from products (excluding deleted items)
    const mapped: AtelierGalleryItem[] = [];
    for (const photo of ATELIER_PHOTOS) {
      if (deletedIds.includes(photo.slug) || deletedIds.includes(photo.id)) continue;
      const matched = liveProducts.find(p =>
        p.slug === photo.slug ||
        p.id === photo.slug ||
        p.slug === photo.slug.replace(/^qadam-/, 'aura-') ||
        p.slug.replace(/^qadam-/, '') === photo.slug.replace(/^qadam-/, '') ||
        (p.name && photo.title && p.name.trim().toLowerCase() === photo.title.trim().toLowerCase())
      );

      const targetProd = matched || INITIAL_PRODUCTS.find(p => p.slug === photo.slug && !deletedIds.includes(p.slug) && !deletedIds.includes(p.id));
      if (!targetProd) continue;
      const effPrice = targetProd.salePrice && targetProd.salePrice < targetProd.price ? targetProd.salePrice : targetProd.price;

      // Edition badge: prioritize admin custom edition, then special tags, then default photo edition
      let edition = targetProd.edition?.trim() || '';
      if (!edition) {
        if (targetProd.isLimitedEdition) edition = 'Limited Edition // 200 Pairs';
        else if (targetProd.isTrending) edition = 'Trending Pick';
        else if (targetProd.isBestSeller) edition = 'Best Seller';
        else if (targetProd.isNewArrival) edition = 'New Arrival';
        else edition = photo.edition;
      }

      mapped.push({
        id: targetProd.id || photo.id,
        title: targetProd.name || photo.title,
        category: photo.category,
        leather: targetProd.specs?.upperMaterial || photo.leather,
        finish: targetProd.tagline || photo.finish,
        image: targetProd.images?.[0] || targetProd.colors?.[0]?.previewImage || photo.image,
        edition,
        price: effPrice,
        originalPrice: targetProd.price,
        slug: targetProd.slug || photo.slug,
        product: targetProd,
        isAtelierFeatured: !!targetProd.isAtelierFeatured,
        specs: {
          hide: targetProd.specs?.upperMaterial || photo.specs.hide,
          construction: targetProd.specs?.soleMaterial || photo.specs.construction,
          last: targetProd.specs?.fit || photo.specs.last,
          insole: targetProd.specs?.cushioning || photo.specs.insole,
        }
      });
    }

    // 2. Also append any extra store products created in Admin Panel that aren't already represented
    const extras: AtelierGalleryItem[] = liveProducts
      .filter(p => !deletedIds.includes(p.id) && !deletedIds.includes(p.slug || '') && !mapped.some(m => m.slug === p.slug || m.id === p.id))
      .map(p => {
        const slugLower = (p.slug || '').toLowerCase();
        const nameLower = (p.name || '').toLowerCase();
        let cat: AtelierPhoto['category'] = 'loafer';
        if (slugLower.includes('monk') || nameLower.includes('monk')) cat = 'monk';
        else if (p.category === 'chelsea-boots' || slugLower.includes('boot') || slugLower.includes('chelsea') || nameLower.includes('boot')) cat = 'boot';
        else if (p.category === 'sandals' || slugLower.includes('sandal') || nameLower.includes('sandal')) cat = 'sandal';
        else if (p.category === 'slides' || slugLower.includes('slide') || nameLower.includes('slide')) cat = 'slide';
        else if (p.category === 'formals' || slugLower.includes('oxford') || slugLower.includes('brogue') || nameLower.includes('oxford') || nameLower.includes('brogue') || nameLower.includes('wholecut') || nameLower.includes('derby')) cat = 'oxford';

        let edition = p.edition?.trim() || '';
        if (!edition) {
          if (p.isLimitedEdition) edition = 'Limited Edition';
          else if (p.isTrending) edition = 'Trending Pick';
          else if (p.isBestSeller) edition = 'Best Seller';
          else if (p.isNewArrival) edition = 'New Arrival';
          else if (cat === 'sandal') edition = 'Summer Atelier';
          else if (cat === 'slide') edition = 'Resort Archive';
          else if (cat === 'boot') edition = 'Winter Atelier';
          else if (p.category === 'casuals') edition = 'Bespoke Casual';
          else edition = 'Handmade in Italy';
        }

        const effPrice = p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;

        return {
          id: p.id,
          title: p.name,
          category: cat,
          leather: p.specs?.upperMaterial || 'Full-Grain Box Calfskin',
          finish: p.tagline || p.description || 'Handcrafted Luxury Leather',
          image: p.images?.[0] || p.colors?.[0]?.previewImage || '/images/shoes/oxford-brogue-transparent.png',
          edition,
          price: effPrice,
          originalPrice: p.price,
          slug: p.slug,
          product: p,
          isAtelierFeatured: !!p.isAtelierFeatured,
          specs: {
            hide: p.specs?.upperMaterial || 'Full-Grain Box Calfskin',
            construction: p.specs?.soleMaterial || 'Goodyear Welt Sole',
            last: p.specs?.fit || 'Anatomical Milanese Last',
            insole: p.specs?.cushioning || 'Molded Natural Cork Bedding',
          }
        };
      });

    const combined = [...mapped, ...extras];

    // Check if admin has set a persistent shuffled sequence
    let adminOrder: string[] = [];
    try {
      adminOrder = JSON.parse(localStorage.getItem('qadam_gallery_order') || '[]');
    } catch {}

    if (Array.isArray(adminOrder) && adminOrder.length > 0) {
      return combined.sort((a, b) => {
        const aIdx = adminOrder.findIndex(k => k === a.id || (a.slug && k === a.slug));
        const bIdx = adminOrder.findIndex(k => k === b.id || (b.slug && k === b.slug));
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        const aFeat = a.isAtelierFeatured ? 1 : 0;
        const bFeat = b.isAtelierFeatured ? 1 : 0;
        return bFeat - aFeat;
      });
    }

    // Default: Prioritize products marked as Atelier Featured in admin panel
    return combined.sort((a, b) => {
      const aFeat = a.isAtelierFeatured ? 1 : 0;
      const bFeat = b.isAtelierFeatured ? 1 : 0;
      return bFeat - aFeat;
    });
  }, [liveProducts, orderVersion]);

  const filteredBase = React.useMemo(() => {
    return selectedCat === 'all'
      ? galleryItems
      : galleryItems.filter(p => {
          if (selectedCat === 'sandal') return p.category === 'sandal' || p.category === 'slide';
          return p.category === selectedCat;
        });
  }, [galleryItems, selectedCat]);

  const displayItems = filteredBase;
  const currentItems = displayItems;

  const product = activeItem ? activeItem.product : null;
  const euOnly = (product?.sizes || []).filter(s => s >= 30).sort((a, b) => a - b);
  const productSizes = euOnly.length ? euOnly : SIZE_OPTIONS;
  const price = activeItem ? activeItem.price : 0;

  useEffect(() => {
    if (!product) return;
    const def = pickDefaultSize(product.sizes);
    setSelectedSize(productSizes.includes(def) && !isSoldOut(product, def) ? def : productSizes.find(s => !isSoldOut(product, s)) || def);
    setAddedSuccess(false);
  }, [activeItem?.id]);

  const sizeOut = !!product && isSoldOut(product, selectedSize);

  const handleAddToCart = () => {
    if (!product || sizeOut) return;
    addToCart(product, product.colors?.[0]?.name || 'Standard', selectedSize, 1, null);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      setActiveItem(null);
      setIsCartOpen(true);
    }, 700);
  };

  const handleBuyNow = () => {
    if (!product || sizeOut) return;
    addToCart(product, product.colors?.[0]?.name || 'Standard', selectedSize, 1, null);
    setActiveItem(null);
    setIsCheckoutOpen(true);
  };

  return (
    <section id="atelier-gallery" className="bg-white py-20 sm:py-28 border-b border-neutral-200 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── SECTION HEADER ── */}
        <div className="relative flex flex-col items-center mb-12 text-center">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-10 bg-neutral-300" />
            <span className="font-tech text-[9.5px] uppercase tracking-[0.35em] text-[#9A7B4F] font-bold">
              QADAM ATELIER ARCHIVE
            </span>
            <span className="h-px w-10 bg-neutral-300" />
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-normal tracking-tight text-neutral-950">
            Handmade Leather Shoes
          </h2>
          <p className="max-w-2xl text-xs sm:text-sm text-neutral-600 mt-3 font-sans leading-relaxed">
            Every pair is sculpted on anatomical lasts, hand-burnished with natural carnauba wax, and reinforced with a 360° Goodyear-welted leather sole.
          </p>

          {/* Controls Row: Category Filter Pills + Shuffle & View Toggle & Pagination */}
          <div className="mt-8 w-full flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 font-tech">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-4 py-2 text-[10.5px] uppercase tracking-[0.14em] font-bold rounded-full transition-all cursor-pointer ${
                    selectedCat === cat.id
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'bg-white text-neutral-600 hover:text-black border border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Designs Count Pill */}
            <div className="flex items-center gap-2 font-tech">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10.5px] uppercase tracking-[0.16em] font-bold rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A8824C]" />
                {displayItems.length} {displayItems.length === 1 ? 'Design' : 'Designs Available'}
              </span>
            </div>
          </div>
        </div>

        {/* ── GALLERY GRID (4 Columns on Desktop) ── */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {currentItems.map((item, idx) => {
              const inWishlist = isInWishlist(item.product.id || item.id);
              const hasDiscount = !!(item.originalPrice && item.originalPrice > item.price);
              const discountPct = hasDiscount ? Math.round((1 - item.price / item.originalPrice!) * 100) : 0;
              const savings = hasDiscount ? item.originalPrice! - item.price : 0;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, delay: idx * 0.03 }}
                  className="group relative bg-white border border-neutral-200/90 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#C9A46A]/60 hover:shadow-[0_20px_40px_-15px_rgba(59,38,24,0.12)] hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image Canvas with hover zoom */}
                  <div
                    onClick={() => {
                      setActiveItem(item);
                      setSelectedSize(pickDefaultSize(item.product.sizes));
                    }}
                    className="relative aspect-square w-full overflow-hidden bg-[#FAFAF8] cursor-pointer flex items-center justify-center p-3 sm:p-4"
                  >
                    <img
                      src={imgUrl(item.image, 960)}
                      decoding="async"
                      alt={item.title}
                      loading="lazy"
                      className="max-h-[90%] max-w-[90%] object-contain mix-blend-multiply filter drop-shadow-[0_12px_16px_rgba(0,0,0,0.1)] transition-transform duration-700 ease-out group-hover:scale-108"
                    />

                    {/* Top-Left: Edition Tag & Featured Badge */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1 max-w-[70%]">
                      {item.edition && (
                        <span className="font-tech text-[8.5px] uppercase tracking-[0.16em] font-bold text-[#E5B56D] bg-[#2A1A10]/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#C9A46A]/30 shadow-xs">
                          {item.edition}
                        </span>
                      )}
                      {item.isAtelierFeatured && (
                        <span className="font-tech text-[8px] uppercase tracking-[0.15em] font-bold text-[#9A7B4F] bg-amber-50/95 px-2 py-0.5 rounded-full border border-amber-200/80 shadow-2xs flex items-center gap-1">
                          <Sparkles className="h-2 w-2 text-[#9A7B4F]" />
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Top-Right: Discount Tag & Wishlist Heart */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                      {hasDiscount && discountPct > 0 && (
                        <span className="rounded-full bg-red-600 text-white font-sans text-[10px] font-bold px-2 py-0.5 shadow-xs tracking-tight">
                          -{discountPct}%
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(item.product);
                        }}
                        title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                        className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/95 backdrop-blur-xs shadow-sm transition-all hover:scale-110 cursor-pointer border border-black/5 ${
                          inWishlist ? 'text-red-500 fill-red-500' : 'text-neutral-500 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current text-red-500' : ''}`} />
                      </button>
                    </div>

                    {/* Hover Quick View Floating Pill Button */}
                    <div className="absolute inset-x-3 bottom-3 z-10 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveItem(item);
                          setSelectedSize(pickDefaultSize(item.product.sizes));
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-white/95 backdrop-blur-md text-neutral-900 text-xs font-semibold shadow-md hover:bg-neutral-950 hover:text-white transition-all ring-1 ring-black/10 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Quick View</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata & Details */}
                  <div className="p-4 sm:p-5 bg-white space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Category kicker & Rating */}
                      <div className="flex items-center justify-between text-[10px] font-tech uppercase tracking-[0.2em] font-bold text-[#A8824C] mb-1">
                        <span>
                          {item.category === 'boot' ? 'Chelsea Boots' : item.category === 'oxford' ? 'Oxfords & Brogues' : item.category === 'loafer' ? 'Loafers & Casuals' : item.category === 'sandal' ? 'Sandals' : item.category === 'slide' ? 'Slides & Mules' : 'Handcrafted'}
                        </span>
                        {item.product.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-neutral-700 font-sans font-semibold">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span>{item.product.rating.toFixed(1)}</span>
                          </span>
                        )}
                      </div>

                      {/* Product Title */}
                      <Link to={`/product/${item.slug}`} className="block group/link">
                        <h3
                          style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }}
                          className="text-base sm:text-[17px] font-semibold text-neutral-950 group-hover/link:text-[#A8824C] transition-colors line-clamp-1 leading-snug"
                        >
                          {item.title}
                        </h3>
                      </Link>

                      {/* Subtitle / Finish */}
                      <p className="text-xs text-neutral-500 line-clamp-1 mt-1 font-normal leading-relaxed">
                        {item.finish || item.leather}
                      </p>
                    </div>

                    {/* Color swatches & EU Size Range */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        {item.product.colors && item.product.colors.length > 0 ? (
                          item.product.colors.slice(0, 4).map(c => (
                            <span
                              key={c.name}
                              title={c.name}
                              className="h-3 w-3 rounded-full border border-black/15 shadow-2xs"
                              style={{ backgroundColor: c.hex }}
                            />
                          ))
                        ) : (
                          <span className="h-3 w-3 rounded-full bg-[#4A2E1B] border border-black/15 shadow-2xs" />
                        )}
                        {item.product.colors && item.product.colors.length > 4 && (
                          <span className="text-[10px] text-neutral-400 font-semibold font-tech">
                            +{item.product.colors.length - 4}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-tech text-neutral-400 font-semibold uppercase tracking-wider">
                        EU 39–45
                      </span>
                    </div>

                    {/* Price and Action Button Bar */}
                    <div className="pt-3 flex items-center justify-between border-t border-neutral-100 mt-2">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-sans text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
                            {formatPrice(item.price)}
                          </span>
                          {hasDiscount && (
                            <span className="font-sans text-xs text-neutral-400 line-through font-medium">
                              {formatPrice(item.originalPrice!)}
                            </span>
                          )}
                        </div>
                        {hasDiscount && savings > 0 && (
                          <span className="text-[9.5px] text-emerald-700 font-bold font-tech uppercase tracking-wide">
                            Save {formatPrice(savings)}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/product/${item.slug}`}
                        className="font-tech text-[10.5px] uppercase tracking-wider font-bold text-neutral-900 hover:text-white bg-neutral-100 hover:bg-neutral-950 px-4 py-2 rounded-full inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <span>View</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* ── ATELIER STATEMENT BAR (REDESIGNED LUXURY SEAL) ── */}
        <div className="relative mt-16 sm:mt-20 overflow-hidden rounded-3xl bg-gradient-to-br from-[#121110] via-[#1a1714] to-[#0c0b0a] border border-[#C9A46A]/30 p-6 sm:p-10 lg:p-12 text-white shadow-2xl shadow-black/40">
          {/* Ambient Warm Glow & Atmospheric Lighting */}
          <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[#C9A46A]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#8C6430]/20 blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#C9A46A]/50 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-12">
            {/* Left: Medallion & Statement */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 max-w-3xl">
              <div className="relative flex-shrink-0">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-[#E6CA9A] via-[#C9A46A] to-[#8C6430] p-[1.5px] shadow-xl shadow-[#C9A46A]/20">
                  <div className="h-full w-full rounded-[14px] bg-[#141210] flex items-center justify-center">
                    <ShieldCheck className="h-8 w-8 sm:h-9 sm:w-9 text-[#E6CA9A]" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#C9A46A] text-neutral-950 flex items-center justify-center shadow-xs">
                  <Award className="h-3.5 w-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 font-tech text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-[#C9A46A] font-bold">
                  <Sparkles className="h-3 w-3 text-[#C9A46A]" />
                  <span>QADAM Quality Guarantee</span>
                </div>
                <h3 className="mt-1 font-serif text-xl sm:text-2xl lg:text-3xl font-normal tracking-tight text-white leading-tight">
                  100% Pure Genuine Leather & Handcrafted Guarantee
                </h3>
                <p className="mt-2 font-sans text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
                  Every pair is handmade and checked for quality, with free size exchange and Cash on Delivery all across Pakistan.
                </p>
              </div>
            </div>

            {/* Right: CTA Button */}
            <div className="flex-shrink-0 flex flex-col sm:items-start lg:items-end gap-2">
              <Link
                to="/shop"
                className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#D4AF37] via-[#C9A46A] to-[#A8824C] hover:from-[#E2C358] hover:to-[#B89258] text-neutral-950 px-8 py-4 font-tech text-xs uppercase font-bold tracking-[0.2em] rounded-xl shadow-xl shadow-[#C9A46A]/25 hover:shadow-[#C9A46A]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                <span>Explore Complete Collection</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
              <span className="font-tech text-[10px] uppercase tracking-[0.16em] text-neutral-400 flex items-center gap-1.5 self-center lg:self-end">
                <CheckCircle2 className="h-3 w-3 text-[#C9A46A]" />
                Direct From Master Shoemakers
              </span>
            </div>
          </div>

          {/* 4 Pillars Hallmarks Strip */}
          <div className="relative z-10 mt-8 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 hover:border-[#C9A46A]/40 rounded-xl p-3 sm:p-3.5 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-[#C9A46A]/10 text-[#C9A46A] flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-tech text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white truncate">Pure Real Leather</p>
                <p className="font-sans text-[10px] text-neutral-400 truncate">100% Genuine Leather</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 hover:border-[#C9A46A]/40 rounded-xl p-3 sm:p-3.5 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-[#C9A46A]/10 text-[#C9A46A] flex items-center justify-center shrink-0">
                <Award className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-tech text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white truncate">Quality Checked</p>
                <p className="font-sans text-[10px] text-neutral-400 truncate">Inspected by Hand</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 hover:border-[#C9A46A]/40 rounded-xl p-3 sm:p-3.5 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-[#C9A46A]/10 text-[#C9A46A] flex items-center justify-center shrink-0">
                <RefreshCw className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-tech text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white truncate">Free Size Exchange</p>
                <p className="font-sans text-[10px] text-neutral-400 truncate">Easy Doorstep Swap</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 hover:border-[#C9A46A]/40 rounded-xl p-3 sm:p-3.5 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-[#C9A46A]/10 text-[#C9A46A] flex items-center justify-center shrink-0">
                <Truck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-tech text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white truncate">Cash on Delivery</p>
                <p className="font-sans text-[10px] text-neutral-400 truncate">All Over Pakistan</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Product preview modal ── */}
      <AnimatePresence>
        {activeItem && product && (
          <motion.div
            key="atelier-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setActiveItem(null)}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="atelier-modal-title"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative grid max-h-[94vh] w-full max-w-4xl grid-cols-1 overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] md:overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                aria-label="Close"
                className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm ring-1 ring-neutral-200 backdrop-blur transition hover:bg-neutral-950 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Photo */}
              <div className="relative flex items-center justify-center bg-[#F5F3EF] p-6 sm:p-10 md:min-h-0">
                <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-sm">
                  {activeItem.edition}
                </span>
                <img
                  src={imgUrl(activeItem.image, 960)}
                  srcSet={imgSrcSet(activeItem.image, [480, 720, 960, 1200])}
                  sizes="(min-width: 768px) 448px, 100vw"
                  decoding="async"
                  alt={product.name}
                  className="aspect-square w-full max-w-[360px] object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.18)] md:max-w-none"
                />
              </div>

              {/* Details */}
              <div className="flex min-h-0 flex-col overscroll-contain p-5 sm:p-8 md:max-h-[94vh] md:overflow-y-auto">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6A45]">Handmade · Italian leather</p>
                <h3 id="atelier-modal-title" className="mt-2 pr-10 font-serif text-2xl leading-tight text-neutral-950 sm:text-[28px]">
                  {product.name}
                </h3>
                {activeItem.finish && <p className="mt-1 text-sm text-neutral-500">{activeItem.finish}</p>}

                <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-2xl font-semibold text-neutral-950">{formatPrice(price)}</span>
                  {price < product.price && <span className="text-sm text-neutral-400 line-through">{formatPrice(product.price)}</span>}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                  <Truck className="h-3.5 w-3.5" /> Delivery all over Pakistan · Cash on Delivery available
                </p>

                {/* Size */}
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-900">Size</span>
                    <span className="text-neutral-500">{sizeLabelFull(selectedSize)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Choose a size">
                    {productSizes.map(sz => {
                      const out = isSoldOut(product, sz);
                      const on = selectedSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setSelectedSize(sz)}
                          title={out ? 'Sold out' : undefined}
                          className={`relative h-11 w-11 flex items-center justify-center rounded-lg text-sm font-semibold transition cursor-pointer select-none ${
                            on ? 'bg-neutral-950 text-white shadow-md ring-2 ring-neutral-950'
                              : out ? 'bg-neutral-50 text-neutral-400 ring-1 ring-dashed ring-neutral-300'
                              : 'bg-white text-neutral-800 ring-1 ring-neutral-200 hover:ring-neutral-900'
                          }`}
                        >
                          {sizeLabel(sz)}
                          {out && <span className="pointer-events-none absolute left-1/2 top-1/2 h-px w-[135%] -translate-x-1/2 -translate-y-1/2 -rotate-[45deg] bg-neutral-300" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-neutral-400">
                    EU sizes · <Link to="/size-guide" className="underline underline-offset-2 hover:text-neutral-700">Size guide</Link>
                  </p>
                </div>

                {/* Details list */}
                <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-neutral-100 pt-5 text-sm">
                  {[
                    ['Leather', activeItem.specs.hide],
                    ['Construction', activeItem.specs.construction],
                    ['Fit', activeItem.specs.last],
                    ['Insole', activeItem.specs.insole],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-neutral-400">{k}</dt>
                      <dd className="mt-0.5 text-neutral-800">{v}</dd>
                    </div>
                  ))}
                </dl>

                {/* Actions */}
                <div className="mt-auto space-y-2 pt-6">
                  {sizeOut ? (
                    <p className="rounded-lg bg-neutral-50 px-3 py-3 text-center text-sm text-neutral-600 ring-1 ring-neutral-200">
                      {sizeLabel(selectedSize)} is sold out.{' '}
                      <Link to={`/product/${product.slug}`} onClick={() => setActiveItem(null)} className="font-medium underline underline-offset-2">Get notified</Link>
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className={`flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition cursor-pointer ${addedSuccess ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-[#3B2618] to-[#5A3A24] text-white shadow-md shadow-[#3B2618]/25 hover:shadow-lg'}`}
                      >
                        {addedSuccess ? <><Check className="h-4 w-4" /> Added to bag</> : <><ShoppingBag className="h-4 w-4" /> Add to bag</>}
                      </button>
                      <button
                        type="button"
                        onClick={handleBuyNow}
                        className="flex h-12 items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition cursor-pointer bg-gradient-to-r from-[#E5B56D] to-[#C9A46A] text-[#2A1A10] shadow-md shadow-[#C9A46A]/30 hover:shadow-lg"
                      >
                        Buy Now
                      </button>
                    </div>
                  )}
                  <Link
                    to={`/product/${product.slug}`}
                    onClick={() => setActiveItem(null)}
                    className="flex items-center justify-center gap-1 pt-1 text-xs text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
                  >
                    View full details <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};
