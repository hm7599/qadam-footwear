import React from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Sparkles, RotateCcw, ShieldCheck, ArrowRight } from 'lucide-react';

const SECTIONS = [
  {
    icon: Handshake,
    title: 'Agreeing to These Terms',
    text: 'By using the QADAM website or buying from us, you agree to these terms.',
  },
  {
    icon: Sparkles,
    title: 'Limited Edition Shoes',
    text: 'Shoes marked "Limited Edition" are made in small numbers only. Orders are confirmed first come, first served. We may cancel orders placed by bots or automated tools so that every customer gets a fair chance.',
  },
  {
    icon: RotateCcw,
    title: 'Free 30-Day Returns',
    text: 'You can return any unworn shoes within 30 days for free. Please keep them in the original box with all tags attached.',
  },
  {
    icon: ShieldCheck,
    title: 'Warranty',
    text: 'Every QADAM shoe comes with a 2-year warranty against manufacturing defects, such as the sole coming apart, under normal use.',
  },
];

export const TermsAndConditionsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FBF7F1] pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A8824C]">Legal · Terms of use</span>
          <h1
            style={{ fontFamily: "'Cinzel', 'Playfair Display', serif", letterSpacing: '0.06em' }}
            className="mt-3 bg-gradient-to-r from-[#3B2618] via-[#8A5A2B] to-[#C9A46A] bg-clip-text text-3xl font-semibold uppercase text-transparent sm:text-5xl"
          >
            Terms &amp; Conditions
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
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A8824C]">
                    Section {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="mt-1 font-serif text-xl text-[#2A1A10]">{s.title}</h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#6E5442]">{s.text}</p>
                </div>
              </section>
            );
          })}
        </div>

        {/* Help */}
        <div className="relative mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-[#3B2618] via-[#4A3020] to-[#5A3A24] p-6 text-center text-white sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#E5B56D]/25 blur-3xl" />
          <h3 className="relative font-serif text-2xl">Have a question about these terms?</h3>
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
