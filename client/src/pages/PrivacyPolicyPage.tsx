import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ClipboardList, BellRing, Lock, Mail, ArrowRight, Check } from 'lucide-react';

const COLLECTED = [
  { label: 'Contact details', text: 'your name, email and phone number.' },
  { label: 'Delivery address', text: 'where you want your order delivered.' },
  { label: 'Shoe size', text: 'the size and foot length you enter in our size guide.' },
  { label: 'Notifications', text: 'if you turn on notifications, a code from your browser so we can send you alerts. It does not include your name.' },
];

const SECTIONS: { icon: React.ElementType; title: string; body: React.ReactNode }[] = [
  {
    icon: ShieldCheck,
    title: 'We Respect Your Privacy',
    body: <p>QADAM ("we", "our") keeps your personal information safe. This page explains what information we collect and why. We only collect what we need to process and deliver your order.</p>,
  },
  {
    icon: ClipboardList,
    title: 'What Information We Collect',
    body: (
      <>
        <p>We only collect information needed for your order:</p>
        <ul className="mt-3 space-y-2.5">
          {COLLECTED.map(c => (
            <li key={c.label} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F6EFE4]">
                <Check className="h-3 w-3 text-[#A8824C]" />
              </span>
              <span><strong className="font-semibold text-[#2A1A10]">{c.label}:</strong> {c.text}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    icon: BellRing,
    title: 'Notifications & How to Turn Them Off',
    body: <p>If you allow notifications, we save a code from your browser so we can send you alerts about new shoes and offers. This code is not linked to your name. You can turn notifications off at any time in your browser settings.</p>,
  },
  {
    icon: Lock,
    title: 'Safe Payments',
    body: <p>All payments are protected with secure encryption. We never store your card number or CVV.</p>,
  },
  {
    icon: Mail,
    title: 'Contact Us',
    body: (
      <p>
        If you want us to delete your information, or have any question about your privacy, email us at{' '}
        <a href="mailto:privacy@qadamshoes.com" className="font-semibold text-[#8A5A2B] underline decoration-[#C9A46A] underline-offset-4 hover:text-[#3B2618]">
          privacy@qadamshoes.com
        </a>.
      </p>
    ),
  },
];

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FBF7F1] pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A8824C]">Legal · Your privacy</span>
          <h1
            style={{ fontFamily: "'Cinzel', 'Playfair Display', serif", letterSpacing: '0.06em' }}
            className="mt-3 bg-gradient-to-r from-[#3B2618] via-[#8A5A2B] to-[#C9A46A] bg-clip-text text-3xl font-semibold uppercase text-transparent sm:text-5xl"
          >
            Privacy Policy
          </h1>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#C9A46A] to-transparent" />
          <span className="mt-4 inline-block rounded-full border border-[#E5D3B5] bg-white px-4 py-1.5 text-xs font-medium text-[#8A6A52]">
            Last updated: November 2026
          </span>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <section
                key={s.title}
                className="group flex flex-col gap-4 sm:flex-row sm:gap-5 rounded-2xl border border-[#EDE1CF] bg-white p-5 transition hover:border-[#C9A46A] hover:shadow-[0_20px_40px_-24px_rgba(59,38,24,0.3)] sm:p-8"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F6EFE4] transition group-hover:bg-[#3B2618]">
                  <Icon className="h-5 w-5 text-[#A8824C] transition group-hover:text-[#E5B56D]" />
                </span>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A8824C]">
                    Section {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="mt-1 font-serif text-xl text-[#2A1A10]">{s.title}</h2>
                  <div className="mt-2 text-[15px] leading-relaxed text-[#6E5442]">{s.body}</div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Help */}
        <div className="relative mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-[#3B2618] via-[#4A3020] to-[#5A3A24] p-6 text-center text-white sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#E5B56D]/25 blur-3xl" />
          <h3 className="relative font-serif text-2xl">Questions about your data?</h3>
          <p className="relative mt-2 text-sm text-white/75">Our team is happy to help on WhatsApp or email.</p>
          <Link
            to="/contact"
            className="group relative mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E5B56D] to-[#C9A46A] px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#2A1A10] shadow-lg transition hover:shadow-xl"
          >
            Contact us
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
