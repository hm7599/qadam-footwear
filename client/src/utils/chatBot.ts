import { Product } from '../types';

/** One bot reply. `products` / `actions` render as cards and buttons under the text. */
export interface BotReply {
  text: string;
  products?: Product[];
  actions?: BotAction[];
  /** quick-reply chips shown after this reply */
  chips?: string[];
  /** order number to look up and show as a card */
  orderNumber?: string;
}

export type BotAction =
  | { kind: 'link'; label: string; to: string }
  | { kind: 'live'; label: string }
  | { kind: 'whatsapp'; label: string; text?: string };

export const START_CHIPS = ['👟 Size help', '🚚 Delivery', '💵 Cash on Delivery', '🔄 Returns', '📦 Track order', '🛍️ Show shoes'];

const has = (q: string, words: string[]) => words.some(w => q.includes(w));

const HUMAN_ACTIONS: BotAction[] = [
  { kind: 'live', label: '💬 Chat with our team' },
  { kind: 'whatsapp', label: 'WhatsApp us' },
];

const CATEGORY_WORDS: Record<string, string[]> = {
  formal: ['formal', 'oxford', 'brogue', 'office', 'wedding', 'shadi', 'derby', 'wholecut', 'monk'],
  casual: ['casual', 'driving', 'loafer', 'moccasin', 'daily'],
  sandal: ['sandal', 'chappal', 'peshawari'],
  slide: ['slide', 'slipper', 'mule'],
  boot: ['boot', 'chelsea'],
};

function findProducts(q: string, products: Product[]): Product[] {
  const words = q.split(/[^a-z0-9]+/).filter(w => w.length > 2);
  // category match first
  for (const [cat, keys] of Object.entries(CATEGORY_WORDS)) {
    if (has(q, keys)) {
      const hits = products.filter(p =>
        (p.category || '').toLowerCase().includes(cat) ||
        keys.some(k => p.name.toLowerCase().includes(k))
      );
      if (hits.length) return hits.slice(0, 4);
    }
  }
  // name / colour match
  const scored = products
    .map(p => {
      const hay = `${p.name} ${p.category} ${(p.colors || []).map(c => c.name).join(' ')}`.toLowerCase();
      return { p, score: words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0) };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 4).map(x => x.p);
}

