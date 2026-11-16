import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

// Floating "back to top" button — appears once the visitor nears the end of the page
export const BackToTop: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const remaining = doc.scrollHeight - (window.scrollY + window.innerHeight);
      setShow(window.scrollY > 400 && remaining < 600);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-6 right-5 sm:bottom-8 sm:right-8 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-[#1B1714] text-[#C9A46A] border border-[#C9A46A]/50 shadow-lg shadow-black/30 transition-all duration-300 hover:bg-[#C9A46A] hover:text-[#1B1714] ${
        show ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-4'
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};
