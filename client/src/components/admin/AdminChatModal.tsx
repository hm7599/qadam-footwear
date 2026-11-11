import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LiveChatPanel } from './LiveChatPanel';
import { bindScrollContain } from '../../utils/scrollContain';

interface AdminChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialChatId?: string;
}

export const AdminChatModal: React.FC<AdminChatModalProps> = ({ isOpen, onClose, initialChatId }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const unbindWheel = bindScrollContain(overlayRef.current);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      unbindWheel();
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center overscroll-none bg-black/60 p-2 sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Live Chat Concierge"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="h-[92vh] w-full max-w-6xl overflow-hidden overscroll-contain rounded-3xl bg-white shadow-2xl ring-1 ring-black/10"
          >
            <LiveChatPanel
              initialChatId={initialChatId}
              isModal
              onClose={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
