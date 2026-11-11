import React from 'react';
import { Truck, Banknote, RotateCcw, ShieldCheck } from 'lucide-react';

const ITEMS = [
  { icon: Truck, title: 'Free Delivery', text: 'All over Pakistan' },
  { icon: Banknote, title: 'Cash on Delivery', text: 'Pay when it arrives' },
  { icon: RotateCcw, title: 'Easy Returns', text: '30 days, free size exchange' },
  { icon: ShieldCheck, title: '100% Original', text: 'Quality checked by hand' },
];

/** Short reassurance row shown right under the hero */
export const TrustStrip: React.FC = () => (
  <section className="border-b border-neutral-200 bg-white">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, text }, i) => (
          <div
            key={title}
            className={`flex items-center gap-3 py-5 sm:py-6 ${i % 2 === 1 ? 'pl-4 sm:pl-6' : ''} ${
              i > 0 ? 'lg:border-l lg:border-neutral-200 lg:pl-6' : ''
            } ${i < 2 ? 'border-b border-neutral-200 lg:border-b-0' : ''}`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">{title}</p>
              <p className="truncate text-xs text-neutral-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
