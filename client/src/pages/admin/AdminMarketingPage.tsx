import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Tag, Truck, ShoppingCart, Bell, TrendingDown, FileText, Send, LayoutDashboard, Plus, X, Loader2, Trash2,
  Pencil, Shuffle, Megaphone, History, Check, MessageCircle, Mail, Search, RefreshCw, AlertCircle,
  Smartphone, Globe, Sparkles, CheckCircle2, ArrowRight, Eye, Copy,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { marketingApi } from '../../utils/marketingApi';
import { api } from '../../utils/api';
import { useCurrency } from '../../context/CurrencyContext';
import { Product } from '../../types';
import { sizeLabel } from '../../utils/sizes';
import { confirmDialog } from '../../components/common/Dialog';

// ── shared bits ───────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'coupons', label: 'Coupons & Discounts', icon: Tag },
  { id: 'shipping', label: 'Free Delivery', icon: Truck },
  { id: 'carts', label: 'Abandoned Carts', icon: ShoppingCart },
  { id: 'stock', label: 'Back in Stock', icon: Bell },
  { id: 'price', label: 'Price Drops', icon: TrendingDown },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'outbox', label: 'Outbox', icon: Send },
] as const;
type TabId = typeof TABS[number]['id'];

const CATEGORIES = [
  { id: 'formals', label: 'Formals' }, { id: 'casuals', label: 'Casuals' }, { id: 'sandals', label: 'Sandals' },
  { id: 'slides', label: 'Slides' }, { id: 'chelsea-boots', label: 'Chelsea Boots' }, { id: 'lifestyle', label: 'Sneakers' },
  { id: 'running', label: 'Running' }, { id: 'basketball', label: 'Sports' }, { id: 'luxury-minimal', label: 'Formal (classic)' },
];

