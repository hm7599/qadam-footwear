export interface ChatMessage {
  id: string;
  from: 'customer' | 'bot' | 'admin' | 'system';
  text: string;
  at: string;
}

export interface LiveConversation {
  id: string;
  name: string;
  mode: 'bot' | 'live';
  status: 'open' | 'closed';
  messages: ChatMessage[];
  unreadCustomer: number;
}

export interface AdminChatSummary {
  id: string;
  name: string;
  mode: 'bot' | 'live';
  messageCount: number;
  lastCustomer: ChatMessage | null;
  phone: string;
  page: string;
  status: 'open' | 'closed';
  unreadAdmin: number;
  updatedAt: string;
  createdAt: string;
  last: ChatMessage | null;
}

export interface AdminConversation extends LiveConversation {
  phone: string;
  page: string;
  unreadAdmin: number;
  createdAt: string;
  updatedAt: string;
}

const KEY = 'qadam_live_chat';

export const savedChat = (): { id: string; token: string } | null => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return v?.id && v?.token ? v : null;
  } catch { return null; }
};
const saveChat = (id: string, token: string) => { try { localStorage.setItem(KEY, JSON.stringify({ id, token })); } catch { /* private mode */ } };
export const forgetChat = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Something went wrong'), { status: res.status });
  return data as T;
}

const adminHeaders = (): HeadersInit => {
  const t = localStorage.getItem('aura_token');
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

export const chatApi = {
  /** Creates the conversation (bot mode by default) with what was said so far. */
  async start(opts: { transcript: { from: 'customer' | 'bot'; text: string }[]; mode?: 'bot' | 'live'; name?: string; phone?: string }): Promise<LiveConversation> {
    const d = await json<{ id: string; token: string; conversation: LiveConversation }>(
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...opts, page: location.pathname }),
      })
    );
    saveChat(d.id, d.token);
    return d.conversation;
  },

  /** Hands the same conversation to the team. */
  async goLive(name: string, phone: string): Promise<LiveConversation> {
    const s = savedChat();
    if (!s) throw new Error('No chat');
    return (await json<{ conversation: LiveConversation }>(
      await fetch(`/api/chat/${s.id}/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-chat-token': s.token },
        body: JSON.stringify({ name, phone }),
      })
    )).conversation;
  },

  async get(): Promise<LiveConversation | null> {
    const s = savedChat();
    if (!s) return null;
    const res = await fetch(`/api/chat/${s.id}`, { headers: { 'x-chat-token': s.token }, cache: 'no-store' });
    if (res.status === 404) { forgetChat(); return null; }
    return (await json<{ conversation: LiveConversation }>(res)).conversation;
  },

  async send(text: string, botReply?: string): Promise<LiveConversation> {
    const s = savedChat();
    if (!s) throw new Error('No chat');
    const d = await json<{ conversation: LiveConversation }>(
      await fetch(`/api/chat/${s.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-chat-token': s.token },
        body: JSON.stringify({ text, botReply }),
      })
    );
    return d.conversation;
  },

  async markRead(): Promise<void> {
    const s = savedChat();
    if (!s) return;
    await fetch(`/api/chat/${s.id}/read`, { method: 'POST', headers: { 'x-chat-token': s.token } }).catch(() => {});
  },

  // ── Admin ──
  async adminList() {
    return json<{ conversations: AdminChatSummary[]; unread: number }>(
      await fetch('/api/chat/admin/list', { headers: adminHeaders(), cache: 'no-store' })
    );
  },
  async adminGet(id: string) {
    return (await json<{ conversation: AdminConversation }>(
      await fetch(`/api/chat/admin/${id}`, { headers: adminHeaders(), cache: 'no-store' })
    )).conversation;
  },
  async adminSend(id: string, text: string) {
    return (await json<{ conversation: AdminConversation }>(
      await fetch(`/api/chat/admin/${id}/messages`, { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ text }) })
    )).conversation;
  },
  async adminStatus(id: string, status: 'open' | 'closed') {
    return (await json<{ conversation: AdminConversation }>(
      await fetch(`/api/chat/admin/${id}/status`, { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ status }) })
    )).conversation;
  },
  async adminDelete(id: string) {
    await json(await fetch(`/api/chat/admin/${id}`, { method: 'DELETE', headers: adminHeaders() }));
  },
};
