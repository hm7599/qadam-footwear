import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Activity, Monitor, Smartphone, Tablet, ShoppingBag, CreditCard, Globe2, Eye, Users, Clock, Wifi, WifiOff, Settings2, X, Loader2, RotateCcw } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';

const token = () => { try { return localStorage.getItem('aura_token') || ''; } catch { return ''; } };
const get = async (path: string) => {
  const r = await fetch(path, { headers: { Authorization: `Bearer ${token()}` } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || `Request failed (${r.status})`);
  return j.data;
};

const card = 'rounded-xl bg-white ring-1 ring-neutral-200';
const ago = (t: number) => {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};
const dur = (sec: number) => (sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`);
const DeviceIcon: React.FC<{ d: string; className?: string }> = ({ d, className = 'h-4 w-4' }) =>
  d === 'Mobile' ? <Smartphone className={className} /> : d === 'Tablet' ? <Tablet className={className} /> : <Monitor className={className} />;

/** Horizontal bar list */
const Bars: React.FC<{ rows: Array<{ key: string; count: number }>; empty?: string }> = ({ rows, empty = 'No data yet.' }) => {
  const max = Math.max(1, ...rows.map(r => r.count));
  if (!rows.length) return <p className="py-4 text-center text-xs text-neutral-400">{empty}</p>;
  return (
    <ul className="space-y-2">
      {rows.map(r => (
        <li key={r.key}>
          <div className="flex justify-between gap-2 text-xs"><span className="truncate text-neutral-700">{r.key || '—'}</span><span className="tabular-nums font-semibold text-neutral-900">{r.count}</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-neutral-100"><div className="h-full rounded-full bg-[#8A6A45]" style={{ width: `${(r.count / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
};

/** Simple column chart for the history */
const Chart: React.FC<{ series: Array<{ date: string; pageviews: number; visitors: number }> }> = ({ series }) => {
  const max = Math.max(1, ...series.map(s => s.pageviews));
  if (!series.length) return <p className="py-10 text-center text-sm text-neutral-400">No history yet — numbers appear as visitors arrive.</p>;
  return (
    <div>
      <div className="flex h-44 items-end gap-1">
        {series.map(s => (
          <div key={s.date} className="group relative flex h-full flex-1 flex-col justify-end" title={`${s.date}: ${s.pageviews} page views, ${s.visitors} visitors`}>
            <div className="flex w-full flex-col justify-end overflow-hidden rounded-t bg-[#E8DCCB]" style={{ height: `${(s.pageviews / max) * 100}%` }}>
              <div className="w-full rounded-t bg-[#8A6A45]" style={{ height: `${s.pageviews ? (s.visitors / s.pageviews) * 100 : 0}%`}} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-neutral-400"><span>{series[0].date}</span><span>{series[series.length - 1].date}</span></div>
      <div className="mt-2 flex gap-4 text-[11px] text-neutral-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#E8DCCB]" /> Page views</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#8A6A45]" /> Visitors</span>
      </div>
    </div>
  );
};

export const AdminLivePage: React.FC = () => {
  const [snap, setSnap] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [days, setDays] = useState(7);
  const [rep, setRep] = useState<any>(null);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [, tick] = useState(0);
  const sock = useRef<Socket | null>(null);

  const handleResetAll = async () => {
    setResetting(true);
    setResetMsg(null);
    try {
      const res = await fetch('/api/live/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to reset.');
      setResetMsg({ type: 'success', text: 'All live visitor records have been reset to zero.' });
      get('/api/live/snapshot').then(setSnap).catch(() => {});
      get(`/api/live/report?days=${days}`).then(setRep).catch(() => {});
      setTimeout(() => {
        setShowResetConfirm(false);
        setResetMsg(null);
      }, 1200);
    } catch (e: any) {
      setResetMsg({ type: 'error', text: e.message || 'Reset failed.' });
    } finally {
      setResetting(false);
    }
  };

  // Live: Socket.IO, with a polling fallback if the socket can't connect
  useEffect(() => {
    const s = io('/live-admin', { path: '/socket.io', auth: { token: token() }, transports: ['websocket', 'polling'], reconnectionDelayMax: 10000 });
    sock.current = s;
    s.on('connect', () => { setConnected(true); setError(''); });
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', (e: any) => { setConnected(false); if (e?.message === 'unauthorized') setError('Your admin session has expired — please sign in again.'); });
    s.on('snapshot', setSnap);
    const poll = setInterval(() => { if (!s.connected) get('/api/live/snapshot').then(setSnap).catch(() => {}); }, 8000);
    get('/api/live/snapshot').then(setSnap).catch(e => setError(e.message));
    const t = setInterval(() => tick(x => x + 1), 1000);
    return () => { s.disconnect(); clearInterval(poll); clearInterval(t); };
  }, []);

  useEffect(() => {
    setRep(null);
    get(`/api/live/report?days=${days}`).then(setRep).catch(e => setError(e.message));
  }, [days]);

  const t = rep?.totals;
  const newPct = useMemo(() => (t && t.newVisitors + t.returningVisitors ? Math.round((t.newVisitors / (t.newVisitors + t.returningVisitors)) * 100) : 0), [t]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Live Visitors</h1>
            <p className="text-sm text-neutral-500">Real people on the store right now. Admins are not counted.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${connected ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-neutral-100 text-neutral-500 ring-neutral-200'}`}>
              {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />} {connected ? 'Live' : 'Reconnecting…'}
            </span>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100 hover:ring-red-300 cursor-pointer transition-colors"
              title="Reset live visitor records and history to zero"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Data
            </button>
            <button onClick={() => setShowSettings(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:ring-neutral-400 cursor-pointer"><Settings2 className="h-3.5 w-3.5" /> Settings</button>
          </div>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">{error}</p>}

        {/* Live counters */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className={`${card} col-span-2 flex items-center gap-4 p-5 lg:col-span-1`}>
            <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" /></span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">Active visitors</p>
              <p className="text-4xl font-bold tabular-nums text-neutral-950">{snap ? snap.activeVisitors : '—'}</p>
              <p className="text-xs text-neutral-500">{snap ? `${snap.activeSessions} session${snap.activeSessions === 1 ? '' : 's'}` : ''}</p>
            </div>
          </div>
          {[
            { icon: ShoppingBag, label: 'With items in bag', value: snap?.withCart },
            { icon: CreditCard, label: 'In checkout', value: snap?.inCheckout },
            { icon: Eye, label: `Page views (${days === 1 ? 'today' : `${days} days`})`, value: t?.pageviews },
          ].map(x => (
            <div key={x.label} className={`${card} p-4`}>
              <x.icon className="h-4 w-4 text-neutral-400" />
              <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-neutral-400">{x.label}</p>
              <p className="text-2xl font-bold tabular-nums text-neutral-950">{x.value ?? '—'}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Who is on the site */}
          <div className={`${card} lg:col-span-2`}>
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-neutral-950">On the site now</h3>
              <span className="text-xs text-neutral-400">updates every 5 s</span>
            </div>
            {!snap ? <p className="flex items-center gap-2 px-4 py-8 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</p>
              : !snap.sessions.length ? <p className="px-4 py-10 text-center text-sm text-neutral-500">Nobody is browsing right now.</p> : (
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="sticky top-0 bg-neutral-50 text-left text-[11px] uppercase tracking-wider text-neutral-400"><tr>
                    <th className="px-4 py-2 font-semibold">Activity</th><th className="px-4 py-2 font-semibold">Device</th><th className="px-4 py-2 font-semibold">Where</th><th className="px-4 py-2 font-semibold">Source</th><th className="px-4 py-2 font-semibold">On site</th>
                  </tr></thead>
                  <tbody className="divide-y divide-neutral-100">
                    {snap.sessions.map((s: any) => (
                      <tr key={s.id}>
                        <td className="px-4 py-2.5">
                          <p className="flex items-center gap-1.5 font-medium text-neutral-900">
                            {s.inCheckout ? <CreditCard className="h-3.5 w-3.5 text-emerald-600" /> : s.cartCount > 0 ? <ShoppingBag className="h-3.5 w-3.5 text-[#8A6A45]" /> : null}
                            <span className="max-w-[260px] truncate">{s.activity}</span>
                          </p>
                          <p className="text-xs text-neutral-400">{s.path} · {s.pageviews} page{s.pageviews === 1 ? '' : 's'}{s.cartCount ? ` · ${s.cartCount} in bag` : ''}{s.tabs > 1 ? ` · ${s.tabs} tabs` : ''}{s.isNew ? ' · new' : ''}</p>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-neutral-600"><span className="flex items-center gap-1.5"><DeviceIcon d={s.device} /> {s.device}</span><span className="text-neutral-400">{s.browser}</span></td>
                        <td className="px-4 py-2.5 text-xs text-neutral-600">{s.country}<p className="text-neutral-400">{s.region}</p></td>
                        <td className="px-4 py-2.5 text-xs text-neutral-600">{s.source}</td>
                        <td className="px-4 py-2.5 text-xs tabular-nums text-neutral-600">{ago(s.startedAt)}<p className="text-neutral-400">seen {ago(s.lastSeen)} ago</p></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div className={card}>
            <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3"><Activity className="h-4 w-4 text-neutral-400" /><h3 className="text-sm font-semibold text-neutral-950">Live activity</h3></div>
            <ul className="max-h-[420px] divide-y divide-neutral-50 overflow-auto">
              {!snap?.feed?.length && <li className="px-4 py-8 text-center text-xs text-neutral-400">Waiting for activity…</li>}
              {snap?.feed?.map((f: any, i: number) => (
                <li key={i} className="flex items-start gap-2.5 px-4 py-2.5">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${f.type === 'checkout' ? 'bg-emerald-500' : f.type === 'cart' ? 'bg-[#8A6A45]' : f.type === 'start' ? 'bg-sky-500' : 'bg-neutral-300'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-neutral-800">{f.text}</p>
                    <p className="text-[11px] text-neutral-400">{f.device} · {f.country} · {ago(f.at)} ago</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className={`${card} p-4`}><h3 className="mb-3 text-sm font-semibold text-neutral-950">Pages being viewed</h3><Bars rows={snap?.pages || []} empty="—" /></div>
          <div className={`${card} p-4`}><h3 className="mb-3 text-sm font-semibold text-neutral-950">Products being viewed</h3><Bars rows={(snap?.products || []).filter((r: any) => r.key)} empty="—" /></div>
          <div className={`${card} p-4`}><h3 className="mb-3 text-sm font-semibold text-neutral-950">Devices now</h3><Bars rows={snap?.devices || []} empty="—" /></div>
        </div>

        {/* History */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-lg font-semibold text-neutral-950">Traffic report</h2>
          <div className="inline-flex rounded-lg bg-neutral-100 p-0.5">
            {[{ d: 1, l: 'Today' }, { d: 7, l: '7 days' }, { d: 30, l: '30 days' }, { d: 90, l: '90 days' }].map(o => (
              <button key={o.d} onClick={() => setDays(o.d)} className={`rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${days === o.d ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>{o.l}</button>
            ))}
          </div>
        </div>
        {!rep ? <div className={`${card} flex items-center gap-2 p-6 text-sm text-neutral-500`}><Loader2 className="h-4 w-4 animate-spin" /> Loading report…</div> : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { icon: Users, l: 'Unique visitors', v: t.uniqueVisitors },
                { icon: Activity, l: 'Sessions', v: t.sessions },
                { icon: Eye, l: 'Page views', v: t.pageviews },
                { icon: Users, l: 'New / returning', v: `${newPct}% / ${100 - newPct}%` },
                { icon: Clock, l: 'Avg. session', v: dur(t.avgSessionSec) },
                { icon: ShoppingBag, l: 'Bag adds / checkouts', v: `${t.cartAdds} / ${t.checkouts}` },
              ].map(x => (
                <div key={x.l} className={`${card} p-4`}>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">{x.l}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-neutral-950">{x.v}</p>
                </div>
              ))}
            </div>
            <div className={`${card} p-5`}><Chart series={rep.series} /></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className={`${card} p-4`}><h3 className="mb-3 text-sm font-semibold">Top products</h3><Bars rows={rep.topProducts.map((p: any) => ({ key: p.name, count: p.views }))} /></div>
              <div className={`${card} p-4`}><h3 className="mb-3 text-sm font-semibold">Top categories</h3><Bars rows={rep.categories} /></div>
              <div className={`${card} p-4`}><h3 className="mb-3 text-sm font-semibold">Traffic sources</h3><Bars rows={rep.sources} /></div>
              <div className={`${card} p-4`}><h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Globe2 className="h-4 w-4 text-neutral-400" /> Countries</h3><Bars rows={rep.countries} /></div>
              <div className={`${card} p-4`}><h3 className="mb-3 text-sm font-semibold">Regions <span className="font-normal text-neutral-400">(from time zone)</span></h3><Bars rows={rep.regions} /></div>
              <div className={`${card} p-4`}><h3 className="mb-3 text-sm font-semibold">Devices</h3><Bars rows={rep.devices} /></div>
            </div>
            <p className="text-xs text-neutral-400">Country comes from your hosting's country header when available (e.g. Cloudflare), otherwise from the visitor's time zone — never GPS. No names, emails, phone numbers or IP addresses are stored.</p>
          </>
        )}
      </div>
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => !resetting && setShowResetConfirm(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-neutral-200 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-950 text-base">Reset Visitor Records to Zero?</h3>
                <p className="text-xs text-neutral-500">Live sessions and analytics history</p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              This will immediately clear all active visitor sessions, activity logs, and previous traffic records to <strong>0</strong>.
            </p>
            {resetMsg && (
              <p className={`rounded-lg px-3 py-2 text-xs font-medium ${resetMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {resetMsg.text}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setShowResetConfirm(false)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetAll}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer disabled:opacity-50"
              >
                {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                {resetting ? 'Resetting…' : 'Yes, Reset to Zero'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showSettings && <LiveSettings onClose={() => setShowSettings(false)} />}
    </AdminLayout>
  );
};

const LiveSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [s, setS] = useState<any>(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { get('/api/live/settings').then(setS).catch(e => setMsg(e.message)); }, []);
  const save = async () => {
    const r = await fetch('/api/live/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(s) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) onClose(); else setMsg(j.message || 'Could not save.');
  };
  const inp = 'h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-900';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4"><h3 className="font-bold">Analytics settings</h3><button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 cursor-pointer" aria-label="Close"><X className="h-5 w-5" /></button></div>
        {!s ? <p className="p-5 text-sm text-neutral-500">{msg || 'Loading…'}</p> : (
          <div className="space-y-4 p-5">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.enabled} onChange={e => setS({ ...s, enabled: e.target.checked })} className="h-4 w-4 accent-neutral-900" /> Collect visitor analytics</label>
            <label className="block text-xs font-semibold text-neutral-700">Visitor counts as gone after (seconds without activity)
              <input value={s.sessionTimeoutSec} onChange={e => setS({ ...s, sessionTimeoutSec: e.target.value.replace(/\D/g, '') })} className={`${inp} mt-1`} /></label>
            <label className="block text-xs font-semibold text-neutral-700">Keep daily reports for (days)
              <input value={s.retentionDays} onChange={e => setS({ ...s, retentionDays: e.target.value.replace(/\D/g, '') })} className={`${inp} mt-1`} /></label>
            {msg && <p className="text-sm text-red-600">{msg}</p>}
            <div className="flex justify-end gap-2"><button onClick={onClose} className="rounded-lg px-4 py-2 text-sm ring-1 ring-neutral-200 cursor-pointer">Cancel</button><button onClick={save} className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white cursor-pointer">Save</button></div>
          </div>
        )}
      </div>
    </div>
  );
};
