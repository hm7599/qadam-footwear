import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroSection } from '../components/home/HeroSection';
import { FreeShippingAnnouncement } from '../components/cart/PromoWidgets';
import { TrustStrip } from "../components/home/TrustStrip";
import { ShopByCategory } from "../components/home/ShopByCategory";
const InteractiveShowcase = lazy(() => import('../components/home/InteractiveShowcase').then(m => ({ default: m.InteractiveShowcase })));
import { CollectionsSection } from '../components/home/CollectionsSection';
const TrendingSection = lazy(() => import('../components/home/TrendingSection').then(m => ({ default: m.TrendingSection })));
const AtelierPhotoGallery = lazy(() => import('../components/home/AtelierPhotoGallery').then(m => ({ default: m.AtelierPhotoGallery })));
const DropCountdownSection = lazy(() => import('../components/home/DropCountdownSection').then(m => ({ default: m.DropCountdownSection })));
const NewsletterSection = lazy(() => import('../components/home/NewsletterSection').then(m => ({ default: m.NewsletterSection })));
import { Product } from '../types';
import { imgUrl } from '../utils/img';

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
};

/** Full-bleed editorial collection banner */
const CollectionBanner: React.FC<{
  title: string;
  kicker: string;
  copy: string;
  to: string;
  image: string;
  reverse?: boolean;
  dark?: boolean;
}> = ({ title, kicker, copy, to, image, reverse, dark }) => (
  <section className={`border-b border-neutral-200 overflow-hidden ${dark ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-900'}`}>
    <motion.div
      {...fadeUp}
      className={`mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2 ${reverse ? 'lg:[direction:rtl]' : ''}`}
    >
      {/* Text Side */}
      <div
        className={`[direction:ltr] flex flex-col justify-center gap-6 p-8 sm:p-14 lg:p-20 ${
          reverse ? 'lg:order-2' : ''
        }`}
      >
        <span className={`font-tech text-[9.5px] uppercase tracking-[0.35em] font-bold ${dark ? 'text-neutral-400' : 'text-neutral-400'}`}>
          {kicker}
        </span>
        <h3 className="font-serif text-4xl sm:text-6xl font-normal tracking-tight leading-[1.02] whitespace-pre-line">
          {title}
        </h3>
        <p className={`max-w-md text-sm sm:text-base leading-relaxed font-sans ${dark ? 'text-neutral-400' : 'text-neutral-600'}`}>
          {copy}
        </p>
        <Link
          to={to}
          className={`group inline-flex w-fit items-center gap-3 px-8 py-4 font-tech text-[11px] uppercase tracking-[0.2em] font-bold transition-all shadow-md active:scale-98 ${
            dark
              ? 'bg-white text-neutral-950 hover:bg-neutral-200'
              : 'bg-black text-white hover:bg-neutral-800'
          }`}
        >
          <span>Shop Collection</span>
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Image Side */}
      <div className={`[direction:ltr] ${reverse ? 'lg:order-1' : ''} min-h-[320px] lg:min-h-[520px] overflow-hidden`}>
        <img
          src={imgUrl(image, 960)} decoding="async"
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
      </div>
    </motion.div>
  </section>
);

export const HomePage: React.FC<{ products: Product[] }> = ({ products }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* 1. Hero */}
      <HeroSection />
      <FreeShippingAnnouncement />

      {/* 2. Trust: delivery, COD, returns, original */}
      <TrustStrip />

      {/* 3. Quick category entry */}
      <ShopByCategory products={products} />

      {/* 4. Featured products */}
      <CollectionsSection products={products} />

      {/* Below the fold: loaded in the background after the first screen */}
      <Suspense fallback={<div className="min-h-[40vh]" />}>
      {/* 5. Featured product spotlight */}
      <TrendingSection products={products} />

      {/* 6. Limited edition countdown */}
      <DropCountdownSection />

      {/* 7. Craft story */}
      <InteractiveShowcase products={products} />

      {/* 8. Handmade collection gallery */}
      <AtelierPhotoGallery />

      {/* 9. Banner */}
      <CollectionBanner
        kicker="HANDMADE IN ITALY"
        title={'Made to\nLast.'}
        copy="Strong, stylish shoes made with care. Comfortable from the first day and built to last for years."
        to="/shop"
        image="/images/atelier/formal_boot_set2_2.jpg"
        dark
      />
      </Suspense>
    </div>
  );
};
