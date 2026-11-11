import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, CheckCircle2, Clock, Truck, PackageCheck, XCircle, Wallet, MessageSquare, Pencil } from 'lucide-react';
import { Order } from '../../types';
import { WhatsAppSettings, fillTemplate, whatsappLink, TEMPLATE_FOR_STATUS, toWhatsAppNumber } from '../../utils/whatsapp';
import { STATUS_LABEL } from '../../utils/orderStatus';

const ICONS: Record<string, React.ElementType> = {
  confirm: CheckCircle2,
  approved: Clock,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
  payment: Wallet,
};

const HINTS: Record<string, string> = {
  confirm: 'Ask the customer to confirm the order',
  approved: 'Order approved, now processing',
  shipped: 'Send courier & tracking number',
  delivered: 'Order delivered, ask for feedback',
  cancelled: 'Tell the customer it was cancelled',
  payment: 'Remind about pending payment',
};

interface Props {
  order: Order | null;
  settings: WhatsAppSettings;
  formatPrice: (n: number) => string;
  onClose: () => void;
}

/** Pick which WhatsApp message to send for an order, preview/edit it, then open WhatsApp */
export const WhatsAppMessageModal: React.FC<Props> = ({ order, settings, formatPrice, onClose }) => {
  const [templateId, setTemplateId] = useState('confirm');
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);

  // When a new order opens, pre-select the message that matches its status
  useEffect(() => {
    if (!order) return;
    const suggested = TEMPLATE_FOR_STATUS[order.orderStatus] || 'confirm';
    const id = settings.templates.some(t => t.id === suggested) ? suggested : settings.templates[0]?.id;
    setTemplateId(id);
    setEditing(false);
  }, [order, settings]);

  useEffect(() => {
    if (!order) return;
    const tpl = settings.templates.find(t => t.id === templateId);
    setText(fillTemplate(tpl?.body || '', order, formatPrice));
  }, [templateId, order, settings, formatPrice]);

  const suggested = order ? TEMPLATE_FOR_STATUS[order.orderStatus] : '';
  const validPhone = order ? toWhatsAppNumber(order.customer.phone).length >= 11 : false;

  const send = () => {
    if (!order || !text.trim()) return;
    window.open(whatsappLink(order.customer.phone, text), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <AnimatePresence>
      {order && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={e => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-[#075E54] px-5 py-4 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">Send WhatsApp to {order.customer.name}</p>
                <p className="truncate text-xs text-white/75">
                  {order.customer.phone} · {order.orderNumber} · {STATUS_LABEL[order.orderStatus]}
                </p>
              </div>
              <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-white/15 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-5">
              {/* Message options */}
              <div className="space-y-2 border-b border-neutral-100 p-4 md:col-span-2 md:border-b-0 md:border-r">
                <p className="mb-1 text-xs font-semibold text-neutral-500">Choose a message</p>
                {settings.templates.map(t => {
                  const Icon = ICONS[t.id] || MessageSquare;
                  const active = templateId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setTemplateId(t.id); setEditing(false); }}
                      className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all cursor-pointer ${
                        active ? 'bg-[#25D366]/10 ring-2 ring-[#25D366]' : 'ring-1 ring-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active ? 'bg-[#25D366] text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                          {t.name}
                          {t.id === suggested && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-800">Suggested</span>
                          )}
                        </span>
                        <span className="block text-xs text-neutral-500">{HINTS[t.id] || 'Custom message'}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Preview */}
              <div className="flex flex-col p-4 md:col-span-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-neutral-500">Preview</p>
                  <button
                    onClick={() => setEditing(e => !e)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-black cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" /> {editing ? 'Done' : 'Edit message'}
                  </button>
                </div>

                {editing ? (
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={14}
                    className="flex-1 rounded-xl border border-neutral-200 p-3 text-sm leading-relaxed outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]"
                  />
                ) : (
                  <div className="flex-1 rounded-xl bg-[#ECE5DD] p-4">
                    <div className="ml-auto max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#DCF8C6] px-3.5 py-2.5 text-[13px] leading-snug text-neutral-900 shadow-sm">
                      {text}
                    </div>
                  </div>
                )}

                {!validPhone && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    This customer's phone number doesn't look like a valid WhatsApp number.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 px-5 py-4">
              <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={send}
                disabled={!text.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1EBE5A] disabled:opacity-40 cursor-pointer"
              >
                <Send className="h-4 w-4" /> Send on WhatsApp
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
