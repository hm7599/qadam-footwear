import React, { useState, useEffect } from 'react';
import { sizeLabel } from '../utils/sizes';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../utils/api';
import { Order } from '../types';
import { Link } from 'react-router-dom';
import { Package, Truck, ArrowRight, Download, Clock } from 'lucide-react';
import { imgUrl } from '../utils/img';
import { alertDialog } from '../components/common/Dialog';

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const list = await api.getOrders({ email: user?.email });
        setOrders(list);
      } catch (e) {
        console.warn('Failed to load orders:', e);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24 bg-white">
        <div className="font-tech text-xs uppercase tracking-widest text-neutral-400 animate-pulse">
          Loading your orders…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="border-b border-neutral-200 pb-8 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-400">MY ORDERS</span>
              <span className="h-1 w-1 bg-black rounded-full" />
              <span className="font-tech text-[10px] uppercase tracking-widest text-neutral-500">{orders.length} REGISTERED DISPATCHES</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-neutral-950">
              Order Dispatches
            </h1>
            <p className="font-editorial text-lg italic text-neutral-600 mt-1">
              All your past and current orders in one place.
            </p>
          </div>
          <Link
            to="/track-order"
            className="flex items-center gap-2 border border-neutral-200 bg-white px-5 py-3 font-tech text-xs uppercase tracking-widest text-black hover:border-black transition-colors self-start sm:self-auto"
          >
            <Truck className="h-4 w-4" />
            <span>Track Any Order Ref</span>
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="border border-neutral-200 p-16 text-center max-w-lg mx-auto space-y-4 bg-neutral-50/50">
            <Package className="h-10 w-10 text-neutral-400 mx-auto stroke-1" />
            <h3 className="font-display text-xl font-bold uppercase tracking-tight text-black">
              No Atelier Orders Recorded
            </h3>
            <p className="font-editorial text-neutral-500 italic">
              Your acquired footwear models and courier tracking details will be archived here.
            </p>
            <Link
              to="/shop"
              className="inline-block mt-4 bg-black px-8 py-3.5 font-tech text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-colors"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div
                key={order.orderNumber}
                className="border border-neutral-200 bg-white p-6 sm:p-8 space-y-6 hover:border-black transition-colors"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-tech text-sm font-bold text-black tracking-widest">
                        Order #{order.orderNumber}
                      </span>
                      <span className={`border px-2.5 py-0.5 font-tech text-[10px] font-bold uppercase tracking-widest ${
                        order.orderStatus === 'delivered'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : order.orderStatus === 'shipped'
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-amber-600 bg-amber-50 text-amber-800'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <p className="font-tech text-xs text-neutral-400 mt-1">
                      DISPATCHED {new Date(order.createdAt).toLocaleDateString().toUpperCase()} • {order.items.length} {order.items.length > 1 ? 'ITEMS' : 'ITEM'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/track-order?orderNumber=${order.orderNumber}`}
                      className="flex items-center gap-2 bg-black px-4 py-2.5 font-tech text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-colors"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      <span>Track Order</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>

                    <button
                      onClick={() => alertDialog(`Official Atelier VAT Invoice for ${order.orderNumber} generated.`)}
                      className="flex items-center gap-2 border border-neutral-200 bg-white px-4 py-2.5 font-tech text-xs uppercase tracking-widest text-neutral-700 hover:border-black hover:text-black transition-colors"
                      title="Download PDF Invoice"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">VAT Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Items in this order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 border border-neutral-200 bg-neutral-50/50 p-4">
                      <div className="h-16 w-16 bg-white border border-neutral-200 p-1 flex-shrink-0">
                        <img src={imgUrl(item.image, 200)} decoding="async" loading="lazy" alt={item.name} className="h-full w-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-xs font-bold uppercase tracking-tight text-black truncate">{item.name}</h4>
                        <p className="font-tech text-[10px] text-neutral-500 uppercase mt-0.5">
                          {item.color} • SIZE {sizeLabel(item.size)} • QTY {item.quantity}
                        </p>
                        <p className="font-tech text-xs font-bold text-black mt-1">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer specs of the order */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between font-tech text-xs text-neutral-500 border-t border-neutral-200 pt-4 gap-2">
                  <div>
                    <span className="text-neutral-400">TRACKING #: </span>
                    <span className="font-bold text-black">{order.trackingNumber || 'AWAITING SCAN'}</span>
                    <span className="text-neutral-400 ml-2">[{order.trackingCarrier}]</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">TOTAL: </span>
                    <span className="font-bold text-black text-sm">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
