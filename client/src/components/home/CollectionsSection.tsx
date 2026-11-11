import React, { useState } from 'react';
import { Product } from '../../types';
import { ProductCard } from '../shop/ProductCard';
import { Link } from 'react-router-dom';
import { MoveRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollectionsSectionProps {
  products: Product[];
}

const TABS = [
  { id: 'bestseller', label: 'Best Sellers' },
  { id: 'casuals', label: 'Casuals' },
  { id: 'formals', label: 'Formals' },
  { id: 'sandals', label: 'Sandals' },
  { id: 'slides', label: 'Slides' },
  { id: 'chelsea', label: 'Chelsea Boots' },
] as const;

type TabId = typeof TABS[number]['id'];

export const CollectionsSection: React.FC<CollectionsSectionProps> = ({ products }) => {
  const [activeTab, setActiveTab] = useState<TabId>('bestseller');

  const filteredProducts = products.filter(p => {
    if (activeTab === 'bestseller') return p.isBestSeller;
    if (activeTab === 'casuals') return p.category === 'casuals';
    if (activeTab === 'formals') return p.category === 'formals' || p.category === 'luxury-minimal';
    if (activeTab === 'sandals') return p.category === 'sandals' || p.slug.includes('sandal');
    if (activeTab === 'slides') return p.category === 'slides' || p.slug.includes('slide');
    if (activeTab === 'chelsea') return p.category === 'chelsea-boots' || p.slug.includes('chelsea');
    return true;
  });

  // Show up to 5 products for a clean 5-column or responsive grid
  const MAX_ITEMS = 5;
  const displayProducts = [
    ...filteredProducts,
    ...products.filter(p => !filteredProducts.includes(p)),
  ].slice(0, MAX_ITEMS);

  return (
    <section className="bg-white py-16 sm:py-20 border-b border-neutral-200 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── SECTION HEADER ── */}
        <div className="relative flex flex-col items-center mb-10">
          
          {/* Top Kicker with Hairline Dividers */}
          <div className="flex items-center gap-4 w-full max-w-md justify-center mb-3">
            <div className="h-px bg-neutral-200 flex-1" />
            <span className="font-tech text-[9.5px] uppercase tracking-[0.3em] text-neutral-400 font-bold whitespace-nowrap">
              SEASONAL RELEASES
            </span>
            <div className="h-px bg-neutral-200 flex-1" />
          </div>

          {/* Centered Heading */}
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal tracking-tight text-neutral-950 text-center">
            Our Favourite Shoes
          </h2>

          {/* Top Right "All Silhouettes →" Link */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:block">
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 font-tech text-[10.5px] uppercase tracking-wider font-bold text-neutral-700 hover:text-black transition-colors"
            >
              <span>View All Shoes</span>
              <MoveRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Pill Tabs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 font-tech">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 text-[10px] uppercase tracking-[0.14em] font-bold rounded-full transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-neutral-950 text-white shadow-sm'
                    : 'bg-transparent text-neutral-600 hover:text-black border border-neutral-200 hover:border-neutral-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 5-COLUMN RESPONSIVE PRODUCT GRID ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5"
          >
            {displayProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Mobile All Silhouettes Link */}
        <div className="mt-8 text-center md:hidden">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 font-tech text-[10.5px] uppercase tracking-wider font-bold text-neutral-800"
          >
            <span>View All Shoes ({products.length})</span>
            <MoveRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
};
