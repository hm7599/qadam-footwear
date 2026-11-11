import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { Link } from 'react-router-dom';
import { imgUrl } from '../../utils/img';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filtered = searchTerm.trim()
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.tagline.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products.slice(0, 4);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24 font-tech">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -15 }}
            className="relative w-full max-w-2xl overflow-hidden border border-neutral-900 bg-white shadow-2xl"
          >
            {/* Input Header */}
            <div className="flex items-center border-b border-neutral-200 px-6 py-4">
              <Search className="h-4 w-4 text-neutral-400 mr-3" />
              <input
                type="text"
                autoFocus
                placeholder="SEARCH SHOES, STYLES OR COLOURS..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs font-bold uppercase tracking-wider text-neutral-950 placeholder:text-neutral-400 focus:outline-none"
              />
              <button
                onClick={onClose}
                className="p-1 text-neutral-400 hover:text-neutral-950 ml-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Suggestions / Results */}
            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                <span>{searchTerm.trim() ? `RESULTS [${filtered.length}]` : 'FEATURED MODELS'}</span>
                <span>ESC TO CLOSE</span>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-10 text-xs text-neutral-400">
                  NO SHOES FOUND FOR "{searchTerm.toUpperCase()}".
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.map(prod => (
                    <Link
                      key={prod.id}
                      to={`/product/${prod.slug}`}
                      onClick={onClose}
                      className="group flex items-center gap-3 border border-neutral-200 bg-[#FBFBFB] p-3 transition-colors hover:border-neutral-950 hover:bg-white"
                    >
                      <div className="h-14 w-14 flex-shrink-0 bg-white p-1 border border-neutral-200">
                        <img src={imgUrl(prod.images[0], 200)} decoding="async" loading="lazy" alt={prod.name} className="h-full w-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-xs font-bold text-neutral-950 uppercase truncate group-hover:text-neutral-600">
                          {prod.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                          <span className="uppercase">{prod.category}</span>
                          <span>//</span>
                          <span className="font-bold text-neutral-950">{formatPrice(prod.salePrice || prod.price)}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-neutral-500">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <Link to="/shop?category=casuals" onClick={onClose} className="hover:text-neutral-950">Casuals</Link>
                <Link to="/shop?category=formals" onClick={onClose} className="hover:text-neutral-950">Formals</Link>
                <Link to="/shop?category=sandals" onClick={onClose} className="hover:text-neutral-950">Sandals</Link>
                <Link to="/shop?category=slides" onClick={onClose} className="hover:text-neutral-950">Slides</Link>
                <Link to="/shop?category=chelsea-boots" onClick={onClose} className="hover:text-neutral-950">Chelsea Boots</Link>
              </div>
              <Link to="/shop" onClick={onClose} className="font-bold text-neutral-950 hover:underline">
                View All Shoes →
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
