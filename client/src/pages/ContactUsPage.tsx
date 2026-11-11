import React, { useState } from 'react';
import { useStoreInfo } from '../utils/storeSettings';
import { MessageCircle, Clock, CheckCircle2, ArrowRight, Send, Truck, Banknote, RefreshCw, Ruler, Mail } from 'lucide-react';

const TOPICS = [
  { value: 'Help with size & fit', icon: Ruler },
  { value: 'Order tracking & delivery', icon: Truck },
  { value: 'Returns & exchanges', icon: RefreshCw },
  { value: 'General question', icon: MessageCircle },
];

const HIGHLIGHTS = [
  { icon: Truck, tag: 'Nationwide', title: 'All Pakistan Delivery', text: 'Tracked shipping to every city and town across Pakistan.', foot: 'Delivered in 2 – 4 days' },
  { icon: Banknote, tag: 'Payment', title: 'Cash on Delivery', text: 'No advance payment. Check your parcel at your door, then pay.', foot: 'Available everywhere' },
  { icon: RefreshCw, tag: 'Peace of mind', title: 'Easy Size Exchange', text: "Size not perfect? We'll swap it for the right one.", foot: 'Hassle-free exchange' },
  { icon: MessageCircle, tag: 'Live help', title: 'WhatsApp Advisor', text: 'Real-time help with sizes, leather care and order updates.', foot: 'Quick replies' },
];

const inputCls =
  'w-full rounded-xl border border-[#E5D3B5] bg-white px-4 py-3 text-sm text-[#2A1A10] placeholder:text-[#B8A28C] transition focus:border-[#C9A46A] focus:outline-none focus:ring-4 focus:ring-[#E5B56D]/20';
const labelCls = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6A52]';

