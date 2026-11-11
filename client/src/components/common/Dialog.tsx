import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

/**
 * Site-wide replacement for window.confirm / window.alert.
 * Call confirmDialog(...) or alertDialog(...) from anywhere; <DialogHost /> is mounted once in App.
 */

type Tone = 'danger' | 'info' | 'success';

interface DialogOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: Tone;
}

interface DialogRequest extends DialogOptions {
  id: number;
  message: string;
  kind: 'confirm' | 'alert';
  resolve: (ok: boolean) => void;
}

let nextId = 1;
let queue: DialogRequest[] = [];
const listeners = new Set<(q: DialogRequest[]) => void>();
const emit = () => listeners.forEach(l => l([...queue]));

const open = (kind: 'confirm' | 'alert', message: string, opts: DialogOptions = {}) =>
  new Promise<boolean>(resolve => {
    queue.push({ id: nextId++, kind, message, resolve, ...opts });
    emit();
  });

const guessTone = (msg: string): Tone => (/delete|remove|cannot be undone|permanent|stop/i.test(msg) ? 'danger' : 'info');

export const confirmDialog = (message: string, opts: DialogOptions = {}) =>
  open('confirm', message, { tone: guessTone(message), ...opts });

export const alertDialog = (message: string, opts: DialogOptions = {}) =>
  open('alert', message, { tone: 'info', ...opts });

const TONE = {
  danger: { Icon: AlertTriangle, badge: 'bg-red-50 text-red-600 ring-red-100', btn: 'bg-red-600 hover:bg-red-700 shadow-red-600/25', title: 'Are you sure?' },
  info: { Icon: Info, badge: 'bg-[#F6EEE2] text-[#A8824C] ring-[#EDE1CF]', btn: 'bg-[#2B2118] hover:bg-black shadow-[#2B2118]/25', title: 'Please confirm' },
  success: { Icon: CheckCircle2, badge: 'bg-emerald-50 text-emerald-600 ring-emerald-100', btn: 'bg-[#2B2118] hover:bg-black shadow-[#2B2118]/25', title: 'Done' },
};

export const DialogHost: React.FC = () => {
  const [items, setItems] = useState<DialogRequest[]>([]);
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    listeners.add(setItems);
    return () => { listeners.delete(setItems); };
  }, []);

  const current = items[0];

  const close = (ok: boolean) => {
    if (!current) return;
    current.resolve(ok);
    queue = queue.filter(q => q.id !== current.id);
    emit();
  };

  useEffect(() => {
    if (!current) return;
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // re-bind for each dialog

  const tone = TONE[current?.tone || 'info'];
  const title = current?.title || (current?.kind === 'alert' ? (current.tone === 'success' ? 'Done' : 'Notice') : tone.title);

  return createPortal(
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center"
          onMouseDown={e => { if (e.target === e.currentTarget) close(false); }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="qadam-dialog-title"
            aria-describedby="qadam-dialog-msg"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_30px_80px_-20px_rgba(40,25,10,0.45)] ring-1 ring-[#EFE6D8]"
          >
            <div className="flex gap-4">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ${tone.badge}`}>
                <tone.Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p id="qadam-dialog-title" className="text-base font-semibold text-neutral-950">{title}</p>
                <p id="qadam-dialog-msg" className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed text-neutral-600">{current.message}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {current.kind === 'confirm' && (
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="h-10 rounded-full px-5 text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200 transition hover:bg-neutral-50 cursor-pointer"
                >
                  {current.cancelText || 'Cancel'}
                </button>
              )}
              <button
                ref={okRef}
                type="button"
                onClick={() => close(true)}
                className={`h-10 rounded-full px-5 text-sm font-semibold text-white shadow-md transition cursor-pointer ${tone.btn}`}
              >
                {current.confirmText || (current.kind === 'alert' ? 'OK' : current.tone === 'danger' ? 'Yes, continue' : 'Confirm')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
