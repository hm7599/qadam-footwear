import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ArrowUpRight, X, Sparkles, Check, ShoppingBag, Shield, Truck, Shuffle, ChevronLeft, ChevronRight, Grid, Layers } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
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
    slug: 'qadam-sovereign-venetian-loafer',
    specs: {
      hide: 'Full-Grain Box Calfskin',
      construction: 'Goodyear Welted Beveled Sole',
      last: 'Elegante Loafer Last',
      insole: 'Arch Support Leather Insole',
    }
  },
  {
    id: 'boot-2',
    title: 'QADAM Noir Equestrian Chelsea',
    category: 'boot',
    leather: 'High-Shine Aniline Calfskin',
    finish: 'Black Mirror Polish with Ribbed Gussets',
    image: '/images/atelier/formal_boot_set2_3.jpg',
    edition: 'Winter Atelier',
    priceRs: 117600,
    slug: 'qadam-tuscan-chelsea-sovereign',
    specs: {
      hide: 'Aniline Black Calfskin',
      construction: 'Goodyear Welted Dainite Rubber Sole',
      last: 'Sleek Equestrian Last',
      insole: 'Tempered Steel Shank + Cork',
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
    slug: 'qadam-florentine-double-monkstrap',
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
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'paged' | 'all'>('paged');
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [shuffledList, setShuffledList] = useState<AtelierGalleryItem[] | null>(null);
  const [activeItem, setActiveItem] = useState<AtelierGalleryItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<number>(9);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  const { addToCart, setIsCartOpen, setIsCheckoutOpen } = useCart();
  const { formatPrice } = useCurrency();

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

  const sourceProducts = products && products.length > 0 ? products : INITIAL_PRODUCTS;
  const liveProducts = sourceProducts.filter(p => p.status !== 'draft');

  // Build dynamic gallery items by merging live products with the showcase photos:
  const galleryItems: AtelierGalleryItem[] = React.useMemo(() => {
    // 1. Map existing ATELIER_PHOTOS with live data from products
    const mapped: AtelierGalleryItem[] = ATELIER_PHOTOS.map(photo => {
      const matched = liveProducts.find(p =>
        p.slug === photo.slug ||
        p.id === photo.slug ||
        p.slug === photo.slug.replace(/^qadam-/, 'aura-') ||
        p.slug.replace(/^qadam-/, '') === photo.slug.replace(/^qadam-/, '') ||
        (p.name && photo.title && p.name.trim().toLowerCase() === photo.title.trim().toLowerCase())
      );

      const targetProd = matched || INITIAL_PRODUCTS.find(p => p.slug === photo.slug) || INITIAL_PRODUCTS[0];
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

      return {
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
        specs: {
          hide: targetProd.specs?.upperMaterial || photo.specs.hide,
          construction: targetProd.specs?.soleMaterial || photo.specs.construction,
          last: targetProd.specs?.fit || photo.specs.last,
          insole: targetProd.specs?.cushioning || photo.specs.insole,
        }
      };
    });

    // 2. Also append any extra store products created in Admin Panel that aren't already represented
    const extras: AtelierGalleryItem[] = liveProducts
      .filter(p => !mapped.some(m => m.slug === p.slug || m.id === p.id))
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
          specs: {
            hide: p.specs?.upperMaterial || 'Full-Grain Box Calfskin',
            construction: p.specs?.soleMaterial || 'Goodyear Welt Sole',
            last: p.specs?.fit || 'Anatomical Milanese Last',
            insole: p.specs?.cushioning || 'Molded Natural Cork Bedding',
          }
        };
      });

    const combined = [...mapped, ...extras];

    // Priority sorting:
    // 1. If sortOrder is explicitly defined (> 0), sort in ascending order (1, 2, 3...)
    // 2. If isFeatured is true, place them ahead of non-featured
    // 3. Otherwise preserve original order
    combined.sort((a, b) => {
      const orderA = a.product?.sortOrder && a.product.sortOrder > 0 ? a.product.sortOrder : null;
      const orderB = b.product?.sortOrder && b.product.sortOrder > 0 ? b.product.sortOrder : null;

      if (orderA !== null && orderB !== null) return orderA - orderB;
      if (orderA !== null && orderB === null) return -1;
      if (orderA === null && orderB !== null) return 1;

      const featA = a.product?.isFeatured ? 1 : 0;
      const featB = b.product?.isFeatured ? 1 : 0;
      if (featA !== featB) return featB - featA;

      return 0;
    });

    return combined;
  }, [liveProducts]);

  const baseFiltered = React.useMemo(() => {
    if (selectedCat === 'all') return galleryItems;
    return galleryItems.filter(p => {
      if (selectedCat === 'sandal') return p.category === 'sandal' || p.category === 'slide';
      return p.category === selectedCat;
    });
  }, [selectedCat, galleryItems]);

  const activeList = shuffledList || baseFiltered;

  const PAGE_SIZE = 4;
  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));

  const displayedItems = viewMode === 'paged'
    ? activeList.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
    : activeList;

  const handleShuffle = () => {
    setIsShuffling(true);
    const arr = [...baseFiltered];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffledList(arr);
    setCurrentPage(0);
    setTimeout(() => setIsShuffling(false), 450);
  };

  const handleResetOrder = () => {
    setShuffledList(null);
    setCurrentPage(0);
  };

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
    <section className="bg-white py-20 sm:py-28 border-b border-neutral-200 overflow-hidden">
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

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 font-tech">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCat(cat.id);
                  setCurrentPage(0);
                  setShuffledList(null);
                }}
                className={`px-5 py-2 text-[10.5px] uppercase tracking-[0.14em] font-bold rounded-full transition-all cursor-pointer ${
                  selectedCat === cat.id
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'bg-white text-neutral-600 hover:text-black border border-neutral-200 hover:border-neutral-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTROLS TOOLBAR: Shuffle, View Mode, Pagination ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          {/* Left: Showing count & Shuffled status */}
          <div className="flex items-center gap-2.5 font-tech text-xs text-neutral-500">
            <span>
              {viewMode === 'paged' && activeList.length > PAGE_SIZE
                ? `Showing ${activeList.length > 0 ? currentPage * PAGE_SIZE + 1 : 0}–${Math.min((currentPage + 1) * PAGE_SIZE, activeList.length)} of ${activeList.length} pairs`
                : `Showing all ${activeList.length} pairs`}
            </span>
            {shuffledList && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                <Sparkles className="h-3 w-3 text-[#9A7B4F]" /> Shuffled
                <button
                  type="button"
                  onClick={handleResetOrder}
                  className="ml-1 text-neutral-600 hover:text-black underline cursor-pointer"
                >
                  Reset
                </button>
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Shuffle Button */}
            <button
              type="button"
              onClick={handleShuffle}
              title="Shuffle pairs to discover random shoes"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10.5px] font-tech font-bold uppercase tracking-wider text-neutral-700 bg-neutral-100 hover:bg-neutral-200 hover:text-black border border-neutral-200 transition cursor-pointer"
            >
              <Shuffle className={`h-3 w-3 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>Shuffle Pairs</span>
            </button>

            {/* View Mode Toggle (only when more than 4 items) */}
            {activeList.length > PAGE_SIZE && (
              <button
                type="button"
                onClick={() => setViewMode(prev => prev === 'paged' ? 'all' : 'paged')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-tech font-bold uppercase tracking-wider text-neutral-600 border border-neutral-200 hover:border-neutral-400 hover:text-black transition cursor-pointer"
              >
                {viewMode === 'paged' ? (
                  <>
                    <Grid className="h-3 w-3" />
                    <span>View All ({activeList.length})</span>
                  </>
                ) : (
                  <>
                    <Layers className="h-3 w-3" />
                    <span>4 Per Slide</span>
                  </>
                )}
              </button>
            )}

            {/* Paging Prev / Next (when in paged mode and totalPages > 1) */}
            {viewMode === 'paged' && totalPages > 1 && (
              <div className="flex items-center gap-1.5 pl-1 sm:border-l sm:border-neutral-200 sm:pl-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  aria-label="Previous page"
                  className="h-7 w-7 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-700 hover:bg-black hover:text-white hover:border-black disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="font-tech text-xs font-bold text-neutral-600 px-1.5">
                  {currentPage + 1}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  aria-label="Next page"
                  className="h-7 w-7 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-700 hover:bg-black hover:text-white hover:border-black disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── GALLERY GRID (4 Columns on Desktop) ── */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {displayedItems.map((item, idx) => (
              <motion.div
                key={`${item.id}-${currentPage}-${shuffledList ? 'shuf' : 'ord'}`}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, delay: idx * 0.03 }}
                className="group relative bg-[#FAF8F5] border border-neutral-200/90 rounded-xl overflow-hidden flex flex-col justify-between hover:border-neutral-400 hover:shadow-xl transition-all duration-300"
              >
                {/* Image Canvas with hover zoom */}
                <div
                  onClick={() => {
                    setActiveItem(item);
                    setSelectedSize(9);
                  }}
                  className="relative aspect-square w-full overflow-hidden bg-gradient-to-b from-[#FAF8F5] to-[#F2EFEA] cursor-pointer flex items-center justify-center p-4"
                >
                  <img
                    src={imgUrl(item.image, 960)} decoding="async"
                    alt={item.title}
                    loading="lazy"
                    className="max-h-[85%] max-w-[85%] object-contain filter drop-shadow-[0_12px_16px_rgba(0,0,0,0.12)] transition-transform duration-700 ease-out group-hover:scale-108"
                  />

                  {/* Top-Right Inspect Pill on Hover */}
                  <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/85 text-white p-2 rounded-full shadow-md">
                    <Eye className="h-3.5 w-3.5" />
                  </div>

                  {/* Top-Left Edition Tag */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="font-tech text-[8px] uppercase tracking-wider text-neutral-600 font-bold bg-white/90 px-2 py-0.5 rounded shadow-2xs border border-neutral-200">
                      {item.edition}
                    </span>
                  </div>

                  {/* Bottom Edition Overlay */}
                  <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between text-[8px] font-tech uppercase tracking-widest text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Click to inspect details</span>
                    <Sparkles className="h-2.5 w-2.5 text-[#9A7B4F]" />
                  </div>
                </div>

                {/* Metadata Footer */}
                <div className="p-4 sm:p-5 bg-white border-t border-neutral-200/80 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-sans text-sm sm:text-base font-semibold text-neutral-900 group-hover:text-black line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="font-sans text-xs text-neutral-500 line-clamp-1 mt-0.5">
                      {item.finish}
                    </p>
                  </div>

                  <div className="pt-2.5 flex items-center justify-between border-t border-neutral-100 mt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-sans text-sm font-bold text-neutral-950">
                        {formatPrice(item.price)}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="font-sans text-xs text-neutral-400 line-through">
                          {formatPrice(item.originalPrice)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setActiveItem(item);
                        setSelectedSize(9);
                      }}
                      className="font-tech text-[10px] uppercase tracking-wider font-bold text-neutral-800 hover:text-black inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Pagination Dots (when in paged mode and totalPages > 1) */}
        {viewMode === 'paged' && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentPage(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 transition-all rounded-full cursor-pointer ${
                  currentPage === i ? 'w-8 bg-neutral-950' : 'w-2 bg-neutral-300 hover:bg-neutral-500'
                }`}
              />
            ))}
          </div>
        )}

        {/* ── ATELIER STATEMENT BAR ── */}
        <div className="mt-14 p-6 sm:p-8 bg-neutral-50 border border-neutral-200/90 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-tech text-xs uppercase tracking-wider font-bold text-neutral-900">
                100% Genuine Italian Box Calfskin & Cordwainer Guarantee
              </h4>
              <p className="font-sans text-xs text-neutral-500 mt-0.5">
                Every pair undergoes 14 inspection checkpoints with complimentary size exchange and Cash on Delivery across Pakistan.
              </p>
            </div>
          </div>
          <Link
            to="/shop"
            className="flex-shrink-0 bg-neutral-950 text-white px-7 py-3.5 font-tech text-[11px] uppercase font-bold tracking-wider hover:bg-neutral-800 transition-colors shadow-sm rounded"
          >
            Explore Complete Collection →
          </Link>
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
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Choose a size">
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
                          className={`relative h-11 rounded-lg text-sm font-medium transition cursor-pointer ${
                            on ? 'bg-neutral-950 text-white'
                              : out ? 'bg-neutral-50 text-neutral-300 ring-1 ring-neutral-100 line-through'
                              : 'bg-white text-neutral-800 ring-1 ring-neutral-200 hover:ring-neutral-900'
                          }`}
                        >
                          {sizeLabel(sz)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[11px] text-neutral-400">
                    UK sizes · <Link to="/size-guide" className="underline underline-offset-2 hover:text-neutral-700">Size guide</Link>
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
