import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2, Loader2, Search, MessageCircle, Store, Globe } from 'lucide-react';
import { api } from '../../utils/api';
import { Product } from '../../types';
import { CURRENCIES } from '../../context/CurrencyContext';
import { SIZE_OPTIONS, sizeLabel } from '../../utils/sizes';
import { DELIVERY_OPTIONS, needsTracking, STATUS_LABEL } from '../../utils/orderStatus';

const RATE = CURRENCIES.PKR.rate;
const toRs = (base: number) => Math.round((base || 0) * RATE);
const fromRs = (rs: number) => Math.round((rs / RATE) * 100) / 100;

const inputCls =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none';

interface Line {
  productId: string;
  name: string;
  slug: string;
  image: string;
  color: string;
  size: number;
  quantity: number;
  priceRs: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SOURCES = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'other', label: 'Other (shop / phone / Instagram…)', icon: Store },
];

/** Admin adds an order by hand — e.g. taken on WhatsApp, phone or in the shop */
export const AddOrderModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [source, setSource] = useState<'whatsapp' | 'other'>('whatsapp');
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', city: '' });
  const [lines, setLines] = useState<Line[]>([]);
  const [query, setQuery] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'paid'>('cod');
  const [courier, setCourier] = useState('Leopards');
  const [tracking, setTracking] = useState('');
  const [status, setStatus] = useState('processing');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    api.getProducts().then(setProducts).catch(() => {});
    setSource('whatsapp');
    setCustomer({ name: '', phone: '', address: '', city: '' });
    setLines([]);
    setQuery('');
    setDeliveryFee('');
    setDiscount('');
    setPaymentMethod('cod');
    setCourier('Leopards');
    setTracking('');
    setStatus('processing');
    setNote('');
    setError('');
  }, [open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, products]);

  const addProduct = (p: Product) => {
    const eu = (p.sizes || []).filter(s => s >= 30);
    setLines(ls => [
      ...ls,
      {
        productId: p.id,
        name: p.name,
        slug: p.slug,
        image: p.images?.[0] || '',
        color: p.colors?.[0]?.name || 'Standard',
        size: eu.includes(42) ? 42 : eu[0] || 42,
        quantity: 1,
        priceRs: toRs(p.salePrice || p.price),
      },
    ]);
    setQuery('');
  };

  const updateLine = (i: number, patch: Partial<Line>) => setLines(ls => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const subtotal = lines.reduce((s, l) => s + l.priceRs * l.quantity, 0);
  const total = Math.max(0, subtotal + (Number(deliveryFee) || 0) - (Number(discount) || 0));
  const pickup = courier === 'Self Pickup';

  const save = async () => {
    setError('');
    if (!customer.name.trim() || !customer.phone.trim()) return setError('Please enter customer name and phone.');
    if (!lines.length) return setError('Please add at least one product.');
    if (!pickup && !customer.address.trim()) return setError('Please enter the delivery address (or choose Self Pickup).');
    if (status === 'shipped' && needsTracking(courier) && !tracking.trim()) return setError('Please enter the tracking number.');

    setSaving(true);
    try {
      await api.createManualOrder({
        source,
        customer: { ...customer, address: pickup ? 'Self pickup' : customer.address, city: customer.city || '-' },
        items: lines.map(l => ({
          productId: l.productId,
          name: l.name,
          slug: l.slug,
          image: l.image,
          color: l.color,
          size: l.size,
          quantity: l.quantity,
          price: fromRs(l.priceRs),
        })),
        shippingCost: fromRs(Number(deliveryFee) || 0),
        discount: fromRs(Number(discount) || 0),
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'card',
        paymentStatus: paymentMethod === 'paid' ? 'paid' : 'pending',
        trackingCarrier: courier,
        trackingNumber: tracking.trim(),
        orderStatus: status,
        adminNote: note.trim(),
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Could not add order.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div className="my-8 w-full max-w-3xl bg-white" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-neutral-950">Add Order</h3>
            <p className="text-xs text-neutral-500">For orders taken on WhatsApp, phone, Instagram or in the shop.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-black cursor-pointer"><X className="h-5 w-5" /></button>
        </div>

        <div className="max-h-[72vh] space-y-6 overflow-y-auto px-6 py-5">
          {/* Source */}
          <section>
            <h4 className="mb-2 text-sm font-semibold">Order came from</h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-neutral-400 ring-1 ring-dashed ring-neutral-200">
                <Globe className="h-4 w-4" /> Website (comes automatically)
              </div>
              {SOURCES.map(s => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSource(s.id as any)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold ring-1 transition-all cursor-pointer ${
                      source === s.id ? 'bg-[#7A4E30] text-white ring-[#7A4E30]' : 'text-neutral-700 ring-neutral-200 hover:ring-neutral-400'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" /> {s.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Customer */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <h4 className="text-sm font-semibold sm:col-span-2">Customer</h4>
            <input value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} placeholder="Name *" className={inputCls} />
            <input value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} placeholder="Phone / WhatsApp * (0300 1234567)" className={inputCls} />
            {!pickup && (
              <>
                <input value={customer.address} onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))} placeholder="Address *" className={`${inputCls} sm:col-span-2`} />
                <input value={customer.city} onChange={e => setCustomer(c => ({ ...c, city: e.target.value }))} placeholder="City" className={inputCls} />
              </>
            )}
          </section>

          {/* Products */}
          <section>
            <h4 className="mb-2 text-sm font-semibold">Products</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a product to add…" className={`${inputCls} pl-9`} />
              {matches.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-neutral-200">
                  {matches.map(p => (
                    <button key={p.id} type="button" onClick={() => addProduct(p)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-neutral-50 cursor-pointer">
                      <img src={p.images?.[0]} alt="" className="h-8 w-8 rounded object-contain bg-neutral-100" />
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="text-xs text-neutral-500">Rs. {toRs(p.salePrice || p.price).toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {lines.length === 0 && <p className="rounded-lg bg-neutral-50 py-4 text-center text-xs text-neutral-400">No products added yet.</p>}
              {lines.map((l, i) => {
                const p = products.find(x => x.id === l.productId);
                return (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl p-2 ring-1 ring-neutral-200">
                    <img src={l.image} alt="" className="h-10 w-10 rounded-lg bg-neutral-100 object-contain" />
                    <span className="min-w-[120px] flex-1 truncate text-sm font-medium">{l.name}</span>
                    <select value={l.size} onChange={e => updateLine(i, { size: Number(e.target.value) })} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs" title="Size">
                      {SIZE_OPTIONS.map(s => <option key={s} value={s}>{sizeLabel(s)}</option>)}
                    </select>
                    {p?.colors && p.colors.length > 1 && (
                      <select value={l.color} onChange={e => updateLine(i, { color: e.target.value })} className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs" title="Colour">
                        {p.colors.map(c => <option key={c.name}>{c.name}</option>)}
                      </select>
                    )}
                    <input type="number" min={1} value={l.quantity} onChange={e => updateLine(i, { quantity: Math.max(1, Number(e.target.value) || 1) })} className="w-14 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs" title="Quantity" />
                    <div className="flex items-center gap-1 text-xs text-neutral-500">
                      Rs.
                      <input type="number" min={0} value={l.priceRs} onChange={e => updateLine(i, { priceRs: Math.max(0, Number(e.target.value) || 0) })} className="w-24 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs" title="Price per pair" />
                    </div>
                    <button type="button" onClick={() => setLines(ls => ls.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 cursor-pointer" title="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Delivery */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <h4 className="text-sm font-semibold sm:col-span-2">Delivery</h4>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-neutral-700">Courier / delivery type</span>
              <select value={courier} onChange={e => setCourier(e.target.value)} className={inputCls}>
                {DELIVERY_OPTIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </label>
            {needsTracking(courier) && (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-neutral-700">Tracking number (if booked)</span>
                <input value={tracking} onChange={e => setTracking(e.target.value)} className={inputCls} />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-neutral-700">Delivery charges (Rs.)</span>
              <input type="number" min={0} value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} placeholder="0" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-neutral-700">Discount (Rs.)</span>
              <input type="number" min={0} value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" className={inputCls} />
            </label>
          </section>

          {/* Payment + status */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold">Payment</h4>
              <div className="flex gap-2">
                {[{ v: 'cod', l: 'Cash on Delivery' }, { v: 'paid', l: 'Already Paid' }].map(p => (
                  <button key={p.v} type="button" onClick={() => setPaymentMethod(p.v as any)} className={`rounded-full px-4 py-1.5 text-xs font-semibold cursor-pointer ${paymentMethod === p.v ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
                    {p.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">Start as</h4>
              <div className="flex flex-wrap gap-2">
                {['pending', 'processing', 'shipped', 'delivered'].map(s => (
                  <button key={s} type="button" onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer ${status === s ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note for yourself (optional)" className={`${inputCls} sm:col-span-2`} />
          </section>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-6 py-4">
          <div className="text-sm">
            <span className="text-neutral-500">Total: </span>
            <b className="text-lg text-neutral-950">Rs. {total.toLocaleString()}</b>
            {lines.length > 0 && <span className="ml-2 text-xs text-neutral-400">({lines.reduce((n, l) => n + l.quantity, 0)} pair{lines.reduce((n, l) => n + l.quantity, 0) === 1 ? '' : 's'})</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer">Cancel</button>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#7A4E30] px-6 py-2 text-sm font-semibold text-white hover:bg-[#5E3B23] disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
