import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../types';
import { ProductCard } from '../components/shop/ProductCard';
import { useCurrency } from '../context/CurrencyContext';
import { SlidersHorizontal, ArrowUpDown, X, Check, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { displaySizes, sizeLabel } from '../utils/sizes';

interface ShopAllPageProps {
  products: Product[];
  fixedCategory?: string;
  fixedGender?: string;
  fixedBadge?: 'new' | 'bestseller';
  title?: string;
  subtitle?: string;
}

export const ShopAllPage: React.FC<ShopAllPageProps> = ({
  products,
  fixedCategory,
  fixedGender,
  fixedBadge,
  title = 'All Shoes',
  subtitle = 'Browse our full collection of comfortable, handmade shoes.',
}) => {
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category');
  const urlFilter = searchParams.get('filter');

  const { formatPrice } = useCurrency();

  const [selectedCategory, setSelectedCategory] = useState<string>(fixedCategory || urlCategory || 'all');
  const [selectedGender, setSelectedGender] = useState<string>(fixedGender || 'all');
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedColorName, setSelectedColorName] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [priceMax, setPriceMax] = useState<number>(500);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState<number>(12);

  useEffect(() => {
    if (fixedCategory) {
      setSelectedCategory(fixedCategory);
    } else if (urlCategory) {
      setSelectedCategory(urlCategory);
    } else {
      setSelectedCategory('all');
    }
  }, [urlCategory, fixedCategory]);

  // Extract distinct colors from products
  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach(p => {
      p.colors.forEach(c => {
        if (!map.has(c.name)) map.set(c.name, c.hex);
      });
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (fixedBadge === 'new' && !p.isNewArrival) return false;
      if (fixedBadge === 'bestseller' && !p.isBestSeller) return false;
      if (urlFilter === 'limited' && !p.isLimitedEdition) return false;
      if (selectedCategory !== 'all') {
        const cat = p.category.toLowerCase();
        const sel = selectedCategory.toLowerCase();
        if (sel === 'formals') {
          if (cat !== 'formals' && cat !== 'luxury-minimal') return false;
        } else if (sel === 'chelsea-boots' || sel === 'chelsea') {
          if (cat !== 'chelsea-boots' && !p.slug.includes('chelsea') && !p.name.toLowerCase().includes('chelsea')) return false;
        } else if (sel === 'casuals') {
          if (cat !== 'casuals' && cat !== 'lifestyle') return false;
        } else if (sel === 'sandals') {
          if (cat !== 'sandals' && !p.slug.includes('sandal') && !p.name.toLowerCase().includes('sandal')) return false;
        } else if (sel === 'slides') {
          if (cat !== 'slides' && !p.slug.includes('slide') && !p.name.toLowerCase().includes('slide')) return false;
        } else if (cat !== sel) {
          return false;
        }
      }
      if (selectedGender !== 'all' && p.gender !== selectedGender && p.gender !== 'unisex') return false;
      if (selectedSize && !p.sizes.includes(selectedSize)) return false;
      if (selectedColorName && !p.colors.some(c => c.name.toLowerCase() === selectedColorName.toLowerCase())) return false;
      const price = p.salePrice || p.price;
      if (price > priceMax) return false;
      return true;
    }).sort((a, b) => {
      const priceA = a.salePrice || a.price;
      const priceB = b.salePrice || b.price;
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      return 0;
    });
  }, [products, selectedCategory, selectedGender, selectedSize, selectedColorName, inStockOnly, priceMax, sortBy, fixedBadge, urlFilter]);

  const hasActiveFilters = selectedCategory !== 'all' || selectedGender !== 'all' || selectedSize !== null || selectedColorName !== null || inStockOnly || priceMax < 500;

  const activeFilterCount = [selectedCategory !== 'all', selectedGender !== 'all', selectedSize !== null, selectedColorName !== null, inStockOnly, priceMax < 500].filter(Boolean).length;

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedGender('all');
    setSelectedSize(null);
    setSelectedColorName(null);
    setInStockOnly(false);
    setPriceMax(500);
  };

  const CATEGORIES = [
    { id: 'all', label: 'All Silhouettes' },
    { id: 'casuals', label: 'Casuals' },
    { id: 'formals', label: 'Formals' },
    { id: 'sandals', label: 'Sandals' },
    { id: 'slides', label: 'Slides' },
    { id: 'chelsea-boots', label: 'Chelsea Boots' },
  ];

  const categoryTitles: Record<string, { title: string; subtitle: string }> = {
    casuals: {
      title: 'Casuals Collection',
      subtitle: 'Effortless luxury driving loafers and smart casual leather silhouettes.',
    },
    formals: {
      title: 'Formals Collection',
      subtitle: 'Goodyear welted Oxfords, Venetian loafers, and hand-patinated bespoke brogues.',
    },
    sandals: {
      title: 'Artisan Sandals',
      subtitle: 'Handcrafted Italian calfskin crisscross and strap sandals with brass hardware.',
    },
    slides: {
      title: 'Luxury Slides & Mules',
      subtitle: 'Woven leather slide mules with cushioned footbeds for refined ease.',
    },
    'chelsea-boots': {
      title: 'Chelsea Boots Collection',
      subtitle: 'Tuscan full-grain leather Chelsea boots with Goodyear welted construction.',
    },
  };

  const currentDisplayTitle = (selectedCategory !== 'all' && categoryTitles[selectedCategory]?.title) || title;
  const currentDisplaySubtitle = (selectedCategory !== 'all' && categoryTitles[selectedCategory]?.subtitle) || subtitle;

  const GENDERS = [
    { id: 'all', label: 'All Shoes' },
    { id: 'men', label: 'Men’s Division' },
  ];

  const SIZES = useMemo(() => displaySizes(products.flatMap(p => p.sizes || [])), [products]);

  return (
    <div className="min-h-screen bg-white pt-28 sm:pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── PAGE HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="border-b border-neutral-200 pb-8 mb-8"
        >
          <div className="flex items-center gap-2 font-tech text-[9px] uppercase tracking-[0.35em] text-[#A8824C] mb-3">
            <span>OUR COLLECTION</span>
            <span>//</span>
            <span>FAST DELIVERY</span>
          </div>
          <h1 style={{ fontFamily: "'Cinzel', 'Playfair Display', serif", letterSpacing: '0.06em' }} className="text-3xl sm:text-5xl font-semibold uppercase leading-[1.1] bg-gradient-to-r from-[#3B2618] via-[#8A5A2B] to-[#C9A46A] bg-clip-text text-transparent">
            {currentDisplayTitle}
          </h1>
          <div className="mt-3 h-px w-24 bg-gradient-to-r from-[#C9A46A] to-transparent" />
          <p style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }} className="italic font-medium text-lg sm:text-xl text-[#8A6A52] mt-3 max-w-2xl">
            {currentDisplaySubtitle}
          </p>
        </motion.div>

        {/* ── CONTROLS & FILTER BAR ── */}
        <div className="sticky top-16 z-20 -mx-4 mb-6 flex items-center justify-between gap-2 border-b border-neutral-200 bg-white/95 px-4 py-3 text-sm backdrop-blur sm:static sm:mx-0 sm:mb-8 sm:bg-transparent sm:px-0 sm:pb-5 sm:pt-0 sm:backdrop-blur-none">
          
          <div className="flex items-center gap-4">
            {/* Filter Toggle */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-expanded={isFilterOpen}
              className={`flex h-10 items-center gap-2 rounded-full border bg-white pl-3.5 pr-3 text-sm font-medium text-neutral-900 transition-colors cursor-pointer ${
                isFilterOpen ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-300 hover:border-neutral-900'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1.5 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Count + clear */}
            <div className="hidden items-center gap-3 text-sm sm:flex">
              <span className="text-neutral-500">
                <span className="font-medium text-neutral-900">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'product' : 'products'}
              </span>
              {hasActiveFilters && (
                <>
                  <span className="h-4 w-px bg-neutral-300" aria-hidden />
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-neutral-500 underline underline-offset-4 decoration-neutral-300 hover:text-neutral-900 hover:decoration-neutral-900 cursor-pointer"
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <SortMenu value={sortBy} onChange={setSortBy} />

          </div>
        </div>

        {/* ── EXPANDABLE ADVANCED FILTER PANEL ── */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden mb-8"
            >
              <div className="rounded-xl border border-neutral-200 bg-[#FAF8F5] p-5 sm:p-7">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 font-tech text-[11px]">

                  {/* Category */}
                  <div>
                    <h4 className="font-bold uppercase tracking-[0.2em] text-black mb-3 pb-2 border-b border-neutral-200 text-[10px]">
                      Discipline
                    </h4>
                    <div className="flex flex-col gap-1.5">
                      {CATEGORIES.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCategory(c.id)}
                          className={`text-left uppercase py-1 tracking-wider transition-colors text-[10px] ${
                            selectedCategory === c.id
                              ? 'font-bold text-black'
                              : 'text-neutral-500 hover:text-black'
                          }`}
                        >
                          {selectedCategory === c.id ? '■ ' : '□ '}{c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gender Division */}
                  <div>
                    <h4 className="font-bold uppercase tracking-[0.2em] text-black mb-3 pb-2 border-b border-neutral-200 text-[10px]">
                      Gender Division
                    </h4>
                    <div className="flex flex-col gap-1.5">
                      {GENDERS.map(g => (
                        <button
                          key={g.id}
                          onClick={() => setSelectedGender(g.id)}
                          className={`text-left uppercase py-1 tracking-wider transition-colors text-[10px] ${
                            selectedGender === g.id
                              ? 'font-bold text-black'
                              : 'text-neutral-500 hover:text-black'
                          }`}
                        >
                          {selectedGender === g.id ? '■ ' : '□ '}{g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Filter */}
                  <div>
                    <h4 className="font-bold uppercase tracking-[0.2em] text-black mb-3 pb-2 border-b border-neutral-200 text-[10px]">
                      Size (EU/UK)
                    </h4>
                    <div className="grid grid-cols-4 gap-1">
                      {SIZES.map(sz => (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(selectedSize === sz ? null : sz)}
                          className={`py-1.5 text-[10px] font-bold transition-all border ${
                            selectedSize === sz
                              ? 'bg-black text-white border-black'
                              : 'border-neutral-300 bg-white text-neutral-600 hover:border-black hover:text-black'
                          }`}
                        >
                          {sizeLabel(sz)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Finish Filter */}
                  <div>
                    <h4 className="font-bold uppercase tracking-[0.2em] text-black mb-3 pb-2 border-b border-neutral-200 text-[10px]">
                      Colorway
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map(c => (
                        <button
                          key={c.name}
                          onClick={() => setSelectedColorName(selectedColorName === c.name ? null : c.name)}
                          title={c.name}
                          className={`relative h-6 w-6 rounded-full border transition-all ${
                            selectedColorName === c.name
                              ? 'border-black ring-2 ring-black ring-offset-2 scale-110'
                              : 'border-neutral-300 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                    {selectedColorName && (
                      <p className="text-[10px] text-black font-bold uppercase mt-2">
                        {selectedColorName}
                      </p>
                    )}
                  </div>

                  {/* Price Range */}
                  <div>
                    <h4 className="font-bold uppercase tracking-[0.2em] text-black mb-3 pb-2 border-b border-neutral-200 text-[10px]">
                      Max Price: {formatPrice(priceMax)}
                    </h4>
                    <div className="pt-2">
                      <input
                        type="range"
                        min="100"
                        max="500"
                        step="10"
                        value={priceMax}
                        onChange={e => setPriceMax(Number(e.target.value))}
                        className="w-full accent-black cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-neutral-400 mt-2 uppercase tracking-wider">
                        <span>{formatPrice(100)}</span>
                        <span>{formatPrice(500)}</span>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ACTIVE FILTER CHIPS ── */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6 font-tech text-[10px]">
            <span className="text-neutral-400 uppercase tracking-widest mr-1">Active Filters:</span>
            {selectedCategory !== 'all' && (
              <span className="flex items-center gap-1 bg-neutral-100 border border-neutral-300 px-2.5 py-1 text-black uppercase">
                {selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="hover:text-red-500">✕</button>
              </span>
            )}
            {selectedGender !== 'all' && (
              <span className="flex items-center gap-1 bg-neutral-100 border border-neutral-300 px-2.5 py-1 text-black uppercase">
                {selectedGender}
                <button onClick={() => setSelectedGender('all')} className="hover:text-red-500">✕</button>
              </span>
            )}
            {selectedSize && (
              <span className="flex items-center gap-1 bg-neutral-100 border border-neutral-300 px-2.5 py-1 text-black uppercase">
                Size {sizeLabel(selectedSize)}
                <button onClick={() => setSelectedSize(null)} className="hover:text-red-500">✕</button>
              </span>
            )}
            {selectedColorName && (
              <span className="flex items-center gap-1 bg-neutral-100 border border-neutral-300 px-2.5 py-1 text-black uppercase">
                Color: {selectedColorName}
                <button onClick={() => setSelectedColorName(null)} className="hover:text-red-500">✕</button>
              </span>
            )}
            {priceMax < 500 && (
              <span className="flex items-center gap-1 bg-neutral-100 border border-neutral-300 px-2.5 py-1 text-black uppercase">
                ≤ {formatPrice(priceMax)}
                <button onClick={() => setPriceMax(500)} className="hover:text-red-500">✕</button>
              </span>
            )}
          </div>
        )}

        {/* ── PRODUCT GRID ── */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 border border-neutral-200 bg-neutral-50/50 font-tech">
            <h3 className="text-sm font-bold text-black uppercase tracking-widest">
              No Footwear Models Match Your Specific Parameters
            </h3>
            <p className="text-xs text-neutral-500 mt-2 font-sans">
              Try changing or clearing your filters.
            </p>
            <button
              onClick={resetFilters}
              className="mt-6 bg-black px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-colors shadow-md"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <>
            <motion.div
              layout
              className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-5`}
            >
              <AnimatePresence>
                {filteredProducts.slice(0, visibleCount).map((prod, i) => (
                  <motion.div
                    key={prod.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ProductCard product={prod} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Load More Button */}
            {visibleCount < filteredProducts.length && (
              <div className="mt-16 text-center">
                <button
                  onClick={() => setVisibleCount(c => c + 12)}
                  className="bg-white border-2 border-black text-black px-10 py-4 font-tech text-xs uppercase font-bold tracking-[0.2em] hover:bg-black hover:text-white transition-all shadow-md active:scale-98"
                >
                  Load More ({filteredProducts.length - visibleCount} Remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured', hint: 'Our picks' },
  { value: 'newest', label: 'Newest', hint: 'Just arrived' },
  { value: 'price_asc', label: 'Price: Low → High', hint: 'Cheapest first' },
  { value: 'price_desc', label: 'Price: High → Low', hint: 'Premium first' },
  { value: 'rating', label: 'Highest Rated', hint: 'Customer favourites' },
];

const SortMenu: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find(o => o.value === value) || SORT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Sort products"
        className={`flex h-10 items-center gap-2 rounded-full border bg-white pl-3.5 pr-3 text-sm font-medium text-[#2A1A10] transition-colors cursor-pointer ${open ? 'border-[#C9A46A] ring-2 ring-[#E5B56D]/30' : 'border-[#E5D3B5] hover:border-[#C9A46A]'}`}
      >
        <ArrowUpDown className="h-3.5 w-3.5 text-[#A8824C]" />
        <span className="hidden sm:inline text-[#8A6A52]">Sort:</span>
        <span>{current.label}</span>
        <ChevronDown className={`h-4 w-4 text-[#A8824C] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-50 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-[#EDE1CF] bg-white p-1 shadow-xl shadow-[#3B2618]/15"
          >
            <li className="px-2.5 pb-1 pt-1.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#A8824C]">Sort by</li>
            {SORT_OPTIONS.map(o => {
              const active = o.value === value;
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => { onChange(o.value); setOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer ${active ? 'bg-[#3B2618] text-white' : 'text-[#2A1A10] hover:bg-[#FBF4E8]'}`}
                  >
                    <span>
                      <span className="block text-[13px] font-medium leading-tight">{o.label}</span>
                      <span className={`block text-[10px] leading-tight ${active ? 'text-[#F3D9A4]' : 'text-[#A8907A]'}`}>{o.hint}</span>
                    </span>
                    {active && <Check className="h-3.5 w-3.5 text-[#E5B56D]" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
