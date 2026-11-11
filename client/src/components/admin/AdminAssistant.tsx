import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, RotateCcw } from 'lucide-react';
import { api } from '../../utils/api';
import { AdminConversation } from '../../utils/chatApi';

/* Admin-only helper chatbot. Rule-based (no LLM backend):
   order lookup, reply suggestions, chat summary, quick facts. */

export interface AssistantTemplate { id: string; category: string; title: string; text: string }

interface BotMsg {
  id: string;
  from: 'admin' | 'bot';
  text: string;
  replies?: string[]; // customer-ready replies admin can insert/send
}

interface Props {
  convo: AdminConversation | null;
  templates: AssistantTemplate[];
  format: (raw: string) => string;
  onInsert: (text: string) => void;
  onSend: (text: string) => void;
  sending: boolean;
}

const ORDER_RE = /\b(QDM|AURA)[\s-]?(\d{3,})\b/i;
const fmtPKR = (n: number) => 'PKR ' + Math.round(n).toLocaleString('en-PK');

const INTENTS: { re: RegExp; ids: string[]; label: string }[] = [
  { re: /\b(order|status|track|kahan|kab|dispatch|parcel)\b/i, ids: ['o1', 'o2', 'o3'], label: 'order status' },
  { re: /\b(size|fit|chhota|bara|tight|loose|exchange)\b/i, ids: ['s1', 's2'], label: 'sizing' },
  { re: /\b(cod|cash|payment|pay|advance|card)\b/i, ids: ['p1'], label: 'payment' },
  { re: /\b(deliver|delivery|shipping|days|din|city|shop|store)\b/i, ids: ['d1', 'o3'], label: 'delivery' },
  { re: /\b(thanks|thank|shukriya|ok|okay|done)\b/i, ids: ['c1'], label: 'closing' },
  { re: /\b(hi|hello|salam|aoa|assalam|hey|team)\b/i, ids: ['g1', 'g2'], label: 'greeting' },
];

const QUICK = ['Suggest reply', 'Summarize chat', 'Lookup order QDM-', 'Help'];

const uid = () => Math.random().toString(36).slice(2);

