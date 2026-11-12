import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Send, MessageCircle, Headset, ArrowUpRight, Star, Package,
  Truck, CheckCircle2, Clock, XCircle, MapPin, ChevronRight,
  Users, Zap,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Product, Order } from '../../types';
import { useStoreWhatsAppNumber } from '../../utils/whatsapp';
import { useCurrency } from '../../context/CurrencyContext';
import { imgUrl } from '../../utils/img';
import { api } from '../../utils/api';
import { botAnswer, BotAction, BotReply, START_CHIPS, chipToQuestion } from '../../utils/chatBot';
import { chatApi, savedChat, forgetChat, LiveConversation, ChatMessage } from '../../utils/chatApi';
import { bindScrollContain } from '../../utils/scrollContain';
import { sizeLabel } from '../../utils/sizes';

/** A message on screen. Rich parts (products, buttons, order card) only exist for this visit. */
type ViewMsg = {
  key: string;
  from: 'customer' | 'bot' | 'admin' | 'system';
  text: string;
  at?: string;
  extra?: Partial<BotReply> & { order?: (Order & { limited?: boolean }) | null; orderError?: string };
};

const WELCOME: ViewMsg = {
  key: 'welcome',
  from: 'bot',
  text: "Assalam o Alaikum! 👋 I'm the QADAM assistant. Ask about sizes, delivery, Cash on Delivery, or returns.",
  extra: { chips: START_CHIPS },
};

const NAME_KEY = 'qadam_chat_name';
let seq = 1;
const k = () => `l${seq++}`;
const timeOf = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
const fromServer = (m: ChatMessage): ViewMsg => ({ key: m.id, from: m.from, text: m.text, at: m.at });

const STATUS: Record<string, { label: string; icon: React.ElementType; tone: string; bg: string }> = {
  pending:    { label: 'Order Received',  icon: Clock,        tone: 'text-amber-800 ring-amber-200',     bg: 'bg-amber-50' },
  processing: { label: 'Being Prepared',  icon: Package,      tone: 'text-sky-800 ring-sky-200',         bg: 'bg-sky-50' },
  shipped:    { label: 'On the Way',      icon: Truck,        tone: 'text-indigo-800 ring-indigo-200',   bg: 'bg-indigo-50' },
  delivered:  { label: 'Delivered ✓',    icon: CheckCircle2, tone: 'text-emerald-800 ring-emerald-200', bg: 'bg-emerald-50' },
  cancelled:  { label: 'Cancelled',      icon: XCircle,      tone: 'text-red-700 ring-red-200',         bg: 'bg-red-50' },
};
const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden>
    <path d="M16.004 3C8.82 3 3 8.82 3 16c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75A12.94 12.94 0 0 0 16.004 29C23.18 29 29 23.18 29 16S23.18 3 16.004 3Zm0 23.6c-2.03 0-4.02-.55-5.75-1.58l-.41-.24-3.96 1.04 1.06-3.86-.27-.4A10.56 10.56 0 0 1 5.4 16c0-5.85 4.76-10.6 10.6-10.6 5.85 0 10.6 4.75 10.6 10.6 0 5.85-4.75 10.6-10.6 10.6Zm5.81-7.94c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.88-1.76-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.07 1.3 3.29c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z" />
  </svg>
);

