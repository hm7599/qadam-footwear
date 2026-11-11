import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, ShoppingBag } from 'lucide-react';
import { marketingApi } from '../utils/marketingApi';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import { CartItem } from '../types';

/** Opens a saved bag from a reminder link, then sends the shopper to their bag */
export const RecoverCartPage: React.FC = () => {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { replaceCart, setIsCartOpen } = useCart();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items } = await marketingApi.recover(token);
        const restored: CartItem[] = [];
        for (const it of items) {
          try {
            const p = await api.getProduct(it.productId);
            const variant = p.colors?.find(c => c.name === it.color);
            restored.push({
              productId: p.id, name: p.name, slug: p.slug, price: p.salePrice || p.price,
              color: it.color, size: it.size, quantity: it.quantity,
              image: variant?.previewImage || p.images?.[0] || '', maxStock: 99,
            });
          } catch { /* product removed – skip it */ }
        }
        if (cancelled) return;
        if (!restored.length) throw new Error('The items in this bag are no longer available.');
        replaceCart(restored);
        navigate('/cart', { replace: true });
        setIsCartOpen(false);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'This link has expired.');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#FAFAF9] px-4 pt-28 pb-16 text-center">
      {error ? (
        <div className="max-w-sm space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F3E6D8] text-[#7A4E30]"><ShoppingBag className="h-7 w-7" /></div>
          <h1 className="font-serif text-2xl text-neutral-950">We couldn't restore your bag</h1>
          <p className="text-sm text-neutral-500">{error}</p>
          <Link to="/shop" className="inline-flex h-11 items-center rounded-md bg-neutral-950 px-6 text-sm font-medium text-white hover:bg-neutral-800">Continue shopping</Link>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Restoring your bag…</p>
      )}
    </div>
  );
};
