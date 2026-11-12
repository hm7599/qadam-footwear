import React, { useState, useRef } from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCurrency } from '../../context/CurrencyContext';
import { X, Heart, ShoppingBag, ArrowRight, Check, Star, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { imgUrl } from '../../utils/img';
import { sizeLabel, sizeLabelFull, pickDefaultSize } from '../../utils/sizes';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<number>(() => pickDefaultSize(product?.sizes));
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const { addToCart, setIsCheckoutOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const imageRef = useRef<HTMLImageElement>(null);

  if (!isOpen || !product) return null;

  const currentColor = product.colors[selectedColorIdx] || product.colors[0];
  const activeImage = currentColor?.previewImage || product.images[activeImageIdx] || product.images[0];
  const price = product.salePrice || product.price;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addToCart(product, currentColor.name, selectedSize, 1, imageRef.current);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 1600);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addToCart(product, currentColor.name, selectedSize, 1, null);
    onClose();
    setIsCheckoutOpen(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-white border border-neutral-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 h-9 w-9 bg-white/90 backdrop-blur-sm border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black hover:border-black transition-all"
            title="Close Quick View"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Left: Product Stage */}
          <div className="md:w-1/2 bg-neutral-50 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-200 relative">
            {/* Badges */}
            <div className="flex items-center gap-2 font-tech text-[9px] uppercase tracking-widest">
              {product.isNewArrival && (
                <span className="bg-black text-white px-2 py-0.5 font-bold">New Arrival</span>
              )}
              {product.isLimitedEdition && (
                <span className="border border-black bg-white text-black px-2 py-0.5 font-bold">Limited 500</span>
              )}
              <span className="text-neutral-400 font-mono ml-auto">
                SKU // {product.id.slice(0, 10).toUpperCase()}
              </span>
            </div>

            {/* Main Shoe Image */}
            <div className="my-auto py-6 flex items-center justify-center min-h-[260px]">
              <img
                ref={imageRef}
                src={imgUrl(activeImage, 800)} decoding="async" loading="lazy"
                alt={product.name}
                className="max-h-64 w-auto object-contain drop-shadow-xl transition-all duration-500"
                style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.12))' }}
              />
            </div>

            {/* Image thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`h-14 w-14 p-1 border bg-white transition-all flex-shrink-0 ${
                    activeImageIdx === idx ? 'border-black shadow-xs' : 'border-neutral-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl(img, 800)} decoding="async" loading="lazy" alt="thumbnail" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Details & Controls */}
          <div className="md:w-1/2 p-7 md:p-8 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Category & Brand */}
              <div className="font-tech text-[9px] uppercase tracking-[0.25em] text-neutral-500 mb-1">
                {product.brand} // {product.category.replace('-', ' ')}
              </div>

              {/* Title */}
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-neutral-950">
                {product.name}
              </h2>
              <p className="font-editorial italic text-sm text-neutral-600 mt-1">
                &ldquo;{product.tagline}&rdquo;
              </p>

              {/* Price & Rating */}
              <div className="flex items-baseline justify-between border-y border-neutral-200 py-3 my-4 font-tech">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black text-black">
                    {formatPrice(price)}
                  </span>
                  {product.salePrice && (
                    <span className="text-sm text-neutral-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-neutral-600">
                  <Star className="h-3.5 w-3.5 text-black fill-current" />
                  <span className="font-bold">{product.rating}</span>
                  <span className="text-neutral-400">({product.reviewCount})</span>
                </div>
              </div>

              {/* Colorways */}
              <div className="space-y-2 mb-4 font-tech">
                <div className="flex justify-between text-[10px] uppercase tracking-wider">
                  <span className="text-neutral-500">Colorway:</span>
                  <span className="font-bold text-black">{currentColor.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {product.colors.map((c, i) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setSelectedColorIdx(i);
                        setActiveImageIdx(0);
                      }}
                      className={`relative flex h-8 w-8 items-center justify-center border transition-all ${
                        selectedColorIdx === i
                          ? 'border-black ring-1 ring-black ring-offset-1'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                      title={c.name}
                    >
                      <span className="h-5 w-5" style={{ backgroundColor: c.hex }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector */}
              <div className="space-y-2 mb-5 font-tech">
                <div className="flex justify-between text-[10px] uppercase tracking-wider">
                  <span className={sizeError ? 'text-red-600 font-bold' : 'text-neutral-500'}>
                    {sizeError ? 'Select size' : 'Size (EU/UK):'}
                  </span>
                  <span className="text-neutral-400 text-[9px]">{selectedSize ? sizeLabelFull(selectedSize) : ''}</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {product.sizes.map(sz => (
                    <button
                      key={sz}
                      onClick={() => {
                        setSelectedSize(sz);
                        setSizeError(false);
                      }}
                      className={`py-2 text-[10px] font-bold transition-all ${
                        selectedSize === sz
                          ? 'bg-black text-white'
                          : 'border border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-black hover:text-black'
                      }`}
                    >
                      {sizeLabel(sz)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-3 border-t border-neutral-200">
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className={`flex-1 flex h-12 items-center justify-center gap-2 rounded-full px-3 font-tech text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    addedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-[#3B2618] to-[#5A3A24] text-white shadow-md shadow-[#3B2618]/25 hover:shadow-lg'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Added to Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </motion.button>

                <button
                  onClick={handleBuyNow}
                  className="flex-1 flex h-12 items-center justify-center rounded-full px-3 font-tech text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all bg-gradient-to-r from-[#E5B56D] to-[#C9A46A] text-[#2A1A10] shadow-md shadow-[#C9A46A]/30 hover:shadow-lg"
                >
                  Buy Now
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  className={`h-12 w-12 shrink-0 rounded-full border flex items-center justify-center transition-all ${
                    isInWishlist(product.id)
                      ? 'border-red-300 bg-red-50 text-red-500'
                      : 'border-neutral-200 text-neutral-600 hover:border-black hover:text-black'
                  }`}
                  title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between font-tech text-[10px] text-neutral-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <Truck className="h-3 w-3 text-black" />
                  <span>Complimentary Global Express</span>
                </div>
                <Link
                  to={`/product/${product.slug}`}
                  onClick={onClose}
                  className="font-bold text-black hover:underline flex items-center gap-1 uppercase"
                >
                  Full Specs <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
