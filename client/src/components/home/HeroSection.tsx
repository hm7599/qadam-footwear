import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoveRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { DEFAULT_HERO, HeroContent, normalizeHero } from '../../data/heroDefaults';
import { imgUrl, imgSrcSet } from '../../utils/img';

export const HeroSection: React.FC = () => {
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO);
  const [idx, setIdx] = useState(0);

  // Load admin-edited content; keep defaults if the API is unavailable
  useEffect(() => {
    api.getSetting('hero')
      .then(data => { if (data) setHero(normalizeHero(data)); })
      .catch(() => {});
  }, []);

  const total = hero.slides.length;
  const slide = hero.slides[Math.min(idx, total - 1)];

  const go = (dir: 1 | -1) => setIdx(i => (i + dir + total) % total);

  // Auto-advance every 7s
  useEffect(() => {
    if (total < 2) return;
    const t = setTimeout(() => go(1), 7000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, total]);

  const isExternal = /^https?:\/\//.test(slide.buttonLink);

  return (
    <section className="relative w-full overflow-hidden border-b border-neutral-200 bg-gradient-to-br from-[#FBF8F3] via-[#F5EEE4] to-[#EDE2D3] pt-[118px] sm:pt-[128px]">
      {/* Soft decorative light */}
      <div className="pointer-events-none absolute -left-40 top-10 h-[480px] w-[480px] rounded-full bg-white/70 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-[420px] w-[620px] rounded-full bg-white/60 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid lg:min-h-[620px] grid-cols-1 items-center gap-6 py-8 sm:gap-8 sm:py-10 lg:grid-cols-12 lg:py-16">

          {/* ── TEXT ── */}
          <div className="lg:col-span-6 order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {slide.tag && (
                  <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
                    <span className="h-px w-8 bg-[#A07A4F]" />
                    {slide.tag}
                  </p>
                )}

                <h1 className="mt-6 select-none font-serif leading-[1.02] tracking-[-0.02em] text-neutral-950 [overflow-wrap:anywhere]">
                  <span className="block text-[clamp(2.5rem,6vw,4.75rem)] font-medium">
                    {slide.titleLine1}
                  </span>
                  <span className="block text-[clamp(2.5rem,6vw,4.75rem)] font-normal italic text-[#8A6A45]">
                    {slide.titleLine2}
                  </span>
                </h1>

                {slide.tagline && (
                  <p className="mt-5 text-sm sm:text-[15px] font-medium tracking-wide text-neutral-800">
                    {slide.tagline}
                  </p>
                )}

                {slide.description && (
                  <p className="mt-2 max-w-md text-sm sm:text-[15px] leading-relaxed text-neutral-500">
                    {slide.description}
                  </p>
                )}
                {slide.buttonText && (
                  isExternal ? (
                    <a
                      href={slide.buttonLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group mt-8 inline-flex h-12 items-center gap-3 rounded-md bg-neutral-950 px-7 text-[13px] font-medium tracking-wide text-white transition-colors hover:bg-[#8A6A45]"
                    >
                      {slide.buttonText}
                      <MoveRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </a>
                  ) : (
                    <Link
                      to={slide.buttonLink || '/shop'}
                      className="group mt-8 inline-flex h-12 items-center gap-3 rounded-md bg-neutral-950 px-7 text-[13px] font-medium tracking-wide text-white transition-colors hover:bg-[#8A6A45]"
                    >
                      {slide.buttonText}
                      <MoveRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  )
                )}
              </motion.div>
            </AnimatePresence>

            {/* Slider controls */}
            {total > 1 && (
              <div className="mt-10 flex items-center gap-4">
                <span className="text-lg font-bold tabular-nums text-neutral-950">{String(idx + 1).padStart(2, '0')}</span>
                <div className="relative h-[2px] w-20 bg-neutral-300 overflow-hidden">
                  <motion.div
                    key={idx}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 7, ease: 'linear' }}
                    className="absolute inset-y-0 left-0 bg-neutral-950"
                  />
                </div>
                <span className="text-sm text-neutral-400">/ {String(total).padStart(2, '0')}</span>
                <div className="ml-2 flex gap-2">
                  <button
                    onClick={() => go(-1)}
                    aria-label="Previous slide"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white/60 text-neutral-800 transition-colors hover:bg-white cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => go(1)}
                    aria-label="Next slide"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-white transition-colors hover:bg-neutral-800 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── SHOE IMAGE (optional) ── */}
          <div className="lg:col-span-6 order-2 relative flex items-center justify-center min-h-[180px] sm:min-h-[240px]">
            <div className="absolute bottom-6 left-1/2 h-10 w-3/4 -translate-x-1/2 rounded-full bg-black/20 blur-2xl" />
            <AnimatePresence mode="wait">
              {slide.image && (
                <motion.img
                  key={slide.image + idx}
                  src={imgUrl(slide.image, 960)} srcSet={imgSrcSet(slide.image, [640, 960, 1440, 1920])} sizes="(min-width: 1024px) 50vw, 100vw" fetchPriority="high" decoding="async"
                  alt={`${slide.titleLine1} ${slide.titleLine2}`}
                  initial={{ opacity: 0, x: 40, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="relative aspect-[4/3] w-full max-w-[560px] max-h-[240px] sm:max-h-[360px] lg:max-h-[440px] rounded-[28px] object-cover shadow-[0_30px_60px_-25px_rgba(90,60,30,0.45)] ring-1 ring-[#EDE1CF] select-none"
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      {hero.stats.length > 0 && (
        <div className="relative border-t border-neutral-300/70 bg-white/50 backdrop-blur">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 gap-y-4 sm:flex sm:items-center sm:justify-between sm:divide-x sm:divide-neutral-300">
              {hero.stats.map((s, i) => (
                <div key={i} className="sm:flex-1 sm:px-8 sm:first:pl-0">
                  <p className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">{s.value}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
