import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, TrendingDown, Trash2, Loader2 } from 'lucide-react';
import { marketingApi } from '../../utils/marketingApi';
import { useCurrency } from '../../context/CurrencyContext';
import { sizeLabel } from '../../utils/sizes';
import { imgUrl } from '../../utils/img';
import { alertDialog, confirmDialog } from '../common/Dialog';

/** Signed-in customer's back-in-stock and price-drop alerts */
export const MyAlerts: React.FC = () => {
  const [data, setData] = useState<{ stock: any[]; price: any[] } | null>(null);
  const [error, setError] = useState('');
  const { formatPrice } = useCurrency();

  const load = () => marketingApi.myAlerts().then(setData).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  const remove = async (type: 'stock' | 'price', id: string) => {
    if (!await confirmDialog('Stop this alert?')) return;
    try { await marketingApi.removeMyAlert(type, id); load(); } catch (e: any) { alertDialog(e.message); }
  };

  const rows = [
    ...(data?.stock || []).map(a => ({ type: 'stock' as const, a, icon: Bell, text: `Back in stock · size ${sizeLabel(a.size)}${a.color ? ` · ${a.color}` : ''}`, done: a.status === 'notified' })),
    ...(data?.price || []).map(a => ({ type: 'price' as const, a, icon: TrendingDown, text: `Price drop${a.targetPriceRs ? ` · target Rs. ${a.targetPriceRs.toLocaleString('en-PK')}` : ' · any drop'}`, done: a.status === 'fulfilled' })),
  ];

  return (
    <div className="mb-12 rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <h3 className="text-base font-semibold text-neutral-950">My alerts</h3>
        <span className="text-xs text-neutral-400">Stock & price notifications</span>
      </div>
      {!data && !error && <p className="flex items-center gap-2 px-5 py-6 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
      {error && <p className="px-5 py-6 text-sm text-red-600">{error}</p>}
      {data && !rows.length && (
        <p className="px-5 py-6 text-sm text-neutral-500">No alerts yet. On a product page, tap a sold-out size or "Notify me when the price drops".</p>
      )}
      <ul className="divide-y divide-neutral-100">
        {rows.map(({ type, a, icon: Icon, text, done }) => (
          <li key={`${type}-${a.id}`} className="flex items-center gap-3 px-5 py-3">
            {a.productImage ? <img src={imgUrl(a.productImage, 200)} decoding="async" loading="lazy" alt="" className="h-11 w-11 rounded-md bg-neutral-50 object-cover" /> : <div className="h-11 w-11 rounded-md bg-neutral-100" />}
            <div className="min-w-0 flex-1">
              <Link to={`/product/${a.productSlug}`} className="block truncate text-sm font-medium text-neutral-900 hover:underline">{a.productName}</Link>
              <p className="flex items-center gap-1.5 text-xs text-neutral-500"><Icon className="h-3.5 w-3.5" /> {text}
                {type === 'price' && a.priceAtSignup ? <span className="text-neutral-400"> · was {formatPrice(a.priceAtSignup)}</span> : null}
              </p>
            </div>
            <span className={`hidden rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>{done ? 'Notified' : 'Waiting'}</span>
            <button onClick={() => remove(type, a.id)} aria-label="Remove alert" className="rounded-md p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
};
