export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

/** Order workflow: a new order must be approved before it is processed. */
export const ORDER_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting Approval',
  processing: 'Approved · Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  processing: 'bg-sky-50 text-sky-800 ring-sky-200',
  shipped: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
};

/** Button text for moving an order to the next status */
export const ACTION_LABEL: Record<string, string> = {
  processing: 'Approve Order',
  shipped: 'Mark as Shipped',
  delivered: 'Mark as Delivered',
  cancelled: 'Cancel Order',
};

/** Where the order came from */
export const ORDER_SOURCES = [
  { id: 'website', label: 'Website', style: 'bg-neutral-100 text-neutral-700' },
  { id: 'whatsapp', label: 'WhatsApp', style: 'bg-[#25D366]/15 text-[#128C7E]' },
  { id: 'other', label: 'Other', style: 'bg-violet-50 text-violet-700' },
] as const;

export const sourceInfo = (id?: string) => ORDER_SOURCES.find(s => s.id === (id || 'website')) || ORDER_SOURCES[0];

/** Delivery options. Couriers need a tracking number; by-hand / pickup do not. */
export const DELIVERY_OPTIONS = [
  { id: 'Leopards', label: 'Leopards Courier', tracking: true },
  { id: 'TCS', label: 'TCS', tracking: true },
  { id: 'M&P', label: 'M&P (Muller & Phipps)', tracking: true },
  { id: 'PostEx', label: 'PostEx', tracking: true },
  { id: 'Trax', label: 'Trax', tracking: true },
  { id: 'Call Courier', label: 'Call Courier', tracking: true },
  { id: 'BlueEx', label: 'BlueEx', tracking: true },
  { id: 'Pakistan Post', label: 'Pakistan Post', tracking: true },
  { id: 'By Hand', label: 'By Hand (our rider)', tracking: false },
  { id: 'Self Pickup', label: 'Self Pickup (from shop)', tracking: false },
  { id: 'Other', label: 'Other', tracking: false },
];

export const needsTracking = (courier?: string) =>
  DELIVERY_OPTIONS.find(d => d.id === courier)?.tracking ?? false;
