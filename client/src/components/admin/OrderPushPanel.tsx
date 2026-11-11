import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../utils/api';
import { Order } from '../../types';
import { STATUS_LABEL, STATUS_STYLE } from '../../utils/orderStatus';
import { BellRing, Search, Send, Loader2, Smartphone, Zap, X } from 'lucide-react';

const PRESET_ORDER = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

/** Send a push notification about one order to the customer who placed it */
export const OrderPushPanel: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [devices, setDevices] = useState<number | null>(null);
  const [presets, setPresets] = useState<Record<string, { title: string; body: string }>>({});
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { api.getOrders().then(setOrders).catch(() => {}); }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? orders.filter(o => o.orderNumber.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q) || (o.customer.phone || '').includes(q))
      : orders;
    return list.slice(0, q ? 6 : 4);
  }, [query, orders]);

  const fill = (status: string, p = presets, o = order) => {
    const pr = p[status];
    if (!pr || !o) return;
    setTitle(pr.title.split('{order}').join(o.orderNumber));
    setBody(pr.body.split('{order}').join(o.orderNumber));
  };

  const pick = async (o: Order) => {
    setOrder(o);
    setQuery('');
    setMsg(null);
    setDevices(null);
    try {
      const info = await api.getOrderPushInfo(o.orderNumber);
      setDevices(info.devices);
      setPresets(info.presets);
      fill(o.orderStatus, info.presets, o);
    } catch {
      setDevices(0);
    }
  };

  const send = async () => {
    if (!order || !title.trim() || !body.trim()) return;
    setSending(true);
    setMsg(null);
    try {
      const text = await api.sendOrderPush(order.orderNumber, title.trim(), body.trim());
      setMsg({ ok: true, text });
    } catch (e: any) {
      setMsg({ ok: false, text: e.message || 'Could not send.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-gradient-to-r from-[#F6E7D8] to-white px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7A4E30] text-white">
            <BellRing className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-neutral-950">Order Notifications</h3>
            <p className="text-xs text-neutral-500">Send an update about one order to that customer's phone.</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
          <Zap className="h-3.5 w-3.5" /> Auto-sent when you approve, ship, deliver or cancel
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        {/* Pick order */}
        <div className="space-y-3">
          <span className="block text-xs font-semibold text-neutral-700">1. Choose an order</span>
          {order ? (
            <div className="flex items-start justify-between gap-3 rounded-xl bg-neutral-50 p-3 ring-1 ring-neutral-200">
              <div className="space-y-1 text-sm">
                <p><b>{order.orderNumber}</b> · {order.customer.name}</p>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${STATUS_STYLE[order.orderStatus]}`}>{STATUS_LABEL[order.orderStatus]}</span>
                <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Smartphone className="h-3.5 w-3.5" />
                  {devices === null ? 'Checking…' : devices > 0 ? `${devices} device(s) will receive this` : 'Notifications are off on this customer\'s device'}
                </p>
              </div>
              <button onClick={() => { setOrder(null); setMsg(null); }} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-200 hover:text-black cursor-pointer" aria-label="Clear">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search order #, name or phone…" className="w-full rounded-lg border border-neutral-200 py-2.5 pl-9 pr-3 text-sm" />
              </div>
              <div className="space-y-1">
                {!query && <p className="text-[11px] text-neutral-400">Latest orders</p>}
                {matches.map(o => (
                  <button key={o.orderNumber} onClick={() => pick(o)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50 ring-1 ring-transparent hover:ring-neutral-200 cursor-pointer">
                    <span><b>{o.orderNumber}</b> · {o.customer.name}</span>
                    <span className="text-xs text-neutral-500">{STATUS_LABEL[o.orderStatus]}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {order && (
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-neutral-700">2. Message type</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ORDER.filter(s => presets[s]).map(s => (
                  <button key={s} onClick={() => fill(s)} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 cursor-pointer">
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Compose + preview */}
        <div className="space-y-3">
          <span className="block text-xs font-semibold text-neutral-700">{order ? '3. Message' : 'Message'}</span>
          <input value={title} onChange={e => setTitle(e.target.value)} disabled={!order} placeholder="Title" className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm disabled:bg-neutral-50" />
          <textarea value={body} onChange={e => setBody(e.target.value)} disabled={!order} rows={3} placeholder="Message" className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm disabled:bg-neutral-50" />

          {/* Mini phone notification preview */}
          <div className="rounded-xl bg-neutral-100 p-3">
            <div className="rounded-xl bg-white/90 p-3 shadow-sm ring-1 ring-black/5">
              <div className="mb-1 flex items-center justify-between text-[11px] text-neutral-500">
                <span className="flex items-center gap-1.5 font-semibold text-neutral-800">
                  <img src="/icons/icon-192.png" alt="" className="h-4 w-4 rounded" /> QADAM
                </span>
                now
              </div>
              <p className="truncate text-sm font-semibold text-neutral-900">{title || 'Notification title'}</p>
              <p className="line-clamp-2 text-xs text-neutral-600">{body || 'Your message will appear here.'}</p>
            </div>
          </div>

          {msg && (
            <p className={`rounded-lg px-3 py-2 text-xs ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>
          )}

          <button
            onClick={send}
            disabled={!order || sending || !title.trim() || !body.trim() || devices === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7A4E30] py-3 text-sm font-semibold text-white hover:bg-[#5E3B23] disabled:opacity-40 cursor-pointer"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send to customer
          </button>
        </div>
      </div>
    </div>
  );
};
