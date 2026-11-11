import React from 'react';
import { ShopAllPage } from './ShopAllPage';
import { Product } from '../types';

export const MensCollectionPage: React.FC<{ products: Product[] }> = ({ products }) => {
  return (
    <ShopAllPage
      products={products}
      fixedGender="men"
      title="Men's Footwear Collection"
      subtitle="Comfortable, stylish shoes for men: formal, casual and sports."
    />
  );
};
