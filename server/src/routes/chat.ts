import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { Collection } from '../config/collection.js';
import { protect, adminOnly, AuthenticatedRequest } from '../middleware/auth.js';
import { rateLimit } from '../security/index.js';
import { sendToAdmins } from '../utils/adminPush.js';

// ── Types ─────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  from: 'customer' | 'bot' | 'admin' | 'system';
  text: string;
  at: string;
}

/**
 * One conversation per visitor. It starts with the FAQ bot (mode "bot") and the same
 * thread is handed to the team when the customer asks for live chat (mode "live").
 */
export interface ChatConversation {
  id: string;
  token: string;            // secret the customer's browser holds
  name: string;
  phone: string;
  page: string;             // page the chat was started from
  mode: 'bot' | 'live';
  status: 'open' | 'closed';
  unreadAdmin: number;      // customer messages the admin has not read (live only)
  unreadCustomer: number;   // admin messages the customer has not read
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export const Chats = new Collection<ChatConversation>(
  'ChatConversation',
  { token: { type: String, index: true }, status: String, mode: String, updatedAt: String },
  [[{ status: 1, updatedAt: -1 }]]
);

const MAX_MESSAGES = 300;
const MAX_TEXT = 1000;
const msgId = () => crypto.randomBytes(6).toString('hex');
const now = () => new Date().toISOString();
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const modeOf = (c: ChatConversation) => c.mode || 'live'; // chats saved before bot logging were live

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** Customer view: never expose the token. */
const publicView = (c: ChatConversation) => ({
  id: c.id, name: c.name, mode: modeOf(c), status: c.status, messages: c.messages, unreadCustomer: c.unreadCustomer,
});
const adminView = (c: ChatConversation) => {
  const { token, ...rest } = c;
  return { ...rest, mode: modeOf(c) };
};

async function getOwned(req: Request): Promise<ChatConversation | undefined> {
  const token = str(req.headers['x-chat-token'], 100) || str((req.body as any)?.token, 100) || str(req.query.token, 100);
  const c = await Chats.get(String(req.params.id));
  if (!c || !token || !safeEqual(c.token, token)) return undefined;
  return c;
}

/** Customer/bot lines sent from the widget; anything else is dropped. */
function cleanTranscript(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const t = now();
  return raw.slice(-60).flatMap((m: any) => {
    const from = m?.from === 'bot' ? 'bot' : m?.from === 'customer' ? 'customer' : null;
    const text = str(m?.text, MAX_TEXT);
    return from && text ? [{ id: msgId(), from, text, at: t } as ChatMessage] : [];
  });
}

function alertAdmins(c: ChatConversation, title: string, body: string) {
  sendToAdmins({
    kind: 'live-chat',
    title,
    body: body.slice(0, 140),
    icon: '/icons/admin-192.png',
    badge: '/icons/admin-192.png',
    url: `/admin/chat?c=${c.id}`,
    tag: `chat-${c.id}`,
  }).catch(() => {});
}

const router = Router();
const customerLimit = rateLimit('chat', 60, 60000);

// ── Customer ──────────────────────────────────────────

// Start a conversation (bot mode, or straight to live)
router.post('/', customerLimit, async (req: Request, res: Response) => {
  const mode: 'bot' | 'live' = req.body?.mode === 'live' ? 'live' : 'bot';
  const name = str(req.body?.name, 60) || 'Website visitor';
  const messages = cleanTranscript(req.body?.transcript);
  const first = str(req.body?.message, MAX_TEXT);
  if (first) messages.push({ id: msgId(), from: 'customer', text: first, at: now() });
  if (!messages.length) return res.status(400).json({ success: false, message: 'Message is empty.' });

  const t = now();
  if (mode === 'live') messages.push({ id: msgId(), from: 'system', text: '✅ Connected to the QADAM team — we will reply here shortly.', at: t });
  const convo = await Chats.insert({
    token: crypto.randomBytes(24).toString('base64url'),
    name, phone: str(req.body?.phone, 30), page: str(req.body?.page, 200),
    mode, status: 'open',
    unreadAdmin: mode === 'live' ? 1 : 0,
    unreadCustomer: 0,
    messages: messages.slice(-MAX_MESSAGES),
    createdAt: t, updatedAt: t,
  });
  if (mode === 'live') alertAdmins(convo, `💬 New live chat from ${name}`, first || messages.filter(m => m.from === 'customer').slice(-1)[0]?.text || '');
  res.status(201).json({ success: true, id: convo.id, token: convo.token, conversation: publicView(convo) });
});

// Read a conversation (polled by the widget)
router.get('/:id', async (req: Request, res: Response) => {
  const c = await getOwned(req);
  if (!c) return res.status(404).json({ success: false, message: 'Chat not found.' });
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, conversation: publicView(c) });
});

