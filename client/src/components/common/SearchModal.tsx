import React, { useState, useEffect, useMemo, useRef } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Product } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { Link, useNavigate } from 'react-router-dom';
import { categoryHasProducts, matchesCategory } from '../../utils/categories';
import { imgUrl } from '../../utils/img';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

const CATEGORY_CHIPS = [
  { id: 'formals', label: 'Formals' },
  { id: 'chelsea-boots', label: 'Chelsea Boots' },
  { id: 'casuals', label: 'Casuals' },
  { id: 'sandals', label: 'Sandals' },
  { id: 'slides', label: 'Slides' },
];

const prettyCategory = (c: string) => c.replace(/-/g, ' ');

/** Splits the name so the matched part can be highlighted */
const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const q = query.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-[#C9A46A]/25 px-0.5 text-inherit">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
};

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  const live = useMemo(() => products.filter(p => p.status !== 'draft'), [products]);
  const chips = CATEGORY_CHIPS.filter(c => categoryHasProducts(live, c.id));

  const q = searchTerm.trim().toLowerCase();
  const results = useMemo(() => {
    let list = category ? live.filter(p => matchesCategory(p, category)) : live;
    if (q) {
      const words = q.split(/\s+/);
      list = list.filter(p => {
        const hay = [p.name, p.category, p.tagline, p.edition, ...(p.colors || []).map(c => c.name)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return words.every(w => hay.includes(w));
      });
    } else if (!category) {
      // Nothing typed: show best sellers first
      list = [...list].sort((a, b) => Number(!!b.isBestSeller) - Number(!!a.isBestSeller)).slice(0, 6);
    }
    return list.slice(0, 24);
  }, [live, q, category]);

  // Reset when opened / closed
  useEffect(() => {
    if (!isOpen) return;
    setSearchTerm('');
    setCategory(null);
    setActive(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => setActive(0), [q, category]);

  const go = (p: Product) => {
    onClose();
    navigate(`/product/${p.slug}`);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter' && results[active]) { e.preventDefault(); go(results[active]); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onClose, results, active]);

  // Keep the highlighted row in view while using arrow keys
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const heading = q
    ? `${results.length} result${results.length === 1 ? '' : 's'}`
    : category
      ? `${prettyCategory(category)}`
      : 'Popular right now';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-start sm:p-6 sm:pt-20" role="dialog" aria-modal="true" aria-label="Search shoes">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/55 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[80vh] sm:max-w-2xl sm:rounded-2xl"
          >
            {/* Search input */}
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-neutral-200 px-4 py-3 sm:px-5">
              <Search className="h-5 w-5 flex-shrink-0 text-[#B8913A]" />
              <input
                type="search"
                autoFocus
                placeholder="Search by name, style or colour…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="Search shoes"
                className="h-11 w-full bg-transparent font-sans text-base text-neutral-950 placeholder:text-neutral-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="flex-shrink-0 rounded-full px-2 py-1 font-tech text-[10px] uppercase tracking-wider text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close search"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category chips */}
            {chips.length > 0 && (
              <div className="flex flex-shrink-0 items-center gap-2 overflow-x-auto border-b border-neutral-100 px-4 py-3 sm:px-5 [scrollbar-width:none]">
                <button
                  onClick={() => setCategory(null)}
                  className={`inline-flex h-9 flex-shrink-0 items-center justify-center whitespace-nowrap rounded-lg border px-4 font-tech text-[11px] font-bold uppercase leading-none tracking-wider transition-colors ${
                    !category ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm' : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 hover:text-neutral-950'
                  }`}
                >
                  All
                </button>
                {chips.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(category === c.id ? null : c.id)}
                    className={`inline-flex h-9 flex-shrink-0 items-center justify-center whitespace-nowrap rounded-lg border px-4 font-tech text-[11px] font-bold uppercase leading-none tracking-wider transition-colors ${
                      category === c.id ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm' : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 hover:text-neutral-950'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {/* Results */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-2 py-3 sm:px-3">
              <div className="px-2 pb-2 font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                {heading}
              </div>

              {results.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-14 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F1EA]">
                    <Search className="h-6 w-6 text-[#B8913A]" />
                  </div>
                  <p className="font-serif text-lg text-neutral-950">No shoes found for “{searchTerm}”</p>
                  <p className="mt-1 text-sm text-neutral-500">Try another word, like “black”, “boot” or “formal”.</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {results.map((prod, idx) => {
                    const sale = prod.salePrice && prod.salePrice < prod.price;
                    const isActive = idx === active;
                    return (
                      <li key={prod.id} data-idx={idx}>
                        <Link
                          to={`/product/${prod.slug}`}
                          onClick={onClose}
                          onMouseEnter={() => setActive(idx)}
                          className={`flex items-center gap-4 rounded-xl p-2.5 transition-colors ${isActive ? 'bg-[#F7F4EF]' : 'hover:bg-neutral-50'}`}
                        >
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#F5F4F2]">
                            {prod.images?.[0] && (
                              <img
                                src={imgUrl(prod.images[0], 160)}
                                width={64}
                                height={64}
                                decoding="async"
                                loading={idx < 6 ? 'eager' : 'lazy'}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-serif text-[15px] text-neutral-950">
                              <Highlight text={prod.name} query={searchTerm} />
                            </p>
                            <p className="mt-0.5 font-tech text-[10px] uppercase tracking-wider text-neutral-500">
                              {prettyCategory(prod.category)}
                              {prod.colors?.length ? ` · ${prod.colors.length} colour${prod.colors.length > 1 ? 's' : ''}` : ''}
                            </p>
                            <p className="mt-1 flex items-baseline gap-2 font-tech text-xs">
                              <span className="font-bold text-neutral-950">{formatPrice(prod.salePrice || prod.price)}</span>
                              {sale && <span className="text-neutral-400 line-through">{formatPrice(prod.price)}</span>}
                              {sale && (
                                <span className="font-bold text-red-700">
                                  −{Math.round((1 - (prod.salePrice as number) / prod.price) * 100)}%
                                </span>
                              )}
                            </p>
                          </div>
                          <ArrowRight className={`h-4 w-4 flex-shrink-0 transition-all ${isActive ? 'translate-x-0 text-neutral-950' : '-translate-x-1 text-neutral-300'}`} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-shrink-0 items-center justify-between border-t border-neutral-200 bg-[#FAF8F5] px-4 py-3 sm:px-5">
              <span className="hidden items-center gap-3 font-tech text-[10px] uppercase tracking-wider text-neutral-400 sm:flex">
                <span><kbd className="rounded border border-neutral-300 bg-white px-1">↑</kbd> <kbd className="rounded border border-neutral-300 bg-white px-1">↓</kbd> move</span>
                <span className="flex items-center gap-1"><kbd className="rounded border border-neutral-300 bg-white px-1"><CornerDownLeft className="inline h-2.5 w-2.5" /></kbd> open</span>
                <span><kbd className="rounded border border-neutral-300 bg-white px-1">esc</kbd> close</span>
              </span>
              <Link
                to={category ? `/shop?category=${category}` : '/shop'}
                onClick={onClose}
                className="ml-auto inline-flex items-center gap-1.5 font-tech text-[11px] font-bold uppercase tracking-wider text-neutral-950 hover:text-[#8C6430]"
              >
                View all shoes <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
