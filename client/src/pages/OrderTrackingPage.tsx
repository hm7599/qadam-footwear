import { imgUrl } from '../utils/img';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Truck, Check, Clock, MapPin, Package, PackageCheck, ClipboardCheck, FileDown,
  RefreshCw, XCircle, Phone, MessageCircle, Copy,
} from 'lucide-react';
import { api } from '../utils/api';
import { useCurrency } from '../context/CurrencyContext';
import { Order } from '../types';
import { sizeLabel } from '../utils/sizes';
import { STATUS_LABEL, needsTracking } from '../utils/orderStatus';
import { downloadInvoice } from '../utils/invoice';

const REFRESH_MS = 20000;

const STEPS = [
  { key: 'pending', title: 'Order received', desc: 'We got your order. Our team will approve it shortly.', icon: ClipboardCheck },
  { key: 'processing', title: 'Approved & packing', desc: 'Your order is approved and being packed.', icon: Package },
  { key: 'shipped', title: 'On the way', desc: 'Your parcel is with the courier.', icon: Truck },
  { key: 'delivered', title: 'Delivered', desc: 'Enjoy your new shoes!', icon: PackageCheck },
] as const;

const BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  processing: 'bg-sky-50 text-sky-800 ring-sky-200',
  shipped: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
};

const timeAgo = (d: Date) => {
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)} min ago`;
};

export const OrderTrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlOrderNumber = searchParams.get('orderNumber') || '';
  const { formatPrice } = useCurrency();

  const [orderQuery, setOrderQuery] = useState(urlOrderNumber);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [justChanged, setJustChanged] = useState(false);
  const [, tick] = useState(0);
  const [copied, setCopied] = useState(false);
  const lastStatus = useRef<string | null>(null);

  const lookupOrder = useCallback(async (orderNum: string, silent = false) => {
    const num = orderNum.trim().toUpperCase();
    if (!num) return;
    silent ? setRefreshing(true) : setLoading(true);
    if (!silent) setError('');
    try {
      const found = await api.getOrderByNumber(num, searchParams.get('key') || undefined);
      if (lastStatus.current && lastStatus.current !== found.orderStatus) {
        setJustChanged(true);
        setTimeout(() => setJustChanged(false), 6000);
      }
      lastStatus.current = found.orderStatus;
      setOrder(found);
      setUpdatedAt(new Date());
    } catch (err: any) {
      if (!silent) {
        setError(err.message || `No order found for "${num}".`);
        setOrder(null);
        lastStatus.current = null;
      }
    } finally {
      silent ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (urlOrderNumber) {
      setOrderQuery(urlOrderNumber);
      lastStatus.current = null;
      lookupOrder(urlOrderNumber);
    }
  }, [urlOrderNumber, lookupOrder]);

  // Live updates: re-check every 20s and whenever the customer comes back to the tab
  useEffect(() => {
    if (!order || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') return;
    const num = order.orderNumber;
    const id = setInterval(() => lookupOrder(num, true), REFRESH_MS);
    const onFocus = () => document.visibilityState === 'visible' && lookupOrder(num, true);
    document.addEventListener('visibilitychange', onFocus);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onFocus); };
  }, [order?.orderNumber, order?.orderStatus, lookupOrder]);

  // keep the "updated x ago" text fresh
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 10000);
    return () => clearInterval(id);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = orderQuery.trim().toUpperCase();
    if (!num) return;
    if (num === urlOrderNumber) lookupOrder(num);
    else setSearchParams({ orderNumber: num }); // keeps the shareable /track-order?orderNumber= link
  };

  const copyNumber = () => {
    if (!order) return;
    navigator.clipboard?.writeText(order.orderNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const cancelled = order?.orderStatus === 'cancelled';
  const currentIdx = order ? STEPS.findIndex(s => s.key === order.orderStatus) : -1;
  const progress = currentIdx < 0 ? 0 : (currentIdx / (STEPS.length - 1)) * 100;
  const showTracking = !!order && needsTracking(order.trackingCarrier) && !!order.trackingNumber && order.orderStatus !== 'pending';
  const itemCount = order ? order.items.reduce((n, i) => n + i.quantity, 0) : 0;
  const historyFor = (key: string) => order?.statusHistory?.find(h => h.status === key);

  return (
    <div className="min-h-screen bg-[#FBF9F6] pb-24 pt-28 sm:pt-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header + search */}
        <div className="mb-8 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#9A7348]">Track your order</span>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">Where is my order?</h1>
          <p className="mt-2 text-sm text-neutral-500">Enter your order number. This page updates by itself.</p>

          <form onSubmit={handleSearchSubmit} className="mx-auto mt-6 flex max-w-lg items-center gap-2 rounded-full bg-white p-1.5 shadow-sm ring-1 ring-neutral-200 focus-within:ring-neutral-400">
            <Search className="ml-3 h-4 w-4 shrink-0 text-neutral-400" />
            <input
              type="text"
              placeholder="e.g. QDM-38659"
              value={orderQuery}
              onChange={e => setOrderQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm uppercase text-neutral-900 outline-none placeholder:normal-case placeholder:text-neutral-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-neutral-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Searching…' : 'Track'}
            </button>
          </form>

          {error && (
            <p className="mx-auto mt-4 max-w-lg rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error} Please check the number in your confirmation message.
            </p>
          )}
        </div>

        {order && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Status change toast */}
            {justChanged && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
                <Check className="h-4 w-4" /> Good news — your order status was just updated!
              </div>
            )}

            {/* Summary card */}
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200">
              <div className="flex flex-col gap-4 border-b border-neutral-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={copyNumber} title="Copy order number" className="group flex items-center gap-1.5 cursor-pointer">
                      <span className="font-serif text-2xl tracking-tight text-neutral-950">{order.orderNumber}</span>
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-neutral-300 group-hover:text-neutral-600" />}
                    </button>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${BADGE[order.orderStatus] || BADGE.pending}`}>
                      {STATUS_LABEL[order.orderStatus] || order.orderStatus}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })} · {itemCount} item{itemCount > 1 ? 's' : ''} · {formatPrice(order.totalAmount)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => downloadInvoice(order, formatPrice)}
                    className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 cursor-pointer"
                  >
                    <FileDown className="h-4 w-4" /> Download invoice
                  </button>
                  <button
                    onClick={() => lookupOrder(order.orderNumber, true)}
                    title="Refresh"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="p-6 sm:p-8">
                {cancelled ? (
                  <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-5 text-red-800">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">This order was cancelled</p>
                      <p className="mt-0.5 text-sm text-red-700">
                        {historyFor('cancelled')?.note || 'If you think this is a mistake, please contact us and we will help.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Desktop: horizontal tracker */}
                    <div className="relative hidden sm:block">
                      <div className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-neutral-100">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-[#B08D57] to-neutral-900"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="relative grid grid-cols-4">
                        {STEPS.map((s, i) => {
                          const done = i < currentIdx;
                          const current = i === currentIdx;
                          const Icon = s.icon;
                          const h = historyFor(s.key);
                          return (
                            <div key={s.key} className="flex flex-col items-center px-2 text-center">
                              <div
                                className={`relative flex h-11 w-11 items-center justify-center rounded-full ring-4 ring-white transition-colors ${
                                  done ? 'bg-neutral-900 text-white' : current ? 'bg-[#B08D57] text-white' : 'bg-neutral-100 text-neutral-400'
                                }`}
                              >
                                {current && <span className="absolute inset-0 animate-ping rounded-full bg-[#B08D57]/40" />}
                                {done ? <Check className="relative h-5 w-5" /> : <Icon className="relative h-5 w-5" />}
                              </div>
                              <p className={`mt-3 text-sm font-semibold ${done || current ? 'text-neutral-950' : 'text-neutral-400'}`}>{s.title}</p>
                              <p className="mt-1 text-xs leading-snug text-neutral-500">{current ? s.desc : h ? new Date(h.timestamp).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : ''}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mobile: vertical tracker */}
                    <ol className="space-y-0 sm:hidden">
                      {STEPS.map((s, i) => {
                        const done = i < currentIdx;
                        const current = i === currentIdx;
                        const Icon = s.icon;
                        const h = historyFor(s.key);
                        return (
                          <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
                            {i < STEPS.length - 1 && (
                              <span className={`absolute left-5 top-11 h-[calc(100%-2.75rem)] w-0.5 ${done ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
                            )}
                            <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${done ? 'bg-neutral-900 text-white' : current ? 'bg-[#B08D57] text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                            </div>
                            <div className="pt-1.5">
                              <p className={`text-sm font-semibold ${done || current ? 'text-neutral-950' : 'text-neutral-400'}`}>{s.title}</p>
                              {(current || h) && (
                                <p className="mt-0.5 text-xs text-neutral-500">
                                  {current ? s.desc : new Date(h!.timestamp).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>

                    {/* Delivery info strip */}
                    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-[#FAF7F2] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Expected delivery</p>
                        <p className="mt-1 text-sm font-semibold text-neutral-950">
                          {order.orderStatus === 'delivered'
                            ? 'Delivered ✓'
                            : order.estimatedDeliveryDate
                            ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'short' })
                            : 'Within 3–5 working days'}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#FAF7F2] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Delivery by</p>
                        <p className="mt-1 text-sm font-semibold text-neutral-950">
                          {order.orderStatus === 'pending' ? 'Assigned after approval' : order.trackingCarrier || 'Courier'}
                        </p>
                        {showTracking && <p className="mt-0.5 text-xs text-neutral-500">Tracking #: <b className="text-neutral-800">{order.trackingNumber}</b></p>}
                      </div>
                      <div className="rounded-2xl bg-[#FAF7F2] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Payment</p>
                        <p className="mt-1 text-sm font-semibold text-neutral-950">
                          {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid online'}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {order.paymentStatus === 'paid' ? 'Paid ✓' : `Please keep ${formatPrice(order.totalAmount)} ready`}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {updatedAt && !cancelled && order.orderStatus !== 'delivered' && (
                  <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Live · updated {timeAgo(updatedAt)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
              {/* Items */}
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 lg:col-span-3">
                <h2 className="mb-4 text-base font-semibold text-neutral-950">Your items</h2>
                <ul className="divide-y divide-neutral-100">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F4F2EF]">
                        {item.image && <img src={imgUrl(item.image, 200)} decoding="async" loading="lazy" alt={item.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link to={item.slug ? `/product/${item.slug}` : '/shop'} className="block truncate text-sm font-medium text-neutral-900 hover:underline">
                          {item.name}
                        </Link>
                        <p className="text-xs text-neutral-500">{item.color} · Size {sizeLabel(item.size)} · Qty {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">{formatPrice(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-1.5 border-t border-neutral-100 pt-4 text-sm">
                  <div className="flex justify-between text-neutral-600"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                  <div className="flex justify-between text-neutral-600"><span>Delivery</span><span>{order.shippingCost ? formatPrice(order.shippingCost) : 'Free'}</span></div>
                  {order.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>− {formatPrice(order.discount)}</span></div>}
                  <div className="flex justify-between pt-1 text-base font-semibold text-neutral-950"><span>Total</span><span>{formatPrice(order.totalAmount)}</span></div>
                </div>
              </div>

              {/* Address + history + help */}
              <div className="space-y-5 lg:col-span-2">
                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
                  <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-neutral-950"><MapPin className="h-4 w-4 text-[#9A7348]" /> Delivery address</h2>
                  <p className="text-sm font-medium text-neutral-900">{order.customer.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    {[order.customer.address, order.customer.apartment].filter(Boolean).join(', ')}
                    <br />
                    {[order.customer.city, order.customer.state, order.customer.postalCode].filter(Boolean).join(', ')}
                  </p>
                  {order.customer.phone && <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500"><Phone className="h-3.5 w-3.5" />{order.customer.phone}</p>}
                </div>

                {order.statusHistory?.length > 0 && (
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
                    <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-neutral-950"><Clock className="h-4 w-4 text-[#9A7348]" /> Updates</h2>
                    <ul className="space-y-3">
                      {[...order.statusHistory].reverse().map((h, i) => (
                        <li key={i} className="flex gap-3">
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i === 0 ? 'bg-[#B08D57]' : 'bg-neutral-300'}`} />
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{STATUS_LABEL[h.status] || h.status}</p>
                            {h.note && <p className="text-xs text-neutral-500">{h.note}</p>}
                            <p className="text-[11px] text-neutral-400">
                              {new Date(h.timestamp).toLocaleString('en-PK', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-3xl bg-[#F3EADC] p-6">
                  <p className="text-sm font-semibold text-neutral-950">Need help with this order?</p>
                  <p className="mt-1 text-xs text-neutral-600">Message us with your order number and we will reply quickly.</p>
                  <Link to="/contact" className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50">
                    <MessageCircle className="h-3.5 w-3.5" /> Contact support
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {!order && !loading && !error && (
          <div className="mx-auto mt-6 max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-neutral-200">
            <Truck className="mx-auto h-10 w-10 text-[#B08D57]" />
            <p className="mt-3 text-sm text-neutral-600">Your order number is in the confirmation message we sent you on WhatsApp/SMS.</p>
          </div>
        )}
      </div>
    </div>
  );
};
