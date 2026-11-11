// Responsive, compressed product images served by the backend (/_img → WebP, cached).
// Only local images under /images are resized; anything else is used as-is.
const resizable = (src?: string) => !!src && src.startsWith('/images/') && /\.(png|jpe?g|webp)$/i.test(src);

/** URL of `src` resized to about `w` pixels wide */
export const imgUrl = (src: string | undefined, w: number): string =>
  !src ? '' : resizable(src) ? `/_img?src=${encodeURIComponent(src)}&w=${w}` : src;

/** srcSet for <img>, e.g. srcSet(src, [320, 480, 640]) */
export const imgSrcSet = (src: string | undefined, widths: number[]): string | undefined =>
  resizable(src) ? widths.map(w => `${imgUrl(src, w)} ${w}w`).join(', ') : undefined;

/** Common presets */
export const CARD_WIDTHS = [240, 320, 480, 640];
export const CARD_SIZES = '(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';
