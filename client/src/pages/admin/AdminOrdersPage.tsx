import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useCurrency } from '../../context/CurrencyContext';
import { api } from '../../utils/api';
import { Order } from '../../types';
import { Check, X, Search, MessageCircle, Truck, PackageCheck, Clock, Loader2, ChevronRight, Settings2 } from 'lucide-react';
import { ORDER_FLOW, STATUS_LABEL, STATUS_STYLE, ACTION_LABEL, OrderStatus, ORDER_SOURCES, sourceInfo, DELIVERY_OPTIONS, needsTracking } from '../../utils/orderStatus';
import { AddOrderModal } from '../../components/admin/AddOrderModal';
import { DEFAULT_WHATSAPP, WhatsAppSettings, normalizeWhatsApp, fillTemplate, whatsappLink, TEMPLATE_FOR_STATUS } from '../../utils/whatsapp';
import { sizeLabel } from '../../utils/sizes';
import { WhatsAppMessageModal } from '../../components/admin/WhatsAppMessageModal';
import { EditOrderModal } from '../../components/admin/EditOrderModal';
import { alertDialog } from '../../components/common/Dialog';

const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Awaiting Approval' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${STATUS_STYLE[status] || STATUS_STYLE.pending}`}>
    {status === 'pending' && <Clock className="h-3 w-3" />}
    {STATUS_LABEL[status] || status}
  </span>
);

