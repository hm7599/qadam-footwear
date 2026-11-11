import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Product } from '../../types';
import { imgUrl } from '../../utils/img';
import { api } from '../../utils/api';
import { DEFAULT_CATEGORIES, CategoriesContent, normalizeCategories } from '../../data/categoryDefaults';

/** Category tiles right after the hero. Content is editable in Admin → Categories. */
export const ShopByCategory: React.FC<{ products: Product[] }> = () => {
  const [content, setContent] = useState<CategoriesContent>(DEFAULT_CATEGORIES);

  useEffect(() => {
    api.getSetting('categories')
      .then(d => { if (d) setContent(normalizeCategories(d)); })
      .catch(() => {});
  }, []);

  const items = content.items.filter(i => i.visible && i.label);
  if (items.length === 0) return null;

  return (
    <section className="bg-white py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-neutral-950">{content.title}</h2>
            {content.subtitle && <p className="mt-1 text-sm text-neutral-500">{content.subtitle}</p>}
          </div>
          <Link to="/shop" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-neutral-800 hover:text-black">
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {items.map((c, i) => (
            <motion.div
              key={c.label + i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
            >
              <Link
                to={c.link || '/shop'}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200 ring-1 ring-black/5"
              >
                {c.image && (
                  <img
                    src={imgUrl(c.image, 480)}
                    decoding="async"
                    loading="lazy"
                    alt={c.label}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm sm:text-base font-semibold text-white">{c.label}</p>
                    {c.hint && <p className="truncate text-[11px] sm:text-xs text-white/75">{c.hint}</p>}
                  </div>
                  <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-sm transition-all group-hover:bg-[#D4A359] group-hover:text-white">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
