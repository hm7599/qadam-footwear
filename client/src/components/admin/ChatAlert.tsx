import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Headset, X, Reply } from 'lucide-react';
import { chatApi } from '../../utils/chatApi';
import { loadPrefs, playOrderChime, speakText, showDesktopNotification } from '../../utils/orderAlerts';

interface Toast { key: string; id: string; name: string; text: string; isNew: boolean }

/**
 * Watches live chats while the admin panel is open. On every new customer message:
 * chime + spoken "Message by a customer" + popup with a Reply button + desktop notification.
 */
export const ChatAlert: React.FC<{ onUnread?: (n: number) => void; onOpenChat?: (id: string) => void }> = ({ onUnread, onOpenChat }) => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef<Map<string, string> | null>(null); // conversation id → last customer message id
  const where = useRef('');
  where.current = pathname + search;

  useEffect(() => {
    let stop = false;

    const check = async () => {
      try {
        const { conversations, unread } = await chatApi.adminList();
        if (stop) return;
        onUnread?.(unread);

        const first = seen.current === null;
        const map = seen.current ?? new Map<string, string>();
        const fresh: Toast[] = [];

        for (const c of conversations) {
          const last = c.last;
          if (!last || last.from !== 'customer') { if (last) map.set(c.id, map.get(c.id) || ''); continue; }
          const prev = map.get(c.id);
          if (!first && prev !== last.id && c.unreadAdmin > 0) {
            fresh.push({ key: `${c.id}-${last.id}`, id: c.id, name: c.name, text: last.text, isNew: prev === undefined });
          }
          map.set(c.id, last.id);
        }
        seen.current = map;
        if (!fresh.length) return;

        // Don't shout about the chat the admin is already looking at
        const toAnnounce = fresh.filter(t => !(where.current.startsWith('/admin/chat') && where.current.includes(`c=${t.id}`) && document.visibilityState === 'visible'));
        if (!toAnnounce.length) return;

        setToasts(ts => [...toAnnounce, ...ts].slice(0, 4));

        const prefs = loadPrefs();
        if (!prefs.enabled) return;
        const t = toAnnounce[0];
        if (prefs.sound) playOrderChime(prefs.volume);
        if (prefs.voice) {
          const sentence = prefs.voiceLang === 'ur'
            ? `Customer ka message aaya hai. ${t.name} keh rahe hain: ${t.text.slice(0, 120)}`
            : `Message by a customer. ${t.name} says: ${t.text.slice(0, 120)}`;
          speakText(sentence, { lang: prefs.voiceLang, volume: prefs.volume, delayMs: prefs.sound ? 900 : 0 });
        }
        if (prefs.desktop && document.visibilityState !== 'visible') {
          showDesktopNotification(`💬 Message from ${t.name}`, t.text.slice(0, 140), `/admin/chat?c=${t.id}`, `chat-${t.id}`);
        }
      } catch { /* not signed in / offline */ }
    };

    check();
    const timer = setInterval(check, 4000);
    return () => { stop = true; clearInterval(timer); };
  }, [onUnread]);

  // Auto-hide each popup after 20 s
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts(ts => ts.slice(0, -1)), 20000);
    return () => clearTimeout(t);
  }, [toasts]);

  const dismiss = (key: string) => setToasts(ts => ts.filter(t => t.key !== key));

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.key}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="pointer-events-auto overflow-hidden rounded-2xl border border-[#E8D9C8] bg-white shadow-2xl shadow-[#3B2618]/20"
            role="alert"
          >
            <div className="flex items-start gap-3 p-4">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3B2618] to-[#5A3A24]">
                <Headset className="h-5 w-5 text-[#F3D9A4]" />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-ping rounded-full bg-red-500" />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#A8824C]">
                  {t.isNew ? 'New live chat' : 'Message by a customer'}
                </p>
                <p className="truncate font-semibold text-[#2E1D12]">{t.name}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-[#6E5442]">{t.text}</p>
              </div>
              <button onClick={() => dismiss(t.key)} aria-label="Dismiss" className="rounded-full p-1 text-[#A8907A] hover:bg-[#FBF4E8] hover:text-[#2E1D12]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => {
                dismiss(t.key);
                if (onOpenChat) {
                  onOpenChat(t.id);
                } else {
                  navigate(`/admin/chat?c=${t.id}`);
                }
              }}
              className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-[#3B2618] to-[#5A3A24] py-2.5 text-sm font-semibold text-[#F3D9A4] hover:opacity-95 cursor-pointer"
            >
              <Reply className="h-4 w-4" /> Reply now
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
