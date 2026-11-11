import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

// Pages that have their own sticky bottom bar (or need full focus)
const HIDDEN_ON = [/^\/product\//, /^\/checkout/, /^\/admin/];

/** App-style bottom tab bar for phones */
export const MobileBottomNav: React.FC = () => {
  const { pathname } = useLocation();
  const { totalCount, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();

  if (HIDDEN_ON.some(r => r.test(pathname))) return null;

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const tab = (active: boolean) =>
    `relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
      active ? 'text-neutral-950' : 'text-neutral-400'
    }`;

  const Badge: React.FC<{ n: number }> = ({ n }) =>
    n > 0 ? (
      <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-950 px-1 text-[9px] font-bold text-white">
        {n > 9 ? '9+' : n}
      </span>
    ) : null;

  return (
    <>
      {/* spacer so page content is not hidden behind the bar */}
      <div className="h-16 sm:hidden" aria-hidden />
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Main"
      >
        <div className="flex h-16 items-stretch">
          <Link to="/" className={tab(isActive('/'))}>
            <Home className="h-5 w-5" />
            Home
          </Link>
          <Link to="/shop" className={tab(isActive('/shop'))}>
            <LayoutGrid className="h-5 w-5" />
            Shop
          </Link>
          <Link to="/wishlist" className={tab(isActive('/wishlist'))}>
            <span className="relative"><Heart className="h-5 w-5" /><Badge n={wishlist.length} /></span>
            Wishlist
          </Link>
          <button onClick={() => setIsCartOpen(true)} className={tab(isActive('/cart'))}>
            <span className="relative"><ShoppingBag className="h-5 w-5" /><Badge n={totalCount} /></span>
            Bag
          </button>
          <Link to="/account" className={tab(isActive('/account') || isActive('/orders'))}>
            <User className="h-5 w-5" />
            Account
          </Link>
        </div>
      </nav>
    </>
  );
};
