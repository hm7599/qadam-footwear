import React, { useState, useRef } from 'react';
import { SIZE_OPTIONS, DEFAULT_SIZE, sizeLabel } from '../../utils/sizes';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { MoveRight, Check, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { imgUrl } from '../../utils/img';

interface TrendingSectionProps {
  products: Product[];
}


export const TrendingSection: React.FC<TrendingSectionProps> = ({ products }) => {
  const oxfordProduct = products.find(p => p.slug.includes('phantom')) || products[0];

  const [selectedSize, setSelectedSize] = useState<number>(DEFAULT_SIZE);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);

  const { addToCart, setIsCheckoutOpen } = useCart();
  const { formatPrice } = useCurrency();
  const shoeImgRef = useRef<HTMLImageElement>(null);

  const handleAddToCart = () => {
    if (!oxfordProduct) return;
    addToCart(oxfordProduct, 'Obsidian Noir', selectedSize, 1, shoeImgRef.current);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 1500);
  };

  const handleBuyNow = () => {
    if (!oxfordProduct) return;
    addToCart(oxfordProduct, 'Obsidian Noir', selectedSize, 1, null);
    setIsCheckoutOpen(true);
  };

  return (
    <section className="bg-white py-14 sm:py-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center rounded-3xl bg-gradient-to-br from-[#F7F5F2] to-[#EDE9E3] p-5 sm:p-8 lg:p-12">

          {/* LEFT: Details */}
          <div className="lg:col-span-5 order-2 lg:order-1 font-sans">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-tech text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A7B4F] ring-1 ring-black/5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9A7B4F]" />
              Featured Pick
            </span>

            <Link to="/product/qadam-phantom-01">
              <h3 className="mt-4 font-serif text-3xl sm:text-4xl leading-tight tracking-tight text-neutral-950 hover:text-neutral-700 transition-colors">
                QADAM Phantom Oxford
              </h3>
            </Link>
            <p className="mt-2 text-sm text-neutral-500">
              Classic black leather shoe, handmade in Italy. Perfect for office and formal events.
            </p>

            <div className="mt-5 flex items-center gap-3 font-tech">
              <span className="text-2xl sm:text-[28px] font-bold tracking-tight text-neutral-950">{formatPrice(395)}</span>
              <span className="text-sm text-neutral-400 line-through">{formatPrice(450)}</span>
              <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold text-white">-12%</span>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-neutral-600">
              <span>Colour:</span>
              <span className="h-4 w-4 rounded-full bg-black ring-2 ring-white ring-offset-1 ring-offset-neutral-300" />
              <span className="font-semibold text-neutral-900">Black</span>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-900">Select Size (UK)</span>
                <button
                  onClick={() => setShowSizeModal(true)}
                  className="text-neutral-500 underline underline-offset-2 hover:text-black cursor-pointer"
                >
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SIZE_OPTIONS.map(sz => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`h-10 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedSize === sz
                        ? 'bg-neutral-950 text-white shadow-md'
                        : 'bg-white text-neutral-700 ring-1 ring-black/5 hover:ring-neutral-900'
                    }`}
                  >
                    {sizeLabel(sz)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
              <button
                onClick={handleAddToCart}
                className={`h-12 rounded-full text-[12px] font-semibold uppercase tracking-wider whitespace-nowrap flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  addedSuccess ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-[#3B2618] to-[#5A3A24] text-white shadow-md shadow-[#3B2618]/25 hover:shadow-lg'
                }`}
              >
                {addedSuccess ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                <span>{addedSuccess ? 'Added' : 'Add to Bag'}</span>
              </button>
              <button
                onClick={handleBuyNow}
                className="h-12 rounded-full text-[12px] font-semibold uppercase tracking-wider whitespace-nowrap flex items-center justify-center transition-all cursor-pointer bg-gradient-to-r from-[#E5B56D] to-[#C9A46A] text-[#2A1A10] shadow-md shadow-[#C9A46A]/30 hover:shadow-lg"
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* RIGHT: Shoe photo */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <Link
              to="/product/qadam-phantom-01"
              className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_-25px_rgba(0,0,0,0.25)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#ffffff_0%,#F3EEE7_100%)]" />
              <motion.img
                ref={shoeImgRef}
                src={imgUrl("/images/featured/burgundy-loafer.png", 640)} decoding="async" loading="lazy"
                alt="QADAM Phantom Oxford"
                className="relative h-full w-full object-cover select-none transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-[11px] font-semibold text-neutral-900 shadow-sm backdrop-blur opacity-0 translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-y-0">
                View Details <MoveRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>

        </div>
      </div>

      {/* Interactive Size Guide Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white max-w-lg w-full p-6 border border-neutral-200 shadow-2xl space-y-4 font-tech text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold uppercase tracking-wider text-sm">Size Chart</h4>
              <button
                onClick={() => setShowSizeModal(false)}
                className="text-neutral-500 hover:text-black font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-neutral-600 font-sans text-xs">
              QADAM shoes are crafted on laser-scanned European lasts. Choose your usual UK size. If you are between sizes, we recommend sizing down for Oxford brogues.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-neutral-100 text-[9px] uppercase font-bold text-neutral-600">
                    <th className="p-2 border">US</th>
                    <th className="p-2 border">UK</th>
                    <th className="p-2 border">EU</th>
                    <th className="p-2 border">Foot (CM)</th>
                  </tr>
                </thead>
                <tbody className="text-[10px]">
                  <tr><td className="p-1.5 border font-bold">8</td><td className="p-1.5 border">7</td><td className="p-1.5 border">41</td><td className="p-1.5 border">26.0</td></tr>
                  <tr><td className="p-1.5 border font-bold">8.5</td><td className="p-1.5 border">7.5</td><td className="p-1.5 border">41.5</td><td className="p-1.5 border">26.5</td></tr>
                  <tr><td className="p-1.5 border font-bold">9</td><td className="p-1.5 border">8</td><td className="p-1.5 border">42</td><td className="p-1.5 border">27.0</td></tr>
                  <tr><td className="p-1.5 border font-bold">9.5</td><td className="p-1.5 border">8.5</td><td className="p-1.5 border">42.5</td><td className="p-1.5 border">27.5</td></tr>
                  <tr><td className="p-1.5 border font-bold">10</td><td className="p-1.5 border">9</td><td className="p-1.5 border">43</td><td className="p-1.5 border">28.0</td></tr>
                  <tr><td className="p-1.5 border font-bold">10.5</td><td className="p-1.5 border">9.5</td><td className="p-1.5 border">43.5</td><td className="p-1.5 border">28.5</td></tr>
                  <tr><td className="p-1.5 border font-bold">11</td><td className="p-1.5 border">10</td><td className="p-1.5 border">44</td><td className="p-1.5 border">29.0</td></tr>
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setShowSizeModal(false)}
              className="w-full py-2.5 bg-black text-white font-bold uppercase tracking-wider text-[10px] cursor-pointer hover:bg-neutral-800 transition-colors"
            >
              Confirm Size Selection
            </button>
          </motion.div>
        </div>
      )}
    </section>
  );
};
