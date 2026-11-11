import React from 'react';
import { ShopAllPage } from './ShopAllPage';
import { Product } from '../types';

export const BestSellersPage: React.FC<{ products: Product[] }> = ({ products }) => {
  return (
    <ShopAllPage
      products={products}
      fixedBadge="bestseller"
      title="Best Sellers & Iconic Models"
      subtitle="Our most loved shoes, chosen by customers."
    />
  );
};