export const ContactUsPage: React.FC = () => {
  const store = useStoreInfo();
  const waNumber = store.phone.replace(/\D/g, '');
  const [form, setForm] = useState({ name: '', phone: '', topic: TOPICS[0].value, message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Assalam o Alaikum QADAM!\n\n*Name:* ${form.name}\n*Phone:* ${form.phone}\n*Topic:* ${form.topic}\n\n${form.message}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#FBF7F1] pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A8824C]">Customer Care</span>
          <h1
            style={{ fontFamily: "'Cinzel', 'Playfair Display', serif", letterSpacing: '0.06em' }}
            className="mt-3 bg-gradient-to-r from-[#3B2618] via-[#8A5A2B] to-[#C9A46A] bg-clip-text text-3xl font-semibold uppercase text-transparent sm:text-5xl"
          >
            Contact Us
          </h1>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#C9A46A] to-transparent" />
          <p
            style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
            className="mx-auto mt-4 max-w-2xl text-lg font-medium italic text-[#8A6A52] sm:text-xl"
          >
            We're here to help with sizes, orders, exchanges and delivery anywhere in Pakistan.
          </p>
        </div>

        <div className="mb-20 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">

          {/* Form */}
          <div className="rounded-3xl border border-[#EDE1CF] bg-white p-6 shadow-[0_20px_50px_-25px_rgba(59,38,24,0.25)] sm:p-10 lg:col-span-7">
            <div className="mb-8 flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B2618] to-[#5A3A24] shadow-lg shadow-[#3B2618]/20">
                <Send className="h-5 w-5 text-[#F3D9A4]" />
              </span>
              <div>
                <h2 className="font-serif text-2xl text-[#2A1A10]">Send us a message</h2>
                <p className="text-sm text-[#8A6A52]">We usually reply within 2 hours.</p>
              </div>
            </div>

            {sent ? (
              <div className="rounded-2xl border border-[#EDE1CF] bg-[#FBF7F1] p-10 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white ring-1 ring-[#E5D3B5]">
                  <CheckCircle2 className="h-8 w-8 text-[#A8824C]" />
                </span>
                <h3 className="mt-5 font-serif text-2xl text-[#2A1A10]">Almost done!</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#8A6A52]">
                  WhatsApp has opened with your message. Just press <b>send</b> there and our team will reply soon.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ ...form, message: '' }); }}
                  className="mt-6 rounded-full border border-[#E5D3B5] bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#3B2618] transition hover:border-[#C9A46A]"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="c-name" className={labelCls}>Full name *</label>
                    <input id="c-name" type="text" required placeholder="Your name" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="c-phone" className={labelCls}>Mobile / WhatsApp *</label>
                    <input id="c-phone" type="tel" required placeholder="0300 1234567" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
                  </div>
                </div>

                <div>
                  <span className={labelCls}>What do you need help with?</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {TOPICS.map(t => {
                      const active = form.topic === t.value;
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setForm({ ...form, topic: t.value })}
                          aria-pressed={active}
                          className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-[13px] font-medium transition ${
                            active
                              ? 'border-[#3B2618] bg-[#3B2618] text-white shadow-md shadow-[#3B2618]/20'
                              : 'border-[#E5D3B5] bg-white text-[#3B2618] hover:border-[#C9A46A] hover:bg-[#FBF4E8]'
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#E5B56D]' : 'text-[#A8824C]'}`} />
                          {t.value}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="c-msg" className={labelCls}>Your message *</label>
                  <textarea id="c-msg" required rows={5} placeholder="Tell us how we can help…" value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })} className={inputCls + ' resize-none'} />
                </div>

                <button
                  type="submit"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#3B2618] to-[#5A3A24] px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-[#3B2618]/25 transition hover:shadow-xl sm:w-auto"
                >
                  Send on WhatsApp
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            )}
          </div>

          {/* Side */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-3xl border border-[#EDE1CF] bg-white p-6 sm:p-8">
              <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A8824C]">Reach us</span>
              <h3 className="mt-1 font-serif text-2xl text-[#2A1A10]">Helplines</h3>
              <div className="mt-6 space-y-3">
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border border-[#EDE1CF] p-4 transition hover:border-[#C9A46A] hover:bg-[#FBF4E8]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F6EFE4]">
                    <MessageCircle className="h-5 w-5 text-[#A8824C]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#2A1A10]">WhatsApp</span>
                    <span className="block truncate text-sm text-[#8A6A52]">{store.phone}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#C9A46A] transition-transform group-hover:translate-x-1" />
                </a>
                {store.email && (
                  <a href={`mailto:${store.email}`}
                    className="group flex items-center gap-4 rounded-2xl border border-[#EDE1CF] p-4 transition hover:border-[#C9A46A] hover:bg-[#FBF4E8]">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F6EFE4]">
                      <Mail className="h-5 w-5 text-[#A8824C]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#2A1A10]">Email</span>
                      <span className="block truncate text-sm text-[#8A6A52]">{store.email}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#C9A46A] transition-transform group-hover:translate-x-1" />
                  </a>
                )}
                <div className="flex items-center gap-4 rounded-2xl border border-[#EDE1CF] p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F6EFE4]">
                    <Clock className="h-5 w-5 text-[#A8824C]" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#2A1A10]">Open 24/7 online</span>
                    <span className="block text-sm text-[#8A6A52]">Fast TCS & Leopards delivery</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3B2618] via-[#4A3020] to-[#5A3A24] p-6 text-white sm:p-8">
              <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#E5B56D]/25 blur-3xl" />
              <span className="relative text-[11px] font-semibold uppercase tracking-[0.3em] text-[#E5B56D]">Chat with us</span>
              <h4 className="relative mt-1 font-serif text-2xl">Need help choosing?</h4>
              <p className="relative mt-2 text-sm leading-relaxed text-white/75">
                Talk to our fitting advisors on WhatsApp about sizes, Cash on Delivery and delivery times.
              </p>
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Hello QADAM, I would like to ask about your shoes.')}`}
                target="_blank"
                rel="noreferrer"
                className="group relative mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E5B56D] to-[#C9A46A] px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#2A1A10] shadow-lg transition hover:shadow-xl"
              >
                Start WhatsApp chat
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div>
          <div className="mb-8 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A8824C]">Why shop with us</span>
            <h3 className="mt-2 font-serif text-2xl text-[#2A1A10] sm:text-3xl">100% online · Delivered across Pakistan</h3>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map(h => {
              const Icon = h.icon;
              return (
                <div key={h.title} className="group rounded-2xl border border-[#EDE1CF] bg-white p-6 transition hover:-translate-y-1 hover:border-[#C9A46A] hover:shadow-[0_20px_40px_-20px_rgba(59,38,24,0.3)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6EFE4] transition group-hover:bg-[#3B2618]">
                    <Icon className="h-5 w-5 text-[#A8824C] transition group-hover:text-[#E5B56D]" />
                  </span>
                  <span className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A8824C]">{h.tag}</span>
                  <h4 className="mt-1 font-serif text-lg text-[#2A1A10]">{h.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#8A6A52]">{h.text}</p>
                  <p className="mt-4 border-t border-[#F1E7D8] pt-3 text-xs font-semibold text-[#3B2618]">{h.foot}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
