import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import { X, Bell, Check, Loader2, AlertCircle, Sparkles, Tag, Truck } from 'lucide-react';

const PERKS = [
  { icon: Sparkles, text: 'New shoes the moment they launch' },
  { icon: Tag, text: 'Special discount codes and early access' },
  { icon: Truck, text: 'Updates about your orders' },
];

export const PushPromptModal: React.FC = () => {
  const { isPromptOpen, closePrompt, subscribeToPush, isBusy, isSubscribed, errorMessage, statusMessage, permission, support } =
    useNotification();

  const blocked = permission === 'denied';
  const iosInstall = support === 'ios-needs-install';

  return (
    <AnimatePresence>
      {isPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePrompt}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            <button
              onClick={closePrompt}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-br from-[#F7F5F2] to-[#EDE9E3] px-7 pb-6 pt-8">
              <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-lg">
                {isSubscribed ? <Check className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
                {!isSubscribed && <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-[#F2EFEA]" />}
              </div>
              <h3 className="font-serif text-2xl tracking-tight text-neutral-950">
                {isSubscribed ? 'You are all set!' : 'Get drop alerts'}
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                {isSubscribed
                  ? 'We will send you a notification for new shoes and offers.'
                  : 'Be the first to know when new and limited shoes go on sale.'}
              </p>
            </div>

            <div className="px-7 pb-7 pt-5">
              {!isSubscribed && (
                <ul className="space-y-2.5">
                  {PERKS.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3 text-sm text-neutral-700">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                        <Icon className="h-4 w-4 text-neutral-800" />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              )}

              {/* Messages */}
              {errorMessage && (
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs leading-relaxed text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {errorMessage}
                </p>
              )}
              {!errorMessage && blocked && !isSubscribed && (
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Notifications are blocked for this site. Click the lock icon next to the address bar → Notifications → Allow, then press the button again.
                </p>
              )}
              {!errorMessage && iosInstall && (
                <p className="mt-4 rounded-xl bg-neutral-50 px-3.5 py-3 text-xs leading-relaxed text-neutral-600">
                  On iPhone: tap <b>Share</b> → <b>Add to Home Screen</b>, open QADAM from your home screen, then turn on alerts.
                </p>
              )}
              {statusMessage && isSubscribed && (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-xs text-emerald-800">
                  <Check className="h-4 w-4 shrink-0" /> {statusMessage}
                </p>
              )}

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-2">
                {isSubscribed ? (
                  <button onClick={closePrompt} className="h-12 w-full rounded-full bg-neutral-950 text-sm font-semibold text-white hover:bg-neutral-800 cursor-pointer">
                    Done
                  </button>
                ) : (
                  <>
                    <button
                      onClick={subscribeToPush}
                      disabled={isBusy}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60 cursor-pointer"
                    >
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                      {isBusy ? 'Turning on…' : blocked ? 'Try again' : 'Turn on alerts'}
                    </button>
                    <button onClick={closePrompt} className="h-10 w-full text-sm text-neutral-500 hover:text-neutral-900 cursor-pointer">
                      Not now
                    </button>
                  </>
                )}
              </div>

              <p className="mt-3 text-center text-[11px] text-neutral-400">No spam. You can turn alerts off anytime.</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
