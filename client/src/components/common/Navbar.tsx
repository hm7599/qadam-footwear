import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';

import {
  Search,
  ShoppingBag,
  Heart,
  User as UserIcon,
  Menu,
  X,
  Shield,
  Truck,
  ShieldCheck,
  Leaf,
  Headphones,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { marketingApi } from '../../utils/marketingApi';
import { useStoreWhatsAppNumber } from '../../utils/whatsapp';
import { SearchModal } from './SearchModal';
import { ActivePromoBanner } from './ActivePromoBanner';
import { Product } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  products: Product[];
}

/* ─── Luxury Footwear & Category Silhouette SVGs (Solid Black Filled) ─── */
const HomeIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.5L2 11h3v10a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-5h2v5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V11h3L12 2.5z" />
  </svg>
);

const CasualsIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a2.5 2.5 0 0 0-2.5 2.5c0 1.1.7 2 1.6 2.3L2.5 15.5A2 2 0 0 0 4 19h16a2 2 0 0 0 1.5-3.5L13 6.8A2.5 2.5 0 0 0 12 2z" />
    <circle cx="12" cy="4.5" r="1.5" fill="currentColor" />
  </svg>
);

const FormalsIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 3.5h3.5l3.5 7 3.5-7H19c.8 0 1.5.6 1.6 1.4l1 14.2c.1.9-.6 1.7-1.5 1.7h-4.3l-3.8-6.8-3.8 6.8H4c-.9 0-1.6-.8-1.5-1.7l1-14.2C3.5 4.1 4.2 3.5 5 3.5zm3.8 1.8l3.2 6.2 3.2-6.2H8.8z" />
  </svg>
);

const SandalsIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 17.5a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1.5H2v1.5zm1.5-3.5h4.2c1 0 1.8-.5 2.4-1.2l2.2-2.8c.8-1 2.1-1.5 3.4-1.5h4.8c1.4 0 2.5 1.1 2.5 2.5V14H3.5z" />
  </svg>
);

const SlidesIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 17.5a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-1.5H2v1.5zm4.5-3.5c0-2.8 2.2-5 5-5h2.5c2.8 0 5 2.2 5 5h-2.5c0-1.4-1.1-2.5-2.5-2.5H11.5c-1.4 0-2.5 1.1-2.5 2.5H6.5z" />
  </svg>
);

const BootsIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 18.5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-1.5H3v1.5zm4-1.5h13v-3.5c0-.8-.4-1.5-1.1-1.9l-3.2-1.8c-.8-.4-1.4-1.2-1.5-2.1V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4.8c0 1.1-.5 2.2-1.4 2.8L5.5 13c-.9.7-1.5 1.7-1.5 2.8v1.2h3z" />
  </svg>
);

const BestSellersIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 4h-2V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1H5a2 2 0 0 0-2 2v2c0 2.8 2 5.1 4.7 5.7.8 1.4 2.1 2.5 3.8 2.9V19H9a1 1 0 0 0-1 1v2h8v-2a1 1 0 0 0-1-1h-2.5v-2.4c1.7-.4 3-1.5 3.8-2.9 2.7-.6 4.7-2.9 4.7-5.7V6a2 2 0 0 0-2-2zm-14 4V6h2v3.7C5.8 9.3 5 8.7 5 8zm14 0c0 .7-.8 1.3-2 1.7V6h2v2z" />
  </svg>
);

/* ─── Nav Links Definition with Matching Icons ─── */
const LEFT_NAV_ITEMS = [
  { label: 'Home', href: '/', Icon: HomeIcon },
  { label: 'Casuals', href: '/shop?category=casuals', Icon: CasualsIcon },
  { label: 'Formals', href: '/shop?category=formals', Icon: FormalsIcon },
  { label: 'Sandals', href: '/shop?category=sandals', Icon: SandalsIcon },
];

const RIGHT_NAV_ITEMS = [
  { label: 'Slides', href: '/shop?category=slides', Icon: SlidesIcon },
  { label: 'Chelsea Boots', href: '/shop?category=chelsea-boots', Icon: BootsIcon },
  { label: 'Best Sellers', href: '/best-sellers', Icon: BestSellersIcon },
];

