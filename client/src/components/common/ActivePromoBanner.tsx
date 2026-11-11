import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, X, Copy, Check, Tag } from 'lucide-react';
import { marketingApi } from '../../utils/marketingApi';

export const ActivePromoBanner: React.FC = () => {
  const [promo, setPromo] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    marketingApi
      .activePromo()
      .then(p => {
        if (p && !sessionStorage.getItem('dismissed_promo_' + p.id)) {
          setPromo(p);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    if (promo?.id) {
      sessionStorage.setItem('dismissed_promo_' + promo.id, 'true');
    }
    setDismissed(true);
  };

  const copyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!promo?.couponCode) return;
    navigator.clipboard.writeText(promo.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (!promo || dismissed) return null;

  return (
    <>
    {/* In-flow spacer so the fixed banner never covers page headings */}
    <div aria-hidden="true" className="h-11 sm:h-12" />
    <div
      role="region"
      aria-label="Promotional announcement"
      className="fixed inset-x-0 top-[110px] sm:top-[116px] z-30 bg-gradient-to-r from-neutral-950 via-[#1d1611] to-neutral-950 px-4 py-2 sm:py-2.5 text-white shadow-lg border-b border-amber-500/30 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs sm:text-[13px]">
        {/* Left: Badge + Message */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 border border-amber-400/30">
            <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
            <span>Offer</span>
          </span>
          <div className="truncate flex items-center gap-2">
            {promo.title && (
              <span className="font-bold text-white shrink-0">{promo.title}:</span>
            )}
            <span className="text-neutral-200 truncate">{promo.message}</span>
          </div>
        </div>

        {/* Right: Coupon copy + CTA + Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          {promo.couponCode && (
            <button
              onClick={copyCoupon}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs font-semibold text-amber-300 border border-white/15 transition-all cursor-pointer"
              title="Click to copy promo code"
            >
              <Tag className="h-3 w-3" />
              <span>{promo.couponCode}</span>
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 opacity-60" />}
            </button>
          )}

          <Link
            to={promo.link || '/shop'}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-400 hover:bg-amber-300 px-3 py-1 text-xs font-bold text-neutral-950 transition-colors shadow-sm"
          >
            <span>Shop Now</span>
            <ArrowRight className="h-3 w-3" />
          </Link>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer ml-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
