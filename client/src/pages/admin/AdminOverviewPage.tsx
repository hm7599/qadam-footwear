import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, ShoppingBag, Package, Users, TrendingUp, TrendingDown, Clock, AlertTriangle, ArrowRight, Plus,
  Megaphone, Settings, Radio, CreditCard, RefreshCw, Loader2, Sun, Moon, Sunrise,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { STATUS_LABEL, STATUS_STYLE } from '../../utils/orderStatus';
import { sizeLabel } from '../../utils/sizes';
import { imgUrl } from '../../utils/img';

interface Dash {
  totalRevenue: number; totalOrders: number; totalProducts: number; liveProducts: number; totalSubscribers: number; totalCustomers: number; avgOrderValue: number;
  today: { revenue: number; orders: number }; thisMonth: { revenue: number; orders: number };
  monthChange: { revenue: number | null; orders: number | null };
  statusCounts: Record<string, number>; awaitingApproval: number; unpaidOnline: number;
  topProducts: Array<{ id: string; name: string; image: string; qty: number; revenue: number }>;
  lowStock: Array<{ id: string; name: string; image: string; size: string; left: number }>;
  daily: Array<{ date: string; revenue: number; orders: number }>;
  recentOrders: any[];
}

const card = 'rounded-2xl bg-white ring-1 ring-[#EFE6D8] shadow-[0_1px_2px_rgba(60,40,20,0.04),0_8px_24px_-16px_rgba(60,40,20,0.18)]';

const Kpi: React.FC<{ label: string; icon: React.ElementType; value: React.ReactNode; foot: React.ReactNode; tint: string; className?: string }> = ({ label, icon: Icon, value, foot, tint, className = '' }) => (
  <div className={`${card} group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 ${className}`}>
    <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-60 blur-2xl ${tint}`} />
    <div className="relative flex items-center justify-between">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6EEE2] text-[#A8824C]"><Icon className="h-4 w-4" /></span>
    </div>
    <div className="relative mt-3 text-[28px] font-bold leading-tight tabular-nums tracking-tight text-neutral-950">{value}</div>
    <div className="relative mt-1.5">{foot}</div>
  </div>
);

const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? { text: 'Working late', icon: Moon } : h < 12 ? { text: 'Good morning', icon: Sunrise } : h < 17 ? { text: 'Good afternoon', icon: Sun } : { text: 'Good evening', icon: Moon };
};

const Change: React.FC<{ v: number | null; label?: string }> = ({ v, label = 'vs same time last month' }) => {
  if (v === null) return <span className="text-xs text-neutral-400">No data from last month yet</span>;
  const up = v >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? 'text-emerald-700' : 'text-red-600'}`}>
      {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {up ? '+' : ''}{v}% <span className="font-normal text-neutral-400">{label}</span>
    </span>
  );
};