/* ── Rich Order Card ──────────────────────────────────────────────── */
const OrderCard: React.FC<{
  order: Order & { limited?: boolean };
  formatPrice: (n: number) => string;
  onClose: () => void;
  onNeedHelp: () => void;
}> = ({ order, formatPrice, onClose, onNeedHelp }) => {
  const st = STATUS[order.orderStatus] || STATUS.pending;
  const Icon = st.icon;
  const stepIdx = STEPS.indexOf(order.orderStatus);

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-[#EDE1CF] bg-white shadow-sm">
      {/* Coloured header */}
      <div className={`flex items-center justify-between gap-2 px-3 py-2.5 ${st.bg}`}>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#A8907A]">Order</p>
          <p className="font-bold text-[#2A1A10]">{order.orderNumber}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${st.tone}`}>
          <Icon className="h-3.5 w-3.5" /> {st.label}
        </span>
      </div>

      {/* Progress bar */}
      {order.orderStatus !== 'cancelled' && (
        <div className="flex items-center gap-1 px-3 pt-2.5 pb-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${i <= stepIdx ? 'bg-gradient-to-r from-[#8A5A2B] to-[#C9A46A]' : 'bg-[#EDE1CF]'}`} />
          ))}
        </div>
      )}

      {/* Item list */}
      <div className="space-y-2 px-3 pt-2 pb-2">
        {(order.items || []).slice(0, 3).map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            {it.image && <img src={imgUrl(it.image, 96)} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-[#F6EFE4] object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-[#2A1A10]">{it.name}</p>
              <p className="text-[11px] text-[#8A6A52]">{it.color ? `${it.color} · ` : ''}Size {sizeLabel(it.size)} · ×{it.quantity}</p>
            </div>
            <p className="shrink-0 text-[12px] font-semibold text-[#8A5A2B]">{formatPrice((it.price || 0) * it.quantity)}</p>
          </div>
        ))}
        {(order.items || []).length > 3 && (
          <p className="text-[11px] text-[#8A6A52]">+{order.items.length - 3} more item(s)</p>
        )}
      </div>

      {/* Detail grid */}
      <div className="mx-3 mb-2 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-[#FBF7F1] px-3 py-2.5 text-[11.5px]">
        <div>
          <p className="text-[#A8907A]">Total</p>
          <p className="font-bold text-[#2A1A10]">{formatPrice(order.totalAmount)}</p>
        </div>
        <div>
          <p className="text-[#A8907A]">Payment</p>
          <p className="font-semibold capitalize text-[#2A1A10]">
            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.paymentMethod || '').replace('_', ' ')}
          </p>
        </div>
        <div>
          <p className="text-[#A8907A]">Date Placed</p>
          <p className="font-semibold text-[#2A1A10]">
            {new Date(order.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        {order.trackingNumber ? (
          <div>
            <p className="text-[#A8907A]">{order.trackingCarrier || 'Courier'}</p>
            <p className="truncate font-semibold text-[#2A1A10]">{order.trackingNumber}</p>
          </div>
        ) : order.estimatedDeliveryDate ? (
          <div>
            <p className="text-[#A8907A]">Expected by</p>
            <p className="font-semibold text-[#2A1A10]">
              {new Date(order.estimatedDeliveryDate).toLocaleDateString([], { day: 'numeric', month: 'short' })}
            </p>
          </div>
        ) : null}
        {order.customer?.address && (
          <div className="col-span-2 flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#A8907A]" />
            <div>
              <p className="text-[#A8907A]">Ship to</p>
              <p className="font-semibold text-[#2A1A10]">
                {order.customer.address}{order.customer.apartment ? `, ${order.customer.apartment}` : ''}, {order.customer.city}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer links */}
      <div className="flex border-t border-[#F1E7D8]">
        <Link
          to={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`}
          onClick={onClose}
          className="flex flex-1 items-center justify-center gap-1 py-2.5 text-[12px] font-semibold text-[#8A5A2B] hover:bg-[#FBF4E8] transition-colors"
        >
          Full Tracking <ArrowUpRight className="h-3 w-3" />
        </Link>
        <div className="w-px bg-[#F1E7D8]" />
        <button
          onClick={onNeedHelp}
          className="flex flex-1 items-center justify-center gap-1 py-2.5 text-[12px] font-semibold text-[#3B2618] hover:bg-[#FBF4E8] transition-colors"
        >
          Need more help? <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

/* ── Main Widget ─────────────────────────────────────────────────── */
export const ChatWidget: React.FC<{ products: Product[] }> = ({ products }) => {
  const waNumber = useStoreWhatsAppNumber();
  const { formatPrice } = useCurrency();
  const { pathname } = useLocation();
  const hideOnPhone = /^\/(product|cart|checkout)/.test(pathname);

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ViewMsg[]>([WELCOME]);
  const [convo, setConvo] = useState<LiveConversation | null>(null);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [askName, setAskName] = useState(false);
  const [who, setWho] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NAME_KEY) || '{}') as { name?: string; phone?: string }; }
    catch { return {}; }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [trackId, setTrackId] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    return bindScrollContain(dialogRef.current);
  }, [open]);

  const live = convo?.mode === 'live';
  const unread = convo?.unreadCustomer || 0;

  const openWhatsApp = (text = "Hi QADAM! I have a question about your shoes.") =>
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');

  const mergeServer = useCallback((c: LiveConversation) => {
    setConvo(c);
    setMsgs(prev => {
      const localByText = new Map(prev.filter(m => m.extra).map(m => [`${m.from}|${m.text}`, m.extra]));
      return [WELCOME, ...c.messages.map(m => ({ ...fromServer(m), extra: localByText.get(`${m.from}|${m.text}`) }))];
    });
  }, []);

  useEffect(() => {
    if (savedChat()) chatApi.get().then(c => { if (c) mergeServer(c); }).catch(() => {});
  }, [mergeServer]);

  useEffect(() => {
    if (!convo) return;
    const ms = open && live ? 3500 : 20000;
    const t = setInterval(async () => {
      try {
        const c = await chatApi.get();
        if (!c) return;
        if (c.messages.length !== convo.messages.length || c.unreadCustomer !== convo.unreadCustomer || c.mode !== convo.mode)
          mergeServer(c);
        if (open && c.unreadCustomer) chatApi.markRead();
      } catch { /* offline */ }
    }, ms);
    return () => clearInterval(t);
  }, [convo, open, live, mergeServer]);

  useEffect(() => {
    const show = setTimeout(() => setShowHint(true), 5000);
    const hide = setTimeout(() => setShowHint(false), 13000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [msgs.length, typing, askName, open]);

  const openPanel = () => {
    setOpen(true);
    setShowHint(false);
    if (unread) { chatApi.markRead(); setConvo(c => (c ? { ...c, unreadCustomer: 0 } : c)); }
  };

  const persist = async (text: string, botReply?: string) => {
    try {
      if (!convo && !savedChat()) {
        const c = await chatApi.start({
          transcript: [{ from: 'customer', text }, ...(botReply ? [{ from: 'bot' as const, text: botReply }] : [])],
          name: who.name, phone: who.phone,
        });
        setConvo(c);
      } else {
        const c = await chatApi.send(text, botReply);
        setConvo(c);
      }
    } catch (err: any) {
      if (err?.status === 404) { forgetChat(); setConvo(null); }
    }
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setInput('');
    setError('');
    setMsgs(m => [...m, { key: k(), from: 'customer', text, at: new Date().toISOString() }]);

    if (live) {
      const detected = botAnswer(text, products).orderNumber;
      let order: (Order & { limited?: boolean }) | null = null;
      if (detected) {
        setLookingUp(true);
        try {
          order = await api.getOrderByNumber(detected);
        } catch { /* team can still assist */ }
        finally { setLookingUp(false); }
      }
      if (order) {
        setMsgs(m => m.map((item, idx) => idx === m.length - 1 ? { ...item, extra: { order } } : item));
      }
      try { mergeServer(await chatApi.send(text)); }
      catch { setError('Message not sent. Check your connection.'); }
      return;
    }

    setTyping(true);
    const reply = botAnswer(text, products);
    let order: (Order & { limited?: boolean }) | null = null;
    let orderError = '';
    let replyText = reply.text;

    if (reply.orderNumber) {
      setLookingUp(true);
      setTyping(false);
      try {
        order = await api.getOrderByNumber(reply.orderNumber);
        const st = STATUS[order.orderStatus]?.label || order.orderStatus;
        replyText = `Here are the details for order ${order.orderNumber} — status is ${st}. You can see the full breakdown below.`;
      } catch (e: any) {
        orderError = e?.message || 'Order not found';
        replyText = `I couldn't find order ${reply.orderNumber}. Please double-check the number, or our team can help you right here in this chat.`;
      } finally {
        setLookingUp(false);
      }
    } else {
      await new Promise(r => setTimeout(r, 500 + Math.min(700, text.length * 12)));
    }

    setTyping(false);
    setMsgs(m => [...m, {
      key: k(), from: 'bot', text: replyText, at: new Date().toISOString(),
      extra: {
        ...reply, order, orderError,
        actions: orderError
          ? [
              { kind: 'live' as const, label: '💬 Chat with our team' },
              { kind: 'whatsapp' as const, label: 'WhatsApp us' },
            ]
          : reply.actions,
      },
    }]);
    persist(text, replyText);
  };

  const requestLive = () => {
    setError('');
    if (live) return;
    if (who.name) return connectLive(who.name, who.phone || '');
    setAskName(true);
  };

  const connectLive = async (name: string, phone: string) => {
    setBusy(true);
    try {
      const me = { name, phone };
      setWho(me);
      try { localStorage.setItem(NAME_KEY, JSON.stringify(me)); } catch { /* ignore */ }
      if (!savedChat()) {
        const transcript = msgs
          .filter(m => m.key !== 'welcome' && (m.from === 'customer' || m.from === 'bot'))
          .map(m => ({ from: m.from as 'customer' | 'bot', text: m.text }));
        if (!transcript.length) transcript.push({ from: 'customer', text: 'I would like to talk to the team.' });
        mergeServer(await chatApi.start({ transcript, mode: 'live', name, phone }));
      } else {
        mergeServer(await chatApi.goLive(name, phone));
      }
      setAskName(false);
    } catch (err: any) {
      setError(err.message || 'Could not connect. Please try WhatsApp.');
    } finally { setBusy(false); }
  };

  const runAction = (a: BotAction) => {
    if (a.kind === 'live') requestLive();
    else if (a.kind === 'whatsapp') openWhatsApp((a as any).text);
    else setOpen(false);
  };

  const lastBotKey = [...msgs].reverse().find(m => m.from === 'bot')?.key;

  return (
    <div className={'fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 max-sm:bottom-20 max-sm:right-3' + (hideOnPhone && !open ? ' max-sm:hidden' : '')}>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-[min(640px,calc(100dvh-7rem))] w-[calc(100vw-1.5rem)] max-w-[390px] origin-bottom-right flex-col overflow-hidden overscroll-contain rounded-3xl bg-white shadow-2xl shadow-[#3B2618]/25 ring-1 ring-[#EDE1CF]"
            role="dialog"
            aria-label="Chat with QADAM"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#EDE1CF] bg-gradient-to-br from-white via-[#FDF9F3] to-[#F6EBDA] px-4 py-3.5">
              <div className="relative">
                <img src="/icons/icon-192.png" alt="QADAM" className="h-10 w-10 rounded-full object-cover ring-2 ring-[#E5B56D]/60" />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-base font-semibold text-[#2A1A10]">
                  {live ? 'QADAM Team' : 'QADAM Assistant'}
                </p>
                <p className="truncate text-[11px] text-[#8A6A52]">
                  {live ? '🟢 Live — we reply within minutes' : 'Instant answers · type order no. for details'}
                </p>
              </div>
              <button onClick={() => openWhatsApp()} aria-label="Open WhatsApp"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm hover:bg-[#1fb857]">
                <WhatsAppIcon className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} aria-label="Close chat"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#EDE1CF] bg-white text-[#8A6A52] hover:text-[#2A1A10]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live-mode banner */}
            <AnimatePresence>
              {live && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 text-[11.5px] font-medium text-emerald-800">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>You're chatting live with the QADAM team. All previous messages are visible to them.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Order lookup loading state */}
            <AnimatePresence>
              {lookingUp && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex items-center gap-2 bg-[#FBF4E8] px-4 py-2 text-[11.5px] font-medium text-[#8A5A2B]">
                    <Zap className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                    <span>Looking up your order…</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Thread */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#FBF7F1] px-4 py-4">
              {msgs.map(m => {
                if (m.from === 'system') {
                  return (
                    <p key={m.key} className="mx-auto w-fit max-w-[90%] rounded-full bg-emerald-100/80 px-3 py-1 text-center text-[11px] font-medium text-emerald-800">
                      {m.text}
                    </p>
                  );
                }
                const mine = m.from === 'customer';
                const x = m.extra;
                return (
                  <div key={m.key}>
                    <div className={mine ? 'flex justify-end' : 'flex items-end gap-2'}>
                      {!mine && (
                        m.from === 'admin'
                          ? <img src="/icons/icon-192.png" alt="QADAM" className="h-6 w-6 shrink-0 rounded-full" />
                          : <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F6EFE4] text-[11px]">🤖</span>
                      )}
                      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug ${
                        mine
                          ? 'rounded-br-sm bg-gradient-to-br from-[#3B2618] to-[#5A3A24] text-white'
                          : m.from === 'admin'
                            ? 'rounded-bl-sm bg-white text-[#2A1A10] shadow-sm ring-2 ring-[#E5B56D]/50'
                            : 'rounded-bl-sm bg-white text-[#3B2618] shadow-sm ring-1 ring-[#EDE1CF]'
                      }`}>
                        {m.from === 'admin' && (
                          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#A8824C]">QADAM Team</p>
                        )}
                        <p className="whitespace-pre-line break-words">{m.text}</p>
                        {m.at && (
                          <p className={`mt-0.5 text-right text-[9.5px] ${mine ? 'text-white/60' : 'text-[#A8907A]'}`}>{timeOf(m.at)}</p>
                        )}
                      </div>
                    </div>

                    {/* Rich order card */}
                    {x?.order && (
                      <OrderCard order={x.order} formatPrice={formatPrice} onClose={() => setOpen(false)} onNeedHelp={requestLive} />
                    )}

                    {/* Order error note */}
                    {x?.orderError && (
                      <div className="ml-8 mt-1.5 rounded-xl bg-red-50 px-3 py-2 text-[11.5px] text-red-700 ring-1 ring-red-100">
                        ⚠️ {x.orderError}
                      </div>
                    )}

                    {/* Product cards */}
                    {x?.products && x.products.length > 0 && (
                      <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 pl-12">
                        {x.products.map(p => (
                          <Link key={p.id} to={`/product/${p.slug}`} onClick={() => setOpen(false)}
                            className="w-36 shrink-0 overflow-hidden rounded-2xl border border-[#EDE1CF] bg-white transition hover:border-[#C9A46A]">
                            <div className="h-24 bg-[#F6EFE4]">
                              <img src={imgUrl(p.images[0], 240)} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                            </div>
                            <div className="p-2">
                              <p className="line-clamp-2 text-[11.5px] font-medium leading-tight text-[#2A1A10]">{p.name}</p>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-[11.5px] font-bold text-[#8A5A2B]">{formatPrice(p.salePrice || p.price)}</span>
                                {p.rating ? <span className="flex items-center gap-0.5 text-[10px] text-[#8A6A52]"><Star className="h-2.5 w-2.5 fill-[#E5A93C] text-[#E5A93C]" />{p.rating}</span> : null}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    {x?.actions && x.actions.length > 0 && !live && (
                      <div className="ml-8 mt-2 flex flex-wrap gap-1.5">
                        {x.actions.map(a => a.kind === 'link' ? (
                          <Link key={a.label} to={a.to} onClick={() => runAction(a)}
                            className="inline-flex items-center gap-1 rounded-full bg-[#3B2618] px-3 py-1.5 text-[12px] font-medium text-[#F3D9A4] transition hover:bg-[#5A3A24]">
                            {a.label} <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        ) : (
                          <button key={a.label} onClick={() => runAction(a)}
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                              a.kind === 'whatsapp'
                                ? 'bg-[#25D366] text-white hover:bg-[#1fb857]'
                                : 'bg-gradient-to-r from-[#E5B56D] to-[#C9A46A] text-[#2A1A10] hover:opacity-90'
                            }`}>
                            {a.kind === 'whatsapp' && <WhatsAppIcon className="h-3.5 w-3.5" />}
                            {a.kind === 'live' && <Headset className="h-3.5 w-3.5" />}
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Topic chips */}
                    {x?.chips && m.key === lastBotKey && !typing && !live && (
                      <div className="ml-8 mt-2 flex flex-wrap gap-1.5">
                        {x.chips.map(c => (
                          <button key={c} onClick={() => send(chipToQuestion(c))}
                            className="rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-[#3B2618] ring-1 ring-[#E5D3B5] transition hover:bg-[#3B2618] hover:text-[#F3D9A4]">
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {typing && (
                <div className="flex items-end gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F6EFE4] text-[11px]">🤖</span>
                  <div className="inline-flex gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-[#EDE1CF]">
                    {[0, 1, 2].map(d => (
                      <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-[#A8824C]"
                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.15 }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Inline connect-to-team form */}
              {askName && !live && (
                <motion.form
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={e => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    connectLive(String(f.get('name') || '').trim(), String(f.get('phone') || '').trim());
                  }}
                  className="ml-8 space-y-2 rounded-2xl bg-white p-3.5 shadow-sm ring-2 ring-[#E5B56D]/50"
                >
                  <p className="text-[12.5px] font-semibold text-[#2A1A10]">👤 Connect to our team</p>
                  <p className="text-[11.5px] text-[#8A6A52]">Your full chat history (including any order details) will be shared with our team.</p>
                  <input name="name" required maxLength={60} autoFocus placeholder="Your name *" defaultValue={who.name}
                    className="w-full rounded-xl border border-[#E5D3B5] px-3 py-2 text-[13px] focus:border-[#C9A46A] focus:outline-none" />
                  <input name="phone" type="tel" maxLength={30} placeholder="Phone / WhatsApp (optional)" defaultValue={who.phone}
                    className="w-full rounded-xl border border-[#E5D3B5] px-3 py-2 text-[13px] focus:border-[#C9A46A] focus:outline-none" />
                  <div className="flex gap-2">
                    <button disabled={busy}
                      className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#3B2618] to-[#5A3A24] text-[12.5px] font-semibold text-white disabled:opacity-60">
                      <Headset className="h-3.5 w-3.5" /> {busy ? 'Connecting…' : 'Connect me now'}
                    </button>
                    <button type="button" onClick={() => setAskName(false)}
                      className="h-9 rounded-full px-3 text-[12.5px] text-[#8A6A52] hover:bg-[#FBF4E8]">
                      Cancel
                    </button>
                  </div>
                </motion.form>
              )}

              {error && <p className="text-center text-[12px] text-red-600">{error}</p>}
            </div>

            {/* Talk-to-person bar (bot mode only) */}
            {!live && !askName && (
              <div className="flex items-center gap-2 border-t border-[#EDE1CF] bg-[#FDFAF5] px-3 py-2">
                <button onClick={requestLive}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-1.5 text-[12px] font-semibold text-[#3B2618] ring-1 ring-[#E5D3B5] transition hover:bg-[#3B2618] hover:text-[#F3D9A4]">
                  <Headset className="h-3.5 w-3.5" /> Talk to a person
                </button>
                <button onClick={() => openWhatsApp()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-1.5 text-[12px] font-semibold text-[#128C7E] ring-1 ring-emerald-200 transition hover:bg-emerald-50">
                  <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
                </button>
              </div>
            )}

            {/* Track order by ID */}
            {!live && (
              <form
                onSubmit={e => { e.preventDefault(); const id = trackId.trim(); if (id && !lookingUp) { send(id); setTrackId(''); } }}
                className="flex items-center gap-2 border-t border-[#EDE1CF] bg-[#FBF6EE] px-3 py-2"
              >
                <Package className="h-4 w-4 shrink-0 text-[#8A5A2B]" />
                <input
                  value={trackId}
                  onChange={e => setTrackId(e.target.value.toUpperCase())}
                  maxLength={30}
                  placeholder="Order ID (e.g. QDM-89214)"
                  aria-label="Order ID"
                  className="min-w-0 flex-1 rounded-full bg-white px-3 py-1.5 text-[12px] text-[#2A1A10] ring-1 ring-[#E8D9C8] placeholder:text-[#A8907A] outline-none focus:ring-2 focus:ring-[#C9A46A]/60"
                />
                <button type="submit" disabled={!trackId.trim() || lookingUp}
                  className="shrink-0 rounded-full bg-[#3B2618] px-3 py-1.5 text-[12px] font-semibold text-[#F3D9A4] transition hover:opacity-95 disabled:opacity-50">
                  Track Order
                </button>
              </form>
            )}

            {/* Input box */}
            <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-[#EDE1CF] bg-white p-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                maxLength={1000}
                placeholder={live ? 'Message our team…' : 'Ask anything or type your order number…'}
                aria-label="Type your message"
                className="min-w-0 flex-1 rounded-full bg-[#F6EFE4] px-4 py-2.5 text-[13px] text-[#2A1A10] placeholder:text-[#A8907A] outline-none focus:ring-2 focus:ring-[#C9A46A]/60"
              />
              <button type="submit" aria-label="Send" disabled={!input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3B2618] to-[#5A3A24] text-[#F3D9A4] shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint bubble */}
      <AnimatePresence>
        {showHint && !open && (
          <motion.button
            onClick={openPanel}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="rounded-2xl rounded-br-sm bg-white px-4 py-2.5 text-[13px] font-medium text-[#3B2618] shadow-lg ring-1 ring-[#EDE1CF]"
          >
            Need help? Chat with us 👋
          </motion.button>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label={open ? 'Close chat' : 'Open chat'}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex h-14 items-center gap-2 rounded-full bg-gradient-to-br from-[#3B2618] to-[#5A3A24] pl-4 pr-4 text-[#F3D9A4] shadow-lg shadow-[#3B2618]/30 ring-2 ring-[#E5B56D]/50 sm:pr-5"
      >
        {!open && <span className="absolute inset-0 animate-ping rounded-full bg-[#C9A46A] opacity-20" />}
        {open ? <X className="relative h-6 w-6" /> : <MessageCircle className="relative h-6 w-6" />}
        <span className="relative hidden text-sm font-semibold sm:inline">{open ? 'Close' : 'Chat with us'}</span>
        {unread > 0 && !open && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {unread}
          </span>
        )}
      </motion.button>
    </div>
  );
};
