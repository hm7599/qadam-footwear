import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

// Stable key even for products without `id` (e.g. older MongoDB data)
const keyOf = (p: Partial<Product> & { _id?: string }) => String(p.id || p._id || p.slug || '');

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('aura_wishlist');
      const list = saved ? JSON.parse(saved) : [];
      // Drop broken entries saved while products had no id (they made every heart look selected)
      return Array.isArray(list) ? list.filter((p: any) => keyOf(p)).map((p: any) => ({ ...p, id: keyOf(p) })) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('aura_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const k = keyOf(product);
      if (!k) return prev;
      const exists = prev.some(p => keyOf(p) === k);
      if (exists) {
        return prev.filter(p => keyOf(p) !== k);
      } else {
        return [...prev, { ...product, id: k }];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return !!productId && wishlist.some(p => keyOf(p) === productId || p.id === productId);
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
