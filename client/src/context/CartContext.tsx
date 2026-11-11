import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import confetti from 'canvas-confetti';
import { marketingApi, Quote, currentPushEndpoint } from '../utils/marketingApi';

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
const newCartId = () => 'c_' + Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');

export interface CheckoutContact { name: string; email: string; phone: string }

interface FlyingShoeData {
  image: string;
  startX: number;
  startY: number;
  width: number;
  height: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, color: string, size: number, quantity?: number, startElement?: HTMLElement | null) => void;
  removeFromCart: (productId: string, color: string, size: number) => void;
  updateQuantity: (productId: string, color: string, size: number, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  subtotal: number;
  shippingCost: number;
  discount: number;
  promoCode: string;
  applyPromoCode: (code: string) => Promise<{ ok: boolean; message: string }>;
  removePromoCode: () => void;
  quote: Quote | null;
  quoteLoading: boolean;
  shippingMethod: 'standard' | 'express';
  setShippingMethod: (m: 'standard' | 'express') => void;
  cartId: string;
  setCheckoutContact: (c: CheckoutContact, consent: boolean) => void;
  replaceCart: (items: CartItem[]) => void;
  total: number;
  totalCount: number;
  cartShake: boolean;
  flyingShoe: FlyingShoeData | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('aura_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartShake, setCartShake] = useState(false);
  const [flyingShoe, setFlyingShoe] = useState<FlyingShoeData | null>(null);
  const [promoCode, setPromoCode] = useState(() => ls.get('aura_coupon') || '');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [cartId, setCartId] = useState(() => ls.get('aura_cart_id') || newCartId());
  const [contact, setContact] = useState<{ c: CheckoutContact; consent: boolean } | null>(null);

  useEffect(() => { ls.set('aura_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { ls.set('aura_cart_id', cartId); }, [cartId]);
  useEffect(() => { if (promoCode) ls.set('aura_coupon', promoCode); else ls.del('aura_coupon'); }, [promoCode]);

  const quoteItems = cart.map(i => ({ productId: i.productId, size: i.size, color: i.color, quantity: i.quantity }));
  const quoteKey = JSON.stringify([quoteItems, promoCode, shippingMethod, contact?.c.email, contact?.c.phone]);

  // Prices, coupon and delivery always come from the server
  useEffect(() => {
    if (!cart.length) { setQuote(null); setQuoteLoading(false); return; }
    let cancelled = false;
    setQuoteLoading(true);
    const t = setTimeout(async () => {
      try {
        const q = await marketingApi.quote({ items: quoteItems, couponCode: promoCode || undefined, shippingMethod, customer: contact?.c });
        if (cancelled) return;
        setQuote(q);
        // Drop a code that stopped being valid (expired, limit reached, items removed…)
        if (promoCode && !q.coupon) setPromoCode('');
      } catch {
        /* keep the last quote */
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey]);

  // Save the bag on the server for abandoned-cart reminders (only sent with the shopper's consent)
  const syncKey = JSON.stringify([quoteItems, contact]);
  useEffect(() => {
    if (!cart.length && !contact) return;
    const t = setTimeout(async () => {
      try {
        await marketingApi.syncCart({ cartId, items: quoteItems, contact: contact?.c, consent: contact?.consent, pushEndpoint: await currentPushEndpoint() });
      } catch {
        /* not critical */
      }
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey, cartId]);

  const setCheckoutContact = (c: CheckoutContact, consent: boolean) => setContact({ c, consent });
  const replaceCart = (items: CartItem[]) => setCart(items);

  const addToCart = (
    product: Product,
    color: string,
    size: number,
    quantity: number = 1,
    startElement?: HTMLElement | null
  ) => {
    // 1. Trigger Flip-to-Cart Animation
    if (startElement) {
      const rect = startElement.getBoundingClientRect();
      const variant = product.colors.find(c => c.name === color);
      const image = variant?.previewImage || product.images[0];

      setFlyingShoe({
        image,
        startX: rect.left,
        startY: rect.top,
        width: rect.width,
        height: rect.height
      });

      setTimeout(() => {
        setFlyingShoe(null);
        setCartShake(true);
        setTimeout(() => setCartShake(false), 800);
        try {
          confetti({
            particleCount: 28,
            spread: 50,
            origin: (() => { const el = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-target]')).find(e => e.getBoundingClientRect().width > 0); const r = el?.getBoundingClientRect(); return r ? { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight } : { y: 0.1, x: 0.9 }; })(),
            colors: ['#E5B56D', '#C9A46A', '#3B2618', '#F3D9A4']
          });
        } catch {
          // ignore
        }
      }, 850);
    } else {
      setCartShake(true);
      setTimeout(() => setCartShake(false), 800);
    }

    // 2. Update Cart state
    setCart(prev => {
      const existingIdx = prev.findIndex(
        item => item.productId === product.id && item.color === color && item.size === size
      );

      const variant = product.colors.find(c => c.name === color);
      const img = variant?.previewImage || product.images[0];
      const effectivePrice = product.salePrice || product.price;

      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + quantity };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price: effectivePrice,
          color,
          size,
          quantity,
          image: img,
          maxStock: 99
        }
      ];
    });
  };

  const removeFromCart = (productId: string, color: string, size: number) => {
    setCart(prev => prev.filter(item => !(item.productId === productId && item.color === color && item.size === size)));
  };

  const updateQuantity = (productId: string, color: string, size: number, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.productId === productId && item.color === color && item.size === size) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    setIsCheckoutOpen(false);
    setPromoCode('');
    setQuote(null);
    setContact(null);
    setCartId(newCartId()); // the finished bag is never reused
  };

  const applyPromoCode = async (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return { ok: false, message: 'Enter a code.' };
    try {
      const q = await marketingApi.quote({ items: quoteItems, couponCode: clean, shippingMethod, customer: contact?.c });
      if (q.coupon) {
        setPromoCode(q.coupon.code);
        setQuote(q);
        return { ok: true, message: `${q.coupon.code} applied — ${q.coupon.offer}.` };
      }
      return { ok: false, message: q.couponError || 'This code is not valid.' };
    } catch (e: any) {
      return { ok: false, message: e.message || 'Could not check the code. Please try again.' };
    }
  };
  const removePromoCode = () => setPromoCode('');

  // Fallback numbers while the first server quote loads
  const localSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotal = quote ? quote.subtotal : localSubtotal;
  const shippingCost = quote ? quote.shippingCost : 0;
  const discount = quote ? quote.discount : 0;
  const total = quote ? quote.total : localSubtotal;
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        subtotal,
        shippingCost,
        discount,
        promoCode,
        applyPromoCode,
        removePromoCode,
        quote,
        quoteLoading,
        shippingMethod,
        setShippingMethod,
        cartId,
        setCheckoutContact,
        replaceCart,
        total,
        totalCount,
        cartShake,
        flyingShoe
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
