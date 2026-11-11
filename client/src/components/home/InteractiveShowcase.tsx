import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { ArrowRight, ChevronLeft, ChevronRight, Layers, ShieldCheck, Feather, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { imgUrl } from '../../utils/img';

interface InteractiveShowcaseProps {
  products: Product[];
}

const SLIDES = [
  {
    tag: 'Made by Hand',
    title: 'Crafted With Care',
    text: 'Every pair is shaped and stitched by skilled hands.',
    image: '/images/mockup/atelier-hands-only.jpg',
  },
  {
    tag: 'Built to Last',
    title: 'Strong Stitched Soles',
    text: 'Soles are stitched, not glued, so they last for years.',
    image: '/images/atelier/formal_oxford_set3_3.jpg',
  },
  {
    tag: 'Classic Style',
    title: 'Polished Leather Loafers',
    text: 'Soft leather, hand-polished for a rich shine.',
    image: '/images/shoes/formal-italian-loafers.png',
  },
  {
    tag: 'Everyday Comfort',
    title: 'Chelsea Leather Boots',
    text: 'Premium leather with a grippy, long-lasting sole.',
    image: '/images/atelier/formal_boot_set2_2.jpg',
  },
];

const FEATURES = [
  { icon: ShieldCheck, title: 'Real Italian Leather', text: 'Soft, strong and breathable' },
  { icon: Layers, title: 'Stitched Sole', text: 'Lasts longer, can be repaired' },
  { icon: Feather, title: 'Soft Cork Insole', text: 'Shapes to your foot' },
  { icon: Sparkles, title: 'Fine Finishing', text: 'Checked by hand, pair by pair' },
];

export const InteractiveShowcase: React.FC<InteractiveShowcaseProps> = () => {
  const [idx, setIdx] = useState(0);
  const total = SLIDES.length;

  const go = (dir: 1 | -1) => setIdx(prev => (prev + dir + total) % total);

  // Auto-play every 6s; resets whenever the slide changes
  useEffect(() => {
    const t = setTimeout(() => go(1), 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const slide = SLIDES[idx];

  return (
    <section className="bg-white py-14 sm:py-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">

          {/* ── LEFT: Image slider ── */}
          <div className="relative min-h-[340px] sm:min-h-[400px] overflow-hidden rounded-3xl bg-neutral-950 text-white">
            <AnimatePresence mode="wait">
              <motion.img
                key={idx}
                src={imgUrl(slide.image, 960)} decoding="async" loading="lazy"
                alt={slide.title}
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="absolute inset-0 h-full w-full object-cover object-right select-none pointer-events-none"
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />

            <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-between p-6 sm:p-9">
              <span className="self-start rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 font-tech text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
                {slide.tag}
              </span>

              <div className="max-w-md">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.45 }}
                  >
                    <h3 className="font-serif text-3xl sm:text-4xl leading-tight tracking-tight">{slide.title}</h3>
                    <p className="mt-2 text-sm sm:text-[15px] text-white/70">{slide.text}</p>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-6 flex items-center justify-between gap-4">
                  {/* Progress dots */}
                  <div className="flex items-center gap-1.5">
                    {SLIDES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setIdx(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                          i === idx ? 'w-8 bg-white' : 'w-1.5 bg-white/35 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => go(-1)}
                      aria-label="Previous"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/5 backdrop-blur transition-colors hover:bg-white hover:text-black cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => go(1)}
                      aria-label="Next"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-neutral-200 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: What makes it special ── */}
          <div className="relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-[#F7F5F2] to-[#EEEAE4] p-6 sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-tech text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9A7B4F]">
                  Inside Every Pair
                </span>
                <h4 className="mt-2 font-serif text-2xl sm:text-3xl leading-tight tracking-tight text-neutral-950">
                  What Makes It Special
                </h4>
              </div>
            </div>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute h-40 w-40 rounded-full bg-white/70 blur-2xl" />
              <img
                src={imgUrl("/images/mockup/blueprint-shoe-only.png", 960)} decoding="async" loading="lazy"
                alt="Shoe design sketch"
                className="relative max-h-[130px] sm:max-h-[150px] object-contain mix-blend-multiply select-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-2xl bg-white/70 p-3.5 ring-1 ring-black/5 backdrop-blur transition-all hover:bg-white hover:shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-neutral-900">{title}</p>
                    <p className="text-xs text-neutral-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                to="/product/qadam-phantom-01"
                className="group inline-flex items-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-[12px] font-semibold uppercase tracking-wider text-white transition-all hover:bg-neutral-800 hover:shadow-lg"
              >
                <span>View Product</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
