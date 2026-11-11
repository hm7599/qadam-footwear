import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { imgUrl } from '../../utils/img';

const HOTSPOTS = [
  {
    id: 'upper',
    code: 'SPEC 01',
    title: 'Real Italian Leather',
    tagline: 'Handmade in Italy',
    description: 'Soft, strong full-grain leather from Italy, with classic hole patterns and careful hand stitching.',
    spec: '1.4 mm thick · hand-polished black',
    image: '/images/atelier/formal_oxford_set3_3.jpg',
    color: '#1a1a1a',
  },
  {
    id: 'foam',
    code: 'SPEC 02',
    title: 'Goodyear Welted Stitched Sole',
    tagline: 'Hand-stitched durability',
    description: 'Every sole is Goodyear-welted by master cordwainers with natural cork filling that molds over time to the unique contours of your foot.',
    spec: 'Hand-welted 360° stitch',
    image: '/images/mockup/atelier-craft.jpg',
    color: '#3d4a5c',
  },
  {
    id: 'plate',
    code: 'SPEC 03',
    title: 'Arch Support Shank',
    tagline: 'Better ergonomic posture',
    description: 'A tempered steel and leather shank inside the midfoot supports your arch and prevents foot fatigue throughout long formal wear.',
    spec: 'Tempered steel shank · Anatomical arch',
    image: '/images/mockup/blueprint-card.jpg',
    color: '#2d3a2d',
  },
  {
    id: 'outsole',
    code: 'SPEC 04',
    title: 'Beveled Leather & Dainite Tread',
    tagline: 'Formal poise with reliable grip',
    description: 'Vegetable-tanned leather outsoles reinforced with recessed rubber heel dovetails for graceful, slip-free movement across marble and all floors.',
    spec: 'Oak-bark tanned leather + rubber dovetail',
    image: '/images/atelier/formal_boot_set2_2.jpg',
    color: '#1a1a2e',
  }
];

export const ShoeAnatomySection: React.FC = () => {
  const [activeId, setActiveId] = useState(HOTSPOTS[0].id);
  const active = HOTSPOTS.find(h => h.id === activeId)!;

  return (
    <section className="bg-white py-20 sm:py-28 border-b border-neutral-200 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-14 pb-8 border-b border-neutral-200"
        >
          <span className="font-tech text-[9px] uppercase tracking-[0.35em] text-neutral-400 font-bold block mb-3">
            WHAT'S INSIDE
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-neutral-950 leading-[1.05]">
            Inside{' '}
            <span className="font-editorial italic font-normal text-neutral-500">Every Pair</span>
          </h2>
          <p className="font-editorial italic text-base sm:text-lg text-neutral-500 mt-3 max-w-xl">
            Every part is designed to keep you comfortable all day long.
          </p>
        </motion.div>

        {/* Interactive Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Hotspot Picker */}
          <div className="lg:col-span-5 space-y-2.5">
            {HOTSPOTS.map((spot, i) => {
              const isActive = activeId === spot.id;
              return (
                <motion.div
                  key={spot.id}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setActiveId(spot.id)}
                  className={`cursor-pointer border transition-all duration-300 ${
                    isActive
                      ? 'border-neutral-950 bg-neutral-950 text-white shadow-md'
                      : 'border-neutral-200 bg-[#FBFBFB] hover:border-neutral-400 text-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between p-5">
                    <div>
                      <span className={`font-tech text-[8.5px] uppercase tracking-widest block mb-1 font-bold ${isActive ? 'text-neutral-400' : 'text-neutral-400'}`}>
                        {spot.code}
                      </span>
                      <h4 className={`font-tech text-sm font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-neutral-950'}`}>
                        {spot.title}
                      </h4>
                      <p className={`font-editorial italic text-xs mt-0.5 ${isActive ? 'text-neutral-300' : 'text-neutral-500'}`}>
                        {spot.tagline}
                      </p>
                    </div>
                    <span className={`font-tech text-xs font-bold flex-shrink-0 ml-4 ${isActive ? 'text-neutral-300' : 'text-neutral-400'}`}>
                      {isActive ? '[-]' : '[+]'}
                    </span>
                  </div>

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-3">
                          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                            {spot.description}
                          </p>
                          <div className="font-tech text-[9.5px] uppercase tracking-wider font-bold bg-white/5 border border-white/10 px-3.5 py-2 text-neutral-200">
                            {spot.spec}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Visual Stage */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative overflow-hidden border border-neutral-200 bg-gradient-to-b from-[#FAFBFD] to-[#F1F3F7] min-h-[460px] flex flex-col justify-between"
              >
                {/* Image Stage */}
                <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative min-h-[340px]">
                  <div className="absolute inset-0 hairline-grid opacity-25" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8)_0%,transparent_75%)] pointer-events-none" />
                  <img
                    src={imgUrl(active.image, 960)} decoding="async" loading="lazy"
                    alt={active.title}
                    className="max-h-[280px] sm:max-h-[320px] max-w-[90%] object-contain relative z-10 select-none drop-shadow-xl"
                    style={{ filter: 'drop-shadow(0 20px 32px rgba(0,0,0,0.14))' }}
                  />
                </div>

                {/* Bottom Metric Bar */}
                <div className="border-t border-neutral-200/90 px-6 py-4 flex items-center justify-between font-tech text-xs bg-white/80 backdrop-blur-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold block">{active.code} METRIC</span>
                    <span className="font-bold text-neutral-900 text-xs mt-0.5">{active.spec}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {HOTSPOTS.map(h => (
                      <button
                        key={h.id}
                        onClick={() => setActiveId(h.id)}
                        className={`h-2 transition-all ${
                          activeId === h.id ? 'bg-neutral-950 w-6' : 'bg-neutral-300 w-2 hover:bg-neutral-500'
                        }`}
                        title={h.title}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
