import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { imgUrl } from '../../utils/img';

/** Finds the bag icon that is actually visible (desktop or mobile header). */
function findCartTarget() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-target]'));
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: window.innerWidth - 40, y: 40 };
}

const SIZE = 64; // flying card size (px)

export const FlipToCartAnimation: React.FC = () => {
  const { flyingShoe } = useCart();

  const path = useMemo(() => {
    if (!flyingShoe) return null;
    const target = findCartTarget();
    // start centred on the source element, shrunk to a card
    const sx = flyingShoe.startX + flyingShoe.width / 2 - SIZE / 2;
    const sy = flyingShoe.startY + flyingShoe.height / 2 - SIZE / 2;
    const ex = target.x - SIZE / 2;
    const ey = target.y - SIZE / 2;
    // arc: rise above the higher of the two points
    const peakY = Math.min(sy, ey) - 120;
    return { sx, sy, ex, ey, midX: (sx + ex) / 2, peakY };
  }, [flyingShoe]);

  return (
    <AnimatePresence>
      {flyingShoe && path && (
        <motion.div
          key="flying-shoe"
          style={{ position: 'fixed', left: 0, top: 0, width: SIZE, height: SIZE, zIndex: 9999, pointerEvents: 'none' }}
          initial={{ x: path.sx, y: path.sy, scale: 0.4, opacity: 0, rotate: 0 }}
          animate={{
            x: [path.sx, path.sx, path.midX, path.ex],
            y: [path.sy, path.sy - 20, path.peakY, path.ey],
            scale: [0.4, 1.25, 0.9, 0.3],
            opacity: [0, 1, 1, 0.2],
            rotate: [0, -8, 12, 360],
          }}
          transition={{ duration: 0.85, times: [0, 0.18, 0.55, 1], ease: 'easeInOut' }}
          className="flex items-center justify-center rounded-2xl bg-white p-1.5 shadow-[0_12px_30px_-6px_rgba(59,38,24,0.45)] ring-2 ring-[#E5B56D]"
        >
          <img
            src={imgUrl(flyingShoe.image, 160)}
            alt=""
            className="h-full w-full object-contain"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
