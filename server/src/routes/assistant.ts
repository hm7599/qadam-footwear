import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { protect, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';
import { rateLimit } from '../security/index.js';
import { DataStore } from '../config/store.js';
import { Chats } from './chat.js';

/* AI assistant for admins inside Live Chat (Claude). Needs ANTHROPIC_API_KEY in server/.env. */

const router = Router();
const MODEL = 'claude-opus-5-5';
let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

const SYSTEM = `You are the internal assistant for admins of QADAM, a Pakistani online store for handcrafted footwear.
Store facts: 100% online; nationwide delivery in 2–4 working days via TCS / Leopards; Cash on Delivery everywhere with no advance; free doorstep size exchange; standard UK sizes; order numbers look like QDM-89214.

You help the admin handle a live customer chat. You can look up orders with tools. Never invent order details: if a tool finds nothing, say so.
Talk to the admin briefly, in the same language they use (Roman Urdu or English).
When you draft a message the admin could send to the customer, put each draft inside <reply>...</reply> tags. Write drafts in the customer's language (match how they write, usually Roman Urdu/English mix), warm and short. Give 1–3 drafts only when useful.`;

const tools: Anthropic.Beta.BetaTool[] = [
  {
    name: 'lookup_order',
    description: 'Get full details of one order by its order number, e.g. QDM-89214.',
    input_schema: { type: 'object', properties: { orderNumber: { type: 'string' } }, required: ['orderNumber'], additionalProperties: false },
    strict: true,
  },
  {
    name: 'find_orders',
    description: "Find a customer's recent orders by phone number or name (partial match). Returns up to 5, newest first.",
    input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false },
    strict: true,
  },
];

const brief = (o: any) => ({
  orderNumber: o.orderNumber, status: o.orderStatus, createdAt: o.createdAt,
  customer: { name: o.customer?.name, phone: o.customer?.phone, city: o.customer?.city },
  items: (o.items || []).map((i: any) => ({ name: i.name, color: i.color, size: i.size, qty: i.quantity, price: i.price })),
  total: o.totalAmount, payment: `${o.paymentMethod} (${o.paymentStatus})`,
  tracking: o.trackingNumber ? `${o.trackingCarrier || ''} ${o.trackingNumber}`.trim() : null,
  estimatedDelivery: o.estimatedDeliveryDate || null,
});

async function runTool(name: string, input: any): Promise<string> {
  if (name === 'lookup_order') {
    const o = await DataStore.getOrderByNumber(String(input.orderNumber || '').toUpperCase().slice(0, 40));
    return JSON.stringify(o ? brief(o) : { error: 'Order not found' });
  }
  if (name === 'find_orders') {
    const q = String(input.query || '').toLowerCase().trim();
    const digits = q.replace(/\D/g, '').slice(-9);
    const all: any[] = await DataStore.getOrders();
    const hits = all.filter(o => {
      const phone = String(o.customer?.phone || '').replace(/\D/g, '');
      return (digits.length >= 6 && phone.includes(digits)) || String(o.customer?.name || '').toLowerCase().includes(q);
    }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5);
    return JSON.stringify(hits.length ? hits.map(brief) : { error: 'No orders found' });
  }
  return JSON.stringify({ error: 'Unknown tool' });
}

router.get('/status', protect, adminOnly, (_req, res) => {
  res.json({ success: true, enabled: !!process.env.ANTHROPIC_API_KEY });
});

router.post('/', protect, adminOnly, rateLimit('admin_assistant', 40, 10 * 60000), async (req: AuthenticatedRequest, res: Response) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ success: false, message: 'AI assistant is not configured (ANTHROPIC_API_KEY missing).' });
  }
  const history = Array.isArray(req.body?.messages) ? req.body.messages.slice(-20) : [];
  const turns: Anthropic.Beta.BetaMessageParam[] = history
    .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!turns.length || turns[turns.length - 1].role !== 'user') {
    return res.status(400).json({ success: false, message: 'Message is empty.' });
  }

  // Current live chat goes in as context ahead of the admin's conversation.
  let context = 'No customer chat is selected.';
  const chatId = typeof req.body?.chatId === 'string' ? req.body.chatId : '';
  if (chatId) {
    const c = await Chats.get(chatId);
    if (c) {
      const lines = c.messages.slice(-40).map(m => `[${m.at}] ${m.from}: ${m.text}`).join('\n');
      context = `Selected customer chat — name: ${c.name || 'unknown'}, phone: ${(c as any).phone || 'unknown'}, status: ${c.status}\n<customer_chat>\n${lines}\n</customer_chat>`;
    }
  }
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: 'user', content: `${context}\n\n(The admin's questions follow.)` },
    { role: 'assistant', content: 'Theek hai, chat dekh li. Batayein kya madad chahiye?' },
    ...turns,
  ];

  try {
    for (let i = 0; i < 5; i++) {
      const r = await getClient().beta.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: SYSTEM,
        output_config: { effort: 'low' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        tools,
        messages,
      } as any) as Anthropic.Beta.BetaMessage;

      if (r.stop_reason === 'refusal') {
        return res.json({ success: true, text: 'Maaf kijiye, is sawal ka jawab nahi de sakta.' });
      }
      if (r.stop_reason !== 'tool_use') {
        const text = r.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map(b => b.text).join('\n').trim();
        return res.json({ success: true, text: text || '…' });
      }
      messages.push({ role: 'assistant', content: r.content });
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const b of r.content) {
        if (b.type !== 'tool_use') continue;
        try {
          results.push({ type: 'tool_result', tool_use_id: b.id, content: await runTool(b.name, b.input) });
        } catch (e: any) {
          results.push({ type: 'tool_result', tool_use_id: b.id, content: `Error: ${e.message}`, is_error: true });
        }
      }
      messages.push({ role: 'user', content: results });
    }
    res.json({ success: true, text: 'Bohat zyada steps ho gaye — sawal thora simple kar ke dobara poochein.' });
  } catch (err: any) {
    if (err instanceof Anthropic.AuthenticationError) return res.status(503).json({ success: false, message: 'Invalid ANTHROPIC_API_KEY.' });
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ success: false, message: 'AI busy hai, thori dair baad try karein.' });
    console.error('[assistant]', err?.message);
    res.status(502).json({ success: false, message: 'AI assistant error. Try again.' });
  }
});

export default router;
