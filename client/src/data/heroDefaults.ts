export interface HeroSlide {
  tag: string;          // small pill text at top, e.g. "QADAM · New Season 2026"
  titleLine1: string;   // big bold line
  titleLine2: string;   // big italic line
  tagline: string;      // short line under the title
  description: string;  // paragraph
  buttonText: string;
  buttonLink: string;
  image: string;        // optional shoe image URL (leave empty for text only)
}

export interface HeroStat {
  value: string;
  label: string;
}

export interface HeroContent {
  slides: HeroSlide[];
  stats: HeroStat[];
}

export const DEFAULT_HERO: HeroContent = {
  slides: [
    {
      tag: 'New Season · 2026',
      titleLine1: 'Crafted by hand,',
      titleLine2: 'made to last.',
      tagline: 'Italian leather. Everyday comfort.',
      description:
        'Shoes designed to look sharp and feel effortless — from the first step to the last.',
      buttonText: 'Shop the Collection',
      buttonLink: '/shop',
      image: '/images/mockup/hero-formal-mobile.png',
    },
    {
      tag: 'Handmade in Italy',
      titleLine1: 'Classic',
      titleLine2: 'Leather',
      tagline: 'Timeless formal shoes.',
      description:
        'Formal shoes stitched by skilled hands. Perfect for the office, weddings and every special day.',
      buttonText: 'Shop Formal Shoes',
      buttonLink: '/shop?category=formals',
      image: '/images/shoes/formal-monkstrap-chestnut.jpg',
    },
    {
      tag: 'Everyday Comfort',
      titleLine1: 'Made to',
      titleLine2: 'Move',
      tagline: 'Comfort in Every Step.',
      description:
        'Soft leather drivers and loafers that keep you comfortable from morning coffee to late-night plans.',
      buttonText: 'Explore Casuals',
      buttonLink: '/shop?category=casuals',
      image: '/images/shoes/cognac-driving-casual.jpg',
    },
  ],
  stats: [
    { value: '198g', label: 'Super Light' },
    { value: '100%', label: 'Real Leather' },
    { value: '30 Days', label: 'Easy Returns' },
    { value: '4.9★', label: 'Customer Rating' },
  ],
};

/** Merge saved data with defaults so missing fields never break the page */
export function normalizeHero(raw: any): HeroContent {
  if (!raw || typeof raw !== 'object') return DEFAULT_HERO;
  const slides: HeroSlide[] = Array.isArray(raw.slides) && raw.slides.length
    ? raw.slides.map((s: any, i: number) => ({ ...(DEFAULT_HERO.slides[i] ?? DEFAULT_HERO.slides[0]), ...s }))
    : DEFAULT_HERO.slides;
  const stats: HeroStat[] = Array.isArray(raw.stats) ? raw.stats : DEFAULT_HERO.stats;
  return { slides, stats };
}