/** Rule-based answers for the most common shopper questions (English + Roman Urdu keywords). */
export function botAnswer(input: string, products: Product[]): BotReply {
  const q = ` ${input.toLowerCase().trim()} `;

  // Talk to a person
  if (has(q, ['human', 'person', 'agent', 'team', 'insaan', 'banda', 'representative', 'talk to', 'baat kar', 'call me', ' live ', 'live chat'])) {
    return { text: 'Sure! You can chat with our team right here, or message us on WhatsApp.', actions: HUMAN_ACTIONS };
  }
  if (has(q, ['whatsapp', 'whats app', 'watsapp'])) {
    return { text: 'Tap below to continue on WhatsApp 👇', actions: [{ kind: 'whatsapp', label: 'Open WhatsApp' }] };
  }

  // Order tracking
  const orderNo = input.match(/\b(QDM|AURA)[\s-]?\d{3,}\b/i)?.[0];
  if (orderNo) {
    const num = orderNo.toUpperCase().replace(/^(QDM|AURA)[\s-]*(\d)/, '$1-$2');
    return { text: `Looking up order ${num}…`, orderNumber: num };
  }
  if (has(q, ['track', 'order status', 'where is my order', 'kahan', 'kab aye', 'kab aega', 'kab milega', 'parcel', 'my order'])) {
    return {
      text: "Sure! Type your order number here (e.g. QDM-89214) and I'll show all details right here in this chat.",
      actions: [{ kind: 'link', label: '📦 Open order tracking', to: '/track-order' }],
    };
  }

  // Size
  if (has(q, ['size', 'fit', 'naap', 'number kya', 'tight', 'loose', 'chota', 'bara', 'measure', ' uk ', ' eu '])) {
    return {
      text: 'Our shoes use UK sizes and fit true to size — choose your usual size. If you are between two sizes, pick the smaller one for Oxfords and the bigger one for boots. Not sure? Measure your foot in cm and use our size calculator.',
      actions: [{ kind: 'link', label: '📏 Open size guide', to: '/size-guide' }],
      chips: ['🔄 Returns', '🛍️ Show shoes'],
    };
  }

  // Payment
  if (has(q, ['cod', 'cash', 'payment', 'pay', 'paisay', 'paise', 'card', 'bank', 'easypaisa', 'jazzcash', 'advance'])) {
    return {
      text: 'Yes — Cash on Delivery is available all over Pakistan. No advance payment needed: check your parcel at the door, then pay. You can also pay online at checkout if you prefer.',
      chips: ['🚚 Delivery', '🛍️ Show shoes'],
    };
  }

  // Delivery
  if (has(q, ['deliver', 'shipping', 'ship', 'courier', 'tcs', 'leopard', 'kitne din', 'how long', 'charges', 'city', 'karachi', 'lahore', 'islamabad'])) {
    return {
      text: 'We deliver all over Pakistan with TCS & Leopards. Orders usually arrive in 2–4 working days. Delivery is free on bigger orders — the bag shows how much more you need for free delivery.',
      chips: ['💵 Cash on Delivery', '📦 Track order'],
    };
  }

  // Returns
  if (has(q, ['return', 'exchange', 'refund', 'wapas', 'badal', 'change size', 'warranty', 'guarantee', 'defect', 'kharab'])) {
    return {
      text: 'Easy returns: send back unworn shoes within 30 days in the original box with tags. Wrong size? We\'ll exchange it for the right one. Every pair also has a 2-year warranty against manufacturing defects.',
      actions: [{ kind: 'link', label: 'Read our terms', to: '/terms' }, ...HUMAN_ACTIONS.slice(0, 1)],
    };
  }

  // Leather / care / quality
  if (has(q, ['leather', 'material', 'quality', 'original', 'genuine', 'asli', 'care', 'polish', 'clean'])) {
    return {
      text: 'All QADAM shoes are handmade from genuine full-grain leather. To care for them: wipe with a soft cloth, use a matching cream polish, and keep shoe trees inside when not worn.',
      chips: ['🛍️ Show shoes', '👟 Size help'],
    };
  }

  // Discounts
  if (has(q, ['discount', 'sale', 'offer', 'coupon', 'promo', 'code', 'deal', 'sasta', 'kam'])) {
    return {
      text: 'Current offers are shown in the banner at the top of the page, and any coupon can be added in your bag before checkout. Turn on alerts to hear about new drops and codes first!',
      actions: [{ kind: 'link', label: '🔥 See best sellers', to: '/best-sellers' }],
    };
  }

  // Contact info
  if (has(q, ['contact', 'phone', 'email', 'address', 'shop', 'store', 'location', 'timing', 'open'])) {
    return {
      text: 'We are a 100% online store, open 24/7 for orders. Our team replies on chat and WhatsApp during the day.',
      actions: [{ kind: 'link', label: 'Contact page', to: '/contact' }, ...HUMAN_ACTIONS],
    };
  }

  // Greetings / thanks
  if (has(q, [' hi ', ' hello', ' hey', 'salam', 'assalam', 'aoa', 'hy '])) {
    return { text: 'Walaikum assalam! 👋 How can I help you today?', chips: START_CHIPS };
  }
  if (has(q, ['thank', 'shukria', 'thanks', 'jazak'])) {
    return { text: 'You\'re welcome! Anything else I can help with? 😊', chips: START_CHIPS };
  }

  // Products / price
  const wantsShoes = has(q, ['show', 'shoe', 'joota', 'jutay', 'price', 'qeemat', 'kitne ka', 'buy', 'new', 'best', 'recommend', 'suggest']);
  const found = findProducts(q, products);
  if (found.length) {
    return { text: 'Here are some shoes you might like:', products: found, actions: [{ kind: 'link', label: 'See all shoes', to: '/shop' }] };
  }
  if (wantsShoes && products.length) {
    const top = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
    return { text: 'Here are our most loved pairs right now:', products: top, actions: [{ kind: 'link', label: 'See all shoes', to: '/shop' }] };
  }

  return {
    text: "Sorry, I didn't quite get that. You can pick a topic below, or talk to our team.",
    chips: START_CHIPS,
    actions: HUMAN_ACTIONS,
  };
}

/** Maps a starter chip to the text the bot should answer. */
export const chipToQuestion = (chip: string) =>
  chip.replace(/^[^\p{L}]+/u, '').toLowerCase().replace('show shoes', 'show shoes').trim();
