import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Compass, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { imgUrl } from '../../utils/img';

const CAMPAIGNS = [
  {
    city: 'QADAM SIGNATURE',
    season: 'A/W 2026',
    title: 'Architectural Form in Motion',
    subtitle: 'Handcrafted Formal Oxfords & Brogues',
    image: '/images/shoes/formal-monkstrap-chestnut.jpg',
    link: '/shop?category=formals',
    tag: 'BESPOKE FORMALS',
  },
  {
    city: 'FIRENZE',
    season: 'TUSCAN HERITAGE',
    title: 'Goodyear Welted Bootmaking',
    subtitle: 'Hand-Lasted Full-Grain Tuscan Leather',
    image: '/images/atelier/formal_boot_set2_2.jpg',
    link: '/shop?category=chelsea-boots',
    tag: 'CHELSEA BOOTS',
  },
  {
    city: 'CAPRI',
    season: 'RIVIERA ATELIER',
    title: 'Mediterranean Sun & Leather',
    subtitle: 'Handcrafted Artisan Straps and Woven Slides',
    image: '/images/shoes/artisan-leather-sandal.jpg',
    link: '/shop?category=sandals',
    tag: 'SANDALS & SLIDES',
  },
];

export const LifestyleShowcase: React.FC = () => {
  return (
    <section className="bg-white py-24 sm:py-32 border-b border-neutral-200 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16 pb-8 border-b border-neutral-200"
        >
          <div>
            <span className="font-tech text-[9px] uppercase tracking-[0.35em] text-neutral-400 font-bold block mb-3">
              [ GLOBAL CAMPAIGN // 2026 ]
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-neutral-950 leading-[1.05]">
              Editorial{' '}
              <span className="font-editorial italic font-normal text-neutral-500">Perspectives</span>
            </h2>
          </div>
          <p className="max-w-md font-sans text-sm text-neutral-600 leading-relaxed">
            Documented on the streets of Milan, London, and Tokyo. Footwear conceived as sculpture, engineered for uninhibited human velocity.
          </p>
        </motion.div>

        {/* Campaign Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CAMPAIGNS.map((item, idx) => (
            <motion.div
              key={item.city}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex flex-col bg-neutral-50 border border-neutral-200 overflow-hidden"
            >
              {/* Image Frame */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                <img
                  src={imgUrl(item.image, 960)} decoding="async"
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Top Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 font-tech text-[9px] uppercase tracking-widest text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1">
                  <span>{item.city}</span>
                  <span>//</span>
                  <span>{item.season}</span>
                </div>

                {/* Bottom Overlay Text */}
                <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
                  <span className="font-tech text-[8px] uppercase tracking-[0.25em] text-neutral-300 block mb-1">
                    {item.tag}
                  </span>
                  <h3 className="font-serif text-xl sm:text-[22px] font-normal tracking-tight leading-tight text-white">
                    {item.title}
                  </h3>
                  <p className="font-editorial italic text-xs text-neutral-300 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Bottom Action Strip */}
              <div className="p-4 bg-white flex items-center justify-between font-tech text-[10px] uppercase tracking-wider border-t border-neutral-100">
                <span className="text-neutral-500">View Lookbook</span>
                <Link
                  to={item.link}
                  className="font-bold text-black flex items-center gap-1 hover:underline"
                >
                  Explore <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
