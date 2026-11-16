import { Product } from '../types';

/** Does this product belong to the storefront category id (casuals, formals, sandals, slides, chelsea-boots)? */
export function matchesCategory(p: Product, id: string): boolean {
  const cat = (p.category || '').toLowerCase();
  const slug = (p.slug || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  switch (id.toLowerCase()) {
    case 'all': return true;
    case 'formals': return cat === 'formals' || cat === 'luxury-minimal';
    case 'casuals': return cat === 'casuals' || cat === 'lifestyle';
    case 'chelsea':
    case 'chelsea-boots': return cat === 'chelsea-boots' || slug.includes('chelsea') || name.includes('chelsea');
    case 'sandals': return cat === 'sandals' || slug.includes('sandal') || name.includes('sandal');
    case 'slides': return cat === 'slides' || slug.includes('slide') || name.includes('slide');
    default: return cat === id.toLowerCase();
  }
}

/** True if at least one live product is in the category. While products are still loading (empty list), everything counts as available so links don't flicker away. */
export function categoryHasProducts(products: Product[], id: string): boolean {
  const live = products.filter(p => p.status !== 'draft');
  if (!live.length) return true;
  return live.some(p => matchesCategory(p, id));
}

/** Pulls the category id out of a "/shop?category=x" link, or null for other links. */
export function categoryFromHref(href: string): string | null {
  const m = href.match(/[?&]category=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