const TOP_TICKER_ITEMS = [
  { icon: Shield, text: 'Free Shipping on Orders Above PKR 3,000', gold: true },
  { icon: Truck, text: 'Easy Returns' },
  { icon: ShieldCheck, text: 'Cash on Delivery Available Across Pakistan' },
  { icon: Leaf, text: 'Handmade in 100% Genuine Leather' },
  { icon: Headphones, text: 'Need Help? Chat with us on WhatsApp' },
];

const actionCircleBtn =
  'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-neutral-800 transition hover:bg-[#E5E7EB] hover:text-black cursor-pointer';

export const Navbar: React.FC<NavbarProps> = ({ products }) => {
  const { totalCount, setIsCartOpen, cartShake } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAdmin, logout } = useAuth();
  const { currency } = useCurrency();
  const storeNumber = useStoreWhatsAppNumber();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activePromo, setActivePromo] = useState<any | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    marketingApi.activePromo().then(setActivePromo).catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 15);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsUserMenuOpen(false);
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const fullPath = location.pathname + location.search;

  const tickerItems = activePromo
    ? [
        {
          icon: Sparkles,
          text: `${activePromo.title || 'Special Offer'}: ${activePromo.message}${
            activePromo.couponCode ? ` (Code: ${activePromo.couponCode})` : ''
          }`,
          isPromo: true,
          gold: true,
        },
        ...TOP_TICKER_ITEMS,
      ]
    : TOP_TICKER_ITEMS;

  const renderNavTab = (item: (typeof LEFT_NAV_ITEMS)[0]) => {
    const isHome = item.href === '/';
    const isActive = isHome ? location.pathname === '/' : fullPath === item.href;
    const Icon = item.Icon;

    return (
      <Link
        key={item.href}
        to={item.href}
        aria-current={isActive ? 'page' : undefined}
        className={`group relative flex flex-col items-center justify-center px-3 sm:px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
          isActive
            ? 'bg-[#FAF3E8] text-neutral-950 font-bold shadow-xs'
            : 'text-neutral-800 hover:text-black hover:bg-neutral-50/80 font-medium'
        }`}
      >
        <span className="flex items-center justify-center transition-transform group-hover:scale-105">
          <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-neutral-950' : 'text-neutral-900'}`} />
        </span>
        <span className="mt-1 text-[11px] sm:text-[11.5px] leading-tight tracking-tight whitespace-nowrap">
          {item.label}
        </span>
        {isActive ? (
          <span className="mt-0.5 h-[2px] w-6 rounded-full bg-[#D4A359]" />
        ) : (
          <span className="mt-0.5 h-[2px] w-0 bg-transparent transition-all group-hover:w-4 group-hover:bg-neutral-300" />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* ── LUXURY FLOATING PILL NAVBAR DOCK ── */}
      <header className="fixed inset-x-0 top-0 z-40 pointer-events-none select-none transition-all duration-300">
        <div
          className={`w-full pointer-events-auto overflow-hidden bg-white shadow-[0_12px_40px_-10px_rgba(0,0,0,0.18)] ring-1 ring-black/10 transition-shadow duration-300 ${
            isScrolled ? 'shadow-[0_16px_48px_-12px_rgba(0,0,0,0.24)]' : ''
          }`}
        >
          {/* ── TOP TIER: SLEEK BLACK BAR WITH RIGHT-TO-LEFT TICKER + CONTROLS ── */}
          <div className="relative flex h-8 items-center justify-between bg-[#0E0E0E] text-white/90 text-[11px] border-b border-white/5">
            {/* Continuous Marquee Ticker (Right to Left, Smooth Infinite Animation that Never Pauses on Cursor Hover) */}
            <div className="relative flex-1 h-full overflow-hidden pointer-events-none">
              <div className="animate-ticker flex h-full items-center whitespace-nowrap tracking-wide motion-reduce:animate-none">
                {[...tickerItems, ...tickerItems, ...tickerItems].map((item: any, i) => {
                  const Icon = item.icon;
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-2 px-6 ${
                        item.isPromo ? 'text-[#E6CFA3] font-medium' : item.gold ? 'text-neutral-100 font-medium' : 'text-neutral-300'
                      }`}
                      aria-hidden={i >= tickerItems.length || undefined}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 ${
                          item.gold ? 'text-[#E5A93C]' : item.isPromo ? 'text-[#C9A46A]' : 'text-[#C9A46A]'
                        }`}
                      />
                      <span>{item.text}</span>
                      <span className="ml-6 h-1 w-1 rounded-full bg-white/20" />
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── BOTTOM TIER: WHITE LUXURY DOCK WITH PERFECT 3-COLUMN BALANCED LAYOUT ── */}
          <div className="relative bg-white">
            {/* Desktop 3-Column Layout */}
            <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center h-[70px] sm:h-[74px] px-3 sm:px-6">
              {/* Left Column: Home, Casuals, Formals, Sandals + Divider */}
              <div className="flex items-center justify-end gap-3 xl:gap-6 pr-5 xl:pr-8">
                {LEFT_NAV_ITEMS.map(renderNavTab)}
                <div className="h-8 w-px bg-neutral-200/90 ml-1.5 xl:ml-3 self-center" />
              </div>

              {/* Center Column: Sculpted Arched Crest Badge */}
              <div className="relative flex flex-col items-center justify-center -mt-3.5 z-20">
                <Link
                  to="/"
                  aria-label="QADAM home"
                  className="group relative flex flex-col items-center justify-center bg-white px-8 sm:px-10 pt-2 pb-2.5 rounded-t-[26px] shadow-[0_-3px_14px_rgba(0,0,0,0.06),0_8px_24px_-2px_rgba(201,164,106,0.3)] border-t border-x border-[#EDE1CF] cursor-pointer"
                >
                  {/* Left Concave Inverted Fillet Scoop */}
                  <span className="pointer-events-none absolute -left-2.5 bottom-0 h-2.5 w-2.5 overflow-hidden">
                    <svg viewBox="0 0 10 10" className="h-full w-full fill-white">
                      <path d="M10,0 C10,5.5 5.5,10 0,10 L10,10 Z" />
                    </svg>
                  </span>
                  {/* Right Concave Inverted Fillet Scoop */}
                  <span className="pointer-events-none absolute -right-2.5 bottom-0 h-2.5 w-2.5 overflow-hidden">
                    <svg viewBox="0 0 10 10" className="h-full w-full fill-white">
                      <path d="M0,0 C0,5.5 4.5,10 10,10 L0,10 Z" />
                    </svg>
                  </span>

                  {/* Brand Logo */}
                  <img src="/logo.png" alt="QADAM Men's Footwear" className="h-16 w-auto object-contain transition-transform group-hover:scale-[1.02]" />

                  {/* Ambient Gold Spotlight Backlight */}
                  <div className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 w-48 h-5 bg-[#E5B56D]/35 blur-md rounded-full" />
                </Link>
              </div>

              {/* Right Column: Slides, Chelsea Boots, Best Sellers + Action Buttons */}
              <div className="flex items-center justify-between gap-2 pl-5 xl:pl-8">
                {/* Right Categories */}
                <div className="flex items-center gap-3 xl:gap-6">
                  {RIGHT_NAV_ITEMS.map(renderNavTab)}
                </div>

                {/* Right Action Icons: Circular Search, Wishlist, Cart, Account */}
                <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
                  {/* Search Icon Button */}
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    aria-label="Search footwear"
                    className={actionCircleBtn}
                    title="Search shoes (Ctrl + K)"
                  >
                    <Search className="h-[17px] w-[17px]" />
                  </button>

                  {/* Wishlist Icon Button */}
                  <Link
                    to="/wishlist"
                    aria-label={`Wishlist${wishlist.length ? `, ${wishlist.length} saved` : ''}`}
                    className={actionCircleBtn}
                    title="My Wishlist"
                  >
                    <Heart className="h-[17px] w-[17px]" />
                    {wishlist.length > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#E5A93C] ring-2 ring-white" />
                    )}
                  </Link>

                  {/* Cart / Bag Button: Solid Black Circle with Gold Count Badge */}
                  <button
                    id="header-cart-icon" data-cart-target
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    aria-label={`Shopping bag, ${totalCount} item${totalCount === 1 ? '' : 's'}`}
                    className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#151515] text-white hover:bg-black transition-transform cursor-pointer shadow-sm ${
                      cartShake ? 'scale-110 ring-2 ring-[#E5A93C]' : ''
                    }`}
                    title="View Shopping Bag"
                  >
                    <ShoppingBag className="h-[16px] w-[16px]" />
                    <AnimatePresence>
                      {totalCount > 0 && (
                        <motion.span
                          key={totalCount}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E5A93C] px-1 text-[10px] font-bold text-neutral-950 ring-2 ring-white shadow-xs"
                        >
                          {totalCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                </div>
              </div>
            </div>

            {/* Mobile / Tablet View (< 1024px) */}
            <div className="flex lg:hidden items-center justify-between h-[64px] px-3 sm:px-4">
              <Link to="/" onClick={() => setIsMobileOpen(false)} className="flex items-center">
                <img src="/logo.png" alt="QADAM Men's Footwear" className="h-12 w-auto object-contain" />
              </Link>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search"
                  className={actionCircleBtn}
                >
                  <Search className="h-4 w-4" />
                </button>
                <Link to="/wishlist" aria-label="Wishlist" className={actionCircleBtn}>
                  <Heart className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  aria-label="Cart"
                  data-cart-target
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full bg-[#151515] text-white transition-transform duration-300 ${cartShake ? 'scale-125 ring-2 ring-[#E5A93C]' : ''}`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {totalCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E5A93C] px-1 text-[10px] font-bold text-neutral-950 ring-2 ring-white">
                      {totalCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── ACTIVE PROMOTION BANNER ── */}
      <ActivePromoBanner />

      {/* ── SEARCH MODAL ── */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} products={products} />

      {/* ── MOBILE / TABLET SLIDE-OUT DRAWER ── */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              key="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-neutral-950/40 backdrop-blur-[2px] lg:hidden"
            />
            <motion.aside
              key="menu-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-[61] flex w-[min(88vw,360px)] flex-col bg-[#FAF8F5] shadow-2xl lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-4 bg-white">
                <Link to="/" onClick={() => setIsMobileOpen(false)} className="flex items-center">
                  <img src="/logo.png" alt="QADAM Men's Footwear" className="h-12 w-auto object-contain" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-800 hover:bg-neutral-200 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Navigation Items with Luxury Silhouette Icons */}
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
                {[...LEFT_NAV_ITEMS, ...RIGHT_NAV_ITEMS].map(item => {
                  const isHome = item.href === '/';
                  const isActive = isHome ? location.pathname === '/' : fullPath === item.href;
                  const Icon = item.Icon;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-[#FAF3E8] text-neutral-950 font-bold border-l-4 border-[#D4A359]'
                          : 'text-neutral-800 hover:bg-white hover:text-black font-medium'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0 text-neutral-900" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}

                <div className="pt-4 border-t border-neutral-200/80 my-3">
                  <Link
                    to="/account"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3.5 px-4 py-2.5 text-sm text-neutral-700 hover:text-black"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>{user ? user.name : 'Sign in / Account'}</span>
                  </Link>
                  <Link
                    to="/track-order"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3.5 px-4 py-2.5 text-sm text-neutral-700 hover:text-black"
                  >
                    <Truck className="h-4 w-4" />
                    <span>Track Order</span>
                  </Link>
                  {storeNumber && (
                    <a
                      href={`https://wa.me/${storeNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3.5 px-4 py-2.5 text-sm text-emerald-700 hover:text-emerald-800"
                    >
                      <Headphones className="h-4 w-4" />
                      <span>WhatsApp Support</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
