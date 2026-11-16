// Responsive, compressed images served by the backend.
// - Local /images/* files go through /_img (resized WebP, cached).
// - Admin uploads (/api/uploads/*) accept ?w= and return a resized WebP, cached for a year.
// Anything else is used as-is.
const isLocal = (src?: string) => !!src && src.startsWith('/images/') && /\.(png|jpe?g|webp)$/i.test(src);
const isUpload = (src?: string) => !!src && src.startsWith('/api/uploads/') && !/\.gif$/i.test(src) && !src.includes('?');
const resizable = (src?: string) => isLocal(src) || isUpload(src);

// Must match the widths the server allows for uploads
const UPLOAD_WIDTHS = [160, 240, 320, 480, 640, 960];
const snap = (w: number) => UPLOAD_WIDTHS.find(x => x >= w) ?? 960;

/** URL of `src` resized to about `w` pixels wide */
export const imgUrl = (src: string | undefined, w: number): string => {
  if (!src) return '';
  if (isLocal(src)) return `/_img?src=${encodeURIComponent(src)}&w=${w}`;
  if (isUpload(src)) return `${src}?w=${snap(w)}`;
  return src;
};

/** srcSet for <img>, e.g. srcSet(src, [320, 480, 640]) */
export const imgSrcSet = (src: string | undefined, widths: number[]): string | undefined =>
  resizable(src) ? widths.map(w => `${imgUrl(src, w)} ${isUpload(src) ? snap(w) : w}w`).join(', ') : undefined;

/** Common presets */
export const CARD_WIDTHS = [240, 320, 480, 640];
export const CARD_SIZES = '(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';