const card = 'rounded-xl bg-white ring-1 ring-neutral-200';
const inputCls = 'h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900';
const btnDark = 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer';
const btnLight = 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200 hover:ring-neutral-400 disabled:opacity-50 cursor-pointer';
const th = 'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400';
const td = 'px-4 py-3 align-top text-sm text-neutral-700';

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
const toLocalInput = (d?: string | null) => (d ? new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');

const Field: React.FC<{ label: string; hint?: string; className?: string; children: React.ReactNode }> = ({ label, hint, className, children }) => (
  <label className={`block ${className || ''}`}>
    <span className="mb-1 block text-xs font-semibold text-neutral-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span>}
  </label>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }> = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-start gap-3">
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-neutral-950' : 'bg-neutral-300'}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
    <span>
      <span className="block text-sm text-neutral-900">{label}</span>
      {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
    </span>
  </label>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="px-4 py-12 text-center text-sm text-neutral-500">{text}</div>
);
const Loading = () => <div className="flex items-center gap-2 px-4 py-10 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;

const Badge: React.FC<{ tone: 'green' | 'amber' | 'grey' | 'red' | 'blue'; children: React.ReactNode }> = ({ tone, children }) => {
  const cls = { green: 'bg-emerald-50 text-emerald-700 ring-emerald-200', amber: 'bg-amber-50 text-amber-800 ring-amber-200', grey: 'bg-neutral-100 text-neutral-600 ring-neutral-200', red: 'bg-red-50 text-red-700 ring-red-200', blue: 'bg-sky-50 text-sky-700 ring-sky-200' }[tone];
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${cls}`}>{children}</span>;
};

const useFlash = () => {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 4000); return () => clearTimeout(t); }, [msg]);
  const node = msg && (
    <div className={`fixed bottom-5 left-1/2 z-[60] flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-lg px-4 py-2.5 text-sm shadow-lg ${msg.ok ? 'bg-neutral-950 text-white' : 'bg-red-600 text-white'}`}>
      {msg.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {msg.text}
    </div>
  );
  return { flash: (ok: boolean, text: string) => setMsg({ ok, text }), node };
};

/** Searchable multi-select of products */
const ProductPicker: React.FC<{ products: Product[]; value: string[]; onChange: (v: string[]) => void; placeholder?: string }> = ({ products, value, onChange, placeholder }) => {
  const [q, setQ] = useState('');
  const matches = q ? products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) && !value.includes(p.id)).slice(0, 6) : [];
  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map(id => {
            const p = products.find(x => x.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-md bg-neutral-100 py-0.5 pl-2 pr-1 text-xs text-neutral-700">
                {p?.name || id}
                <button type="button" onClick={() => onChange(value.filter(v => v !== id))} className="rounded p-0.5 hover:bg-neutral-200 cursor-pointer" aria-label="Remove"><X className="h-3 w-3" /></button>
              </span>
            );
          })}
        </div>
      )}
      <div className="relative">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder || 'Search products…'} className={inputCls} />
        {matches.length > 0 && (
          <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-neutral-200">
            {matches.map(p => (
              <button key={p.id} type="button" onClick={() => { onChange([...value, p.id]); setQ(''); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 cursor-pointer">
                {p.images?.[0] && <img src={p.images[0]} alt="" className="h-7 w-7 rounded object-cover" />}
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CategoryPicker: React.FC<{ value: string[]; onChange: (v: string[]) => void }> = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {CATEGORIES.map(c => {
      const on = value.includes(c.id);
      return (
        <button key={c.id} type="button" onClick={() => onChange(on ? value.filter(v => v !== c.id) : [...value, c.id])}
          className={`rounded-md px-2.5 py-1 text-xs font-medium ring-1 cursor-pointer ${on ? 'bg-neutral-950 text-white ring-neutral-950' : 'bg-white text-neutral-600 ring-neutral-200 hover:ring-neutral-400'}`}>
          {c.label}
        </button>
      );
    })}
  </div>
);

// ── OVERVIEW ──────────────────────────────────────────
const Overview: React.FC<{ go: (t: TabId) => void }> = ({ go }) => {
  const [d, setD] = useState<any>(null);
  const { formatPrice } = useCurrency();
  useEffect(() => { marketingApi.dashboard().then(setD).catch(() => setD({})); }, []);
  if (!d) return <Loading />;
  const stats: Array<{ label: string; value: React.ReactNode; tab: TabId }> = [
    { label: 'Active coupons', value: d.activeCoupons ?? 0, tab: 'coupons' },
    { label: 'Coupon uses', value: d.couponUses ?? 0, tab: 'coupons' },
    { label: 'Discount given', value: formatPrice(d.totalDiscount || 0), tab: 'coupons' },
    { label: 'Abandoned carts', value: d.abandonedCarts ?? 0, tab: 'carts' },
    { label: 'Recovered carts', value: d.recoveredCarts ?? 0, tab: 'carts' },
    { label: 'Recovered revenue', value: formatPrice(d.recoveredRevenue || 0), tab: 'carts' },
    { label: 'Waiting stock alerts', value: d.activeStockAlerts ?? 0, tab: 'stock' },
    { label: 'Price-drop subscribers', value: d.priceDropSubscribers ?? 0, tab: 'price' },
    { label: 'Notifications sent', value: d.notificationsSent ?? 0, tab: 'outbox' },
  ];
  return (
    <div className="space-y-5">
      {d.queuedMessages > 0 && (
        <button onClick={() => go('outbox')} className="flex w-full items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-left ring-1 ring-amber-200 cursor-pointer">
          <span className="flex items-center gap-2 text-sm text-amber-900"><Send className="h-4 w-4" /> <strong>{d.queuedMessages}</strong> WhatsApp / email message(s) are ready to send.</span>
          <span className="text-xs font-semibold text-amber-900">Open Outbox →</span>
        </button>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(s => (
          <button key={s.label} onClick={() => go(s.tab)} className={`${card} p-4 text-left transition-shadow hover:shadow-sm cursor-pointer`}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">{s.label}</p>
            <p className="mt-1.5 text-xl font-bold tabular-nums text-neutral-950 sm:text-2xl">{s.value}</p>
          </button>
        ))}
      </div>
      <PromoComposer onGoOutbox={() => go('outbox')} />
    </div>
  );
};

const PromoComposer: React.FC<{ onGoOutbox?: () => void }> = ({ onGoOutbox }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('/shop?category=sandals');
  const [couponCode, setCouponCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [channels, setChannels] = useState({
    whatsapp: true,
    push: true,
    email: true,
    storefrontBanner: true,
  });
  const [busy, setBusy] = useState(false);
  const [audience, setAudience] = useState<{
    pushCount: number;
    whatsappCount: number;
    emailCount: number;
    totalReach: number;
    activePromotion: any;
  } | null>(null);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const { flash, node } = useFlash();

  const loadAudience = () => {
    marketingApi.promoAudience().then(setAudience).catch(() => {});
  };

  useEffect(() => {
    loadAudience();
  }, []);

  const clearBanner = async () => {
    try {
      await marketingApi.clearActivePromo();
      flash(true, 'Live website promotional banner removed.');
      loadAudience();
    } catch (e: any) {
      flash(false, e.message);
    }
  };

  const applyPreset = (presetSubject: string, presetMessage: string, presetLink: string, presetCoupon = '') => {
    setSubject(presetSubject);
    setMessage(presetMessage);
    setLink(presetLink);
    if (presetCoupon) setCouponCode(presetCoupon);
  };

  const send = async () => {
    if (!message.trim()) return flash(false, 'Please write an offer message first.');
    const activeChannelCount = Object.values(channels).filter(Boolean).length;
    if (activeChannelCount === 0) return flash(false, 'Please select at least one delivery channel.');

    const promptText = `Send this promotional offer to customers?\n\nTarget Delivery:\n${
      channels.whatsapp ? `• WhatsApp Broadcast (${audience?.whatsappCount || 0} customer phones)\n` : ''
    }${
      channels.push ? `• Web Push Notifications (${audience?.pushCount || 0} devices)\n` : ''
    }${
      channels.email ? `• Customer Email (${audience?.emailCount || 0} emails)\n` : ''
    }${
      channels.storefrontBanner ? `• Live Storefront Banner (all website visitors)\n` : ''
    }`;

    if (!await confirmDialog(promptText)) return;
    setBusy(true);
    setLastSummary(null);
    try {
      const r = await marketingApi.sendPromo({
        subject: subject.trim(),
        message: message.trim(),
        link: link.trim(),
        couponCode: couponCode.trim().toUpperCase(),
        channels,
      });
      flash(true, r.message || 'Promotion successfully dispatched to all customer touchpoints!');
      setLastSummary(r.message || 'Offer successfully dispatched to customers.');
      setMessage('');
      setSubject('');
      loadAudience();
    } catch (e: any) {
      flash(false, e.message);
    } finally {
      setBusy(false);
    }
  };

  const activePromo = audience?.activePromotion;

  return (
    <div className={`${card} p-5 space-y-4`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-950">
              <Megaphone className="h-4 w-4 text-amber-600" />
              Send a Promotional Offer
            </h3>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Sparkles className="h-3 w-3" /> Multi-Channel Delivery
            </span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">
            Delivers directly to customer WhatsApp, email, browser push notifications, and publishes live to the website top banner.
          </p>
        </div>

        {/* Audience Reach Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 border border-emerald-200" title="Customers with phone numbers from orders, accounts and carts">
            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>{audience ? `${audience.whatsappCount} WhatsApp` : '…'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-blue-800 border border-blue-200" title="Customer emails from past orders and accounts">
            <Mail className="h-3.5 w-3.5 text-blue-600" />
            <span>{audience ? `${audience.emailCount} Email` : '…'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 font-semibold text-purple-800 border border-purple-200" title="Browser push notification devices">
            <Bell className="h-3.5 w-3.5 text-purple-600" />
            <span>{audience ? `${audience.pushCount} Push` : '…'}</span>
          </span>
        </div>
      </div>

      {/* Active Promotion Banner Status (if currently live on site) */}
      {activePromo && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span>
              <strong>Active on Website:</strong> "{activePromo.title || 'Special Offer'}" — {activePromo.message}
              {activePromo.couponCode && <span className="ml-1.5 font-bold uppercase tracking-wider bg-white/70 px-1.5 py-0.5 rounded border border-amber-300">Code: {activePromo.couponCode}</span>}
            </span>
          </div>
          <button
            type="button"
            onClick={clearBanner}
            className="self-end sm:self-auto rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50 cursor-pointer"
          >
            End / Remove Banner
          </button>
        </div>
      )}

      {/* Presets */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Quick Offer Presets</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset('Weekend Sale', '20% off all handcrafted leather sandals and slides this weekend only. Complimentary cash on delivery across Pakistan.', '/shop?category=sandals', 'WEEKEND20')}
            className="rounded-lg bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-800 transition-colors cursor-pointer"
          >
            👡 20% Off Sandals Sale
          </button>
          <button
            type="button"
            onClick={() => applyPreset('Formal Collection Drop', 'Discover the QADAM Phantom Oxford Brogue — Goodyear welted box calfskin with bespoke Milanese medallion.', '/shop?category=formals')}
            className="rounded-lg bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-800 transition-colors cursor-pointer"
          >
            👞 New Formal Drop
          </button>
          <button
            type="button"
            onClick={() => applyPreset('Free Express Delivery', 'Free nationwide express courier delivery on all orders placed today. Pay via Cash on Delivery.', '/shop')}
            className="rounded-lg bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-800 transition-colors cursor-pointer"
          >
            🚚 Free Delivery Weekend
          </button>
          <button
            type="button"
            onClick={() => applyPreset('VIP Client Reduction', 'Enjoy a private Rs. 5,000 reduction on all Italian casuals and loafers.', '/shop?category=casuals', 'VIP5000')}
            className="rounded-lg bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-800 transition-colors cursor-pointer"
          >
            ⭐ VIP Rs. 5,000 Off
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Offer Title">
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Weekend sale"
            className={inputCls}
          />
        </Field>

        <Field label="Target Destination Link">
          <select
            value={link}
            onChange={e => setLink(e.target.value)}
            className={inputCls}
          >
            <option value="/shop?category=sandals">Sandals & Slides (/shop?category=sandals)</option>
            <option value="/shop?category=formals">Formals & Oxfords (/shop?category=formals)</option>
            <option value="/shop?category=casuals">Casuals & Drivers (/shop?category=casuals)</option>
            <option value="/shop?category=chelsea-boots">Chelsea Boots (/shop?category=chelsea-boots)</option>
            <option value="/best-sellers">Best Sellers (/best-sellers)</option>
            <option value="/shop">All Footwear (/shop)</option>
          </select>
        </Field>

        <Field label="Discount Coupon Code (Optional)">
          <input
            value={couponCode}
            onChange={e => setCouponCode(e.target.value.toUpperCase())}
            placeholder="e.g. WEEKEND20"
            className={inputCls}
          />
        </Field>

        <Field label="Offer Message for Customers" className="sm:col-span-3">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="e.g. 20% off all sandals this weekend only. Complimentary cash on delivery across Pakistan."
            className={`${inputCls} h-auto py-2 leading-relaxed`}
          />
        </Field>
      </div>

      {/* Delivery Channels */}
      <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-200/70">
        <p className="text-xs font-bold text-neutral-900 mb-2">Select Delivery Channels:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={channels.whatsapp}
              onChange={e => setChannels({ ...channels, whatsapp: e.target.checked })}
              className="rounded accent-emerald-600 h-4 w-4"
            />
            <span className="font-medium text-neutral-800 flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
              WhatsApp
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={channels.push}
              onChange={e => setChannels({ ...channels, push: e.target.checked })}
              className="rounded accent-purple-600 h-4 w-4"
            />
            <span className="font-medium text-neutral-800 flex items-center gap-1">
              <Bell className="h-3.5 w-3.5 text-purple-600" />
              Web Push
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={channels.email}
              onChange={e => setChannels({ ...channels, email: e.target.checked })}
              className="rounded accent-blue-600 h-4 w-4"
            />
            <span className="font-medium text-neutral-800 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-blue-600" />
              Customer Email
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={channels.storefrontBanner}
              onChange={e => setChannels({ ...channels, storefrontBanner: e.target.checked })}
              className="rounded accent-amber-600 h-4 w-4"
            />
            <span className="font-medium text-neutral-800 flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-amber-600" />
              Website Banner
            </span>
          </label>
        </div>
      </div>

      {/* Live Preview Toggle & Card */}
      {message.trim() && (
        <div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{showPreview ? 'Hide Customer Message Preview' : 'Preview Customer WhatsApp Message'}</span>
          </button>

          {showPreview && (
            <div className="mt-2 rounded-xl bg-emerald-50/60 p-3.5 border border-emerald-200 text-xs space-y-1.5 font-sans">
              <p className="font-bold text-emerald-950">QADAM | {subject || 'Weekend Sale'}</p>
              <p className="text-neutral-800">Salam Alex!</p>
              <p className="text-neutral-800 whitespace-pre-line">{message}</p>
              {couponCode && <p className="font-bold text-emerald-900">🎁 Promo Code: {couponCode}</p>}
              <p className="text-emerald-700">🛍️ Shop now: https://qadamshoes.com{link}</p>
              <p className="text-[11px] text-neutral-400 italic">Handcrafted Italian Leather Footwear • Cash on Delivery across Pakistan</p>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <p className="text-xs text-neutral-500">
          Reaching <strong className="text-neutral-900">{audience?.totalReach || 0} customer contacts</strong> + all active website visitors.
        </p>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onGoOutbox && (
            <button
              type="button"
              onClick={onGoOutbox}
              className={btnLight}
            >
              <Send className="h-3.5 w-3.5" />
              <span>View Outbox</span>
            </button>
          )}

          <button
            type="button"
            onClick={send}
            disabled={busy}
            className={`${btnDark} flex-1 sm:flex-initial`}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>Send Offer to Customers</span>
          </button>
        </div>
      </div>

      {lastSummary && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 border border-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{lastSummary}</span>
          </div>
          {onGoOutbox && (
            <button
              type="button"
              onClick={onGoOutbox}
              className="shrink-0 font-bold text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
            >
              Open Outbox to Send →
            </button>
          )}
        </div>
      )}

      {node}
    </div>
  );
};

// ── COUPONS ───────────────────────────────────────────
const EMPTY_COUPON = {
  code: '', description: '', type: 'percent', value: 10, minOrderRs: 0, maxDiscountRs: 0,
  startsAt: '', expiresAt: '', usageLimit: 0, perCustomerLimit: 1, productIds: [] as string[], categories: [] as string[],
  firstOrderOnly: false, stackWithSale: true, showInCart: false, active: true,
};

const Coupons: React.FC<{ products: Product[] }> = ({ products }) => {
  const [list, setList] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [usage, setUsage] = useState<{ coupon: any; rows: any[] | null } | null>(null);
  const [q, setQ] = useState('');
  const { formatPrice } = useCurrency();
  const { flash, node } = useFlash();

  const load = () => marketingApi.coupons().then(setList).catch(e => { flash(false, e.message); setList([]); });
  useEffect(() => { load(); }, []);

  const toggle = async (c: any) => {
    try { await marketingApi.updateCoupon(c.id, { active: !c.active }); load(); } catch (e: any) { flash(false, e.message); }
  };
  const remove = async (c: any) => {
    if (!await confirmDialog(`Delete coupon ${c.code}? Its usage history is kept.`)) return;
    try { await marketingApi.deleteCoupon(c.id); load(); flash(true, 'Coupon deleted.'); } catch (e: any) { flash(false, e.message); }
  };
  const announce = async (c: any) => {
    if (!await confirmDialog(`Send ${c.code} to everyone who allowed notifications?`)) return;
    try { const r = await marketingApi.announceCoupon(c.id); flash(true, r.message || 'Sent.'); } catch (e: any) { flash(false, e.message); }
  };
  const openUsage = async (c: any) => {
    setUsage({ coupon: c, rows: null });
    try { setUsage({ coupon: c, rows: await marketingApi.couponUsage(c.id) }); } catch (e: any) { flash(false, e.message); setUsage(null); }
  };

  const status = (c: any) => {
    const now = Date.now();
    if (!c.active) return <Badge tone="grey">Inactive</Badge>;
    if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return <Badge tone="red">Expired</Badge>;
    if (c.startsAt && new Date(c.startsAt).getTime() > now) return <Badge tone="blue">Scheduled</Badge>;
    if (c.usageLimit && c.uses >= c.usageLimit) return <Badge tone="amber">Used up</Badge>;
    return <Badge tone="green">Active</Badge>;
  };

  const shown = (list || []).filter(c => !q || c.code.includes(q.toUpperCase()) || (c.description || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search codes…" className={`${inputCls} pl-9`} />
        </div>
        <button onClick={() => setEditing({ ...EMPTY_COUPON })} className={btnDark}><Plus className="h-3.5 w-3.5" /> New coupon</button>
      </div>

      <div className={`${card} overflow-hidden`}>
        {!list ? <Loading /> : !shown.length ? <Empty text="No coupons yet. Create your first discount code." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-neutral-100 bg-neutral-50/60"><tr>
                <th className={th}>Code</th><th className={th}>Offer</th><th className={th}>Rules</th><th className={th}>Used</th><th className={th}>Discount given</th><th className={th}>Status</th><th className={th} />
              </tr></thead>
              <tbody className="divide-y divide-neutral-100">
                {shown.map(c => (
                  <tr key={c.id} className="hover:bg-neutral-50/50">
                    <td className={td}>
                      <p className="font-mono text-sm font-semibold text-neutral-950">{c.code}</p>
                      {c.description && <p className="max-w-[200px] truncate text-xs text-neutral-500">{c.description}</p>}
                    </td>
                    <td className={td}>{c.offer}{c.maxDiscountRs > 0 && <p className="text-xs text-neutral-400">max Rs. {c.maxDiscountRs.toLocaleString('en-PK')}</p>}</td>
                    <td className={`${td} text-xs text-neutral-500`}>
                      {c.minOrderRs > 0 && <p>Min Rs. {c.minOrderRs.toLocaleString('en-PK')}</p>}
                      {c.firstOrderOnly && <p>First order only</p>}
                      {(c.productIds.length > 0 || c.categories.length > 0) && <p>Selected items</p>}
                      {!c.stackWithSale && <p>Not on sale items</p>}
                      {c.expiresAt && <p>Ends {fmtDate(c.expiresAt)}</p>}
                      {c.showInCart && <p className="text-[#8A6A45]">Shown in cart</p>}
                    </td>
                    <td className={`${td} tabular-nums`}>{c.uses}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                    <td className={`${td} tabular-nums`}>{formatPrice(c.totalDiscount || 0)}</td>
                    <td className={td}>{status(c)}</td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <div className="inline-flex gap-1">
                        <button onClick={() => toggle(c)} className={btnLight} title={c.active ? 'Deactivate' : 'Activate'}>{c.active ? 'Pause' : 'Activate'}</button>
                        <button onClick={() => openUsage(c)} className={btnLight} title="Usage history"><History className="h-3.5 w-3.5" /></button>
                        <button onClick={() => announce(c)} className={btnLight} title="Announce to subscribers"><Megaphone className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditing({ ...c, startsAt: toLocalInput(c.startsAt), expiresAt: toLocalInput(c.expiresAt) })} className={btnLight} title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => remove(c)} className={`${btnLight} text-red-600`} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <CouponForm initial={editing} products={products} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); flash(true, 'Coupon saved.'); }} />}

      {usage && (
        <Modal title={`Usage · ${usage.coupon.code}`} onClose={() => setUsage(null)}>
          {!usage.rows ? <Loading /> : !usage.rows.length ? <Empty text="Not used yet." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Discount</th><th className={th}>Order total</th><th className={th}>Date</th></tr></thead>
                <tbody className="divide-y divide-neutral-100">
                  {usage.rows.map(u => (
                    <tr key={u.id}><td className={`${td} font-mono text-xs`}>{u.orderNumber}</td><td className={td}>{u.customerName}<p className="text-xs text-neutral-400">{u.customerKey}</p></td>
                      <td className={td}>{formatPrice(u.discount)}</td><td className={td}>{formatPrice(u.orderTotal)}</td><td className={`${td} text-xs`}>{fmtDate(u.createdAt)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
      {node}
    </div>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, footer, wide }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
    <div className={`my-8 w-full ${wide ? 'max-w-3xl' : 'max-w-2xl'} rounded-2xl bg-white shadow-2xl`} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <h3 className="text-base font-bold text-neutral-950">{title}</h3>
        <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-black cursor-pointer" aria-label="Close"><X className="h-5 w-5" /></button>
      </div>
      <div className="max-h-[72vh] overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-neutral-100 px-5 py-3">{footer}</div>}
    </div>
  </div>
);

const CouponForm: React.FC<{ initial: any; products: Product[]; onClose: () => void; onSaved: () => void }> = ({ initial, products, onClose, onSaved }) => {
  const [f, setF] = useState<any>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  const gen = async () => { try { set('code', (await marketingApi.generateCode()).code); } catch (e: any) { setErr(e.message); } };
  const save = async () => {
    setBusy(true); setErr('');
    const body = {
      ...f,
      code: String(f.code).trim().toUpperCase(),
      value: Number(f.value) || 0, minOrderRs: Number(f.minOrderRs) || 0, maxDiscountRs: Number(f.maxDiscountRs) || 0,
      usageLimit: Number(f.usageLimit) || 0, perCustomerLimit: Number(f.perCustomerLimit) || 0,
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
      expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
    };
    try {
      if (f.id) await marketingApi.updateCoupon(f.id, body); else await marketingApi.createCoupon(body);
      onSaved();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const num = (k: string) => ({ value: f[k] === 0 ? '' : f[k], onChange: (e: any) => set(k, e.target.value.replace(/[^\d.]/g, '')), inputMode: 'numeric' as const, className: inputCls });

  return (
    <Modal title={f.id ? `Edit ${initial.code}` : 'New coupon'} onClose={onClose} wide
      footer={<>
        {err && <p className="mr-auto self-center text-sm text-red-600">{err}</p>}
        <button onClick={onClose} className={btnLight}>Cancel</button>
        <button onClick={save} disabled={busy} className={btnDark}>{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save coupon</button>
      </>}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code *">
            <div className="flex gap-2">
              <input value={f.code} onChange={e => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} placeholder="EID20" className={`${inputCls} font-mono uppercase`} />
              <button type="button" onClick={gen} className={btnLight} title="Generate a unique code"><Shuffle className="h-3.5 w-3.5" /></button>
            </div>
          </Field>
          <Field label="Description (shown to customers)"><input value={f.description} onChange={e => set('description', e.target.value)} placeholder="Eid special" className={inputCls} /></Field>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-neutral-700">Discount type *</span>
          <div className="inline-flex rounded-lg bg-neutral-100 p-0.5">
            {[{ v: 'percent', l: 'Percentage' }, { v: 'fixed', l: 'Fixed amount' }, { v: 'free_shipping', l: 'Free delivery' }].map(o => (
              <button key={o.v} type="button" onClick={() => set('type', o.v)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${f.type === o.v ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>{o.l}</button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {f.type !== 'free_shipping' && (
            <Field label={f.type === 'percent' ? 'Percent off *' : 'Amount off (Rs.) *'}><input {...num('value')} placeholder={f.type === 'percent' ? '10' : '1000'} /></Field>
          )}
          <Field label="Minimum order (Rs.)" hint="0 = no minimum"><input {...num('minOrderRs')} placeholder="0" /></Field>
          {f.type === 'percent' && <Field label="Maximum discount (Rs.)" hint="0 = no cap"><input {...num('maxDiscountRs')} placeholder="0" /></Field>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts" hint="Empty = right away"><input type="datetime-local" value={f.startsAt || ''} onChange={e => set('startsAt', e.target.value)} className={inputCls} /></Field>
          <Field label="Expires" hint="Empty = never"><input type="datetime-local" value={f.expiresAt || ''} onChange={e => set('expiresAt', e.target.value)} className={inputCls} /></Field>
          <Field label="Total uses allowed" hint="0 = unlimited"><input {...num('usageLimit')} placeholder="0" /></Field>
          <Field label="Uses per customer" hint="Matched by email / phone. 0 = unlimited"><input {...num('perCustomerLimit')} placeholder="1" /></Field>
        </div>

        <div className="space-y-3 rounded-xl bg-neutral-50 p-4">
          <p className="text-xs font-semibold text-neutral-700">Only for these (leave empty for the whole shop)</p>
          <Field label="Categories"><CategoryPicker value={f.categories} onChange={v => set('categories', v)} /></Field>
          <Field label="Products"><ProductPicker products={products} value={f.productIds} onChange={v => set('productIds', v)} /></Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle checked={f.active} onChange={v => set('active', v)} label="Active" />
          <Toggle checked={f.firstOrderOnly} onChange={v => set('firstOrderOnly', v)} label="First order only" hint="Customers with an earlier order can't use it" />
          <Toggle checked={f.stackWithSale} onChange={v => set('stackWithSale', v)} label="Also on sale items" hint="Off = no extra discount on already-discounted shoes" />
          <Toggle checked={f.showInCart} onChange={v => set('showInCart', v)} label="Show as offer in the cart" hint="Customers can tap it to apply" />
        </div>
      </div>
    </Modal>
  );
};

// ── SHIPPING ──────────────────────────────────────────
const Shipping: React.FC<{ products: Product[] }> = ({ products }) => {
  const [s, setS] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const { flash, node } = useFlash();
  useEffect(() => { marketingApi.getSettings('shipping').then(setS).catch(e => flash(false, e.message)); }, []);
  if (!s) return <Loading />;
  const set = (k: string, v: any) => setS((x: any) => ({ ...x, [k]: v }));
  const num = (k: string) => ({ value: s[k], onChange: (e: any) => set(k, e.target.value.replace(/[^\d]/g, '')), inputMode: 'numeric' as const, className: inputCls });
  const setCamp = (i: number, k: string, v: any) => set('campaigns', s.campaigns.map((c: any, j: number) => (j === i ? { ...c, [k]: v } : c)));
  const save = async () => {
    setBusy(true);
    try {
      const body = { ...s, campaigns: s.campaigns.map((c: any) => ({ ...c, startsAt: c.startsAt ? new Date(c.startsAt).toISOString() : null, endsAt: c.endsAt ? new Date(c.endsAt).toISOString() : null })) };
      const r = await marketingApi.saveSettings('shipping', body);
      setS(r.data); flash(true, 'Delivery settings saved.');
    } catch (e: any) { flash(false, e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className={`${card} space-y-5 p-5`}>
        <Toggle checked={s.enabled} onChange={v => set('enabled', v)} label="Free delivery above a minimum order" hint="Shows the progress bar in the bag, cart, checkout and homepage." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Free delivery from (Rs.)"><input {...num('thresholdRs')} /></Field>
          <Field label="Standard delivery fee (Rs.)"><input {...num('standardFeeRs')} /></Field>
          <Field label="Express delivery fee (Rs.)" hint="Express is never free"><input {...num('expressFeeRs')} /></Field>
        </div>
        <Toggle checked={s.combineWithCoupons} onChange={v => set('combineWithCoupons', v)} label="Allow free delivery together with discount codes" hint="Off = using a discount code removes free delivery" />
      </div>

      <div className={`${card} space-y-4 p-5`}>
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">Which items count towards free delivery</h3>
          <p className="text-xs text-neutral-500">Leave empty to count everything. Excluded products never count.</p>
        </div>
        <Field label="Eligible categories"><CategoryPicker value={s.eligibleCategories} onChange={v => set('eligibleCategories', v)} /></Field>
        <Field label="Eligible products"><ProductPicker products={products} value={s.eligibleProducts} onChange={v => set('eligibleProducts', v)} /></Field>
        <Field label="Excluded products"><ProductPicker products={products} value={s.excludedProducts} onChange={v => set('excludedProducts', v)} placeholder="Search products to exclude…" /></Field>
      </div>

      <div className={`${card} space-y-3 p-5`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-950">Campaign thresholds</h3>
            <p className="text-xs text-neutral-500">A different minimum for a limited time (e.g. Eid). The lowest running one is used.</p>
          </div>
          <button onClick={() => set('campaigns', [...s.campaigns, { id: Math.random().toString(36).slice(2, 10), name: 'New campaign', thresholdRs: Math.round(s.thresholdRs / 2), startsAt: '', endsAt: '', active: true }])} className={btnLight}><Plus className="h-3.5 w-3.5" /> Add</button>
        </div>
        {!s.campaigns.length && <p className="text-xs text-neutral-400">No campaigns.</p>}
        {s.campaigns.map((c: any, i: number) => (
          <div key={c.id} className="grid items-end gap-3 rounded-lg bg-neutral-50 p-3 sm:grid-cols-[1.4fr_1fr_1.2fr_1.2fr_auto_auto]">
            <Field label="Name"><input value={c.name} onChange={e => setCamp(i, 'name', e.target.value)} className={inputCls} /></Field>
            <Field label="Free from (Rs.)"><input value={c.thresholdRs} onChange={e => setCamp(i, 'thresholdRs', e.target.value.replace(/[^\d]/g, ''))} className={inputCls} /></Field>
            <Field label="Starts"><input type="datetime-local" value={toLocalInput(c.startsAt) || c.startsAt || ''} onChange={e => setCamp(i, 'startsAt', e.target.value)} className={inputCls} /></Field>
            <Field label="Ends"><input type="datetime-local" value={toLocalInput(c.endsAt) || c.endsAt || ''} onChange={e => setCamp(i, 'endsAt', e.target.value)} className={inputCls} /></Field>
            <div className="pb-2"><Toggle checked={c.active} onChange={v => setCamp(i, 'active', v)} label="On" /></div>
            <button onClick={() => set('campaigns', s.campaigns.filter((_: any, j: number) => j !== i))} className={`${btnLight} mb-0.5 text-red-600`} aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>

      <div className="flex justify-end"><button onClick={save} disabled={busy} className={btnDark}>{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save delivery settings</button></div>
      {node}
    </div>
  );
};

// ── ABANDONED CARTS ───────────────────────────────────
const CART_STATUS: Record<string, { tone: any; label: string }> = {
  active: { tone: 'blue', label: 'Shopping' }, abandoned: { tone: 'amber', label: 'Abandoned' },
  recovered: { tone: 'green', label: 'Recovered' }, converted: { tone: 'grey', label: 'Ordered' }, opted_out: { tone: 'red', label: 'Opted out' },
};

const Carts: React.FC = () => {
  const [list, setList] = useState<any[] | null>(null);
  const [filter, setFilter] = useState('abandoned');
  const [open, setOpen] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { formatPrice } = useCurrency();
  const { flash, node } = useFlash();
  const load = () => marketingApi.carts().then(setList).catch(e => { flash(false, e.message); setList([]); });
  useEffect(() => { load(); }, []);

  const remind = async (c: any) => {
    try { const r = await marketingApi.remindCart(c.id); flash(true, r.message || 'Done.'); load(); } catch (e: any) { flash(false, e.message); }
  };
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: list?.length || 0 };
    (list || []).forEach(c => { m[c.status] = (m[c.status] || 0) + 1; });
    return m;
  }, [list]);
  const recovered = (list || []).reduce((s, c) => s + (c.recoveredRevenue || 0), 0);
  const shown = (list || []).filter(c => filter === 'all' || c.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit flex-wrap rounded-lg bg-neutral-100 p-0.5">
          {['abandoned', 'active', 'recovered', 'converted', 'opted_out', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${filter === f ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>
              {f === 'all' ? 'All' : CART_STATUS[f].label} <span className="text-neutral-400">{counts[f] || 0}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Recovered revenue: <strong className="text-neutral-900">{formatPrice(recovered)}</strong></span>
          <button onClick={() => setShowSettings(true)} className={btnLight}>Settings</button>
          <button onClick={load} className={btnLight} aria-label="Refresh"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        {!list ? <Loading /> : !shown.length ? <Empty text="No carts here." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-neutral-100 bg-neutral-50/60"><tr>
                <th className={th}>Customer</th><th className={th}>Bag</th><th className={th}>Total</th><th className={th}>Last activity</th><th className={th}>Abandoned</th><th className={th}>Status</th><th className={th}>Reminders</th><th className={th} />
              </tr></thead>
              <tbody className="divide-y divide-neutral-100">
                {shown.map(c => (
                  <tr key={c.id} className="hover:bg-neutral-50/50">
                    <td className={td}>
                      <p className="font-medium text-neutral-900">{c.contact.name || <span className="text-neutral-400">Guest</span>}</p>
                      <p className="text-xs text-neutral-500">{c.contact.phone || '—'}</p>
                      <p className="text-xs text-neutral-500">{c.contact.email || ''}</p>
                      {!c.consent && <p className="text-[11px] text-neutral-400">No reminder consent</p>}
                    </td>
                    <td className={td}>
                      <button onClick={() => setOpen(c)} className="text-left hover:underline cursor-pointer">
                        {c.items.slice(0, 2).map((i: any, k: number) => <p key={k} className="max-w-[220px] truncate text-xs">{i.name} · {sizeLabel(i.size)} · {i.color} ×{i.quantity}</p>)}
                        {c.items.length > 2 && <p className="text-xs text-neutral-400">+{c.items.length - 2} more</p>}
                      </button>
                    </td>
                    <td className={`${td} tabular-nums`}>{formatPrice(c.total)}</td>
                    <td className={`${td} text-xs`}>{fmtDate(c.lastActivity)}</td>
                    <td className={`${td} text-xs`}>{fmtDate(c.abandonedAt)}</td>
                    <td className={td}><Badge tone={CART_STATUS[c.status]?.tone || 'grey'}>{CART_STATUS[c.status]?.label || c.status}</Badge>
                      {c.recoveredOrder && <p className="mt-1 font-mono text-[11px] text-neutral-500">{c.recoveredOrder}</p>}</td>
                    <td className={`${td} text-xs`}>{(c.reminderHistory || []).length || '—'}</td>
                    <td className={`${td} text-right`}>
                      {['active', 'abandoned'].includes(c.status) && c.consent && (c.contact.phone || c.contact.email || c.hasPush) && (
                        <button onClick={() => remind(c)} className={btnLight}><Send className="h-3.5 w-3.5" /> Remind</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <Modal title={`Bag · ${open.contact.name || 'Guest'}`} onClose={() => setOpen(null)}>
          <div className="space-y-4">
            <div className="divide-y divide-neutral-100 rounded-lg ring-1 ring-neutral-200">
              {open.items.map((i: any, k: number) => (
                <div key={k} className="flex items-center gap-3 px-3 py-2">
                  {i.image && <img src={i.image} alt="" className="h-10 w-10 rounded object-cover" />}
                  <div className="min-w-0 flex-1"><p className="truncate text-sm">{i.name}</p><p className="text-xs text-neutral-500">Size {sizeLabel(i.size)} · {i.color} · Qty {i.quantity}</p></div>
                  <p className="text-sm font-medium">{formatPrice(i.price * i.quantity)}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-neutral-700">Reminder history</p>
              {!(open.reminderHistory || []).length ? <p className="text-xs text-neutral-400">No reminders yet.</p> : (
                <ul className="space-y-1">{open.reminderHistory.map((h: any, k: number) => <li key={k} className="text-xs text-neutral-600">{fmtDate(h.at)} · {h.channel} · {h.status}</li>)}</ul>
              )}
            </div>
          </div>
        </Modal>
      )}
      {showSettings && <RecoverySettings onClose={() => setShowSettings(false)} flash={flash} />}
      {node}
    </div>
  );
};

const RecoverySettings: React.FC<{ onClose: () => void; flash: (ok: boolean, t: string) => void }> = ({ onClose, flash }) => {
  const [s, setS] = useState<any>(null);
  const [hours, setHours] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { marketingApi.getSettings('recovery').then(r => { setS(r); setHours(r.reminderHours.join(', ')); }).catch(e => flash(false, e.message)); }, []);
  const set = (k: string, v: any) => setS((x: any) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true);
    try {
      await marketingApi.saveSettings('recovery', { ...s, reminderHours: hours.split(/[,\s]+/).filter(Boolean).map(Number) });
      flash(true, 'Recovery settings saved.'); onClose();
    } catch (e: any) { flash(false, e.message); } finally { setBusy(false); }
  };
  return (
    <Modal title="Abandoned cart settings" onClose={onClose} footer={<><button onClick={onClose} className={btnLight}>Cancel</button><button onClick={save} disabled={busy || !s} className={btnDark}>Save</button></>}>
      {!s ? <Loading /> : (
        <div className="space-y-4">
          <Toggle checked={s.enabled} onChange={v => set('enabled', v)} label="Automatic reminders" hint="Checked every minute in the background" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mark as abandoned after (minutes)"><input value={s.abandonAfterMinutes} onChange={e => set('abandonAfterMinutes', e.target.value.replace(/[^\d]/g, ''))} className={inputCls} /></Field>
            <Field label="Send reminders after (hours)" hint="Comma separated, e.g. 1, 24 = two reminders"><input value={hours} onChange={e => setHours(e.target.value)} className={inputCls} /></Field>
            <Field label="Recovery link valid for (days)"><input value={s.tokenDays} onChange={e => set('tokenDays', e.target.value.replace(/[^\d]/g, ''))} className={inputCls} /></Field>
            <Field label="Website address for links" hint="e.g. https://qadamshoes.pk — empty = detected automatically"><input value={s.siteUrl} onChange={e => set('siteUrl', e.target.value)} placeholder="https://" className={inputCls} /></Field>
          </div>
          <div className="space-y-2.5 rounded-lg bg-neutral-50 p-3">
            <p className="text-xs font-semibold text-neutral-700">Channels</p>
            <Toggle checked={s.channels.push} onChange={v => set('channels', { ...s.channels, push: v })} label="Browser notification" hint="Sent automatically if the shopper allowed notifications" />
            <Toggle checked={s.channels.whatsapp} onChange={v => set('channels', { ...s.channels, whatsapp: v })} label="WhatsApp" hint="Prepared in the Outbox — you send it with one click" />
            <Toggle checked={s.channels.email} onChange={v => set('channels', { ...s.channels, email: v })} label="Email" hint="Prepared in the Outbox — opens your email app" />
          </div>
          <p className="text-xs text-neutral-500">Reminders only go to shoppers who ticked "Remind me" at checkout, stop as soon as they order, and every message has an unsubscribe link.</p>
        </div>
      )}
    </Modal>
  );
};

// ── STOCK ALERTS ──────────────────────────────────────
const StockAlerts: React.FC = () => {
  const [list, setList] = useState<any[] | null>(null);
  const [q, setQ] = useState('');
  const [size, setSize] = useState('');
  const [filter, setFilter] = useState('waiting');
  const { flash, node } = useFlash();
  const load = () => marketingApi.stockAlerts().then(setList).catch(e => { flash(false, e.message); setList([]); });
  useEffect(() => { load(); }, []);

  const notify = async (a: any) => {
    try { const r = await marketingApi.notifyStock(a.id); flash(true, r.message || 'Sent.'); load(); }
    catch (e: any) {
      if (/still out of stock/i.test(e.message) && await confirmDialog(`${e.message}\n\nSend anyway?`)) {
        try { await marketingApi.notifyStock(a.id, true); flash(true, 'Sent.'); load(); } catch (e2: any) { flash(false, e2.message); }
      } else flash(false, e.message);
    }
  };
  const remove = async (a: any) => {
    if (!await confirmDialog('Remove this subscription?')) return;
    try { await marketingApi.removeStock(a.id); load(); } catch (e: any) { flash(false, e.message); }
  };

  const shown = (list || []).filter(a =>
    (filter === 'all' || a.status === filter) &&
    (!q || a.productName.toLowerCase().includes(q.toLowerCase())) &&
    (!size || String(a.size) === size));
  const sizes = [...new Set((list || []).map(a => a.size))].sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search product…" className={`${inputCls} pl-9`} /></div>
        <select value={size} onChange={e => setSize(e.target.value)} className={`${inputCls} sm:w-36`}><option value="">All sizes</option>{sizes.map(s => <option key={s} value={s}>Size {sizeLabel(s)}</option>)}</select>
        <div className="inline-flex w-fit rounded-lg bg-neutral-100 p-0.5">
          {['waiting', 'notified', 'all'].map(f => <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize cursor-pointer ${filter === f ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>{f}</button>)}
        </div>
      </div>
      <p className="text-xs text-neutral-500">Alerts are sent automatically when you save a product and a sold-out size goes above 0 (Products → Edit → Track stock for each size).</p>
      <div className={`${card} overflow-hidden`}>
        {!list ? <Loading /> : !shown.length ? <Empty text="No stock alerts." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-neutral-100 bg-neutral-50/60"><tr><th className={th}>Product</th><th className={th}>Size / colour</th><th className={th}>Contact</th><th className={th}>Subscribed</th><th className={th}>Status</th><th className={th} /></tr></thead>
              <tbody className="divide-y divide-neutral-100">
                {shown.map(a => (
                  <tr key={a.id} className="hover:bg-neutral-50/50">
                    <td className={td}><div className="flex items-center gap-2.5">{a.productImage && <img src={a.productImage} alt="" className="h-10 w-10 rounded object-cover" />}<span className="max-w-[200px] truncate">{a.productName}</span></div></td>
                    <td className={td}>{sizeLabel(a.size)}<p className="text-xs text-neutral-400">{a.color || 'Any colour'}</p></td>
                    <td className={`${td} text-xs`}>{a.phone && <p>{a.phone}</p>}{a.email && <p>{a.email}</p>}{a.pushEndpoint && <p className="text-neutral-400">+ browser</p>}</td>
                    <td className={`${td} text-xs`}>{fmtDate(a.createdAt)}</td>
                    <td className={td}>{a.status === 'waiting' ? <Badge tone="amber">Waiting</Badge> : <Badge tone="green">Notified</Badge>}{a.notifiedAt && <p className="mt-1 text-[11px] text-neutral-400">{fmtDate(a.notifiedAt)}</p>}</td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <div className="inline-flex gap-1">
                        {a.status === 'waiting' && <button onClick={() => notify(a)} className={btnLight}><Send className="h-3.5 w-3.5" /> Notify</button>}
                        <button onClick={() => remove(a)} className={`${btnLight} text-red-600`} aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {node}
    </div>
  );
};

// ── PRICE DROPS ───────────────────────────────────────
const PriceDrops: React.FC = () => {
  const [d, setD] = useState<{ products: any[]; subscriptions: any[]; history: any[] } | null>(null);
  const [view, setView] = useState<'products' | 'subscribers' | 'history'>('products');
  const { formatPrice } = useCurrency();
  const { flash, node } = useFlash();
  const load = () => marketingApi.priceAlerts().then(setD).catch(e => { flash(false, e.message); setD({ products: [], subscriptions: [], history: [] }); });
  useEffect(() => { load(); }, []);
  const notify = async (a: any) => { try { const r = await marketingApi.notifyPrice(a.id); flash(true, r.message || 'Sent.'); load(); } catch (e: any) { flash(false, e.message); } };
  const remove = async (a: any) => { if (!await confirmDialog('Remove this subscription?')) return; try { await marketingApi.removePrice(a.id); load(); } catch (e: any) { flash(false, e.message); } };

  return (
    <div className="space-y-4">
      <div className="inline-flex w-fit rounded-lg bg-neutral-100 p-0.5">
        {[{ id: 'products', l: 'Products' }, { id: 'subscribers', l: 'Subscribers' }, { id: 'history', l: 'Price changes' }].map(v => (
          <button key={v.id} onClick={() => setView(v.id as any)} className={`rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${view === v.id ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>{v.l}</button>
        ))}
      </div>
      <p className="text-xs text-neutral-500">When you lower a product's price (or add a sale price), subscribers whose target is reached are notified once for that price. Price increases are ignored.</p>
      <div className={`${card} overflow-hidden`}>
        {!d ? <Loading /> : view === 'products' ? (
          !d.products.length ? <Empty text="No price-drop subscriptions yet." /> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[640px]">
              <thead className="border-b border-neutral-100 bg-neutral-50/60"><tr><th className={th}>Product</th><th className={th}>Previous price</th><th className={th}>Current price</th><th className={th}>Reduction</th><th className={th}>Subscribers</th><th className={th}>Notifications sent</th></tr></thead>
              <tbody className="divide-y divide-neutral-100">{d.products.map(p => (
                <tr key={p.productId}>
                  <td className={td}><div className="flex items-center gap-2.5">{p.productImage && <img src={p.productImage} alt="" className="h-10 w-10 rounded object-cover" />}<span className="max-w-[220px] truncate">{p.productName}</span></div></td>
                  <td className={td}>{p.previousPrice != null ? formatPrice(p.previousPrice) : '—'}</td>
                  <td className={td}>{p.currentPrice != null ? formatPrice(p.currentPrice) : 'Deleted'}</td>
                  <td className={td}>{p.previousPrice != null && p.currentPrice != null && p.currentPrice < p.previousPrice ? <span className="text-emerald-700">−{formatPrice(p.previousPrice - p.currentPrice)}</span> : '—'}</td>
                  <td className={td}>{p.active} active <span className="text-neutral-400">/ {p.subscribers}</span></td>
                  <td className={td}>{p.notificationsSent}</td>
                </tr>))}</tbody>
            </table></div>)
        ) : view === 'subscribers' ? (
          !d.subscriptions.length ? <Empty text="No subscribers." /> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[720px]">
              <thead className="border-b border-neutral-100 bg-neutral-50/60"><tr><th className={th}>Product</th><th className={th}>Target</th><th className={th}>Contact</th><th className={th}>Since</th><th className={th}>Status</th><th className={th} /></tr></thead>
              <tbody className="divide-y divide-neutral-100">{d.subscriptions.map(a => (
                <tr key={a.id}>
                  <td className={td}><span className="block max-w-[220px] truncate">{a.productName}</span><span className="text-xs text-neutral-400">at sign-up {formatPrice(a.priceAtSignup)}</span></td>
                  <td className={td}>{a.targetPriceRs ? `Rs. ${a.targetPriceRs.toLocaleString('en-PK')}` : 'Any drop'}</td>
                  <td className={`${td} text-xs`}>{a.phone && <p>{a.phone}</p>}{a.email && <p>{a.email}</p>}{a.pushEndpoint && <p className="text-neutral-400">+ browser</p>}</td>
                  <td className={`${td} text-xs`}>{fmtDate(a.createdAt)}</td>
                  <td className={td}>{a.status === 'active' ? <Badge tone="blue">Watching</Badge> : <Badge tone="green">Notified</Badge>}{a.notifyCount > 0 && <p className="mt-1 text-[11px] text-neutral-400">{a.notifyCount}× sent</p>}</td>
                  <td className={`${td} whitespace-nowrap text-right`}><div className="inline-flex gap-1">
                    <button onClick={() => notify(a)} className={btnLight}><Send className="h-3.5 w-3.5" /> Notify</button>
                    <button onClick={() => remove(a)} className={`${btnLight} text-red-600`} aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div></td>
                </tr>))}</tbody>
            </table></div>)
        ) : (
          !d.history.length ? <Empty text="No price drops recorded yet." /> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[560px]">
              <thead className="border-b border-neutral-100 bg-neutral-50/60"><tr><th className={th}>Date</th><th className={th}>Product</th><th className={th}>Old → new</th><th className={th}>Subscribers</th><th className={th}>Notified</th></tr></thead>
              <tbody className="divide-y divide-neutral-100">{d.history.map(h => (
                <tr key={h.id}><td className={`${td} text-xs`}>{fmtDate(h.createdAt)}</td><td className={td}>{h.productName}</td>
                  <td className={td}>{formatPrice(h.oldPrice)} → <strong>{formatPrice(h.newPrice)}</strong></td><td className={td}>{h.subscribers}</td><td className={td}>{h.notified}</td></tr>))}</tbody>
            </table></div>)
        )}
      </div>
      {node}
    </div>
  );
};

