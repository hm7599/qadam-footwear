import React from 'react';

/** Branded full-page loader: logo inside a smooth spinning gold ring. */
export const PageLoader: React.FC<{ label?: string; className?: string }> = ({ label = 'Loading', className = '' }) => (
  <div
    className={`flex min-h-[70vh] w-full flex-col items-center justify-center gap-5 bg-white ${className}`}
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="relative h-20 w-20">
      {/* static track */}
      <span className="absolute inset-0 rounded-full border-2 border-neutral-200" />
      {/* spinning gold arc */}
      <span
        className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
        style={{ borderTopColor: '#B8913A', borderRightColor: '#B8913A', animationDuration: '0.9s' }}
      />
      <img
        src="/logo.webp?v=1"
        alt=""
        aria-hidden="true"
        className="absolute inset-3 h-14 w-14 object-contain animate-pulse"
      />
    </div>
    <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-neutral-500">
      {label}
      <span className="sr-only">…</span>
    </span>
  </div>
);
