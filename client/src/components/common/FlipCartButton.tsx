import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Check } from 'lucide-react';

interface Props {
  /** true right after the item was added → shows the "Checkout" side */
  flipped: boolean;
  onAdd: (e: React.MouseEvent<HTMLElement>) => void;
  onCheckout: () => void;
  /** size / layout classes for the outer wrapper, e.g. "h-14 flex-1" */
  className?: string;
  /** text classes shared by both faces */
  textClassName?: string;
  addLabel?: string;
  checkoutLabel?: string;
}

/**
 * "Add to Bag" button that flips in 3D to a gold "Checkout" face after adding.
 */
export const FlipCartButton: React.FC<Props> = ({
  flipped,
  onAdd,
  onCheckout,
  className = 'h-14 flex-1',
  textClassName = 'text-sm font-semibold',
  addLabel = 'Add to Bag',
  checkoutLabel = 'Checkout',
}) => {
  const face =
    'absolute inset-0 flex items-center justify-center gap-2 whitespace-nowrap rounded-full [backface-visibility:hidden] ' +
    textClassName;

  return (
    <div className={`relative [perspective:900px] ${className}`}>
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateX: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front: Add to Bag */}
        <button
          type="button"
          onClick={onAdd}
          tabIndex={flipped ? -1 : 0}
          aria-hidden={flipped}
          className={`${face} bg-gradient-to-r from-[#3B2618] to-[#5A3A24] text-white shadow-md shadow-[#3B2618]/25 transition-shadow hover:shadow-lg active:scale-[0.98]`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>{addLabel}</span>
        </button>

        {/* Back: Checkout */}
        <button
          type="button"
          onClick={onCheckout}
          tabIndex={flipped ? 0 : -1}
          aria-hidden={!flipped}
          className={`${face} [transform:rotateX(180deg)] bg-gradient-to-r from-[#E5B56D] to-[#C9A46A] text-[#2A1A10] shadow-md shadow-[#C9A46A]/40 ring-2 ring-[#3B2618]/10 active:scale-[0.98]`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3B2618] text-[#F3D9A4]">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span>{checkoutLabel}</span>
          <motion.span
            animate={flipped ? { x: [0, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.9, repeat: flipped ? Infinity : 0, repeatDelay: 0.4 }}
            className="flex"
          >
            <ArrowRight className="h-4 w-4" />
          </motion.span>
        </button>
      </motion.div>
    </div>
  );
};
