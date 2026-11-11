import React, { useState } from 'react';
import { Bell, Check, Loader2, TrendingDown, X } from 'lucide-react';
import { Product } from '../../types';
import { marketingApi, currentPushEndpoint } from '../../utils/marketingApi';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { sizeLabel } from '../../utils/sizes';

/** Units left for a size; null = not tracked (treated as in stock) */
export const sizeLeft = (p: Product, size: number): number | null => {
  const v = p.sizeStock?.[String(size)];
  return v === undefined || v === null ? null : Math.max(0, Number(v) || 0);
};
export const isSoldOut = (p: Product, size: number) => sizeLeft(p, size) === 0;

const inputCls = 'h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900';

/** Shared contact fields: email OR phone */
const useContact = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const payload = async () => ({ email: email.trim(), phone: phone.trim(), pushEndpoint: await currentPushEndpoint(), userEmail: user?.email || '' });
  const fields = (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" autoComplete="email" className={inputCls} aria-label="Email" />
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="WhatsApp number" inputMode="tel" autoComplete="tel" className={inputCls} aria-label="WhatsApp number" />
    </div>
  );
  return { fields, payload, valid: !!(email.trim() || phone.trim()) };
};

export const StockAlertForm: React.FC<{ product: Product; size: number; color: string }> = ({ product, size, color }) => {
  const c = useContact();
  const [state, setState] = useState<{ busy?: boolean; ok?: string; err?: string }>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c.valid) return setState({ err: 'Enter your email or WhatsApp number.' });
    setState({ busy: true });
    try {
      const r = await marketingApi.stockAlert({ productId: product.id, size, color, ...(await c.payload()) });
      setState({ ok: r.message || "We'll let you know." });
    } catch (e: any) {
      setState({ err: e.message });
    }
  };

  return (
    <div className="rounded-xl bg-[#FAF6F1] p-4 ring-1 ring-[#EADFD2]">
      <p className="text-sm font-semibold text-neutral-950">Size {sizeLabel(size)} – Out of Stock</p>
      {state.ok ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-700"><Check className="h-4 w-4" /> {state.ok}</p>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-2">
          <p className="text-xs text-neutral-500">Get one message when size {sizeLabel(size)}{color ? ` in ${color}` : ''} is back.</p>
          {c.fields}
          {state.err && <p className="text-xs text-red-600">{state.err}</p>}
          <button type="submit" disabled={state.busy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer">
            {state.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />} Notify Me When Available
          </button>
        </form>
      )}
    </div>
  );
};

export const PriceAlertButton: React.FC<{ product: Product; size?: number }> = ({ product, size }) => {
  const { formatPrice, convertPrice } = useCurrency();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState('');
  const c = useContact();
  const [state, setState] = useState<{ busy?: boolean; ok?: string; err?: string }>({});
  const current = product.salePrice || product.price;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c.valid) return setState({ err: 'Enter your email or WhatsApp number.' });
    const t = Number(String(target).replace(/[^\d]/g, '')) || 0;
    if (t && t >= convertPrice(current)) return setState({ err: `Target must be below ${formatPrice(current)}.` });
    setState({ busy: true });
    try {
      const r = await marketingApi.priceAlert({ productId: product.id, size, targetPriceRs: t, ...(await c.payload()) });
      setState({ ok: r.message || "We'll tell you when the price drops." });
    } catch (e: any) {
      setState({ err: e.message });
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs text-neutral-500 underline-offset-2 hover:text-neutral-950 hover:underline cursor-pointer">
        <TrendingDown className="h-3.5 w-3.5" /> Notify me when the price drops
      </button>
    );
  }

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-neutral-200">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-neutral-950">Price drop alert</p>
          <p className="text-xs text-neutral-500">Current price: <strong className="text-neutral-800">{formatPrice(current)}</strong></p>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"><X className="h-4 w-4" /></button>
      </div>
      {state.ok ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-700"><Check className="h-4 w-4" /> {state.ok}</p>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-2">
          <label className="block">
            <span className="mb-1 block text-xs text-neutral-600">Target price (optional — leave empty for any drop)</span>
            <div className="flex items-center rounded-lg border border-neutral-200 bg-white focus-within:border-neutral-900">
              <span className="pl-3 text-sm text-neutral-400">Rs.</span>
              <input value={target} onChange={e => setTarget(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" placeholder={String(Math.round(convertPrice(current) * 0.85))}
                className="h-11 w-full bg-transparent px-2 text-sm outline-none" />
            </div>
          </label>
          {c.fields}
          {state.err && <p className="text-xs text-red-600">{state.err}</p>}
          <button type="submit" disabled={state.busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer">
            {state.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />} Notify Me When Price Drops
          </button>
        </form>
      )}
    </div>
  );
};
