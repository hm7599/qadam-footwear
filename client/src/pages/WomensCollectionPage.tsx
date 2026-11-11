import React from 'react';
import { ShopAllPage } from './ShopAllPage';
import { Product } from '../types';

export const WomensCollectionPage: React.FC<{ products: Product[] }> = ({ products }) => {
  return (
    <ShopAllPage
      products={products}
      fixedGender="women"
      title="Women's Footwear Collection"
      subtitle="Light, comfortable shoes with great arch support and beautiful finishes."
    />
  );
};
