import React, { useState, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Heart, ShoppingBag, Check, Eye } from 'lucide-react';
import { pickDefaultSize, sizeRange, SIZE_OPTIONS } from '../../utils/sizes';
import { imgUrl, imgSrcSet, CARD_WIDTHS, CARD_SIZES } from '../../utils/img';
import { isSoldOut } from './AlertForms';

// Only downloaded when someone opens Quick View
const QuickViewModal = lazy(() => import('./QuickViewModal').then(m => ({ default: m.QuickViewModal })));

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'editorial' | 'compact';
  /** true for cards visible on the first screen (loads the image right away) */
  priority?: boolean;
}

const FALLBACK_IMG = '/images/atelier/formal_oxford_set3_3.jpg';

const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (!img.src.includes('formal_oxford_set3_3')) { img.srcset = ''; img.src = FALLBACK_IMG; }
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [wantSecondary, setWantSecondary] = useState(false); // second photo only after the first hover
  const [quickOpen, setQuickOpen] = useState(false);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const imageRef = useRef<HTMLImageElement>(null);

  const currentColor = product.colors?.[0];
  const activeImage = currentColor?.previewImage || product.images?.[0] || FALLBACK_IMG;
  const secondaryImage = product.images?.[1] || product.images?.[0] || activeImage;
  const hasSecondary = !!secondaryImage && secondaryImage !== activeImage;

  const price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
  const hasDiscount = price < product.price;
  const discountPct = hasDiscount ? Math.round((1 - price / product.price) * 100) : 0;

  const eu = (product.sizes || []).filter(s => s >= 30);
  const sizes = eu.length ? eu : SIZE_OPTIONS; // older products store US sizes → every standard size is offered
  const available = sizes.filter(s => !isSoldOut(product, s));
  const soldOut = sizes.length > 0 && available.length === 0;
  const range = sizeRange(available.length ? available : sizes);
  const defaultSize = available.includes(pickDefaultSize(product.sizes)) ? pickDefaultSize(product.sizes) : available[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut || !defaultSize) return;
    addToCart(product, currentColor?.name || 'Standard', defaultSize, 1, imageRef.current);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1400);
  };

  const inWishlist = isInWishlist(product.id);
  // Up to two small labels: discount + one status
  const status = soldOut ? { text: 'Sold out', cls: 'bg-neutral-900/80 text-white' }
    : product.isNewArrival ? { text: 'New', cls: 'bg-white text-neutral-900' }
    : product.isBestSeller ? { text: 'Best seller', cls: 'bg-white text-neutral-900' }
    : product.isLimitedEdition ? { text: 'Limited', cls: 'bg-neutral-900 text-white' }
    : null;

  const categoryName = product.category === 'lifestyle' ? 'Sneakers' : product.category.replace(/-/g, ' ');

  return (
    <article
      onMouseEnter={() => { setIsHovered(true); setWantSecondary(true); }}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex h-full flex-col"
    >
      {/* ── IMAGE ── */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#F5F4F2]">
        <Link to={`/product/${product.slug}`} className="absolute inset-0 block" aria-label={product.name} tabIndex={-1}>
          <img
            ref={imageRef}
            src={imgUrl(activeImage, 480)}
            srcSet={imgSrcSet(activeImage, CARD_WIDTHS)}
            sizes={CARD_SIZES}
            width={480}
            height={480}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onError={onImgError}
            className={`absolute inset-0 h-full w-full object-cover transition duration-700 ease-out motion-reduce:transition-none ${
              isHovered && hasSecondary && wantSecondary ? 'opacity-0' : 'opacity-100 group-hover:scale-[1.04]'
            } ${soldOut ? 'grayscale-[40%]' : ''}`}
          />
          {hasSecondary && wantSecondary && (
            <img
              src={imgUrl(secondaryImage, 480)}
              srcSet={imgSrcSet(secondaryImage, CARD_WIDTHS)}
              sizes={CARD_SIZES}
              alt=""
              decoding="async"
              onError={onImgError}
              className={`absolute inset-0 h-full w-full object-cover transition duration-700 ease-out motion-reduce:transition-none ${
                isHovered ? 'opacity-100 scale-[1.04]' : 'pointer-events-none opacity-0'
              }`}
            />
          )}
        </Link>

        {/* Labels */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1">
          {hasDiscount && discountPct > 0 && (
            <span className="rounded bg-[#B3261E] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">−{discountPct}%</span>
          )}
          {status && <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-sm ${status.cls}`}>{status.text}</span>}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
          aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={inWishlist}
          className={`absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition cursor-pointer hover:bg-white focus-visible:outline-2 focus-visible:outline-neutral-900 ${
            inWishlist ? 'text-[#B3261E]' : 'text-neutral-700'
          }`}
        >
          <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
        </button>

        {/* Desktop: quick view + add, slide up on hover */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-20 hidden gap-1.5 transition duration-300 sm:flex sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus-within:translate-y-0 sm:focus-within:opacity-100 motion-reduce:transition-none">
          <button
            type="button"
            onClick={e => { e.preventDefault(); setQuickOpen(true); }}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-white/95 text-xs font-medium text-neutral-900 shadow-sm backdrop-blur hover:bg-white cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" /> Quick view
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={soldOut}
            aria-label={soldOut ? 'Sold out' : `Add ${product.name} to bag`}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md shadow-sm transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              addedFeedback ? 'bg-emerald-600 text-white' : 'bg-neutral-950 text-white hover:bg-neutral-800'
            }`}
          >
            {addedFeedback ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile: one small round bag button (doesn't cover the photo) */}
        {!soldOut && (
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to bag`}
            className={`absolute bottom-2 right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition active:scale-95 sm:hidden ${
              addedFeedback ? 'bg-emerald-600 text-white' : 'bg-white text-neutral-900'
            }`}
          >
            {addedFeedback ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* ── DETAILS ── */}
      <div className="flex flex-1 flex-col pt-2.5">
        <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-neutral-500">
          <span className="truncate">{categoryName}</span>
          {product.rating > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 normal-case tracking-normal text-neutral-600" aria-label={`Rated ${product.rating} out of 5`}>
              <span className="text-amber-500" aria-hidden>★</span>{product.rating}
            </span>
          )}
        </div>

        <h3 className="mt-1 text-[13px] font-medium leading-5 text-neutral-900 sm:text-sm">
          <Link to={`/product/${product.slug}`} title={product.name} className="line-clamp-1 py-1 -my-1 hover:underline underline-offset-2 after:absolute after:inset-0 after:z-0 sm:after:content-none">
            {product.name}
          </Link>
        </h3>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className={`text-sm font-semibold ${hasDiscount ? 'text-[#B3261E]' : 'text-neutral-950'}`}>{formatPrice(price)}</span>
          {hasDiscount && <span className="text-xs text-neutral-400 line-through">{formatPrice(product.price)}</span>}
        </div>
        {range && <p className="mt-0.5 text-[11px] text-neutral-500">{soldOut ? 'All sizes sold out' : range}</p>}
      </div>

      {quickOpen && (
        <Suspense fallback={null}>
          <QuickViewModal product={product} isOpen={quickOpen} onClose={() => setQuickOpen(false)} />
        </Suspense>
      )}
    </article>
  );
};
