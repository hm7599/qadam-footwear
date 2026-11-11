import React from 'react';
import { motion } from 'framer-motion';

const REVIEWS = [
  {
    quote: 'QADAM represents the single greatest leap in luxury athletic footwear since the invention of the vulcanized sole. The Phantom 01 is sheer poetry on foot.',
    author: 'Elena Rostova',
    role: 'Architect & Collector',
    location: 'Zurich',
    model: 'QADAM PHANTOM 01',
    rating: 5,
  },
  {
    quote: 'The supercritical nitrogen cushioning absorbs impact with a buttery plushness I\'ve never experienced in traditional designer sneakers. Exceptional engineering.',
    author: 'Marcus Vance',
    role: 'Industrial Designer',
    location: 'San Francisco',
    model: 'QADAM VELOCITY STRATA',
    rating: 5,
  },
  {
    quote: 'Museum-grade craftsmanship. The leather aroma upon unboxing is unforgettable, the stitchless edges are immaculate, and the silhouette commands attention.',
    author: 'Devon Sinclair',
    role: 'Creative Director',
    location: 'London',
    model: 'QADAM CELESTIAL HIGH',
    rating: 5,
  },
];

const PRESS = [
  { name: 'VOGUE', quote: 'The new standard of architectural minimalist luxury.' },
  { name: 'HYPEBEAST', quote: 'Where aerodynamic engineering meets haute couture.' },
  { name: 'GQ', quote: 'The most anticipated sneaker release of the decade.' },
  { name: 'WIRED', quote: 'Breakthrough supercritical nitrogen foam — zero compromise.' },
];

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
  item: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
  },
};

export const ReviewsSection: React.FC = () => {
  return (
    <section className="bg-white py-20 sm:py-28 border-b border-neutral-200 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mb-14 pb-8 border-b border-neutral-200"
        >
          <span className="font-tech text-[9px] uppercase tracking-[0.35em] text-neutral-400 font-bold block mb-3">
            [ CRITICAL RECEPTION ]
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-neutral-950 leading-[1.05]">
            Acclaimed{' '}
            <span className="font-editorial italic font-normal text-neutral-500">Globally</span>
          </h2>
          <p className="font-editorial italic text-base sm:text-lg text-neutral-500 mt-3">
            Trusted by architects, runners, and fashion collectors across 60+ countries.
          </p>
        </motion.div>

        {/* Review Cards */}
        <motion.div
          variants={stagger.container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {REVIEWS.map((rev, idx) => (
            <motion.div
              key={idx}
              variants={stagger.item}
              className="relative flex flex-col justify-between border border-neutral-200 bg-[#FAFBFD] p-7 sm:p-8 hover:border-neutral-400 hover:shadow-xl transition-all duration-300"
            >
              {/* Large quote mark */}
              <div
                className="absolute top-5 right-6 font-serif text-[75px] leading-none text-neutral-200 select-none pointer-events-none font-bold"
                aria-hidden
              >
                “
              </div>

              <div>
                {/* Stars */}
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(rev.rating)].map((_, i) => (
                    <span key={i} className="text-neutral-900 text-xs">★</span>
                  ))}
                </div>

                <span className="font-tech text-[8px] text-neutral-400 font-bold uppercase tracking-[0.25em] block mb-4">
                  VERIFIED ATELIER PATRON
                </span>
                <p className="font-editorial italic text-base sm:text-[17px] leading-relaxed text-neutral-800 relative z-10">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-neutral-200 flex items-end justify-between">
                <div>
                  <h4 className="font-tech text-xs font-bold text-neutral-950 uppercase tracking-wider">
                    {rev.author}
                  </h4>
                  <p className="font-tech text-[9px] text-neutral-500 mt-0.5 uppercase tracking-wider">
                    {rev.role} · {rev.location}
                  </p>
                </div>
                <span className="font-tech text-[8px] font-bold text-neutral-600 border border-neutral-300 bg-white px-2.5 py-1 flex-shrink-0 ml-3">
                  {rev.model.split(' ').slice(-2).join(' ')}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Press Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 pt-12 border-t border-neutral-200"
        >
          <p className="font-tech text-[9px] uppercase tracking-[0.35em] text-neutral-400 text-center mb-10 font-bold">
            EDITORIAL PRESS ACCREDITATIONS
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {PRESS.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="flex flex-col items-center text-center group cursor-default"
              >
                <span className="font-serif text-2xl sm:text-3xl font-bold tracking-widest text-neutral-900 group-hover:text-black transition-colors duration-300">
                  {item.name}
                </span>
                <span className="font-editorial italic text-xs sm:text-sm text-neutral-500 max-w-[180px] mt-2 leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
};
