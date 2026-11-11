import React from 'react';
import { ShopAllPage } from './ShopAllPage';
import { Product } from '../types';

export const NewArrivalsPage: React.FC<{ products: Product[] }> = ({ products }) => {
  return (
    <ShopAllPage
      products={products}
      fixedBadge="new"
      title="New Arrivals & Seasonal Drops"
      subtitle="Our newest shoes, just arrived."
    />
  );
};