export const AdminOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [d, setD] = useState<Dash | null>(null);
  const [error, setError] = useState('');
  const [live, setLive] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const load = async () => {
    setRefreshing(true);
    try { setD((await api.getAnalytics()) as unknown as Dash); setError(''); }
    catch (e: any) { setError(e.message || 'Could not load the dashboard.'); }
    finally { setRefreshing(false); }
    try {
      const t = localStorage.getItem('aura_token') || '';
      const r = await fetch('/api/live/snapshot', { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) setLive((await r.json()).data.activeVisitors);
    } catch { /* optional */ }
  };
  useEffect(() => { load(); const iv = setInterval(load, 60000); return () => clearInterval(iv); }, []);

  const g = greeting();
  const firstName = (user?.name || 'Admin').replace(/^QADAM\s+/i, '').split(' ')[0] || 'Admin';
  const maxDay = useMemo(() => Math.max(1, ...(d?.daily || []).map(x => x.revenue)), [d]);
  const totalStatus = d ? Object.values(d.statusCounts).reduce((a, b) => a + b, 0) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FCF8F2] via-[#F7EEE1] to-[#EFDFC7] px-6 py-8 ring-1 ring-[#EDE1CF] sm:px-9">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full bg-[#E5B56D]/30 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/60 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#A8824C]">
                <g.icon className="h-3.5 w-3.5" /> {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 className="mt-2 font-serif !text-3xl sm:!text-4xl !font-normal !text-[#2B2118]">{g.text}, {firstName}</h1>
              <p className="mt-2 text-sm text-neutral-600">
                {!d ? 'Loading your store…'
                  : d.awaitingApproval > 0 ? <>You have <strong className="text-neutral-950">{d.awaitingApproval} order{d.awaitingApproval === 1 ? '' : 's'}</strong> waiting for approval.</>
                  : d.today.orders > 0 ? <>{d.today.orders} order{d.today.orders === 1 ? '' : 's'} today so far — {formatPrice(d.today.revenue)}.</>
                  : 'All caught up. Here is how your store is doing.'}
              </p>
            </div>
            <div className="-mx-1 flex shrink-0 flex-nowrap gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none]">
              {[
                { to: '/admin/products', label: 'Add product', icon: Plus, primary: true },
                { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
                { to: '/admin/marketing', label: 'Marketing', icon: Megaphone },
                { to: '/admin/settings', label: 'Settings', icon: Settings },
              ].map(a => (
                <Link key={a.to} to={a.to} className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2.5 text-xs font-semibold transition-all ${a.primary ? 'bg-[#2B2118] text-white shadow-md shadow-[#2B2118]/20 hover:bg-black' : 'bg-white/80 text-neutral-800 ring-1 ring-[#E6D7C0] backdrop-blur hover:bg-white hover:text-black'}`}>
                  <a.icon className="h-3.5 w-3.5" /> {a.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">{error}</p>}

        {!d ? (
          <div className={`${card} flex items-center gap-2 p-8 text-sm text-neutral-500`}><Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard…</div>
        ) : (
          <>
            {/* Needs attention */}
            {(d.awaitingApproval > 0 || d.unpaidOnline > 0 || d.lowStock.length > 0) && (
              <div className="grid gap-3 sm:grid-cols-3">
                {d.awaitingApproval > 0 && (
                  <Link to="/admin/orders" className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200 hover:ring-amber-300">
                    <Clock className="h-5 w-5 text-amber-700" />
                    <span className="flex-1 text-sm text-amber-900"><strong>{d.awaitingApproval}</strong> to approve</span>
                    <ArrowRight className="h-4 w-4 text-amber-700" />
                  </Link>
                )}
                {d.unpaidOnline > 0 && (
                  <Link to="/admin/orders" className="flex items-center gap-3 rounded-xl bg-sky-50 px-4 py-3 ring-1 ring-sky-200 hover:ring-sky-300">
                    <CreditCard className="h-5 w-5 text-sky-700" />
                    <span className="flex-1 text-sm text-sky-900"><strong>{d.unpaidOnline}</strong> online payment{d.unpaidOnline === 1 ? '' : 's'} to confirm</span>
                    <ArrowRight className="h-4 w-4 text-sky-700" />
                  </Link>
                )}
                {d.lowStock.length > 0 && (
                  <Link to="/admin/products" className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200 hover:ring-red-300">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="flex-1 text-sm text-red-900"><strong>{d.lowStock.length}</strong> size{d.lowStock.length === 1 ? '' : 's'} low or sold out</span>
                    <ArrowRight className="h-4 w-4 text-red-600" />
                  </Link>
                )}
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Kpi className="col-span-2 lg:col-span-1" label="Sales this month" icon={Wallet} tint="bg-[#E5B56D]/40" value={formatPrice(d.thisMonth.revenue)} foot={<Change v={d.monthChange.revenue} />} />
              <Kpi label="Orders this month" icon={ShoppingBag} tint="bg-sky-200/50" value={d.thisMonth.orders} foot={<Change v={d.monthChange.orders} label="" />} />
              <Kpi label="Average order" icon={TrendingUp} tint="bg-emerald-200/50" value={formatPrice(d.avgOrderValue)} foot={<span className="text-xs text-neutral-400">All time · {formatPrice(d.totalRevenue)} total</span>} />
              <Link to="/admin/live" className="col-span-2 lg:col-span-1">
                <Kpi label="On the store now" icon={Radio} tint="bg-rose-200/50" className="h-full"
                  value={<span className="flex items-center gap-2.5">{live ?? '—'}{live !== null && live > 0 && <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>}</span>}
                  foot={<span className="text-xs font-medium text-[#A8824C]">Live visitors · see who →</span>} />
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {/* Sales chart */}
              <section className={`${card} p-5 lg:col-span-2`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold text-neutral-950">Sales — last 30 days</h2>
                    <p className="text-xs text-neutral-400">
                      {hover !== null ? `${new Date(d.daily[hover].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}: ${formatPrice(d.daily[hover].revenue)} · ${d.daily[hover].orders} order(s)` : `${formatPrice(d.daily.reduce((a, x) => a + x.revenue, 0))} from ${d.daily.reduce((a, x) => a + x.orders, 0)} orders`}
                    </p>
                  </div>
                  <button onClick={load} aria-label="Refresh" className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></button>
                </div>
                <div className="relative mt-5 flex h-52 items-end gap-[3px] bg-[linear-gradient(to_top,#F3ECE1_1px,transparent_1px)] bg-[length:100%_25%]" onMouseLeave={() => setHover(null)}>
                  {d.daily.map((x, i) => (
                    <div key={x.date} className="flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
                      <div className={`w-full rounded-t-md transition-colors ${hover === i ? 'bg-[#7A4E30]' : x.revenue ? 'bg-gradient-to-t from-[#A8824C] to-[#E5B56D]' : 'bg-[#F3ECE1]'}`}
                        style={{ height: x.revenue ? `${Math.max(4, (x.revenue / maxDay) * 100)}%` : '4px' }} />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-neutral-400">
                  <span>{new Date(d.daily[0].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span><span>Today</span>
                </div>
              </section>

              {/* Order status */}
              <section className={`${card} p-5`}>
                <h2 className="text-[15px] font-semibold text-neutral-950">Orders by status</h2>
                <p className="text-xs text-neutral-400">{d.totalOrders} order{d.totalOrders === 1 ? '' : 's'} in total</p>
                <ul className="mt-4 space-y-3">
                  {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(st => {
                    const n = d.statusCounts[st] || 0;
                    return (
                      <li key={st}>
                        <div className="flex justify-between text-xs"><span className="text-neutral-700">{STATUS_LABEL[st] || st}</span><span className="font-semibold tabular-nums text-neutral-900">{n}</span></div>
                        <div className="mt-1 h-1.5 rounded-full bg-neutral-100"><div className={`h-full rounded-full ${st === 'cancelled' ? 'bg-red-400' : st === 'pending' ? 'bg-amber-400' : st === 'delivered' ? 'bg-emerald-500' : 'bg-[#B08D57]'}`} style={{ width: `${totalStatus ? (n / totalStatus) * 100 : 0}%` }} /></div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-4 text-center">
                  <div><p className="text-lg font-bold tabular-nums">{d.liveProducts}</p><p className="text-[11px] text-neutral-400">Products live</p></div>
                  <div><p className="text-lg font-bold tabular-nums">{d.totalCustomers}</p><p className="text-[11px] text-neutral-400">Customers</p></div>
                  <div><p className="text-lg font-bold tabular-nums">{d.totalSubscribers}</p><p className="text-[11px] text-neutral-400">Subscribers</p></div>
                </div>
              </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {/* Recent orders */}
              <section className={`${card} overflow-hidden lg:col-span-2`}>
                <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
                  <h2 className="text-[15px] font-semibold text-neutral-950">Recent orders</h2>
                  <Link to="/admin/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-neutral-950">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
                {!d.recentOrders.length ? <p className="px-5 py-10 text-center text-sm text-neutral-500">No orders yet. They will appear here as soon as customers buy.</p> : (
                  <ul className="divide-y divide-neutral-100">
                    {d.recentOrders.map(o => (
                      <li key={o.orderNumber}>
                        <Link to="/admin/orders" className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3E6D8] text-xs font-bold text-[#7A4E30]">{(o.customer?.name || '?')[0].toUpperCase()}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-neutral-900">{o.customer?.name}</p>
                            <p className="truncate text-xs text-neutral-400">{o.orderNumber} · {o.customer?.city} · {new Date(o.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                          </div>
                          <span className={`hidden rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 sm:inline ${STATUS_STYLE[o.orderStatus] || ''}`}>{STATUS_LABEL[o.orderStatus] || o.orderStatus}</span>
                          <span className="w-24 text-right text-sm font-semibold tabular-nums text-neutral-950">{formatPrice(o.totalAmount)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Best sellers + stock */}
              <section className={`${card} p-5`}>
                <h2 className="text-[15px] font-semibold text-neutral-950">Best sellers</h2>
                {!d.topProducts.length ? <p className="mt-3 text-xs text-neutral-400">No sales yet.</p> : (
                  <ul className="mt-3 space-y-3">
                    {d.topProducts.map((p, i) => (
                      <li key={p.id} className="flex items-center gap-3">
                        <span className="w-4 text-xs font-semibold text-neutral-400">{i + 1}</span>
                        {p.image ? <img src={imgUrl(p.image, 160)} alt="" className="h-10 w-10 rounded-lg bg-neutral-50 object-cover" loading="lazy" /> : <span className="h-10 w-10 rounded-lg bg-neutral-100" />}
                        <div className="min-w-0 flex-1"><p className="truncate text-sm text-neutral-900">{p.name}</p><p className="text-xs text-neutral-400">{p.qty} sold · {formatPrice(p.revenue)}</p></div>
                      </li>
                    ))}
                  </ul>
                )}
                {d.lowStock.length > 0 && (
                  <>
                    <h3 className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-neutral-950"><Package className="h-4 w-4 text-neutral-400" /> Low stock</h3>
                    <ul className="mt-2 space-y-1.5">
                      {d.lowStock.map(s => (
                        <li key={s.id + s.size} className="flex justify-between gap-2 text-xs">
                          <span className="truncate text-neutral-700">{s.name} · {sizeLabel(s.size)}</span>
                          <span className={`shrink-0 font-semibold ${s.left === 0 ? 'text-red-600' : 'text-amber-700'}`}>{s.left === 0 ? 'Sold out' : `${s.left} left`}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {!d.lowStock.length && <p className="mt-6 flex items-center gap-1.5 text-xs text-neutral-400"><Users className="h-3.5 w-3.5" /> No low-stock sizes (only products with per-size stock are checked).</p>}
              </section>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};
