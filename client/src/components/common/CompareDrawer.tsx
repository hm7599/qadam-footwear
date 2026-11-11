import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompare } from '../../context/CompareContext';
import { useCurrency } from '../../context/CurrencyContext';
import { X, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { imgUrl } from '../../utils/img';

export const CompareDrawer: React.FC = () => {
  const { compareList, removeFromCompare, clearCompare, isCompareOpen, setIsCompareOpen } = useCompare();
  const { formatPrice } = useCurrency();

  if (compareList.length === 0) return null;

  return (
    <>
      {/* Floating Pill Bar when items are selected */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 border border-neutral-900 bg-white px-5 py-2.5 shadow-2xl font-tech text-xs max-sm:bottom-20">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-neutral-900" />
          <span className="font-bold text-neutral-900 uppercase">
            COMPARE [{compareList.length}/4]
          </span>
        </div>

        <div className="flex items-center -space-x-1">
          {compareList.map(p => (
            <img
              key={p.id}
              src={imgUrl(p.images[0], 480)} decoding="async" loading="lazy"
              alt={p.name}
              className="h-7 w-7 border border-neutral-300 object-contain bg-neutral-50"
            />
          ))}
        </div>

        <button
          onClick={() => setIsCompareOpen(true)}
          className="bg-neutral-950 px-3.5 py-1 text-[10px] uppercase font-bold tracking-widest text-white hover:bg-neutral-800"
        >
          Inspect Matrix
        </button>

        <button
          onClick={clearCompare}
          title="Clear all"
          className="text-neutral-400 hover:text-neutral-900 p-0.5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Full Comparison Modal Dialog */}
      <AnimatePresence>
        {isCompareOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-tech">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCompareOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-5xl overflow-hidden border border-neutral-900 bg-white shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 p-6">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest block">COMPARE</span>
                  <h3 className="font-display text-xl font-bold text-neutral-950 uppercase">Compare Shoes</h3>
                </div>
                <button
                  onClick={() => setIsCompareOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-950"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto p-6 flex-1">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="py-4 text-neutral-400 uppercase tracking-wider w-40 text-[10px]">SPECIFICATION</th>
                      {compareList.map(item => (
                        <th key={item.id} className="py-4 px-4 min-w-[200px]">
                          <div className="flex flex-col items-center text-center">
                            <div className="relative h-24 w-24 mb-2 border border-neutral-200 p-1 bg-neutral-50">
                              <img src={imgUrl(item.images[0], 480)} decoding="async" loading="lazy" alt={item.name} className="h-full w-full object-contain" />
                              <button
                                onClick={() => removeFromCompare(item.id)}
                                className="absolute -top-1.5 -right-1.5 bg-white border border-neutral-300 p-0.5 text-neutral-500 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="font-display font-bold text-neutral-950 text-sm uppercase">{item.name}</span>
                            <span className="font-bold text-neutral-900 mt-0.5">{formatPrice(item.salePrice || item.price)}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    <tr>
                      <td className="py-3 text-[11px] uppercase text-neutral-400">Category</td>
                      {compareList.map(item => (
                        <td key={item.id} className="py-3 px-4 text-center uppercase">{item.category}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-[11px] uppercase text-neutral-400">Weight</td>
                      {compareList.map(item => (
                        <td key={item.id} className="py-3 px-4 text-center font-bold text-neutral-950">{item.specs.weight}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-[11px] uppercase text-neutral-400">Cushioning</td>
                      {compareList.map(item => (
                        <td key={item.id} className="py-3 px-4 text-center">{item.specs.cushioning}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-[11px] uppercase text-neutral-400">Heel Drop</td>
                      {compareList.map(item => (
                        <td key={item.id} className="py-3 px-4 text-center">{item.specs.heelDrop}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-[11px] uppercase text-neutral-400">Upper Weave</td>
                      {compareList.map(item => (
                        <td key={item.id} className="py-3 px-4 text-center">{item.specs.upperMaterial}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-[11px] uppercase text-neutral-400">Outsole</td>
                      {compareList.map(item => (
                        <td key={item.id} className="py-3 px-4 text-center">{item.specs.soleMaterial}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-[11px] uppercase text-neutral-400">Rating</td>
                      {compareList.map(item => (
                        <td key={item.id} className="py-3 px-4 text-center">★ {item.rating} ({item.reviewCount})</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 text-[11px] uppercase text-neutral-400">Action</td>
                      {compareList.map(item => (
                        <td key={item.id} className="py-4 px-4 text-center">
                          <Link
                            to={`/product/${item.slug}`}
                            onClick={() => setIsCompareOpen(false)}
                            className="inline-flex items-center gap-1.5 bg-neutral-950 px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-white hover:bg-neutral-800"
                          >
                            <span>Inspect 3D</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
