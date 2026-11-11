import React from 'react';
import { CouponBox, FreeShippingBar, PriceSummary } from '../components/cart/PromoWidgets';
import { sizeLabel } from '../utils/sizes';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';
import { imgUrl } from '../utils/img';

export const CartPage: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setIsCheckoutOpen,
    totalCount
  } = useCart();
  const { formatPrice } = useCurrency();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-36 pb-24 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4 space-y-6">
          <div className="flex h-20 w-20 items-center justify-center border border-neutral-200 bg-neutral-50 mx-auto text-neutral-400">
            <ShoppingBag className="h-8 w-8 stroke-1" />
          </div>
          <div>
            <p className="font-tech text-[10px] uppercase tracking-widest text-neutral-400 mb-2">YOUR BAG</p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight uppercase text-black">
              Your Bag is Empty
            </h1>
            <p className="font-editorial text-lg italic text-neutral-500 mt-2">
              Your bag is empty.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-3 bg-black px-8 py-4 text-xs font-tech uppercase tracking-widest text-white hover:bg-neutral-800 transition-colors"
          >
            <span>Start Shopping</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Header */}
        <div className="border-b border-neutral-200 pb-8 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400">SHOPPING BAG</span>
              <span className="h-1 w-1 bg-black rounded-full" />
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-500">{totalCount} ALLOCATED UNITS</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-neutral-950">
              Shopping Bag
            </h1>
            <p className="font-editorial text-lg italic text-neutral-600 mt-1">
              Review your items before checkout.
            </p>
          </div>
          <button
            onClick={clearCart}
            className="font-tech text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors self-start md:self-auto"
          >
            Clear Bag
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map(item => (
              <div
                key={`${item.productId}-${item.color}-${item.size}`}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-neutral-200 bg-white p-6 hover:border-black transition-colors"
              >
                <div className="flex items-center gap-6">
                  <div className="h-28 w-28 flex-shrink-0 bg-neutral-50 border border-neutral-200 p-3 overflow-hidden">
                    <img src={imgUrl(item.image, 320)} decoding="async" loading="lazy" alt={item.name} className="h-full w-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-tech text-[9px] uppercase tracking-widest text-neutral-400">
                      Item #{item.productId.slice(0, 8)}
                    </span>
                    <Link to={`/product/${item.slug}`} className="block font-display text-lg font-bold uppercase tracking-tight text-black hover:underline">
                      {item.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 font-tech text-[11px] text-neutral-600">
                      <span>TONE: <strong className="text-black font-semibold uppercase">{item.color}</strong></span>
                      <span className="text-neutral-300">•</span>
                      <span>SIZE: <strong className="text-black font-semibold">{sizeLabel(item.size)}</strong></span>
                    </div>
                    <p className="font-tech text-xs text-neutral-500 pt-1">
                      {formatPrice(item.price)} <span className="text-[10px] text-neutral-400">/ unit</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-8 pt-4 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                  {/* Stepper */}
                  <div className="flex items-center border border-neutral-200 bg-white">
                    <button
                      onClick={() => updateQuantity(item.productId, item.color, item.size, -1)}
                      className="px-3 py-2 text-neutral-400 hover:text-black hover:bg-neutral-50 transition-colors"
                      title="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-tech px-4 text-xs font-bold text-black">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.color, item.size, 1)}
                      className="px-3 py-2 text-neutral-400 hover:text-black hover:bg-neutral-50 transition-colors"
                      title="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <span className="font-tech text-sm font-bold text-black min-w-[70px] text-right">
                    {formatPrice(item.price * item.quantity)}
                  </span>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.productId, item.color, item.size)}
                    className="text-neutral-400 hover:text-red-500 transition-colors p-2"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="border border-neutral-200 bg-neutral-50 p-4 flex items-center justify-between">
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-500">
                FAST, SAFE DELIVERY
              </span>
              <span className="font-tech text-[10px] uppercase tracking-widest text-black font-bold">
                ORDER SUMMARY
              </span>
            </div>
          </div>

          {/* Right Summary Panel */}
          <div className="lg:col-span-4 border border-neutral-200 bg-neutral-50/50 p-8 space-y-6">
            <div>
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400 block mb-1">
                PRICE DETAILS
              </span>
              <h3 className="font-display text-2xl font-black uppercase tracking-tight text-black border-b border-neutral-200 pb-4">
                Order Summary
              </h3>
            </div>

            <FreeShippingBar />
            <div>
              <span className="mb-2 block text-xs font-medium text-neutral-600">Discount code</span>
              <CouponBox />
            </div>
            <PriceSummary className="border-t border-neutral-200 pt-4" />

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="flex w-full items-center justify-center gap-3 bg-black py-4 font-tech text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 border-t border-neutral-200 pt-4">
              <ShieldCheck className="h-5 w-5 text-neutral-700 flex-shrink-0 mt-0.5" />
              <p className="font-tech text-[10px] text-neutral-500 uppercase leading-relaxed">
                Safe, sealed delivery and free returns within 30 days.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
