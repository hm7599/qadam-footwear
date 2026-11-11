import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, ArrowRight } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';
import { imgUrl } from '../../utils/img';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TimeBox: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_25px_-12px_rgba(90,55,25,0.35)] ring-1 ring-[#E8DCCB]">
      <motion.span
        key={value}
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="font-serif text-3xl sm:text-4xl font-semibold tabular-nums text-[#3B2414]"
      >
        {value}
      </motion.span>
    </div>
    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8B6B4A]">{label}</span>
  </div>
);

export const DropCountdownSection: React.FC = () => {
  const { openPrompt, isSubscribed } = useNotification();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 2, hours: 14, minutes: 38, seconds: 42 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const sold = 347;
  const total = 500;
  const pct = Math.round((sold / total) * 100);

  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FBF6EF] via-[#F4EADD] to-[#EAD9C3] ring-1 ring-[#E8DCCB]">
          {/* Soft decorative glows */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-10 h-80 w-80 rounded-full bg-[#C99A6B]/25 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 p-6 sm:p-10 lg:p-14 items-center">

            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 order-2 lg:order-1 space-y-7"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-[#3B2414] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F4EADD]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E0B07A] animate-pulse" />
                Limited Edition
              </span>

              <div>
                <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight text-[#2A190D]">
                  The Classic<br />Brown Brogue
                </h2>
                <p className="mt-4 max-w-md text-base text-[#6B4F36] leading-relaxed">
                  Rich brown leather, handmade with fine brogue details. Only 500 pairs will be made.
                </p>
              </div>

              {/* Countdown */}
              <div>
                <p className="mb-3 text-xs font-semibold text-[#3B2414]">Sale starts in:</p>
                <div className="flex items-start gap-2 sm:gap-3">
                  <TimeBox value={pad(timeLeft.days)} label="Days" />
                  <span className="mt-5 sm:mt-6 font-serif text-2xl text-[#C99A6B]">:</span>
                  <TimeBox value={pad(timeLeft.hours)} label="Hours" />
                  <span className="mt-5 sm:mt-6 font-serif text-2xl text-[#C99A6B]">:</span>
                  <TimeBox value={pad(timeLeft.minutes)} label="Mins" />
                  <span className="mt-5 sm:mt-6 font-serif text-2xl text-[#C99A6B]">:</span>
                  <TimeBox value={pad(timeLeft.seconds)} label="Secs" />
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={openPrompt}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#3B2414] px-7 text-[12px] font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#2A190D] hover:shadow-lg cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                  {isSubscribed ? 'You will be notified' : 'Notify Me'}
                </button>
                <Link
                  to="/product/qadam-phantom-01"
                  className="group flex h-12 items-center justify-center gap-2 rounded-full bg-white/70 px-7 text-[12px] font-semibold uppercase tracking-wider text-[#3B2414] ring-1 ring-[#D9C4A8] transition-all hover:bg-white"
                >
                  View Details
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Stock progress */}
              <div className="max-w-sm">
                <div className="mb-2 flex justify-between text-xs text-[#6B4F36]">
                  <span><b className="text-[#3B2414]">{sold}</b> of {total} already reserved</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/70 ring-1 ring-[#E8DCCB]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#C99A6B] to-[#7A4A25]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Right: Shoe */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 order-1 lg:order-2"
            >
              <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl shadow-[0_30px_60px_-25px_rgba(90,55,25,0.45)]">
                <img
                  src={imgUrl("/images/drop/brown-brogue.png", 960)} decoding="async" loading="lazy"
                  alt="Classic Brown Brogue"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#3B2414] backdrop-blur">
                  Only 500 Pairs
                </span>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};
