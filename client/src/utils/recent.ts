// Recently viewed products (kept on this device only)
const KEY = 'aura_recent';
const MAX = 12;

export const recentlyViewed = {
  list(): string[] {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]').filter((x: any) => typeof x === 'string'); } catch { return []; }
  },
  add(slug: string) {
    try {
      const next = [slug, ...recentlyViewed.list().filter(s => s !== slug)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch { /* storage blocked */ }
  },
};
