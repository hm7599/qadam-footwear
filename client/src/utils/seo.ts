import { useEffect } from 'react';

// Per-page <title>, description, canonical, Open Graph / Twitter tags and JSON-LD.
const SITE = "QADAM Men's Footwear";
const DEFAULT_DESC = 'Handmade leather shoes for men in Pakistan — formals, loafers, sneakers, sandals and boots. Cash on delivery, easy exchange, delivery all over Pakistan.';
const DEFAULT_IMG = '/images/mockup/hero-formal-banner-2x.png';

export interface PageMeta {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'product';
  noindex?: boolean;
  jsonLd?: Record<string, any> | null;
}

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', value);
}

export function applyMeta(m: PageMeta) {
  const title = m.title ? `${m.title} | ${SITE}` : `${SITE} — Handmade Leather Shoes in Pakistan`;
  const desc = (m.description || DEFAULT_DESC).replace(/\s+/g, ' ').slice(0, 160);
  const url = location.origin + location.pathname;
  const img = new URL(m.image || DEFAULT_IMG, location.origin).href;

  document.title = title;
  setMeta('name', 'description', desc);
  setMeta('name', 'robots', m.noindex ? 'noindex, nofollow' : 'index, follow');
  setMeta('property', 'og:site_name', SITE);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:type', m.type || 'website');
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', img);
  setMeta('property', 'og:locale', 'en_PK');
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', desc);
  setMeta('name', 'twitter:image', img);

  let canon = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon); }
  canon.href = url;

  // JSON-LD (structured data) — one script we replace on each page
  document.getElementById('page-jsonld')?.remove();
  if (m.jsonLd) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = 'page-jsonld';
    s.textContent = JSON.stringify(m.jsonLd);
    document.head.appendChild(s);
  }
}

/** Set page meta while a component is shown */
export function usePageMeta(m: PageMeta, deps: any[] = []) {
  useEffect(() => { applyMeta(m); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, deps);
}

/** Default meta for each route (pages with their own meta override this) */
export const ROUTE_META: Array<{ match: RegExp; meta: PageMeta }> = [
  { match: /^\/$/, meta: { jsonLd: { '@context': 'https://schema.org', '@type': 'OnlineStore', name: SITE, url: '/', areaServed: 'PK', currenciesAccepted: 'PKR', paymentAccepted: 'Cash on Delivery, Bank Transfer' } } },
  { match: /^\/shop/, meta: { title: 'Shop All Shoes', description: 'Browse all QADAM shoes — formal, casual, loafers, sandals, slides and boots. Filter by size, price and colour. Cash on delivery across Pakistan.' } },
  { match: /^\/new-arrivals/, meta: { title: 'New Arrivals', description: 'The newest QADAM shoes, just in. Handmade leather, delivered all over Pakistan.' } },
  { match: /^\/best-sellers/, meta: { title: 'Best Sellers', description: 'Our most-loved shoes, chosen by customers across Pakistan.' } },
  { match: /^\/mens/, meta: { title: "Men's Shoes", description: "Men's formal shoes, loafers, sneakers, sandals and boots by QADAM." } },
  { match: /^\/size-guide/, meta: { title: 'Size Guide', description: 'Find your QADAM shoe size — UK and EU size chart with foot length in cm.' } },
  { match: /^\/contact/, meta: { title: 'Contact Us', description: 'Talk to QADAM on WhatsApp, email or phone. We help with sizes, orders, returns and exchanges.' } },
  { match: /^\/track-order/, meta: { title: 'Track Your Order', description: 'Check the status of your QADAM order.', noindex: true } },
  { match: /^\/privacy/, meta: { title: 'Privacy Policy' } },
  { match: /^\/terms/, meta: { title: 'Terms & Conditions' } },
  { match: /^\/(cart|checkout|account|orders|wishlist|recover-cart)/, meta: { title: 'Your Account', noindex: true } },
  { match: /^\/admin/, meta: { title: 'Admin', noindex: true } },
];