// ── TEMPLATES ─────────────────────────────────────────
const TEMPLATE_INFO: Array<{ key: string; label: string; vars: string[] }> = [
  { key: 'abandoned_cart', label: 'Abandoned Cart', vars: ['customer_name', 'recovery_link', 'opt_out_link', 'cart_total', 'product_name', 'item_count', 'store_name'] },
  { key: 'back_in_stock', label: 'Back in Stock', vars: ['customer_name', 'product_name', 'size', 'color', 'price', 'product_url', 'store_name'] },
  { key: 'price_drop', label: 'Price Drop', vars: ['customer_name', 'product_name', 'price', 'old_price', 'target_price', 'size', 'product_url', 'store_name'] },
  { key: 'promo', label: 'Promotional Offer', vars: ['customer_name', 'message', 'shop_url', 'store_name'] },
  { key: 'coupon', label: 'Coupon Announcement', vars: ['customer_name', 'coupon_code', 'coupon_offer', 'shop_url', 'store_name'] },
];

const Templates: React.FC = () => {
  const [t, setT] = useState<any>(null);
  const [active, setActive] = useState('abandoned_cart');
  const [busy, setBusy] = useState(false);
  const { flash, node } = useFlash();
  useEffect(() => { marketingApi.getSettings('templates').then(setT).catch(e => flash(false, e.message)); }, []);
  if (!t) return <Loading />;
  const info = TEMPLATE_INFO.find(x => x.key === active)!;
  const cur = t[active];
  const set = (k: 'subject' | 'body', v: string) => setT((x: any) => ({ ...x, [active]: { ...x[active], [k]: v } }));
  const insert = (v: string) => set('body', `${cur.body}{{${v}}}`);
  const save = async () => { setBusy(true); try { const r = await marketingApi.saveSettings('templates', t); setT(r.data); flash(true, 'Templates saved.'); } catch (e: any) { flash(false, e.message); } finally { setBusy(false); } };

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <div className={`${card} p-1.5`}>
        {TEMPLATE_INFO.map(x => (
          <button key={x.key} onClick={() => setActive(x.key)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm cursor-pointer ${active === x.key ? 'bg-neutral-950 text-white' : 'text-neutral-700 hover:bg-neutral-50'}`}>{x.label}</button>
        ))}
      </div>
      <div className={`${card} space-y-4 p-5`}>
        <Field label="Subject / title"><input value={cur.subject} onChange={e => set('subject', e.target.value)} className={inputCls} /></Field>
        <Field label="Message"><textarea value={cur.body} onChange={e => set('body', e.target.value)} rows={8} className={`${inputCls} h-auto py-2 leading-relaxed`} /></Field>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-neutral-700">Insert a detail</p>
          <div className="flex flex-wrap gap-1.5">{info.vars.map(v => <button key={v} type="button" onClick={() => insert(v)} className="rounded-md bg-neutral-100 px-2 py-1 font-mono text-[11px] text-neutral-700 hover:bg-neutral-200 cursor-pointer">{`{{${v}}}`}</button>)}</div>
          <p className="mt-2 text-[11px] text-neutral-400">Tip: *stars* make text bold on WhatsApp.</p>
        </div>
        <div className="flex justify-end"><button onClick={save} disabled={busy} className={btnDark}>{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save templates</button></div>
      </div>
      {node}
    </div>
  );
};

// ── OUTBOX ────────────────────────────────────────────
const KIND_LABEL: Record<string, string> = { abandoned_cart: 'Abandoned cart', back_in_stock: 'Back in stock', price_drop: 'Price drop', promo: 'Promotion', coupon: 'Coupon' };

const Outbox: React.FC = () => {
  const [list, setList] = useState<any[] | null>(null);
  const [status, setStatus] = useState('queued');
  const { flash, node } = useFlash();
  const load = () => { setList(null); marketingApi.messages(status === 'all' ? '' : status).then(setList).catch(e => { flash(false, e.message); setList([]); }); };
  useEffect(() => { load(); }, [status]);

  const send = async (m: any) => {
    window.open(m.sendLink, '_blank');
    try { await marketingApi.markMessage(m.id, 'sent'); setList(l => (l || []).filter(x => status !== 'queued' || x.id !== m.id)); } catch (e: any) { flash(false, e.message); }
  };
  const skip = async (m: any) => { try { await marketingApi.markMessage(m.id, 'skip'); load(); } catch (e: any) { flash(false, e.message); } };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-lg bg-neutral-100 p-0.5">
          {[{ id: 'queued', l: 'To send' }, { id: 'sent', l: 'Sent' }, { id: 'failed', l: 'Failed' }, { id: 'skipped', l: 'Skipped' }, { id: 'all', l: 'All' }].map(s => (
            <button key={s.id} onClick={() => setStatus(s.id)} className={`rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${status === s.id ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>{s.l}</button>
          ))}
        </div>
        <button onClick={load} className={btnLight}><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>
      <p className="text-xs text-neutral-500">Browser notifications go out automatically. WhatsApp and email messages wait here — "Send" opens WhatsApp / your email app with the message ready, then marks it as sent.</p>
      <div className="space-y-2">
        {!list ? <div className={card}><Loading /></div> : !list.length ? <div className={card}><Empty text={status === 'queued' ? 'Nothing waiting. 🎉' : 'No messages.'} /></div> : list.map(m => (
          <div key={m.id} className={`${card} flex flex-col gap-3 p-4 sm:flex-row sm:items-start`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              {m.channel === 'whatsapp' ? <MessageCircle className="h-4 w-4 text-[#1EA952]" /> : m.channel === 'email' ? <Mail className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-neutral-950">{m.to}</span>
                <Badge tone="grey">{KIND_LABEL[m.kind] || m.kind}</Badge>
                {m.status === 'failed' && <Badge tone="red">Failed</Badge>}
                {m.status === 'sent' && <Badge tone="green">Sent</Badge>}
                <span className="text-xs text-neutral-400">{fmtDate(m.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs font-medium text-neutral-700">{m.subject}</p>
              <p className="mt-0.5 line-clamp-3 whitespace-pre-line text-xs text-neutral-500">{m.body}</p>
              {m.error && <p className="mt-1 text-xs text-red-600">{m.error}</p>}
            </div>
            {m.status === 'queued' && m.sendLink && (
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => skip(m)} className={btnLight}>Skip</button>
                <button onClick={() => send(m)} className={m.channel === 'whatsapp' ? `${btnDark} bg-[#1EA952] hover:bg-[#178A43]` : btnDark}>
                  {m.channel === 'whatsapp' ? <MessageCircle className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />} Send
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {node}
    </div>
  );
};

// ── PAGE ──────────────────────────────────────────────
export const AdminMarketingPage: React.FC = () => {
  const { tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const active = (TABS.some(t => t.id === tab) ? tab : 'overview') as TabId;
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { api.getAdminProducts().then(setProducts).catch(() => {}); }, []);
  const go = (t: TabId) => navigate(t === 'overview' ? '/admin/marketing' : `/admin/marketing/${t}`);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Marketing</h1>
          <p className="text-sm text-neutral-500">Coupons, free delivery, abandoned carts and customer alerts.</p>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none]">
          <div className="flex w-max gap-1 border-b border-neutral-200">
            {TABS.map(t => {
              const on = active === t.id;
              return (
                <Link key={t.id} to={t.id === 'overview' ? '/admin/marketing' : `/admin/marketing/${t.id}`}
                  className={`relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[13px] font-medium ${on ? 'text-neutral-950' : 'text-neutral-500 hover:text-neutral-900'}`}>
                  <t.icon className="h-4 w-4" /> {t.label}
                  {on && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-neutral-950" />}
                </Link>
              );
            })}
          </div>
        </div>

        {active === 'overview' && <Overview go={go} />}
        {active === 'coupons' && <Coupons products={products} />}
        {active === 'shipping' && <Shipping products={products} />}
        {active === 'carts' && <Carts />}
        {active === 'stock' && <StockAlerts />}
        {active === 'price' && <PriceDrops />}
        {active === 'templates' && <Templates />}
        {active === 'outbox' && <Outbox />}
      </div>
    </AdminLayout>
  );
};