export const AdminOrdersPage: React.FC = () => {
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [wa, setWa] = useState<WhatsAppSettings>(DEFAULT_WHATSAPP);

  // Status change dialog
  const [selected, setSelected] = useState<Order | null>(null);
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [tracking, setTracking] = useState('');
  const [courier, setCourier] = useState('');
  const [note, setNote] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [waOrder, setWaOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [updating, setUpdating] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      setOrders(await api.getOrders());
    } catch (e) {
      console.warn('Load orders error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    api.getSetting('whatsapp').then(d => d && setWa(normalizeWhatsApp(d))).catch(() => {});
  }, []);

  // Refresh the list when the new-order alert detects new orders
  useEffect(() => {
    const onNew = () => { loadOrders(); };
    window.addEventListener("qadam-new-orders", onNew);
    return () => window.removeEventListener("qadam-new-orders", onNew);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    orders.forEach(o => { c[o.orderStatus] = (c[o.orderStatus] || 0) + 1; });
    return c;
  }, [orders]);

  const openAction = (ord: Order, next: OrderStatus) => {
    setSelected(ord);
    setTarget(next);
    setTracking(ord.trackingNumber || '');
    setCourier(ord.trackingCarrier || 'Leopards');
    setNote('');
    setSendWhatsApp(true);
  };

  const confirmAction = async () => {
    if (!selected || !target) return;
    if (target === 'shipped' && needsTracking(courier) && !tracking.trim()) {
      alertDialog('Please enter the tracking number before marking as shipped.');
      return;
    }
    setUpdating(true);
    // Open the tab now (during the click) so the browser does not block it as a popup
    const waTab = sendWhatsApp ? window.open("", "_blank") : null;
    try {
      const updated = await api.updateOrderStatus(
        selected.orderNumber,
        target,
        tracking.trim(),
        note.trim() || (target === 'processing' ? 'Order approved by admin' : `Status changed to ${STATUS_LABEL[target]}`),
        courier.trim()
      );
      if (sendWhatsApp) {
        const merged = { ...selected, ...(updated || {}), orderStatus: target, trackingNumber: tracking.trim() || selected.trackingNumber, trackingCarrier: courier || selected.trackingCarrier } as Order;
        const tpl = wa.templates.find(t => t.id === TEMPLATE_FOR_STATUS[target]) || wa.templates[0];
        const link = whatsappLink(merged.customer.phone, fillTemplate(tpl?.body || "", merged, formatPrice));
        if (waTab) waTab.location.href = link; else window.open(link, "_blank");
      }
      setSelected(null);
      await loadOrders();
    } catch (err: any) {
      waTab?.close();
      alertDialog(err.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = orders.filter(o => {
    if (filterStatus !== 'all' && o.orderStatus !== filterStatus) return false;
    if (sourceFilter !== 'all' && (o.source || 'website') !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        (o.customer.phone || '').includes(q)
      );
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1>Orders</h1>
            <p className="mt-1 text-sm text-neutral-500">
              New orders must be approved first. Then move them to Shipped and Delivered.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#7A4E30] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5E3B23] cursor-pointer"
          >
            + Add Order
          </button>
          {(counts.pending || 0) > 0 && (
            <button
              onClick={() => setFilterStatus('pending')}
              className="inline-flex items-center gap-2 self-start rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200 cursor-pointer"
            >
              <Clock className="h-4 w-4" /> {counts.pending} waiting for approval
            </button>
          )}
          </div>
        </div>

        {/* Filters toolbar */}
        <div className="rounded-xl bg-white ring-1 ring-neutral-200">
          {/* Status tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-neutral-100 px-2 [scrollbar-width:none]">
            {FILTERS.map(f => {
              const active = filterStatus === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`relative flex shrink-0 items-center gap-2 px-3 py-3 text-[13px] font-medium transition-colors cursor-pointer ${
                    active ? 'text-neutral-950' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {f.label}
                  <span className={`min-w-[20px] rounded-md px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums ${
                    active ? 'bg-neutral-950 text-white' : f.id === 'pending' && (counts[f.id] || 0) > 0 ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {counts[f.id] || 0}
                  </span>
                  {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-neutral-950" />}
                </button>
              );
            })}
          </div>

          {/* Source + search */}
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit rounded-lg bg-neutral-100 p-0.5">
              {[{ id: "all", label: "All sources" }, ...ORDER_SOURCES].map(s => {
                const active = sourceFilter === s.id;
                const n = s.id === "all" ? orders.length : orders.filter(o => (o.source || "website") === s.id).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSourceFilter(s.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      active ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {s.label} <span className="ml-0.5 tabular-nums text-neutral-400">{n}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search order, name or phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center text-sm text-neutral-500">No orders found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ord => {
              const next = ORDER_FLOW[ord.orderStatus as OrderStatus] || [];
              return (
                <div
                  key={ord.orderNumber}
                  className={`rounded-xl bg-white ring-1 transition-shadow hover:shadow-sm ${ord.orderStatus === 'pending' ? 'ring-amber-300' : 'ring-neutral-200'}`}
                >
                  {/* Header: order no. + status */}
                  <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="whitespace-nowrap text-sm font-bold text-neutral-950">{ord.orderNumber}</span>
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${sourceInfo(ord.source).style}`}>{sourceInfo(ord.source).label}</span>
                      <span className="whitespace-nowrap text-xs text-neutral-400">
                        {new Date(ord.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <StatusBadge status={ord.orderStatus} />
                  </div>

                  {/* Body */}
                  <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Customer</p>
                      <p className="mt-1 truncate text-sm font-semibold text-neutral-900">{ord.customer.name}</p>
                      <p className="truncate text-xs text-neutral-500">{ord.customer.phone}{ord.customer.city ? ` · ${ord.customer.city}` : ''}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Total</p>
                      <p className="mt-1 whitespace-nowrap text-sm font-bold text-neutral-950">{formatPrice(ord.totalAmount)}</p>
                      <p className="text-xs text-neutral-500">
                        {ord.items.reduce((n, i) => n + i.quantity, 0)} item(s) · {ord.paymentMethod === 'cod' ? 'COD' : 'Paid online'}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Delivery</p>
                      {ord.trackingNumber && ord.orderStatus !== 'pending' ? (
                        <>
                          <p className="mt-1 truncate text-sm font-medium text-neutral-900">{ord.trackingCarrier || 'Courier'}</p>
                          <p className="truncate font-mono text-xs text-neutral-500" title={ord.trackingNumber}>{ord.trackingNumber}</p>
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-neutral-400">Not shipped yet</p>
                      )}
                    </div>
                  </div>

                  {/* Footer: items + actions */}
                  <div className="flex flex-col gap-3 border-t border-neutral-100 bg-neutral-50/60 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-wrap gap-1.5">
                      {ord.items.map((it, i) => (
                        <span key={i} className="inline-flex max-w-full items-center gap-2 rounded-full bg-white py-0.5 pl-0.5 pr-2.5 text-[11px] text-neutral-700 ring-1 ring-neutral-200">
                          {it.image && <img src={it.image} alt="" className="h-5 w-5 rounded-full object-cover" />}
                          <span className="truncate">{it.name} · {sizeLabel(it.size)} · ×{it.quantity}</span>
                        </span>
                      ))}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {next.includes('cancelled') && (
                        <button
                          onClick={() => openAction(ord, 'cancelled')}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          {ord.orderStatus === 'pending' ? 'Reject' : 'Cancel'}
                        </button>
                      )}
                      <button
                        onClick={() => setWaOrder(ord)}
                        title="Send WhatsApp message"
                        aria-label="Send WhatsApp message"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1EA952] ring-1 ring-neutral-200 bg-white hover:bg-[#25D366] hover:text-white hover:ring-[#25D366] cursor-pointer"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditOrder(ord)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200 hover:ring-neutral-400 cursor-pointer"
                      >
                        <Settings2 className="h-3.5 w-3.5" /> Manage
                      </button>
                      {next.filter(s => s !== 'cancelled').map(s => (
                        <button
                          key={s}
                          onClick={() => openAction(ord, s)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white cursor-pointer ${
                            s === 'processing' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-neutral-950 hover:bg-neutral-800'
                          }`}
                        >
                          {s === 'processing' ? <Check className="h-3.5 w-3.5" /> : s === 'shipped' ? <Truck className="h-3.5 w-3.5" /> : <PackageCheck className="h-3.5 w-3.5" />}
                          {ACTION_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <AddOrderModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={loadOrders} />
        <EditOrderModal order={editOrder} onClose={() => setEditOrder(null)} onSaved={loadOrders} onDeleted={loadOrders} />
        <WhatsAppMessageModal order={waOrder} settings={wa} formatPrice={formatPrice} onClose={() => setWaOrder(null)} />

        {/* Action dialog */}
        {selected && target && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-neutral-950">{ACTION_LABEL[target]}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-neutral-500">
                    {selected.orderNumber} · {STATUS_LABEL[selected.orderStatus]} <ChevronRight className="h-3.5 w-3.5" /> {STATUS_LABEL[target]}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-black cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {target === 'shipped' && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-neutral-700">Courier</span>
                      <select value={courier} onChange={e => setCourier(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900">
                        {DELIVERY_OPTIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                        {courier && !DELIVERY_OPTIONS.some(d => d.id === courier) && <option value={courier}>{courier}</option>}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-neutral-700">{needsTracking(courier) ? "Tracking number *" : "Tracking / receipt no. (optional)"}</span>
                      <input value={tracking} onChange={e => setTracking(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900" />
                    </label>
                  </div>
                )}

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-neutral-700">
                    {target === 'cancelled' ? 'Reason (optional)' : 'Note (optional)'}
                  </span>
                  <input value={note} onChange={e => setNote(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900" />
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#25D366]/10 px-3 py-2.5 text-sm text-neutral-800">
                  <input type="checkbox" checked={sendWhatsApp} onChange={e => setSendWhatsApp(e.target.checked)} className="h-4 w-4 accent-[#25D366]" />
                  Send WhatsApp message to customer after saving
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setSelected(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer">
                  Back
                </button>
                <button
                  onClick={confirmAction}
                  disabled={updating}
                  className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer ${
                    target === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : target === 'processing' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-neutral-950 hover:bg-neutral-800'
                  }`}
                >
                  {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {ACTION_LABEL[target]}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
