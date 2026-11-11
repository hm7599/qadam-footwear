import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Headset, Send, ArrowLeft, Phone, CheckCircle2, RotateCcw, Trash2,
  MessageCircle, Search, Package, Truck, Clock, XCircle, MapPin,
  ChevronDown, ChevronUp, X, Sparkles, Plus, Bookmark, PanelRightClose,
  PanelRightOpen, Bot,
} from 'lucide-react';
import { chatApi, AdminChatSummary, AdminConversation } from '../../utils/chatApi';
import { api } from '../../utils/api';
import { AdminAssistant } from './AdminAssistant';
import { Order } from '../../types';

const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const timeOf = (iso: string) =>
  new Date(iso).toLocaleString([], { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' });

const waLink = (phone: string) => {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('0')) d = '92' + d.slice(1);
  return `https://wa.me/${d}`;
};

const fmtPKR = (n: number) =>
  'PKR ' + n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const STATUS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending:    { label: 'Pending',    icon: Clock,        color: 'text-amber-700 bg-amber-50 ring-amber-200' },
  processing: { label: 'Processing', icon: Package,      color: 'text-sky-700 bg-sky-50 ring-sky-200' },
  shipped:    { label: 'Shipped',    icon: Truck,        color: 'text-indigo-700 bg-indigo-50 ring-indigo-200' },
  delivered:  { label: 'Delivered',  icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
  cancelled:  { label: 'Cancelled',  icon: XCircle,      color: 'text-red-700 bg-red-50 ring-red-200' },
};

const ORDER_RE = /\b(QDM|AURA)[\s-]?\d{3,}\b/gi;

function extractOrderNumbers(messages: { text: string }[]): string[] {
  const nums = new Set<string>();
  messages.forEach(m => {
    const matches = m.text.matchAll(ORDER_RE);
    for (const match of matches) {
      nums.add(match[0].toUpperCase().replace(/^(QDM|AURA)[\s-]*(\d)/, '$1-$2'));
    }
  });
  return [...nums];
}

export interface ChatTemplate {
  id: string;
  category: 'Greetings' | 'Orders' | 'Sizes' | 'Delivery' | 'Payment' | 'Closing' | 'Custom';
  title: string;
  text: string;
  isCustom?: boolean;
}

const CUSTOM_TPL_KEY = 'aura_chat_custom_templates';

const DEFAULT_TEMPLATES: ChatTemplate[] = [
  {
    id: 'g1',
    category: 'Greetings',
    title: 'Warm Welcome',
    text: 'Assalam o Alaikum {name}! Welcome to QADAM. How may I assist you with your handcrafted footwear today?',
  },
  {
    id: 'g2',
    category: 'Greetings',
    title: 'Urdu Salam',
    text: 'Assalam o Alaikum {name}! Ji bilkul, batayein main aap ki kya madad kar sakta hoon?',
  },
  {
    id: 'o1',
    category: 'Orders',
    title: 'Ask Order Number',
    text: 'Could you please share your Order Number (e.g. QDM-89214) so I can check its live dispatch status right away?',
  },
  {
    id: 'o2',
    category: 'Orders',
    title: 'Order Preparing',
    text: 'Aap ka order confirm ho chuka hai {name} aur hamare artisans isay prepare kar rahe hain. Jald hi aap ko courier tracking number send kar diya jaye ga.',
  },
  {
    id: 'o3',
    category: 'Orders',
    title: 'Parcel Dispatched',
    text: 'Good news {name}! Aap ka parcel courier (TCS / Leopards) ke hawale kar diya gaya hai. Delivery 2–4 working days mein aap ke doorstep par ho jaye gi.',
  },
  {
    id: 's1',
    category: 'Sizes',
    title: 'UK Size Guide',
    text: 'Our shoes fit true to standard UK sizes. Please select your regular formal shoe size. Feel free to share your usual UK size or foot length in cm for an exact recommendation.',
  },
  {
    id: 's2',
    category: 'Sizes',
    title: 'Free Size Exchange',
    text: 'Agar size ka koi bhi issue aye to bilkul pareshan na hon {name} — QADAM offers a free doorstep size exchange across Pakistan!',
  },
  {
    id: 'p1',
    category: 'Payment',
    title: 'Cash on Delivery (COD)',
    text: 'Yes! We offer 100% Cash on Delivery (COD) all over Pakistan with zero advance payment required. You pay the rider when your parcel arrives.',
  },
  {
    id: 'd1',
    category: 'Delivery',
    title: 'Online Store & Shipping',
    text: 'QADAM is a 100% Online Footwear Store. We deliver nationwide across Pakistan within 2–4 working days via express courier.',
  },
  {
    id: 'c1',
    category: 'Closing',
    title: 'Thank You',
    text: 'Thank you for choosing QADAM, {name}! If you need anything else, just message us here anytime. 🙏',
  },
];

function loadCustomTemplates(): ChatTemplate[] {
  try {
    const raw = JSON.parse(localStorage.getItem(CUSTOM_TPL_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveCustomTemplates(list: ChatTemplate[]) {
  try {
    localStorage.setItem(CUSTOM_TPL_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

function formatTemplateText(raw: string, customerName?: string): string {
  const trimmed = (customerName || '').trim();
  const isGeneric = !trimmed || /^(website visitor|visitor|guest)$/i.test(trimmed);
  const first = isGeneric ? '' : trimmed.split(/\s+/)[0];
  return raw
    .replace(/\s*\{name\}/g, first ? ` ${first}` : '')
    .replace(/,\s*!/g, '!')
    .replace(/\s+,/g, ',')
    .trim();
}

/* ── Inline Order Info Panel ──────────────────────────────────────── */
const OrderInfoPanel: React.FC<{ orderNumbers: string[] }> = ({ orderNumbers }) => {
  const [orders, setOrders] = useState<Record<string, Order | 'loading' | 'error'>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!orderNumbers.length) return;
    setOrders(prev => {
      const next = { ...prev };
      orderNumbers.forEach(n => { if (!next[n]) next[n] = 'loading'; });
      return next;
    });
    orderNumbers.forEach(async num => {
      if (orders[num] && orders[num] !== 'loading') return;
      try {
        const order = await api.getOrderByNumber(num);
        setOrders(prev => ({ ...prev, [num]: order }));
        setExpanded(prev => ({ ...prev, [num]: true }));
      } catch {
        setOrders(prev => ({ ...prev, [num]: 'error' }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(orderNumbers)]);

  if (!orderNumbers.length) return null;

  return (
    <div className="border-t border-[#F1E6D8] bg-[#FDFAF5]">
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
        <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#9A6440]">
          <Package className="h-3.5 w-3.5" /> Order Mentioned in Chat
        </p>
      </div>
      <div className="space-y-1.5 px-3 pb-2.5">
        {orderNumbers.map(num => {
          const o = orders[num];
          const isOpen = expanded[num];
          if (o === 'loading') {
            return (
              <div key={num} className="rounded-xl bg-white px-3 py-2 ring-1 ring-[#E8D9C8] text-[11.5px] text-[#8A6A52] animate-pulse">
                Loading order {num}…
              </div>
            );
          }
          if (o === 'error' || !o) {
            return (
              <div key={num} className="rounded-xl bg-red-50 px-3 py-1.5 text-[11.5px] text-red-600 ring-1 ring-red-100">
                ⚠️ Order {num} not found
              </div>
            );
          }
          const st = STATUS[o.orderStatus] || STATUS.pending;
          const StIcon = st.icon;
          return (
            <div key={num} className="overflow-hidden rounded-xl bg-white ring-1 ring-[#E8D9C8] shadow-sm">
              <button
                type="button"
                onClick={() => setExpanded(prev => ({ ...prev, [num]: !prev[num] }))}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#FBF4E8] transition-colors cursor-pointer"
              >
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ${st.color}`}>
                  <StIcon className="h-3 w-3" /> {st.label}
                </span>
                <span className="flex-1 font-bold text-xs text-[#2E1D12]">{o.orderNumber}</span>
                <span className="text-[11px] font-semibold text-[#8A5A2B]">{fmtPKR(o.totalAmount)}</span>
                {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-[#A8907A]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#A8907A]" />}
              </button>

              {isOpen && (
                <div className="border-t border-[#F1E6D8] px-3 pb-2.5 pt-2 space-y-2 text-[11px]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-[#2E1D12]">{o.customer?.name}</span>
                      {o.customer?.phone && (
                        <a href={waLink(o.customer.phone)} target="_blank" rel="noreferrer"
                          className="ml-2 text-emerald-700 hover:underline font-medium">
                          {o.customer.phone}
                        </a>
                      )}
                    </div>
                    <span className="text-[#8A6A52] capitalize">
                      {o.paymentMethod === 'cod' ? 'Cash on Delivery' : (o.paymentMethod || '').replace('_', ' ')}
                    </span>
                  </div>

                  {o.customer?.address && (
                    <div className="flex items-start gap-1 text-[#3B2618]">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#A8907A]" />
                      <p>
                        {o.customer.address}{o.customer.apartment ? `, ${o.customer.apartment}` : ''}, {o.customer.city}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1 rounded-lg bg-[#FBF7F1] p-2">
                    {(o.items || []).slice(0, 3).map((it, i) => (
                      <div key={i} className="flex justify-between gap-2 text-[#3B2618]">
                        <span className="truncate">{it.name} {it.color ? `(${it.color})` : ''} · Sz {it.size} ×{it.quantity}</span>
                        <span className="shrink-0 font-semibold">{fmtPKR((it.price || 0) * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Main Reusable Live Chat Panel ────────────────────────────────── */
export interface LiveChatPanelProps {
  initialChatId?: string;
  onSelectChatId?: (id: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const LiveChatPanel: React.FC<LiveChatPanelProps> = ({
  initialChatId = '',
  onSelectChatId,
  onClose,
  isModal = false,
}) => {
  const [list, setList] = useState<AdminChatSummary[]>([]);
  const [activeId, setActiveId] = useState<string>(initialChatId);
  const [convo, setConvo] = useState<AdminConversation | null>(null);
  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [q, setQ] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Templates Panel state (visible by default on desktop so templates are right there!)
  const [showTemplates, setShowTemplates] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [customTemplates, setCustomTemplates] = useState<ChatTemplate[]>(loadCustomTemplates);
  const [templateCategory, setTemplateCategory] = useState<string>('All');
  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [rightTab, setRightTab] = useState<'templates' | 'assistant'>('templates');
  const [addingTpl, setAddingTpl] = useState(false);
  const [newTplTitle, setNewTplTitle] = useState('');
  const [newTplText, setNewTplText] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastCount = useRef(0);

  useEffect(() => {
    if (initialChatId) setActiveId(initialChatId);
  }, [initialChatId]);

  const selectChat = (id: string) => {
    setActiveId(id);
    onSelectChatId?.(id);
  };

  const loadList = useCallback(() => {
    chatApi.adminList()
      .then(d => {
        setList(d.conversations);
        if (!activeId && d.conversations.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
          const firstOpen = d.conversations.find(c => c.status === 'open') || d.conversations[0];
          setActiveId(firstOpen.id);
        }
      })
      .catch(e => setError(e.message));
  }, [activeId]);

  const loadConvo = useCallback(() => {
    if (!activeId) return;
    chatApi.adminGet(activeId).then(setConvo).catch(() => setConvo(null));
  }, [activeId]);

  useEffect(() => {
    loadList();
    const t = setInterval(loadList, 4000);
    return () => clearInterval(t);
  }, [loadList]);

  useEffect(() => {
    if (!activeId) {
      setConvo(null);
      return;
    }
    loadConvo();
    const t = setInterval(loadConvo, 3000);
    return () => clearInterval(t);
  }, [activeId, loadConvo]);

  useEffect(() => {
    const n = convo?.messages.length || 0;
    if (n !== lastCount.current) {
      lastCount.current = n;
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [convo?.messages.length]);

  const send = async (e?: React.FormEvent, preset?: string) => {
    e?.preventDefault();
    const t = (preset ?? text).trim();
    if (!t || !convo) return;
    setSending(true);
    try {
      setConvo(await chatApi.adminSend(convo.id, t));
      if (!preset) setText('');
      loadList();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const insertTemplate = (tmpl: ChatTemplate) => {
    const formatted = formatTemplateText(tmpl.text, convo?.name);
    setText(formatted);
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  const sendTemplateNow = (tmpl: ChatTemplate) => {
    const formatted = formatTemplateText(tmpl.text, convo?.name);
    send(undefined, formatted);
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplTitle.trim() || !newTplText.trim()) return;
    const item: ChatTemplate = {
      id: `custom-${Date.now()}`,
      category: 'Custom',
      title: newTplTitle.trim(),
      text: newTplText.trim(),
      isCustom: true,
    };
    const next = [item, ...customTemplates];
    setCustomTemplates(next);
    saveCustomTemplates(next);
    setNewTplTitle('');
    setNewTplText('');
    setAddingTpl(false);
    setTemplateCategory('All');
  };

  const deleteCustomTemplate = (id: string) => {
    const next = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(next);
    saveCustomTemplates(next);
  };

  const setStatus = async (status: 'open' | 'closed') => {
    if (!convo) return;
    setConvo(await chatApi.adminStatus(convo.id, status));
    loadList();
  };

  const remove = async () => {
    if (!convo || !confirm(`Delete the chat with ${convo.name}? This cannot be undone.`)) return;
    await chatApi.adminDelete(convo.id);
    selectChat('');
    loadList();
  };

  const shown = list
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c => !q || `${c.name} ${c.phone} ${c.last?.text || ''}`.toLowerCase().includes(q.toLowerCase()));
  const openCount = list.filter(c => c.status === 'open').length;
  const mentionedOrderNums = convo ? extractOrderNumbers(convo.messages) : [];

  const allTemplates = [...customTemplates, ...DEFAULT_TEMPLATES];
  const categories = ['All', ...(customTemplates.length ? ['Custom'] : []), 'Greetings', 'Orders', 'Sizes', 'Delivery', 'Payment', 'Closing'];
  const filteredTemplates = allTemplates.filter(t => {
    const catMatch = templateCategory === 'All' || t.category === templateCategory;
    const qMatch = !templateSearch.trim() ||
      t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.text.toLowerCase().includes(templateSearch.toLowerCase());
    return catMatch && qMatch;
  });

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* ── Top Header Bar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#E8D9C8] bg-gradient-to-r from-[#F6E7D8] via-[#FDF8F3] to-[#EBD3BC] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B2618] to-[#5A3A24] text-[#F3D9A4] shadow-sm">
            <Headset className="h-4.5 w-4.5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#2E1D12]">Live Chat & Templates</h2>
              {openCount > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800 ring-1 ring-emerald-500/30">
                  {openCount} Open
                </span>
              )}
            </div>
            <p className="hidden text-[11.5px] text-[#8A6A52] sm:block">
              Chat with customers & send instant templated responses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTemplates(s => !s)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              showTemplates
                ? 'bg-[#3B2618] text-[#F3D9A4] shadow-sm'
                : 'bg-white/90 text-[#3B2618] ring-1 ring-[#D9C3A5] hover:bg-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#C9A46A]" />
            <span>Templates</span>
            {showTemplates ? <PanelRightClose className="h-3.5 w-3.5 opacity-80" /> : <PanelRightOpen className="h-3.5 w-3.5 opacity-80" />}
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Live Chat"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#6B4C36] ring-1 ring-[#D9C3A5] hover:bg-white hover:text-black transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-1.5 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold">×</button>
        </div>
      )}

      {/* ── Main Content Split Grid ── */}
      <div className={`grid min-h-0 flex-1 grid-cols-1 overflow-hidden ${
        showTemplates ? 'md:grid-cols-[260px_1fr_300px] lg:grid-cols-[275px_1fr_320px]' : 'md:grid-cols-[280px_1fr]'
      }`}>

        {/* ── 1. Left Column: Conversations List ── */}
        <aside className={`${activeId ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-r border-[#F1E6D8] bg-[#FDFAF5]`}>
          <div className="space-y-2 border-b border-[#F1E6D8] p-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#B8A28C]" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search customer or message…"
                className="w-full rounded-xl border border-[#E8D9C8] bg-white py-1.5 pl-8 pr-2.5 text-xs focus:border-[#C9A46A] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-white p-1 text-[11px] font-semibold ring-1 ring-[#E8D9C8]">
              {(['open', 'closed', 'all'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-lg py-1 capitalize transition-colors cursor-pointer ${
                    filter === f ? 'bg-[#3B2618] text-white' : 'text-[#6E5442] hover:bg-[#FBF7F1]'
                  }`}
                >
                  {f}{f === 'open' && openCount ? ` (${openCount})` : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {shown.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-xs text-[#8A6A52]">
                <MessageCircle className="mb-2 h-7 w-7 text-[#D9C3A5]" />
                No chats here yet.
              </div>
            ) : (
              shown.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectChat(c.id)}
                  className={`flex w-full items-start gap-2.5 border-b border-[#F7EFE4] px-3 py-2.5 text-left transition cursor-pointer ${
                    c.id === activeId ? 'bg-white shadow-sm ring-1 ring-inset ring-[#E8D9C8]' : 'hover:bg-white/60'
                  }`}
                >
                  <div className="relative shrink-0">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#3B2618] to-[#5A3A24] font-serif text-xs font-bold text-[#F3D9A4]">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    {c.mode === 'live' && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-1">
                      <span className={`truncate text-xs ${c.unreadAdmin ? 'font-bold text-[#2E1D12]' : 'font-semibold text-[#3B2618]'}`}>
                        {c.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-[#A8907A]">{ago(c.updatedAt)}</span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-1">
                      <span className={`truncate text-[11px] ${c.unreadAdmin ? 'font-medium text-[#3B2618]' : 'text-[#8A6A52]'}`}>
                        {c.last ? `${c.last.from === 'admin' ? 'You: ' : ''}${c.last.text}` : '—'}
                      </span>
                      {c.unreadAdmin > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                          {c.unreadAdmin}
                        </span>
                      )}
                      {c.status === 'closed' && (
                        <span className="shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.2 text-[9px] text-neutral-500">
                          Closed
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── 2. Center Column: Active Chat Thread ── */}
        <section className={`${activeId ? 'flex' : 'hidden md:flex'} min-h-0 flex-col bg-white relative`}>
          {!activeId ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-[#8A6A52]">
              <Headset className="mb-3 h-10 w-10 text-[#D9C3A5]" />
              <p className="font-semibold text-[#3B2618]">Select a customer chat</p>
              <p className="mt-1 max-w-xs text-xs">
                Pick a conversation on the left to view full history, check their orders, or send templated replies.
              </p>
            </div>
          ) : !convo ? (
            <div className="flex flex-1 items-center justify-center text-xs text-[#8A6A52]">
              Loading conversation…
            </div>
          ) : (
            <>
              {/* Active Chat Header */}
              <div className="flex items-center gap-2.5 border-b border-[#F1E6D8] px-3.5 py-2.5 bg-[#FDFAF5]">
                <button
                  type="button"
                  onClick={() => selectChat('')}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white md:hidden cursor-pointer"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="relative">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3B2618] font-serif text-xs font-bold text-[#F3D9A4]">
                    {convo.name.charAt(0).toUpperCase()}
                  </span>
                  {convo.mode === 'live' && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-sm text-[#2E1D12]">{convo.name}</p>
                    {convo.mode === 'live' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" /> Live
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-[#8A6A52]">
                    {convo.phone || 'No phone'} · started {timeOf(convo.createdAt)}
                    {convo.page ? ` · on ${convo.page}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {convo.phone && (
                    <a
                      href={waLink(convo.phone)}
                      target="_blank"
                      rel="noreferrer"
                      title="Open in WhatsApp"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {convo.status === 'open' ? (
                    <button
                      type="button"
                      onClick={() => setStatus('closed')}
                      className="flex h-8 items-center gap-1 rounded-full bg-white px-2.5 text-[11px] font-semibold text-[#3B2618] ring-1 ring-[#D9C3A5] hover:bg-[#FBF4E8] cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Solved</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStatus('open')}
                      className="flex h-8 items-center gap-1 rounded-full bg-white px-2.5 text-[11px] font-semibold text-[#3B2618] ring-1 ring-[#D9C3A5] hover:bg-[#FBF4E8] cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                      <span className="hidden sm:inline">Reopen</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={remove}
                    title="Delete chat"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#A8907A] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Messages Thread */}
              <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto overscroll-contain bg-[#FBF7F1] p-4">
                {convo.messages.map(m => (
                  m.from === 'system' ? (
                    <p key={m.id} className="mx-auto w-fit max-w-[90%] rounded-full bg-emerald-100/90 px-3 py-1 text-center text-[11px] font-medium text-emerald-800">
                      {m.text}
                    </p>
                  ) : (
                    <div key={m.id} className={m.from === 'admin' ? 'flex justify-end' : 'flex'}>
                      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                        m.from === 'admin'
                          ? 'rounded-br-sm bg-gradient-to-br from-[#3B2618] to-[#5A3A24] text-white shadow-sm'
                          : 'rounded-bl-sm bg-white text-[#2E1D12] shadow-sm ring-1 ring-[#EDE1CF]'
                      }`}>
                        {m.from === 'bot' && (
                          <p className="mb-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-[#A8824C]">QADAM Bot</p>
                        )}
                        <p className="whitespace-pre-line break-words">{m.text}</p>
                        <p className={`mt-0.5 text-right text-[9px] ${m.from === 'admin' ? 'text-white/60' : 'text-[#A8907A]'}`}>
                          {timeOf(m.at)}
                        </p>
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Auto-detected Order Details */}
              {mentionedOrderNums.length > 0 && (
                <OrderInfoPanel orderNumbers={mentionedOrderNums} />
              )}

              {/* Quick Chips Strip (Always handy even if templates panel is hidden on mobile) */}
              {!showTemplates && (
                <div className="flex items-center gap-1.5 overflow-x-auto border-t border-[#F1E6D8] bg-[#FDFAF5] px-3 py-1.5">
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#A8907A] flex items-center gap-1">
                    <Bookmark className="h-3 w-3" /> Quick:
                  </span>
                  {allTemplates.slice(0, 5).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => insertTemplate(t)}
                      className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#6E5442] ring-1 ring-[#E8D9C8] hover:bg-[#3B2618] hover:text-[#F3D9A4] transition-colors cursor-pointer"
                    >
                      {t.title}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowTemplates(true)}
                    className="shrink-0 rounded-full bg-[#F6EFE4] px-2.5 py-1 text-[11px] font-semibold text-[#8A5A2B] hover:bg-[#ECDDC9] cursor-pointer"
                  >
                    All templates…
                  </button>
                </div>
              )}

              {/* Input Box */}
              <form onSubmit={send} className="flex items-end gap-2 border-t border-[#F1E6D8] bg-white p-3">
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={2}
                  maxLength={1000}
                  placeholder="Type a reply or click a template on the right…"
                  className="min-h-[44px] flex-1 resize-y rounded-2xl border border-[#E8D9C8] px-3.5 py-2 text-xs focus:border-[#C9A46A] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  aria-label="Send reply"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3B2618] to-[#5A3A24] text-[#F3D9A4] shadow-sm hover:opacity-95 active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </section>

        {/* ── 3. Right Column: Ready-Made & Custom Templates Panel ── */}
        {showTemplates && (
          <aside className="flex min-h-0 flex-col border-l border-[#F1E6D8] bg-[#FDFAF5] max-md:absolute max-md:inset-0 max-md:z-30">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-[#F1E6D8] px-3.5 py-2.5 bg-white">
              <div className="flex items-center gap-1.5">
                {(['templates', 'assistant'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setRightTab(tab)}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                      rightTab === tab ? 'bg-[#3B2618] text-[#F3D9A4]' : 'text-[#6E5442] hover:bg-[#F6EFE4]'
                    }`}
                  >
                    {tab === 'templates' ? <Sparkles className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    {tab === 'templates' ? 'Templates' : 'Assistant'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {rightTab === 'templates' && <button
                  type="button"
                  onClick={() => setAddingTpl(a => !a)}
                  className="flex items-center gap-1 rounded-lg bg-[#F6EFE4] px-2 py-1 text-[11px] font-semibold text-[#8A5A2B] hover:bg-[#ECDDC9] transition-colors cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> {addingTpl ? 'Cancel' : 'New'}
                </button>}
                <button
                  type="button"
                  onClick={() => setShowTemplates(false)}
                  className="rounded-lg p-1 text-[#8A6A52] hover:bg-neutral-100 md:hidden cursor-pointer"
                  aria-label="Close templates"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {rightTab === 'assistant' ? (
              <AdminAssistant
                convo={convo}
                templates={allTemplates}
                format={raw => formatTemplateText(raw, convo?.name)}
                onInsert={t => { setText(t); setTimeout(() => inputRef.current?.focus(), 40); }}
                onSend={t => send(undefined, t)}
                sending={sending}
              />
            ) : (<>
            {/* Add custom template form */}
            {addingTpl && (
              <form onSubmit={handleAddTemplate} className="border-b border-[#F1E6D8] bg-white p-3 space-y-2">
                <p className="text-[11px] font-semibold text-[#3B2618]">Save a custom template</p>
                <input
                  value={newTplTitle}
                  onChange={e => setNewTplTitle(e.target.value)}
                  placeholder="Title (e.g. Weekend Discount)"
                  required
                  maxLength={50}
                  className="w-full rounded-lg border border-[#E8D9C8] px-2.5 py-1.5 text-xs focus:border-[#C9A46A] focus:outline-none"
                />
                <textarea
                  value={newTplText}
                  onChange={e => setNewTplText(e.target.value)}
                  placeholder="Message body… Tip: use {name} for customer's first name."
                  required
                  rows={3}
                  maxLength={600}
                  className="w-full rounded-lg border border-[#E8D9C8] px-2.5 py-1.5 text-xs focus:border-[#C9A46A] focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#3B2618] py-1.5 text-xs font-semibold text-[#F3D9A4] hover:opacity-95 cursor-pointer"
                >
                  Save Template
                </button>
              </form>
            )}

            {/* Search & Categories */}
            <div className="space-y-2 border-b border-[#F1E6D8] p-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#B8A28C]" />
                <input
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                  placeholder="Search templates…"
                  className="w-full rounded-lg border border-[#E8D9C8] bg-white py-1 pl-7 pr-2 text-[11.5px] focus:border-[#C9A46A] focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTemplateCategory(cat)}
                    className={`rounded-md px-2 py-0.5 text-[10.5px] font-medium transition-colors cursor-pointer ${
                      templateCategory === cat
                        ? 'bg-[#3B2618] text-white'
                        : 'bg-white text-[#6E5442] ring-1 ring-[#E8D9C8] hover:bg-[#F6EFE4]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Cards */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-2">
              {!convo && (
                <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800 ring-1 ring-amber-200">
                  Select a chat on the left to insert or send templates.
                </p>
              )}

              {filteredTemplates.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#8A6A52]">No templates match.</p>
              ) : (
                filteredTemplates.map(tmpl => (
                  <div
                    key={tmpl.id}
                    className="group rounded-xl border border-[#E8D9C8] bg-white p-2.5 shadow-2xs transition hover:border-[#C9A46A]"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate font-semibold text-xs text-[#2E1D12]">{tmpl.title}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="rounded bg-[#F6EFE4] px-1.5 py-0.5 text-[9px] font-medium text-[#8A6A52]">
                          {tmpl.category}
                        </span>
                        {tmpl.isCustom && (
                          <button
                            type="button"
                            onClick={() => deleteCustomTemplate(tmpl.id)}
                            title="Delete template"
                            className="text-[#A8907A] hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mt-1 text-[11px] text-[#6E5442] leading-relaxed">
                      {formatTemplateText(tmpl.text, convo?.name)}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={!convo}
                        onClick={() => insertTemplate(tmpl)}
                        className="flex-1 rounded-lg bg-[#F6EFE4] py-1 text-[11px] font-semibold text-[#3B2618] hover:bg-[#EADBC7] transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        Insert
                      </button>
                      <button
                        type="button"
                        disabled={!convo || sending}
                        onClick={() => sendTemplateNow(tmpl)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-[#3B2618] to-[#5A3A24] py-1 text-[11px] font-semibold text-[#F3D9A4] hover:opacity-95 transition-opacity disabled:opacity-40 cursor-pointer"
                      >
                        <Send className="h-2.5 w-2.5" /> Send
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            </>)}
          </aside>
        )}
      </div>
    </div>
  );
};
