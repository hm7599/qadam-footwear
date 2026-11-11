import React, { useEffect, useState } from 'react';
import { Truck, Tag, X, Loader2, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { marketingApi, Offer, ShippingInfo } from '../../utils/marketingApi';

/** "Add Rs. X more to unlock FREE DELIVERY" — uses the server quote for the current bag */
export const FreeShippingBar: React.FC<{ className?: string; compact?: boolean }> = ({ className = '', compact }) => {
  const { quote, cart } = useCart();
  const { formatPrice } = useCurrency();
  const fs = quote?.freeShipping;
  if (!cart.length || !fs || (!fs.enabled && !fs.byCoupon)) return null;

  const pct = fs.unlocked ? 100 : Math.min(100, Math.round((fs.eligibleSubtotal / (fs.threshold || 1)) * 100));
  let text: React.ReactNode;
  if (fs.byCoupon) text = <>Your code gives you <strong>FREE DELIVERY</strong>.</>;
  else if (fs.blockedByCoupon) text = <>Free delivery can't be combined with your discount code.</>;
  else if (fs.unlocked) text = <>Congratulations! You've unlocked <strong>FREE DELIVERY</strong>.</>;
  else text = <>Add <strong>{formatPrice(fs.remaining)}</strong> more to unlock <strong>FREE DELIVERY</strong>.</>;

  return (
    <div className={`rounded-lg bg-[#FAF6F1] px-3.5 py-3 ring-1 ring-[#EADFD2] ${className}`} role="status" aria-live="polite">
      <p className="flex items-start gap-2 text-xs leading-snug text-neutral-700">
        <Truck className={`mt-px h-4 w-4 shrink-0 ${fs.unlocked ? 'text-emerald-600' : 'text-[#8A6A45]'}`} />
        <span>{text}{fs.campaign && !fs.unlocked ? <span className="text-neutral-400"> · {fs.campaign}</span> : null}</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EADFD2]">
        <div className={`h-full rounded-full transition-[width] duration-500 ${fs.unlocked ? 'bg-emerald-600' : 'bg-[#8A6A45]'}`} style={{ width: `${pct}%` }} />
      </div>
      {!compact && fs.hasExcluded && !fs.unlocked && (
        <p className="mt-1.5 text-[11px] text-neutral-400">Some items in your bag don't count towards free delivery.</p>
      )}
    </div>
  );
};

/** Thin announcement line for the homepage */
export const FreeShippingAnnouncement: React.FC = () => {
  const [info, setInfo] = useState<ShippingInfo | null>(null);
  const { formatPrice } = useCurrency();
  useEffect(() => { marketingApi.shippingInfo().then(setInfo).catch(() => {}); }, []);
  if (!info?.enabled) return null;
  return (
    <div className="bg-[#1C1A17] px-4 py-2 text-center text-[11px] sm:text-xs tracking-wide text-white/85">
      <Truck className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px text-[#D9B98F]" />
      Free delivery on orders over <strong className="text-white">{formatPrice(info.threshold)}</strong>
      {info.campaign ? <span className="text-white/50"> · {info.campaign}</span> : null}
    </div>
  );
};

/** Coupon input + applied state + public offers */
export const CouponBox: React.FC<{ className?: string; showOffers?: boolean }> = ({ className = '', showOffers = true }) => {
  const { promoCode, applyPromoCode, removePromoCode, quote } = useCart();
  const { formatPrice } = useCurrency();
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    if (showOffers) marketingApi.offers().then(setOffers).catch(() => {});
  }, [showOffers]);

  const apply = async (code: string) => {
    setBusy(true);
    setMsg(null);
    const r = await applyPromoCode(code);
    setBusy(false);
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) setInput('');
  };

  const applied = quote?.coupon;

  return (
    <div className={className}>
      {promoCode && applied ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-200">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <Tag className="h-3.5 w-3.5" /> {applied.code}
            </p>
            <p className="truncate text-[11px] text-emerald-700">
              {applied.type === 'free_shipping' ? 'Free delivery' : `You save ${formatPrice(applied.discount)}`}
              {applied.description ? ` · ${applied.description}` : ''}
            </p>
          </div>
          <button type="button" onClick={() => { removePromoCode(); setMsg(null); }} aria-label="Remove code"
            className="rounded-md p-1 text-emerald-700 hover:bg-emerald-100 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); if (input.trim()) apply(input); }} className="flex gap-2">
          <input
            value={input}
            onChange={e => { setInput(e.target.value.toUpperCase()); setMsg(null); }}
            placeholder="Discount code"
            aria-label="Discount code"
            className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 text-sm uppercase tracking-wide text-neutral-900 outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400 focus:border-neutral-900"
          />
          <button type="submit" disabled={busy || !input.trim()}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-neutral-950 px-4 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 cursor-pointer">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
          </button>
        </form>
      )}
      {msg && !msg.ok && <p className="mt-1.5 text-[11px] text-red-600">{msg.text}</p>}
      {msg && msg.ok && !applied && <p className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-700"><Check className="h-3 w-3" />{msg.text}</p>}

      {showOffers && !promoCode && offers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {offers.slice(0, 3).map(o => (
            <button key={o.code} type="button" onClick={() => apply(o.code)} title={o.description}
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-[#C9AF8F] bg-[#FAF6F1] px-2 py-1 text-[11px] text-[#7A5A35] hover:bg-[#F3EADF] cursor-pointer">
              <Tag className="h-3 w-3" /> <strong>{o.code}</strong> · {o.offer}
              {o.minOrderRs > 0 && <span className="text-[#A08A6E]"> over Rs. {o.minOrderRs.toLocaleString('en-PK')}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/** Subtotal / discount / delivery / total lines */
export const PriceSummary: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { subtotal, discount, shippingCost, total, quote, quoteLoading, promoCode, shippingMethod } = useCart();
  const { formatPrice } = useCurrency();
  const fs = quote?.freeShipping;
  const freeDelivery = shippingCost === 0 && !!quote;
  return (
    <dl className={`space-y-2 text-sm ${className}`}>
      <div className="flex justify-between text-neutral-600"><dt>Subtotal</dt><dd className="font-medium text-neutral-900">{formatPrice(subtotal)}</dd></div>
      {discount > 0 && (
        <div className="flex justify-between text-emerald-700"><dt>Discount {promoCode && <span className="text-xs">({promoCode})</span>}</dt><dd className="font-medium">−{formatPrice(discount)}</dd></div>
      )}
      <div className="flex justify-between text-neutral-600">
        <dt>Delivery {shippingMethod === 'express' && <span className="text-xs text-neutral-400">(Express)</span>}</dt>
        <dd className="font-medium text-neutral-900">
          {freeDelivery ? (
            <span className="text-emerald-700">
              {quote && quote.standardFee > 0 && shippingMethod === 'standard' && <s className="mr-1.5 font-normal text-neutral-400">{formatPrice(quote.standardFee)}</s>}
              Free
            </span>
          ) : formatPrice(shippingCost)}
        </dd>
      </div>
      {!freeDelivery && fs?.enabled && shippingMethod === 'standard' && fs.remaining > 0 && (
        <p className="text-right text-[11px] text-neutral-400">Free over {formatPrice(fs.threshold)}</p>
      )}
      <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold text-neutral-950">
        <dt>Total</dt>
        <dd className="flex items-center gap-2">{quoteLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />}{formatPrice(total)}</dd>
      </div>
    </dl>
  );
};
