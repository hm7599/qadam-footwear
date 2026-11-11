import React, { useState } from 'react';
import { Ruler, PenLine, TableProperties, ArrowRight, Footprints, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const SIZES = [
  { usMen: 6, uk: 5.5, eu: 38.5, cm: 24.0, inches: 9.4 },
  { usMen: 6.5, uk: 6, eu: 39, cm: 24.5, inches: 9.6 },
  { usMen: 7, uk: 6.5, eu: 40, cm: 25.0, inches: 9.8 },
  { usMen: 7.5, uk: 7, eu: 40.5, cm: 25.5, inches: 10.0 },
  { usMen: 8, uk: 7.5, eu: 41, cm: 26.0, inches: 10.2 },
  { usMen: 8.5, uk: 8, eu: 42, cm: 26.5, inches: 10.4 },
  { usMen: 9, uk: 8.5, eu: 42.5, cm: 27.0, inches: 10.6 },
  { usMen: 9.5, uk: 9, eu: 43, cm: 27.5, inches: 10.8 },
  { usMen: 10, uk: 9.5, eu: 44, cm: 28.0, inches: 11.0 },
  { usMen: 10.5, uk: 10, eu: 44.5, cm: 28.5, inches: 11.2 },
  { usMen: 11, uk: 10.5, eu: 45, cm: 29.0, inches: 11.4 },
  { usMen: 11.5, uk: 11, eu: 45.5, cm: 29.5, inches: 11.6 },
  { usMen: 12, uk: 11.5, eu: 46, cm: 30.0, inches: 11.8 },
  { usMen: 13, uk: 12.5, eu: 47.5, cm: 31.0, inches: 12.2 },
];

const WIDTHS = [
  { id: 'narrow', label: 'Narrow' },
  { id: 'standard', label: 'Standard' },
  { id: 'wide', label: 'Wide' },
] as const;

const STEPS = [
  { icon: Footprints, title: 'Stand on paper', text: 'Put a sheet of paper on the floor against a wall. Stand barefoot with your heel touching the wall.' },
  { icon: PenLine, title: 'Mark your longest toe', text: 'Hold a pen straight up and mark the tip of your longest toe. Do this for both feet.' },
  { icon: TableProperties, title: 'Measure & match', text: 'Measure from the wall to the mark in cm. Use the bigger foot and find it in the chart above.' },
];

const MIN = 23.5, MAX = 31.5;

export const SizeGuidePage: React.FC = () => {
  const [footCm, setFootCm] = useState<number>(27.0);
  const [footWidth, setFootWidth] = useState<'narrow' | 'standard' | 'wide'>('standard');

  const recommended = SIZES.reduce((prev, curr) =>
    Math.abs(curr.cm - footCm) < Math.abs(prev.cm - footCm) ? curr : prev
  );
  const pct = ((footCm - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="min-h-screen bg-[#FBF7F1] pt-32 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A8824C]">Find your fit</span>
          <h1
            style={{ fontFamily: "'Cinzel', 'Playfair Display', serif", letterSpacing: '0.06em' }}
            className="mt-3 bg-gradient-to-r from-[#3B2618] via-[#8A5A2B] to-[#C9A46A] bg-clip-text text-3xl font-semibold uppercase text-transparent sm:text-5xl"
          >
            Size Guide
          </h1>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#C9A46A] to-transparent" />
          <p
            style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
            className="mx-auto mt-4 max-w-2xl text-lg font-medium italic text-[#8A6A52] sm:text-xl"
          >
            Find your perfect shoe size in a few easy steps.
          </p>
        </div>

        {/* Calculator */}
        <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-3xl border border-[#EDE1CF] bg-white p-6 shadow-[0_20px_50px_-25px_rgba(59,38,24,0.25)] sm:p-10 lg:col-span-7">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B2618] to-[#5A3A24] shadow-lg shadow-[#3B2618]/20">
                <Ruler className="h-5 w-5 text-[#F3D9A4]" />
              </span>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A8824C]">Size calculator</span>
                <h2 className="font-serif text-2xl text-[#2A1A10]">Measure your foot</h2>
              </div>
            </div>

            {/* Length */}
            <div className="mt-8">
              <div className="flex items-end justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6A52]">Heel to toe length</span>
                <span className="text-right">
                  <span className="font-serif text-3xl text-[#2A1A10]">{footCm.toFixed(1)}</span>
                  <span className="ml-1 text-sm text-[#8A6A52]">cm</span>
                  <span className="ml-2 text-xs text-[#A8907A]">({(footCm / 2.54).toFixed(1)}")</span>
                </span>
              </div>
              <input
                type="range"
                min={MIN}
                max={MAX}
                step="0.5"
                value={footCm}
                onChange={e => setFootCm(Number(e.target.value))}
                aria-label="Foot length in centimetres"
                className="qadam-range mt-4 w-full cursor-pointer"
                style={{ background: `linear-gradient(to right, #8A5A2B 0%, #C9A46A ${pct}%, #EDE1CF ${pct}%, #EDE1CF 100%)` }}
              />
              <div className="mt-2 flex justify-between text-[11px] text-[#A8907A]">
                <span>{MIN} cm</span>
                <span>27.5 cm</span>
                <span>{MAX} cm</span>
              </div>
            </div>

            {/* Width */}
            <div className="mt-8">
              <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6A52]">Foot width</span>
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#F6EFE4] p-1.5">
                {WIDTHS.map(w => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setFootWidth(w.id)}
                    aria-pressed={footWidth === w.id}
                    className={`rounded-xl py-2.5 text-sm font-medium transition ${
                      footWidth === w.id
                        ? 'bg-[#3B2618] text-white shadow-md shadow-[#3B2618]/20'
                        : 'text-[#6E5442] hover:bg-white'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3B2618] via-[#4A3020] to-[#5A3A24] p-6 text-white sm:p-10 lg:col-span-5">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#E5B56D]/25 blur-3xl" />
            <span className="relative text-[11px] font-semibold uppercase tracking-[0.3em] text-[#E5B56D]">Your size</span>

            <div className="relative mt-4 text-center">
              <span className="block text-sm text-white/70">UK size</span>
              <span
                style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
                className="block bg-gradient-to-b from-[#F7E2B5] to-[#C9A46A] bg-clip-text text-7xl font-semibold leading-none text-transparent sm:text-8xl"
              >
                {recommended.uk}
              </span>
            </div>

            <div className="relative mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <span className="block font-serif text-2xl">{recommended.eu}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">EU</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <span className="block font-serif text-2xl">{recommended.usMen}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">US</span>
              </div>
            </div>

            <p className="relative mt-5 flex gap-2 rounded-2xl bg-white/5 p-3 text-sm leading-relaxed text-white/80">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#E5B56D]" />
              {footWidth === 'wide'
                ? 'You have wide feet, so we suggest going one size up.'
                : 'Choose your normal size. Leather softens and shapes to your foot after a few wears.'}
            </p>

            <Link
              to="/shop"
              className="group relative mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#E5B56D] to-[#C9A46A] py-4 text-xs font-bold uppercase tracking-[0.18em] text-[#2A1A10] shadow-lg transition hover:shadow-xl"
            >
              Shop UK size {recommended.uk}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-12 overflow-hidden rounded-3xl border border-[#EDE1CF] bg-white">
          <div className="flex items-center justify-between border-b border-[#EDE1CF] px-6 py-5 sm:px-8">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A8824C]">Size chart</span>
              <h3 className="font-serif text-xl text-[#2A1A10]">Size conversion chart</h3>
            </div>
            <span className="hidden rounded-full bg-[#F6EFE4] px-3 py-1 text-xs text-[#8A6A52] sm:inline">Your size is highlighted</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="bg-[#FBF7F1] text-[11px] uppercase tracking-[0.15em] text-[#8A6A52]">
                <tr>
                  <th className="px-4 sm:px-4 sm:px-6 py-3.5 font-semibold">UK</th>
                  <th className="px-4 sm:px-4 sm:px-6 py-3.5 font-semibold">EU</th>
                  <th className="px-4 sm:px-4 sm:px-6 py-3.5 font-semibold">US</th>
                  <th className="px-4 sm:px-4 sm:px-6 py-3.5 font-semibold">Length (cm)</th>
                  <th className="px-4 sm:px-4 sm:px-6 py-3.5 font-semibold">Length (inches)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1E7D8] text-[#2A1A10]">
                {SIZES.map(s => {
                  const active = s === recommended;
                  return (
                    <tr
                      key={s.usMen}
                      onClick={() => setFootCm(s.cm)}
                      className={`cursor-pointer transition-colors ${active ? 'bg-[#3B2618] text-white' : 'hover:bg-[#FBF4E8]'}`}
                    >
                      <td className={`px-4 sm:px-6 py-3 font-semibold ${active ? 'text-[#E5B56D]' : ''}`}>{s.uk}</td>
                      <td className="px-4 sm:px-6 py-3">{s.eu}</td>
                      <td className="px-4 sm:px-6 py-3">{s.usMen}</td>
                      <td className="px-4 sm:px-6 py-3 font-semibold">{s.cm.toFixed(1)} cm</td>
                      <td className={`px-4 sm:px-6 py-3 ${active ? 'text-white/70' : 'text-[#8A6A52]'}`}>{s.inches.toFixed(1)}"</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* How to measure */}
        <div>
          <div className="mb-6 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A8824C]">3 easy steps</span>
            <h3 className="mt-2 font-serif text-2xl text-[#2A1A10] sm:text-3xl">How to measure your foot</h3>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {STEPS.map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={st.title} className="group relative rounded-2xl border border-[#EDE1CF] bg-white p-6 transition hover:-translate-y-1 hover:border-[#C9A46A] hover:shadow-[0_20px_40px_-20px_rgba(59,38,24,0.3)]">
                  <span className="absolute right-5 top-4 font-serif text-4xl text-[#F1E7D8]">0{i + 1}</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6EFE4] transition group-hover:bg-[#3B2618]">
                    <Icon className="h-5 w-5 text-[#A8824C] transition group-hover:text-[#E5B56D]" />
                  </span>
                  <h4 className="mt-4 font-serif text-lg text-[#2A1A10]">{st.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#8A6A52]">{st.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
