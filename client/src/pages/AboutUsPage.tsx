import React from 'react';
import { Sparkles, Award, ShieldCheck, Feather, Cpu, Leaf, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { imgUrl } from '../utils/img';

export const AboutUsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Hero */}
        <div className="max-w-4xl border-b border-neutral-200 pb-12 mb-16">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400">[ QADAM HERITAGE ARCHIVE ]</span>
            <span className="h-1 w-1 bg-black rounded-full" />
            <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-500">EST. 2024</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-neutral-950 leading-[1.05]">
            Architectural Sculpture. <br />
            <span className="font-editorial italic font-normal text-neutral-500 lowercase">zero-gravity</span> Velocity.
          </h1>
          <p className="mt-8 font-editorial text-xl sm:text-2xl text-neutral-600 leading-relaxed max-w-3xl">
            Founded by an alliance of footwear biomechanics specialists and master leather cordwainers, QADAM exists for a singular mission: to elevate everyday movement through uncompromising handcrafted leather footwear.
          </p>
        </div>

        {/* Big Photography Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <div className="border border-neutral-200 bg-neutral-50 h-[460px] overflow-hidden group">
            <img
              src={imgUrl("https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=85", 960)} decoding="async" loading="lazy"
              alt="QADAM Handcrafted Shoemaking"
              className="h-full w-full object-cover filter grayscale contrast-115 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="p-4 border-t border-neutral-200 bg-white flex justify-between font-tech text-[10px] uppercase tracking-widest text-neutral-400">
              <span>PLATE 01 // HAND LASTING</span>
              <span>QADAM CRAFTSMANSHIP STUDIO</span>
            </div>
          </div>
          <div className="border border-neutral-200 bg-neutral-50 h-[460px] overflow-hidden group">
            <img
              src={imgUrl("https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85", 960)} decoding="async" loading="lazy"
              alt="QADAM Prototype Laboratory"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="p-4 border-t border-neutral-200 bg-white flex justify-between font-tech text-[10px] uppercase tracking-widest text-neutral-400">
              <span>PLATE 02 // KINETIC PROTOTYPING</span>
              <span>WIND TUNNEL AERODYNAMICS</span>
            </div>
          </div>
        </div>

        {/* 3 Pillars of Innovation */}
        <div className="mb-24">
          <div className="border-b border-neutral-200 pb-6 mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400 block mb-1">
                [ STRUCTURAL AXIOMS ]
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-neutral-950">
                Zero-Compromise Engineering
              </h2>
            </div>
            <p className="font-editorial text-base italic text-neutral-500 max-w-md">
              Every curve is dictated by kinematics; every gram calibrated for effortless acceleration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-neutral-200 bg-white p-8 space-y-4 hover:border-black transition-colors">
              <span className="font-tech text-xs font-bold text-black border border-black px-2 py-0.5">AXIOM 01</span>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-black">
                Aerospace Carbon Monocoque
              </h3>
              <p className="font-tech text-xs text-neutral-600 leading-relaxed">
                We embed structural 3K woven carbon fiber bridges directly inside our midsoles, stabilizing torsional twist while providing catapult-like kinetic propulsion.
              </p>
            </div>

            <div className="border border-neutral-200 bg-white p-8 space-y-4 hover:border-black transition-colors">
              <span className="font-tech text-xs font-bold text-black border border-black px-2 py-0.5">AXIOM 02</span>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-black">
                Nitrogen Micro-Foam
              </h3>
              <p className="font-tech text-xs text-neutral-600 leading-relaxed">
                By charging biopolymer compounds with supercritical liquid nitrogen, we produce closed-cell foams 40% lighter than standard EVA, returning 87% bounce.
              </p>
            </div>

            <div className="border border-neutral-200 bg-white p-8 space-y-4 hover:border-black transition-colors">
              <span className="font-tech text-xs font-bold text-black border border-black px-2 py-0.5">AXIOM 03</span>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-black">
                Circular Biopolymers
              </h3>
              <p className="font-tech text-xs text-neutral-600 leading-relaxed">
                100% of our upper knitting fibers are sourced from ocean-recovered plastics and castor oil biopolymers. Every silhouette is carbon-neutral certified.
              </p>
            </div>
          </div>
        </div>

        {/* Atelier Numbers */}
        <div className="border border-neutral-200 bg-neutral-50/50 p-10 sm:p-16 mb-24">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
            <div className="pt-4 sm:pt-0">
              <p className="font-display text-5xl sm:text-6xl font-black tracking-tight text-black">140</p>
              <p className="font-tech text-[10px] text-neutral-500 uppercase tracking-widest mt-2">Manual Craft Steps</p>
            </div>
            <div className="pt-4 sm:pt-0">
              <p className="font-display text-5xl sm:text-6xl font-black tracking-tight text-black">198G</p>
              <p className="font-tech text-[10px] text-neutral-500 uppercase tracking-widest mt-2">Velocity Strata Mass</p>
            </div>
            <div className="pt-4 sm:pt-0">
              <p className="font-display text-5xl sm:text-6xl font-black tracking-tight text-black">100%</p>
              <p className="font-tech text-[10px] text-neutral-500 uppercase tracking-widest mt-2">Nationwide Online Delivery</p>
            </div>
            <div className="pt-4 sm:pt-0">
              <p className="font-display text-5xl sm:text-6xl font-black tracking-tight text-black">500</p>
              <p className="font-tech text-[10px] text-neutral-500 uppercase tracking-widest mt-2">Numbered Pairs / Drop</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="border border-neutral-200 bg-white p-12 text-center space-y-6 max-w-2xl mx-auto">
          <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400 block">
            [ ATELIER DISPATCH ]
          </span>
          <h3 className="font-display text-3xl font-black uppercase tracking-tight text-black">
            Experience the Future on Foot
          </h3>
          <p className="font-editorial text-lg italic text-neutral-500 max-w-md mx-auto">
            Discover our collection of performance and architectural silhouettes designed to transcend seasons.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-3 bg-black px-9 py-4 font-tech text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-colors"
          >
            <span>Explore Collection</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </div>
  );
};
