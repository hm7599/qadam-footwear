export interface CategoryTile {
  label: string;
  hint: string;
  link: string;
  image: string;
  visible: boolean;
}

export interface CategoriesContent {
  title: string;
  subtitle: string;
  items: CategoryTile[];
}

export const DEFAULT_CATEGORIES: CategoriesContent = {
  title: 'Shop by Category',
  subtitle: 'Find the right pair faster.',
  items: [
    { label: 'Casuals', hint: 'Easy everyday comfort', link: '/shop?category=casuals', image: '/images/shoes/cognac-driving-casual.jpg', visible: true },
    { label: 'Formals', hint: 'Office & weddings', link: '/shop?category=formals', image: '/images/atelier/formal_oxford_set3_3.jpg', visible: true },
    { label: 'Sandals', hint: 'Handcrafted leather', link: '/shop?category=sandals', image: '/images/shoes/artisan-leather-sandal.jpg', visible: true },
    { label: 'Slides', hint: 'Relaxed luxury', link: '/shop?category=slides', image: '/images/shoes/luxury-leather-slides.jpg', visible: true },
    { label: 'Chelsea Boots', hint: 'Sleek & timeless', link: '/shop?category=chelsea-boots', image: '/images/atelier/formal_boot_set2_2.jpg', visible: true },
  ],
};

const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);

export const normalizeCategories = (raw: any): CategoriesContent => {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) return DEFAULT_CATEGORIES;
  return {
    title: str(raw.title, DEFAULT_CATEGORIES.title),
    subtitle: str(raw.subtitle, DEFAULT_CATEGORIES.subtitle),
    items: raw.items
      .filter((i: any) => i && typeof i === 'object')
      .map((i: any) => ({
        label: str(i.label, ''),
        hint: str(i.hint, ''),
        link: str(i.link, '/shop'),
        image: str(i.image, ''),
        visible: i.visible !== false,
      })),
  };
};
