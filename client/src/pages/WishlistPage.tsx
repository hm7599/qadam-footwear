import React, { useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/shop/ProductCard';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Trash2, ShoppingBag, Truck, ShieldCheck, RefreshCw } from 'lucide-react';

const categories = [
  { label: 'Casuals', href: '/shop?category=casuals' },
  { label: 'Formals', href: '/shop?category=formals' },
  { label: 'Sandals', href: '/shop?category=sandals' },
  { label: 'Slides', href: '/shop?category=slides' },
  { label: 'Chelsea Boots', href: '/shop?category=chelsea-boots' },
  { label: 'Best Sellers', href: '/best-sellers' },
];

const perks = [
  { Icon: Truck, title: 'Nationwide delivery', text: 'Fast shipping across Pakistan' },
  { Icon: RefreshCw, title: 'Easy exchanges', text: 'Hassle-free size swaps' },
  { Icon: ShieldCheck, title: 'Genuine leather', text: 'Handcrafted quality you can feel' },
];

export const WishlistPage: React.FC = () => {
  const { wishlist, clearWishlist } = useWishlist();
  const [confirmClear, setConfirmClear] = useState(false);
  const count = wishlist.length;

  return (
    <div className="min-h-screen bg-[#FBF8F3] pt-28 pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#EDE1CF] bg-gradient-to-b from-[#F6EEE2] to-[#FBF8F3]">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[38rem] -translate-x-1/2 rounded-full bg-[#E5B56D]/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <nav className="mb-5 flex items-center justify-center gap-2 text-xs text-neutral-500">
            <Link to="/" className="hover:text-black">Home</Link>
            <span className="text-neutral-300">/</span>
            <span className="text-[#A8824C] font-medium">Wishlist</span>
          </nav>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_-6px_rgba(201,164,106,0.45)] ring-1 ring-[#EDE1CF]">
            <Heart className="h-6 w-6 fill-[#D4A359] text-[#D4A359]" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl tracking-tight text-neutral-950">My Wishlist</h1>
          <p className="mx-auto mt-3 max-w-xl text-neutral-600">
            The pairs you love, saved in one place. Come back any time to make them yours.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold tracking-wider text-[#A8824C] ring-1 ring-[#EDE1CF]">
            {count} {count === 1 ? 'SAVED ITEM' : 'SAVED ITEMS'}
          </span>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
        {count === 0 ? (
          <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 sm:p-12 text-center shadow-[0_20px_60px_-25px_rgba(120,85,40,0.35)] ring-1 ring-[#EDE1CF]">
            <div className="relative mx-auto mb-6 h-24 w-24">
              <div className="absolute inset-0 rounded-full bg-[#F6EEE2]" />
              <div className="absolute inset-3 flex items-center justify-center rounded-full bg-white ring-1 ring-[#EDE1CF]">
                <Heart className="h-8 w-8 text-[#D4A359]" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-neutral-950">Your wishlist is empty</h2>
            <p className="mx-auto mt-3 max-w-md text-neutral-600">
              Tap the heart on any pair you like and it will be waiting for you here.
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#9C6A3E] to-[#6E4527] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#9C6A3E]/25 transition hover:brightness-110"
            >
              Explore the collection <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-10 border-t border-[#F1E8DA] pt-8">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Or browse by style</p>
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map(c => (
                  <Link
                    key={c.label}
                    to={c.href}
                    className="rounded-full border border-[#EDE1CF] bg-[#FBF8F3] px-4 py-2 text-sm text-neutral-700 transition hover:border-[#D4A359] hover:bg-white hover:text-black"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-white px-5 py-4 ring-1 ring-[#EDE1CF] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-neutral-600">
                <span className="font-semibold text-neutral-950">{count}</span> {count === 1 ? 'pair' : 'pairs'} saved for later
              </p>
              <div className="flex items-center gap-3">
                {confirmClear ? (
                  <>
                    <span className="text-sm text-neutral-600">Remove all items?</span>
                    <button
                      onClick={() => { clearWishlist(); setConfirmClear(false); }}
                      className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
                    >
                      Yes, clear
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="rounded-full px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setConfirmClear(true)}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-black cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Clear all
                    </button>
                    <Link
                      to="/shop"
                      className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" /> Continue shopping
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
              {wishlist.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {/* Perks */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {perks.map(({ Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-[#EDE1CF]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F6EEE2] text-[#A8824C]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-950">{title}</p>
                <p className="text-xs text-neutral-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
