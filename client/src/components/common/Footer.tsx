import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Truck, ShieldCheck, RotateCcw, Phone, Mail, MapPin } from 'lucide-react';
import { useStoreWhatsAppNumber } from '../../utils/whatsapp';
import { useStoreInfo, usePaymentSettings, onlineMethodNames } from '../../utils/storeSettings';

const NAV_COLUMNS = [
  {
    title: 'Categories',
    links: [
      { label: 'Casuals', href: '/shop?category=casuals' },
      { label: 'Formals', href: '/shop?category=formals' },
      { label: 'Sandals', href: '/shop?category=sandals' },
      { label: 'Slides', href: '/shop?category=slides' },
      { label: 'Best Sellers', href: '/best-sellers' },
      { label: 'Chelsea Boots', href: '/shop?category=chelsea-boots' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Track Order', href: '/track-order' },
      { label: 'Size Guide', href: '/size-guide' },
      { label: 'Returns & Exchange', href: '/terms' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

const PERKS = [
  { icon: Truck, title: 'Fast Delivery', text: 'All over Pakistan via TCS & Leopards' },
  { icon: ShieldCheck, title: 'Cash on Delivery', text: 'Pay when you receive your order' },
  { icon: RotateCcw, title: 'Easy Returns', text: 'Hassle-free size exchange' },
];


const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

// "923001234567" -> "+92 300 1234567"
const prettyPhone = (n: string) => n.replace(/^(\d{2})(\d{3})(\d+)$/, '+$1 $2 $3');

export const Footer: React.FC = () => {
  const storeNumber = useStoreWhatsAppNumber();
  const store = useStoreInfo();
  const pay = usePaymentSettings();
  // Only payment methods the admin actually switched on (Admin → Settings → Payments)
  const payments = [...(pay.codEnabled ? ['Cash on Delivery'] : []), ...(pay.onlineEnabled ? onlineMethodNames(pay) : [])];
  const socialHref: Record<string, string> = { Instagram: store.socials.instagram, Facebook: store.socials.facebook, TikTok: store.socials.tiktok, YouTube: store.socials.youtube };
  const socials = SOCIALS.filter(x => socialHref[x.name]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 2800);
  };

  return (
    <footer className="bg-[#FAF8F5] text-neutral-700 font-sans border-t border-neutral-200">

      {/* ── PERKS STRIP ── */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-3 gap-4 px-4 py-6 sm:px-6 lg:px-8">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F3EEE7] text-[#7A4A25]">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{title}</p>
                <p className="text-xs text-neutral-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-12">

          {/* Brand + contact */}
          <div className="col-span-2 lg:col-span-4 space-y-5">
            <Link to="/" className="inline-flex">
              <img src="/logo.png" alt="QADAM Men's Footwear" className="h-20 w-auto object-contain" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-neutral-500">
              Handmade leather shoes and comfortable sneakers, designed to look good and last for years.
            </p>

            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={`https://wa.me/${storeNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-8 items-center gap-2.5 text-neutral-700 hover:text-[#128C7E] transition-colors"
                >
                  <Phone className="h-4 w-4 text-emerald-600" />
                  {prettyPhone(storeNumber)} (WhatsApp Support)
                </a>
              </li>
              <li className="inline-flex items-center gap-2.5 text-neutral-700">
                <Truck className="h-4 w-4 text-neutral-400" />
                Nationwide Delivery Across Pakistan
              </li>
              <li className="inline-flex items-center gap-2.5 text-neutral-700">
                <RotateCcw className="h-4 w-4 text-neutral-400" />
                100% Online Store · Doorstep Size Exchanges
              </li>
            </ul>

            <div className="flex items-center gap-2 pt-1">
              {socials.map(s => (
                <a
                  key={s.name}
                  href={socialHref[s.name]}
                  target="_blank"
                  rel="noreferrer"
                  title={s.name}
                  aria-label={s.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-600 ring-1 ring-neutral-200 transition-all hover:bg-neutral-950 hover:text-white hover:ring-neutral-950"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {NAV_COLUMNS.map(col => (
            <div key={col.title} className="lg:col-span-2">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-neutral-950">{col.title}</h4>
              <ul className="space-y-0.5 text-sm">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="inline-block py-1.5 text-neutral-500 transition-colors hover:text-neutral-950"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Online Concierge (WhatsApp) */}
          <div className="col-span-2 lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-950">Online Assistance</h4>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Have questions about size, fit, or Cash on Delivery? Chat directly with us.
            </p>
            <a
              href={`https://wa.me/${storeNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>WhatsApp Us</span>
            </a>
          </div>

        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} <span className="font-semibold text-neutral-800">QADAM</span>. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {payments.map(p => (
              <span
                key={p}
                className="rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-200"
              >
                {p}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <Link to="/privacy" className="inline-block py-1.5 hover:text-neutral-950 transition-colors">Privacy</Link>
            <Link to="/terms" className="inline-block py-1.5 hover:text-neutral-950 transition-colors">Terms</Link>
            <Link to="/admin" className="inline-block py-1.5 opacity-60 hover:opacity-100 hover:text-neutral-950 transition-all">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