export const AdminAssistant: React.FC<Props> = ({ convo, templates, format, onInsert, onSend, sending }) => {
  const [msgs, setMsgs] = useState<BotMsg[]>([{
    id: 'hello', from: 'bot',
    text: 'Salam! Main aap ka admin assistant hoon. Mujh se poochein:\n• "suggest reply" — customer ke last message ka jawab\n• "summarize" — chat ka khulasa\n• "QDM-12345" — order details\n• "help" — sab commands',
  }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, busy]);

  const tplById = (id: string) => templates.find(t => t.id === id);

  const suggest = (): BotMsg => {
    if (!convo) return { id: uid(), from: 'bot', text: 'Pehle left side se koi chat select karein.' };
    const last = [...convo.messages].reverse().find(m => m.from === 'customer');
    if (!last) return { id: uid(), from: 'bot', text: 'Customer ne abhi tak koi message nahi bheja.' };
    const order = last.text.match(ORDER_RE);
    const hits = INTENTS.filter(i => i.re.test(last.text));
    const ids = [...new Set(hits.flatMap(h => h.ids))];
    const replies = ids.map(tplById).filter(Boolean).map(t => format(t!.text)).slice(0, 3);
    if (order) replies.unshift(`Shukriya! Main order ${order[1].toUpperCase()}-${order[2]} check kar raha hoon, bas ek minute.`);
    if (!replies.length) replies.push(format(tplById('g2')?.text || 'Ji batayein, main aap ki kya madad kar sakta hoon?'));
    return {
      id: uid(), from: 'bot',
      text: `Last message: "${last.text}"\nDetected: ${hits.map(h => h.label).join(', ') || 'general'}. Suggested replies:`,
      replies,
    };
  };

  const summarize = (): BotMsg => {
    if (!convo) return { id: uid(), from: 'bot', text: 'Pehle koi chat select karein.' };
    const m = convo.messages;
    const cust = m.filter(x => x.from === 'customer');
    const admin = m.filter(x => x.from === 'admin');
    const lastAdmin = admin.length ? new Date(admin[admin.length - 1].at).getTime() : 0;
    const pending = cust.filter(x => new Date(x.at).getTime() > lastAdmin).length;
    const topics = INTENTS.filter(i => cust.some(c => i.re.test(c.text))).map(i => i.label);
    const orders = [...new Set(cust.map(c => c.text.match(ORDER_RE)).filter(Boolean).map(x => `${x![1].toUpperCase()}-${x![2]}`))];
    return {
      id: uid(), from: 'bot',
      text: [
        `👤 ${convo.name}${convo.phone ? ` · ${convo.phone}` : ''}`,
        `💬 ${m.length} messages (${cust.length} customer, ${admin.length} admin)`,
        `⏳ ${pending ? `${pending} unanswered customer message(s)` : 'Sab messages ka jawab de diya gaya hai'}`,
        `🏷️ Topics: ${topics.join(', ') || '—'}`,
        `📦 Orders mentioned: ${orders.join(', ') || 'none'}`,
        `📌 Status: ${convo.status}`,
      ].join('\n'),
    };
  };

  const lookup = async (code: string, digits: string): Promise<BotMsg> => {
    const num = `${code.toUpperCase()}-${digits}`;
    try {
      const o = await api.getOrderByNumber(num);
      const items = o.items.map(i => `• ${i.name} (${i.color}, UK ${i.size}) ×${i.quantity}`).join('\n');
      const first = o.customer.name.split(/\s+/)[0];
      const statusLine: Record<string, string> = {
        pending: `aap ka order ${num} receive ho gaya hai aur jald confirm kar diya jaye ga.`,
        processing: `aap ka order ${num} hamare artisans prepare kar rahe hain.`,
        shipped: `aap ka order ${num} dispatch ho chuka hai${o.trackingNumber ? ` — ${o.trackingCarrier || 'Courier'} tracking: ${o.trackingNumber}` : ''}.`,
        delivered: `aap ka order ${num} deliver ho chuka hai. Umeed hai aap ko pasand aya!`,
        cancelled: `aap ka order ${num} cancel ho chuka hai. Koi sawal ho to batayein.`,
      };
      return {
        id: uid(), from: 'bot',
        text: `📦 ${num} — ${o.orderStatus.toUpperCase()}\n👤 ${o.customer.name} · ${o.customer.phone} · ${o.customer.city}\n${items}\n💰 ${fmtPKR(o.totalAmount)} · ${o.paymentMethod.toUpperCase()} (${o.paymentStatus})${o.trackingNumber ? `\n🚚 ${o.trackingCarrier || ''} ${o.trackingNumber}` : ''}`,
        replies: [`${first} sahab, ${statusLine[o.orderStatus]}`],
      };
    } catch {
      return { id: uid(), from: 'bot', text: `Order ${num} nahi mila. Number dobara check karein.` };
    }
  };

  const answer = async (q: string): Promise<BotMsg> => {
    const order = q.match(ORDER_RE);
    if (order) return lookup(order[1], order[2]);
    if (/suggest|reply|jawab|respond/i.test(q)) return suggest();
    if (/summar|khulasa|overview|detail/i.test(q)) return summarize();
    if (/help|command|madad/i.test(q)) {
      return { id: uid(), from: 'bot', text: 'Commands:\n• suggest reply\n• summarize\n• QDM-12345 (order lookup)\n• template <word> — template dhundhein\n• cod / size / delivery — quick answers' };
    }
    const tm = q.match(/^(?:template|tpl|find)\s+(.+)/i);
    const term = (tm?.[1] || q).toLowerCase();
    const found = templates.filter(t => `${t.title} ${t.text} ${t.category}`.toLowerCase().includes(term)).slice(0, 3);
    if (found.length) return { id: uid(), from: 'bot', text: `${found.length} template(s) mile:`, replies: found.map(t => format(t.text)) };
    const intent = INTENTS.find(i => i.re.test(q));
    if (intent) {
      return { id: uid(), from: 'bot', text: `"${intent.label}" ke liye replies:`, replies: intent.ids.map(tplById).filter(Boolean).map(t => format(t!.text)) };
    }
    return { id: uid(), from: 'bot', text: 'Samajh nahi aya. "help" likhein commands dekhne ke liye.' };
  };

  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!q || busy) return;
    setMsgs(m => [...m, { id: uid(), from: 'admin', text: q }]);
    setInput('');
    setBusy(true);
    const reply = await answer(q);
    setMsgs(m => [...m, reply]);
    setBusy(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-2.5">
        {msgs.map(m => (
          <div key={m.id} className={`flex gap-1.5 ${m.from === 'admin' ? 'justify-end' : ''}`}>
            {m.from === 'bot' && (
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3B2618] to-[#5A3A24] text-[#F3D9A4]">
                <Bot className="h-3.5 w-3.5" />
              </span>
            )}
            <div className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[11.5px] leading-relaxed ${
              m.from === 'admin' ? 'bg-[#3B2618] text-[#F3D9A4]' : 'bg-white text-[#3B2618] ring-1 ring-[#E8D9C8]'
            }`}>
              <p className="whitespace-pre-line">{m.text}</p>
              {m.replies?.map((r, i) => (
                <div key={i} className="mt-2 rounded-lg bg-[#FDFAF5] p-2 ring-1 ring-[#EFE3D3]">
                  <p className="text-[11px] text-[#6E5442]">{r}</p>
                  <div className="mt-1.5 flex gap-1.5">
                    <button type="button" disabled={!convo} onClick={() => onInsert(r)}
                      className="flex-1 rounded-md bg-[#F6EFE4] py-0.5 text-[10.5px] font-semibold text-[#3B2618] hover:bg-[#EADBC7] disabled:opacity-40 cursor-pointer">
                      Insert
                    </button>
                    <button type="button" disabled={!convo || sending} onClick={() => onSend(r)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-md bg-gradient-to-r from-[#3B2618] to-[#5A3A24] py-0.5 text-[10.5px] font-semibold text-[#F3D9A4] disabled:opacity-40 cursor-pointer">
                      <Send className="h-2.5 w-2.5" /> Send
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {busy && <p className="pl-8 text-[11px] text-[#8A6A52]">Assistant soch raha hai…</p>}
      </div>

      <div className="border-t border-[#F1E6D8] bg-white p-2 space-y-1.5">
        <div className="flex flex-wrap gap-1">
          {QUICK.map(qk => (
            <button key={qk} type="button"
              onClick={() => (qk.endsWith('-') ? setInput(qk) : ask(qk))}
              className="flex items-center gap-1 rounded-md bg-[#F6EFE4] px-2 py-0.5 text-[10.5px] font-medium text-[#8A5A2B] hover:bg-[#ECDDC9] cursor-pointer">
              <Sparkles className="h-2.5 w-2.5" /> {qk}
            </button>
          ))}
          <button type="button" title="Clear" onClick={() => setMsgs(m => m.slice(0, 1))}
            className="ml-auto rounded-md p-1 text-[#A8907A] hover:bg-neutral-100 cursor-pointer">
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
        <form onSubmit={e => { e.preventDefault(); ask(input); }} className="flex gap-1.5">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Assistant se poochein…"
            className="flex-1 rounded-lg border border-[#E8D9C8] px-2.5 py-1.5 text-xs focus:border-[#C9A46A] focus:outline-none" />
          <button type="submit" disabled={!input.trim() || busy}
            className="rounded-lg bg-[#3B2618] px-2.5 text-[#F3D9A4] disabled:opacity-40 cursor-pointer" aria-label="Ask">
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