// Add messages: the customer's text, plus (in bot mode) the bot's reply so the team sees the full history
router.post('/:id/messages', customerLimit, async (req: Request, res: Response) => {
  const c = await getOwned(req);
  if (!c) return res.status(404).json({ success: false, message: 'Chat not found.' });
  const text = str(req.body?.text, MAX_TEXT);
  if (!text) return res.status(400).json({ success: false, message: 'Message is empty.' });

  const live = modeOf(c) === 'live';
  const add: ChatMessage[] = [{ id: msgId(), from: 'customer', text, at: now() }];
  const botReply = str(req.body?.botReply, MAX_TEXT);
  if (!live && botReply) add.push({ id: msgId(), from: 'bot', text: botReply, at: now() });

  const messages = [...c.messages, ...add].slice(-MAX_MESSAGES);
  const updated = await Chats.update(c.id, {
    messages, status: 'open', unreadAdmin: live ? (c.unreadAdmin || 0) + 1 : 0, updatedAt: now(),
  });
  if (live && (c.unreadAdmin || 0) === 0) alertAdmins(c, `💬 ${c.name} sent a message`, text);
  res.json({ success: true, conversation: publicView(updated!) });
});

// Hand the same conversation to the team
router.post('/:id/live', customerLimit, async (req: Request, res: Response) => {
  const c = await getOwned(req);
  if (!c) return res.status(404).json({ success: false, message: 'Chat not found.' });
  const name = str(req.body?.name, 60) || c.name;
  const phone = str(req.body?.phone, 30) || c.phone;
  if (modeOf(c) === 'live' && c.status === 'open') return res.json({ success: true, conversation: publicView(c) });

  const messages = [...c.messages, { id: msgId(), from: 'system' as const, text: '✅ Connected to the QADAM team — we will reply here shortly.', at: now() }].slice(-MAX_MESSAGES);
  const updated = await Chats.update(c.id, { name, phone, mode: 'live', status: 'open', unreadAdmin: Math.max(1, c.unreadAdmin || 0), messages, updatedAt: now() });
  const lastCustomer = c.messages.filter(m => m.from === 'customer').slice(-1)[0]?.text || 'wants to talk to the team';
  alertAdmins(updated!, `💬 ${name} wants live chat`, lastCustomer);
  res.json({ success: true, conversation: publicView(updated!) });
});

// Customer has seen the admin's replies
router.post('/:id/read', async (req: Request, res: Response) => {
  const c = await getOwned(req);
  if (!c) return res.status(404).json({ success: false });
  if (c.unreadCustomer) await Chats.update(c.id, { unreadCustomer: 0 });
  res.json({ success: true });
});

// ── Admin ─────────────────────────────────────────────

router.get('/admin/list', protect, adminOnly, async (_req: AuthenticatedRequest, res: Response) => {
  const all = await Chats.all();
  const list = all
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 300)
    .map(c => ({
      id: c.id, name: c.name, phone: c.phone, page: c.page, mode: modeOf(c), status: c.status,
      unreadAdmin: c.unreadAdmin, updatedAt: c.updatedAt, createdAt: c.createdAt,
      messageCount: c.messages.length,
      last: c.messages.filter(m => m.from !== 'system').slice(-1)[0] || null,
      lastCustomer: c.messages.filter(m => m.from === 'customer').slice(-1)[0] || null,
    }));
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, conversations: list, unread: list.reduce((n, c) => n + (c.mode === 'live' ? c.unreadAdmin || 0 : 0), 0) });
});

router.get('/admin/:id', protect, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  const c = await Chats.get(String(req.params.id));
  if (!c) return res.status(404).json({ success: false, message: 'Chat not found.' });
  if (c.unreadAdmin) await Chats.update(c.id, { unreadAdmin: 0 });
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, conversation: { ...adminView(c), unreadAdmin: 0 } });
});

// Admin reply — also takes over a bot conversation
router.post('/admin/:id/messages', protect, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  const c = await Chats.get(String(req.params.id));
  if (!c) return res.status(404).json({ success: false, message: 'Chat not found.' });
  const text = str(req.body?.text, MAX_TEXT);
  if (!text) return res.status(400).json({ success: false, message: 'Message is empty.' });
  const messages = [...c.messages, { id: msgId(), from: 'admin' as const, text, at: now() }].slice(-MAX_MESSAGES);
  const updated = await Chats.update(c.id, {
    messages, mode: 'live', status: 'open', unreadAdmin: 0, unreadCustomer: (c.unreadCustomer || 0) + 1, updatedAt: now(),
  });
  res.json({ success: true, conversation: adminView(updated!) });
});

router.post('/admin/:id/status', protect, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  const c = await Chats.get(String(req.params.id));
  if (!c) return res.status(404).json({ success: false, message: 'Chat not found.' });
  const status = req.body?.status === 'closed' ? 'closed' : 'open';
  const extra = status === 'closed'
    ? [{ id: msgId(), from: 'system' as const, text: 'This chat was marked solved. Send a message any time if you need more help.', at: now() }]
    : [];
  const updated = await Chats.update(c.id, { status, unreadAdmin: 0, messages: [...c.messages, ...extra].slice(-MAX_MESSAGES), updatedAt: now() });
  res.json({ success: true, conversation: adminView(updated!) });
});

router.delete('/admin/:id', protect, adminOnly, async (req: AuthenticatedRequest, res: Response) => {
  await Chats.remove(String(req.params.id));
  res.json({ success: true });
});

export default router;
