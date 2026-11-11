import React, { useEffect, useState } from 'react';
import { X, Loader2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { sizeLabel } from '../../utils/sizes';
import { sourceInfo } from '../../utils/orderStatus';
import { Order } from '../../types';
import { api } from '../../utils/api';
import { STATUS_LABEL, STATUS_STYLE, DELIVERY_OPTIONS } from '../../utils/orderStatus';
import { confirmDialog } from '../common/Dialog';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const inputCls =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900';

const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className, children }) => (
  <label className={`block ${className || ''}`}>
    <span className="mb-1 block text-xs font-semibold text-neutral-700">{label}</span>
    {children}
  </label>
);

interface Props {
  order: Order | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}

/** Edit an order's status (any step) and customer / delivery details */
export const EditOrderModal: React.FC<Props> = ({ order, onClose, onSaved, onDeleted }) => {
  const { formatPrice } = useCurrency();
  const [notify, setNotify] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<string>('pending');
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [note, setNote] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '', apartment: '', city: '' });
  const [courier, setCourier] = useState('');
  const [tracking, setTracking] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!order) return;
    setStatus(order.orderStatus);
    setPaymentStatus(order.paymentStatus || 'pending');
    setNote('');
    setCustomer({
      name: order.customer.name || '',
      phone: order.customer.phone || '',
      email: order.customer.email || '',
      address: order.customer.address || '',
      apartment: order.customer.apartment || '',
      city: order.customer.city || '',
    });
    setCourier(order.trackingCarrier || '');
    setTracking(order.trackingNumber || '');
    setError('');
    setNotify(true);
  }, [order]);

  if (!order) return null;

  const setC = (k: keyof typeof customer, v: string) => setCustomer(c => ({ ...c, [k]: v }));

  const save = async () => {
    if (!customer.name.trim() || !customer.phone.trim()) {
      setError('Name and phone are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.editOrder(order.orderNumber, {
        orderStatus: status,
        paymentStatus,
        note: note.trim() || (status !== order.orderStatus ? `Status changed to ${STATUS_LABEL[status] || status} by admin` : ''),
        notifyCustomer: notify,
        customer,
        trackingCarrier: courier,
        trackingNumber: tracking,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!await confirmDialog(`Delete order ${order.orderNumber} (${order.customer.name}) permanently? This cannot be undone.`)) return;
    setDeleting(true);
    setError('');
    try {
      await api.deleteOrder(order.orderNumber);
      (onDeleted || onSaved)();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Could not delete.');
    } finally {
      setDeleting(false);
    }
  };

  const forced = status !== order.orderStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-neutral-950">Manage Order</h3>
            <p className="flex items-center gap-2 text-sm text-neutral-500">
              {order.orderNumber}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sourceInfo(order.source).style}`}>{sourceInfo(order.source).label}</span>
              <span className="text-neutral-300">·</span>
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-black cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
          {/* Items */}
          <section>
            <h4 className="mb-2 text-sm font-semibold text-neutral-900">Items</h4>
            <div className="divide-y divide-neutral-100 rounded-xl ring-1 ring-neutral-200">
              {order.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  {it.image ? <img src={it.image} alt="" className="h-10 w-10 rounded-md bg-neutral-50 object-cover" /> : <div className="h-10 w-10 rounded-md bg-neutral-100" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">{it.name}</p>
                    <p className="text-xs text-neutral-500">{sizeLabel(it.size)} · Qty {it.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">{formatPrice(it.price * it.quantity)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between bg-neutral-50 px-3 py-2.5 text-sm">
                <span className="font-medium text-neutral-600">Total</span>
                <span className="font-bold text-neutral-950">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </section>

          {/* Status */}
          <section>
            <h4 className="text-sm font-semibold text-neutral-900">Order status</h4>
            <p className="mb-2 text-xs text-neutral-500">Pick any status — this skips the normal approve → ship → deliver steps.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`rounded-xl px-2 py-2.5 text-xs font-semibold ring-1 transition-all cursor-pointer ${
                    status === s ? `${STATUS_STYLE[s]} ring-2` : 'bg-white text-neutral-500 ring-neutral-200 hover:ring-neutral-400'
                  }`}
                >
                  {status === s ? '✓ ' : ''}{STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            {forced && (
              <div className="mt-3 space-y-2 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" /> Force change: {STATUS_LABEL[order.orderStatus]} → {STATUS_LABEL[status]}
                </p>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Reason / note (optional)" className={inputCls} />
                <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                  <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} className="h-4 w-4 accent-neutral-900" />
                  Notify customer about this change
                </label>
              </div>
            )}
          </section>

          {/* Payment */}
          <section>
            <h4 className="mb-2 text-sm font-semibold text-neutral-900">Payment</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { v: 'paid', l: 'Paid' },
                { v: 'pending', l: 'Not paid yet' },
                { v: 'failed', l: 'Failed' },
              ].map(p => (
                <button
                  key={p.v}
                  type="button"
                  onClick={() => setPaymentStatus(p.v)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    paymentStatus === p.v ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {p.l}
                </button>
              ))}
              <span className="self-center text-xs text-neutral-400">
                Method: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}
              </span>
            </div>
          </section>

          {/* Customer */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <h4 className="text-sm font-semibold text-neutral-900 sm:col-span-2">Customer & delivery</h4>
            <Field label="Name *"><input value={customer.name} onChange={e => setC('name', e.target.value)} className={inputCls} /></Field>
            <Field label="Phone / WhatsApp *"><input value={customer.phone} onChange={e => setC('phone', e.target.value)} className={inputCls} /></Field>
            <Field label="Email" className="sm:col-span-2"><input value={customer.email} onChange={e => setC('email', e.target.value)} className={inputCls} /></Field>
            <Field label="Address" className="sm:col-span-2"><input value={customer.address} onChange={e => setC('address', e.target.value)} className={inputCls} /></Field>
            <Field label="Apartment / area"><input value={customer.apartment} onChange={e => setC('apartment', e.target.value)} className={inputCls} /></Field>
            <Field label="City"><input value={customer.city} onChange={e => setC('city', e.target.value)} className={inputCls} /></Field>
          </section>

          {/* Shipping */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <h4 className="text-sm font-semibold text-neutral-900 sm:col-span-2">Courier</h4>
            <Field label="Courier / delivery type">
              <select value={courier} onChange={e => setCourier(e.target.value)} className={inputCls}>
                <option value="">— Not set —</option>
                {DELIVERY_OPTIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                {courier && !DELIVERY_OPTIONS.some(d => d.id === courier) && <option value={courier}>{courier}</option>}
              </select>
            </Field>
            <Field label="Tracking number"><input value={tracking} onChange={e => setTracking(e.target.value)} className={inputCls} /></Field>
          </section>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-neutral-100 px-6 py-4">
          <button onClick={remove} disabled={deleting || saving} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete order
          </button>
          <div className="flex gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-6 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};
