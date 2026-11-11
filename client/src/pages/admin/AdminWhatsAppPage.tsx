import React, { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { api } from '../../utils/api';
import { useCurrency } from '../../context/CurrencyContext';
import { Order } from '../../types';
import {
  DEFAULT_WHATSAPP, PLACEHOLDERS, TEMPLATE_FOR_STATUS, WhatsAppSettings, WhatsAppTemplate,
  fillTemplate, normalizeWhatsApp, toWhatsAppNumber, whatsappLink,
} from '../../utils/whatsapp';
import { STATUS_LABEL } from '../../utils/orderStatus';
import { MessageCircle, Plus, Save, Send, Trash2, Copy, Check, Search, Settings2 } from 'lucide-react';
import { confirmDialog } from '../../components/common/Dialog';

const inputCls =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900';

export const AdminWhatsAppPage: React.FC = () => {
  const { formatPrice } = useCurrency();
  const [settings, setSettings] = useState<WhatsAppSettings>(DEFAULT_WHATSAPP);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'send' | 'templates'>('send');

  // Send panel
  const [orderQuery, setOrderQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [phone, setPhone] = useState('');
  const [templateId, setTemplateId] = useState('confirm');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Templates panel
  const [editId, setEditId] = useState<string>(DEFAULT_WHATSAPP.templates[0].id);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    api.getSetting('whatsapp').then(d => d && setSettings(normalizeWhatsApp(d))).catch(() => {});
    api.getOrders().then(setOrders).catch(() => {});
  }, []);

  const template = settings.templates.find(t => t.id === templateId) || settings.templates[0];

  // Rebuild the message whenever the order or template changes
  useEffect(() => {
    setMessage(fillTemplate(template?.body || '', order, formatPrice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, templateId, settings]);

  const pickOrder = (o: Order) => {
    setOrder(o);
    setPhone(o.customer.phone);
    setOrderQuery('');
    setTemplateId(TEMPLATE_FOR_STATUS[o.orderStatus] || 'confirm');
  };

  const matches = useMemo(() => {
    const q = orderQuery.trim().toLowerCase();
    if (!q) return [];
    return orders
      .filter(o => o.orderNumber.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q) || (o.customer.phone || '').includes(q))
      .slice(0, 6);
  }, [orderQuery, orders]);

  const pendingOrders = orders.filter(o => o.orderStatus === 'pending').slice(0, 5);
  const validPhone = toWhatsAppNumber(phone).length >= 11;

  const send = () => {
    if (!validPhone || !message.trim()) return;
    window.open(whatsappLink(phone, message), '_blank', 'noopener,noreferrer');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  // ── Template editing ──
  const editing = settings.templates.find(t => t.id === editId);
  const updateTemplate = (id: string, patch: Partial<WhatsAppTemplate>) =>
    setSettings(s => ({ ...s, templates: s.templates.map(t => (t.id === id ? { ...t, ...patch } : t)) }));

  const addTemplate = () => {
    const id = `custom-${Date.now()}`;
    setSettings(s => ({ ...s, templates: [...s.templates, { id, name: 'New Message', body: 'Hi {name}, ' }] }));
    setEditId(id);
  };

  const removeTemplate = async (id: string) => {
    if (!await confirmDialog('Delete this message template?')) return;
    setSettings(s => ({ ...s, templates: s.templates.filter(t => t.id !== id) }));
    setEditId(settings.templates.find(t => t.id !== id)?.id || '');
  };

  const insertPlaceholder = (key: string) => {
    if (!editing) return;
    updateTemplate(editing.id, { body: editing.body + key });
  };

  const saveSettings = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await api.updateSetting('whatsapp', { ...settings, businessNumber: toWhatsAppNumber(settings.businessNumber) });
      setStatus({ ok: true, msg: 'Saved!' });
    } catch (e: any) {
      setStatus({ ok: false, msg: e.message || 'Could not save.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366] text-white">
              <MessageCircle className="h-6 w-6" />
            </span>
            <div>
              <h1>WhatsApp Center</h1>
              <p className="text-sm text-neutral-500">Send order confirmations and updates to customers on WhatsApp.</p>
            </div>
          </div>
          <div className="flex rounded-full bg-white p-1 ring-1 ring-neutral-200">
            {(['send', 'templates'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${tab === t ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:text-black'}`}
              >
                {t === 'send' ? 'Send Message' : 'Templates & Settings'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'send' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left: compose */}
            <div className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-neutral-200 lg:col-span-3">
              {/* Order picker */}
              <div className="relative">
                <span className="mb-1 block text-xs font-semibold text-neutral-700">1. Choose an order (optional)</span>
                {order ? (
                  <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5 ring-1 ring-neutral-200">
                    <div className="text-sm">
                      <b>{order.orderNumber}</b> · {order.customer.name} · {formatPrice(order.totalAmount)}
                      <span className="ml-2 text-xs text-neutral-500">({STATUS_LABEL[order.orderStatus]})</span>
                    </div>
                    <button onClick={() => { setOrder(null); setPhone(''); }} className="text-xs font-semibold text-red-600 hover:underline cursor-pointer">Clear</button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        value={orderQuery}
                        onChange={e => setOrderQuery(e.target.value)}
                        placeholder="Search by order #, name or phone…"
                        className={`${inputCls} pl-9`}
                      />
                    </div>
                    {matches.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-neutral-200">
                        {matches.map(o => (
                          <button key={o.orderNumber} onClick={() => pickOrder(o)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50 cursor-pointer">
                            <span><b>{o.orderNumber}</b> · {o.customer.name}</span>
                            <span className="text-xs text-neutral-500">{STATUS_LABEL[o.orderStatus]}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-neutral-700">2. Customer WhatsApp number</span>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0300 1234567" className={inputCls} />
                {phone && !validPhone && <span className="mt-1 block text-[11px] text-red-500">Please enter a valid number.</span>}
              </label>

              <div>
                <span className="mb-1 block text-xs font-semibold text-neutral-700">3. Message type</span>
                <div className="flex flex-wrap gap-2">
                  {settings.templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTemplateId(t.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        templateId === t.id ? 'bg-[#25D366] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-neutral-700">4. Message (you can edit it)</span>
                <textarea rows={10} value={message} onChange={e => setMessage(e.target.value)} className={`${inputCls} font-sans leading-relaxed`} />
              </label>

              <div className="flex flex-wrap justify-end gap-2">
                <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={send}
                  disabled={!validPhone || !message.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1EBE5A] disabled:opacity-40 cursor-pointer"
                >
                  <Send className="h-4 w-4" /> Open in WhatsApp
                </button>
              </div>
            </div>

            {/* Right: preview + pending */}
            <div className="space-y-5 lg:col-span-2">
              <div className="overflow-hidden rounded-2xl ring-1 ring-neutral-200">
                <div className="bg-[#075E54] px-4 py-3 text-sm font-semibold text-white">
                  Preview {order ? `· ${order.customer.name}` : ''}
                </div>
                <div className="min-h-[220px] bg-[#ECE5DD] p-4">
                  <div className="ml-auto max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#DCF8C6] px-3.5 py-2.5 text-[13px] leading-snug text-neutral-900 shadow-sm">
                    {message || <span className="text-neutral-400">Your message will appear here…</span>}
                  </div>
                </div>
              </div>

              {pendingOrders.length > 0 && (
                <div className="rounded-2xl bg-white p-4 ring-1 ring-amber-200">
                  <p className="mb-2 text-sm font-semibold text-amber-900">Orders waiting for confirmation</p>
                  <div className="space-y-1.5">
                    {pendingOrders.map(o => (
                      <button key={o.orderNumber} onClick={() => pickOrder(o)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-amber-50 cursor-pointer">
                        <span><b>{o.orderNumber}</b> · {o.customer.name}</span>
                        <span className="text-xs font-semibold text-[#128C7E]">Select →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-neutral-500">
                Clicking “Open in WhatsApp” opens WhatsApp (app or web) with the message ready — just press send.
              </p>
            </div>
          </div>
        ) : (
          /* ── Templates & settings ── */
          <div className="space-y-6">
            {status && (
              <div className={`rounded-lg px-4 py-3 text-sm ${status.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{status.msg}</div>
            )}

            <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
              <h2 className="mb-1 flex items-center gap-2 text-base"><Settings2 className="h-4 w-4" /> Store WhatsApp number</h2>
              <p className="mb-3 text-xs text-neutral-500">Used by the green WhatsApp chat button on the website.</p>
              <input
                value={settings.businessNumber}
                onChange={e => setSettings(s => ({ ...s, businessNumber: e.target.value }))}
                placeholder="0300 1234567"
                className={`${inputCls} max-w-xs`}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
                {settings.templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setEditId(t.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer ${editId === t.id ? 'bg-neutral-950 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
                  >
                    {t.name}
                  </button>
                ))}
                <button onClick={addTemplate} className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-neutral-200 py-2 text-sm font-semibold text-neutral-500 hover:border-neutral-400 hover:text-neutral-900 cursor-pointer">
                  <Plus className="h-4 w-4" /> New template
                </button>
              </div>

              <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-neutral-200 lg:col-span-2">
                {editing ? (
                  <>
                    <div className="flex items-end gap-3">
                      <label className="block flex-1">
                        <span className="mb-1 block text-xs font-semibold text-neutral-700">Template name</span>
                        <input value={editing.name} onChange={e => updateTemplate(editing.id, { name: e.target.value })} className={inputCls} />
                      </label>
                      <button onClick={() => removeTemplate(editing.id)} disabled={settings.templates.length <= 1} title="Delete" className="mb-0.5 rounded-lg p-2.5 text-red-500 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-30 cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-neutral-700">Message</span>
                      <textarea rows={10} value={editing.body} onChange={e => updateTemplate(editing.id, { body: e.target.value })} className={`${inputCls} leading-relaxed`} />
                      <span className="mt-1 block text-[11px] text-neutral-400">Tip: wrap text in *stars* to make it bold on WhatsApp.</span>
                    </label>
                    <div>
                      <span className="mb-1.5 block text-xs font-semibold text-neutral-700">Click to insert customer / order details</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PLACEHOLDERS.map(p => (
                          <button key={p.key} onClick={() => insertPlaceholder(p.key)} title={p.desc} className="rounded-md bg-neutral-100 px-2 py-1 font-mono text-[11px] text-neutral-700 hover:bg-neutral-200 cursor-pointer">
                            {p.key}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-neutral-500">Select a template to edit.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={async () => { if (await confirmDialog('Restore the default templates? (Not saved until you click Save)')) setSettings(s => ({ ...DEFAULT_WHATSAPP, businessNumber: s.businessNumber })); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer"
              >
                Restore defaults
              </button>
              <button onClick={saveSettings} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer">
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
