import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

const PERKS = [
  'Early access to new shoes before anyone else',
  'Special members-only offers',
  'Invites to store events',
  'No spam — only useful updates',
];

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section className="bg-gradient-to-br from-[#F6EFE4] via-[#F3EADC] to-[#EADCC7] py-20 sm:py-28 border-b border-[#E2D6C3] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hairline-grid opacity-[0.06]" />
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-5 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #C9A96E, transparent)' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-6"
          >
            <div>
              <span className="font-tech text-[9px] uppercase tracking-[0.35em] text-neutral-500 block mb-4">
                JOIN OUR LIST
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-neutral-950 leading-[0.95]">
                Get Early<br />
                <span className="font-editorial italic font-normal text-[#9A7348]">Access</span>
              </h2>
            </div>

            <ul className="space-y-3">
              {PERKS.map((perk, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="flex items-start gap-3 font-tech text-[11px] uppercase tracking-wider text-neutral-700"
                >
                  <span className="flex h-4 w-4 items-center justify-center bg-white rounded-full text-[#9A7348] flex-shrink-0 mt-0.5">
                    <Check className="h-2.5 w-2.5 text-[#9A7348]" />
                  </span>
                  {perk}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 lg:col-start-8"
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl bg-white p-8 shadow-sm text-center space-y-3"
              >
                <div className="flex h-12 w-12 items-center justify-center bg-emerald-50 rounded-full mx-auto">
                  <Check className="h-6 w-6 text-emerald-700" />
                </div>
                <p className="font-display text-lg font-bold text-neutral-950 uppercase tracking-wider">
                  Enrolled
                </p>
                <p className="font-tech text-[10px] uppercase tracking-widest text-neutral-600">
                  You will get our latest news and offers.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-tech text-[9px] uppercase tracking-[0.3em] text-neutral-500 block mb-2">
                    Your Email Address
                  </label>
                  <div className={`relative rounded-full border transition-colors duration-200 ${focused ? 'border-neutral-900 bg-white' : 'border-[#D9C9B1] bg-white/70'}`}>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder="yourname@example.com"
                      className="w-full bg-transparent px-5 py-4 font-tech text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none uppercase tracking-wider"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 rounded-full bg-neutral-950 text-white px-7 py-4 font-tech text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-neutral-800"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="font-tech text-[9px] uppercase tracking-wider text-neutral-500 text-center">
                  Unsubscribe anytime. No spam.
                </p>
              </form>
            )}
          </motion.div>

        </div>
      </div>
    </section>
  );
};
