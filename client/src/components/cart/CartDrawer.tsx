import React from 'react';
import { CouponBox, FreeShippingBar, PriceSummary } from './PromoWidgets';
import { sizeLabel } from '../../utils/sizes';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { imgUrl } from '../../utils/img';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    removeFromCart,
    updateQuantity,
    totalCount
  } = useCart();
  const { formatPrice } = useCurrency();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-tech">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-screen max-w-md bg-white border-l border-neutral-200 shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="relative overflow-hidden border-b border-[#EDE1CF] bg-gradient-to-br from-white via-[#FDF9F3] to-[#F6EBDA] px-6 pt-6 pb-5">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#E5B56D]/25 blur-3xl" />
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5B56D]/50 bg-white shadow-sm">
                      <ShoppingBag className="h-5 w-5 text-[#A8824C]" />
                    </span>
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-[#A8824C]">QADAM · Your Bag</span>
                      <h2 className="font-serif text-2xl leading-tight text-[#2A1A10]">
                        Shopping Bag
                        <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#3B2618] px-2 align-middle font-sans text-xs font-bold text-[#F3D9A4]">{totalCount}</span>
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    aria-label="Close bag"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EDE1CF] bg-white text-[#8A6A52] transition hover:bg-[#F6EFE4] hover:text-[#2A1A10]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Free delivery progress */}
              {cart.length > 0 && <div className="border-b border-[#EDE1CF] bg-[#FBF7F1] p-4"><FreeShippingBar compact /></div>}

              {/* Items List */}
              <div className="flex-1 overflow-y-auto bg-[#FBF7F1] p-5 space-y-3">
                {cart.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-2 py-10 text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 rounded-full bg-[#E5B56D]/30 blur-2xl" />
                      <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-[#E5B56D]/50 bg-gradient-to-br from-white to-[#F3E6D2] shadow-[0_10px_30px_-10px_rgba(138,106,82,0.5)]">
                        <ShoppingBag className="h-11 w-11 text-[#A8824C]" strokeWidth={1.4} />
                      </div>
                    </div>
                    <h4 className="font-serif text-2xl text-[#2A1A10]">Your bag is empty</h4>
                    <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-[#8A6A52]">
                      Find a pair you love. Handmade leather, Cash on Delivery all over Pakistan.
                    </p>
                    <Link
                      to="/shop"
                      onClick={() => setIsCartOpen(false)}
                      className="group mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3B2618] to-[#5A3A24] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-[#3B2618]/25 transition hover:shadow-xl"
                    >
                      Start Shopping
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <div className="mt-8 w-full">
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#A8824C]">Popular right now</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { to: '/new-arrivals', label: 'New Arrivals' },
                          { to: '/best-sellers', label: 'Best Sellers' },
                          { to: '/mens', label: "Men's Shoes" },
                        ].map(c => (
                          <Link
                            key={c.to}
                            to={c.to}
                            onClick={() => setIsCartOpen(false)}
                            className="rounded-xl border border-[#EDE1CF] bg-white px-2 py-3 text-[11px] font-semibold text-[#3B2618] transition hover:border-[#C9A46A] hover:shadow-md"
                          >
                            {c.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  cart.map(item => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      key={`${item.productId}-${item.color}-${item.size}`}
                      className="flex gap-4 rounded-2xl border border-[#EDE1CF] bg-white p-3 shadow-sm"
                    >
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-[#F6EFE4] p-1">
                        <img src={imgUrl(item.image, 200)} decoding="async" loading="lazy" alt={item.name} className="h-full w-full object-contain" />
                      </div>

                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <h4 className="font-display text-sm font-bold text-neutral-950">{item.name}</h4>
                            <span className="ml-2 shrink-0 font-bold text-[#3B2618]">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5 uppercase">
                            Colour: <span className="font-bold text-neutral-900">{item.color}</span> · Size {sizeLabel(item.size)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          {/* Qty Stepper */}
                          <div className="flex items-center rounded-full border border-[#EDE1CF] bg-white">
                            <button
                              onClick={() => updateQuantity(item.productId, item.color, item.size, -1)}
                              className="px-2 py-1 text-neutral-500 hover:text-neutral-950"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-neutral-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.color, item.size, 1)}
                              className="px-2 py-1 text-neutral-500 hover:text-neutral-950"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Delete Item */}
                          <button
                            onClick={() => removeFromCart(item.productId, item.color, item.size)}
                            className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer Summary & Checkout */}
              {cart.length > 0 && (
                <div className="border-t border-[#EDE1CF] bg-white p-6 space-y-4 shadow-[0_-8px_24px_-12px_rgba(59,38,24,0.25)]">
                  <CouponBox />
                  <PriceSummary className="border-t border-neutral-100 pt-3" />

                  {/* Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsCheckoutOpen(true);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3B2618] to-[#5A3A24] py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-[#3B2618]/25 transition-all hover:shadow-xl active:scale-98"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[9.5px] uppercase tracking-wider text-neutral-500 pt-1">
                      <span>✓ Cash on Delivery (COD)</span>
                      <span>•</span>
                      <span>Free Express Courier Across Pakistan</span>
                    </div>

                    <Link
                      to="/cart"
                      onClick={() => setIsCartOpen(false)}
                      className="block text-center text-xs uppercase tracking-wider text-neutral-400 hover:text-neutral-950 py-1"
                    >
                      View Full Bag Details →
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
