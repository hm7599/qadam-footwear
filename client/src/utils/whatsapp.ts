import { useEffect, useState } from 'react';
import { Order } from '../types';
import { sizeLabel } from './sizes';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  body: string;
}

export interface WhatsAppSettings {
  businessNumber: string; // shown on the website chat button
  templates: WhatsAppTemplate[];
}

/** Placeholders admins can use inside templates */
export const PLACEHOLDERS: { key: string; desc: string }[] = [
  { key: '{name}', desc: 'Customer name' },
  { key: '{order}', desc: 'Order number' },
  { key: '{total}', desc: 'Order total (Rs.)' },
  { key: '{items}', desc: 'List of items' },
  { key: '{address}', desc: 'Delivery address' },
  { key: '{payment}', desc: 'Payment method' },
  { key: '{tracking}', desc: 'Tracking number' },
  { key: '{courier}', desc: 'Courier name' },
  { key: '{track_link}', desc: 'Order tracking link' },
];

export const DEFAULT_WHATSAPP: WhatsAppSettings = {
  businessNumber: '923001234567',
  templates: [
    {
      id: 'confirm',
      name: 'Order Confirmation',
      body:
        'Assalam o Alaikum {name}! 👋\n\nThank you for shopping with *QADAM*.\nWe have received your order *{order}*.\n\n🛍️ Items:\n{items}\n\n💰 Total: *{total}*\n💳 Payment: {payment}\n📍 Address: {address}\n\nPlease reply *YES* to confirm your order. ✅',
    },
    {
      id: 'approved',
      name: 'Order Approved',
      body:
        'Hi {name}! 🎉\n\nYour order *{order}* has been *approved* and is now being prepared.\nWe will let you know as soon as it is shipped.\n\nThank you for choosing QADAM! 🖤',
    },
    {
      id: 'shipped',
      name: 'Order Shipped',
      body:
        'Hi {name}! 🚚\n\nGood news, your order *{order}* has been *shipped*.\n\nCourier: {courier}\nTracking #: *{tracking}*\nTrack here: {track_link}\n\nIt will reach you in 2–4 working days.',
    },
    {
      id: 'delivered',
      name: 'Order Delivered',
      body:
        'Hi {name}! ✅\n\nYour order *{order}* has been *delivered*.\nWe hope you love your new shoes! 👟\n\nPlease share your feedback with us. Thank you! 🖤',
    },
    {
      id: 'cancelled',
      name: 'Order Cancelled',
      body:
        'Hi {name},\n\nSorry, your order *{order}* has been *cancelled*.\nIf you have any questions, just reply to this message and we will help you.\n\n— Team QADAM',
    },
    {
      id: 'payment',
      name: 'Payment Reminder',
      body:
        'Hi {name},\n\nThis is a reminder about your order *{order}* (Total: *{total}*).\nPlease complete your payment so we can process your order.\n\nThank you! — Team QADAM',
    },
  ],
};

/** Template to suggest for each order status */
export const TEMPLATE_FOR_STATUS: Record<string, string> = {
  pending: 'confirm',
  processing: 'approved',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

export function normalizeWhatsApp(raw: any): WhatsAppSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_WHATSAPP;
  return {
    businessNumber:
      typeof raw.businessNumber === 'string' && raw.businessNumber ? raw.businessNumber : DEFAULT_WHATSAPP.businessNumber,
    templates: Array.isArray(raw.templates) && raw.templates.length ? raw.templates : DEFAULT_WHATSAPP.templates,
  };
}

/** Converts Pakistani numbers like 0300-1234567 / +92 300 1234567 to 923001234567 */
export function toWhatsAppNumber(phone: string): string {
  let d = (phone || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '92' + d.slice(1);
  else if (d.length === 10 && d.startsWith('3')) d = '92' + d;
  return d;
}

const PAYMENT_LABEL: Record<string, string> = {
  cod: 'Cash on Delivery',
  card: 'Card',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
};

export function fillTemplate(body: string, order: Order | null, formatPrice: (n: number) => string): string {
  if (!order) return body;
  const c = order.customer;
  const values: Record<string, string> = {
    '{name}': c.name?.split(' ')[0] || c.name || '',
    '{order}': order.orderNumber,
    '{total}': formatPrice(order.totalAmount),
    '{items}': order.items
      .map(it => `• ${it.name} (Size ${sizeLabel(it.size)}, ${it.color}) × ${it.quantity}`)
      .join('\n'),
    '{address}': [c.address, c.apartment, c.city].filter(Boolean).join(', '),
    '{payment}': PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod,
    '{tracking}': order.trackingNumber || '—',
    '{courier}': order.trackingCarrier || 'Courier',
    '{track_link}': `${window.location.origin}/track-order?orderNumber=${order.orderNumber}${(order as any).accessKey ? `&key=${(order as any).accessKey}` : ''}`,
  };
  return Object.entries(values).reduce((txt, [k, v]) => txt.split(k).join(v), body);
}

export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(text)}`;
}

// ── Store number used by the public chat button / footer (loaded once, shared) ──
let numberPromise: Promise<string> | null = null;
const loadStoreNumber = (): Promise<string> => {
  if (!numberPromise) {
    numberPromise = fetch('/api/settings/whatsapp')
      .then(r => r.json())
      .then(d => toWhatsAppNumber(normalizeWhatsApp(d?.data).businessNumber))
      .catch(() => DEFAULT_WHATSAPP.businessNumber);
  }
  return numberPromise;
};

export function useStoreWhatsAppNumber(): string {
  const [num, setNum] = useState(DEFAULT_WHATSAPP.businessNumber);
  useEffect(() => {
    loadStoreNumber().then(setNum);
  }, []);
  return num;
}
