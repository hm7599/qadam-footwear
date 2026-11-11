import React, { useEffect, useState } from 'react';
import { ShieldAlert, ScrollText, Loader2, RefreshCw } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';

const token = () => { try { return localStorage.getItem('aura_token') || ''; } catch { return ''; } };
const get = async (p: string) => {
  const r = await fetch(p, { headers: { Authorization: `Bearer ${token()}` } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || 'Failed');
  return j.data as any[];
};

const LABEL: Record<string, string> = {
  login_failed: 'Failed sign-in', admin_login_failed: 'Failed ADMIN sign-in', admin_login: 'Admin signed in', login_locked: 'Sign-in locked (too many tries)',
  rate_limit: 'Rate limit hit', invalid_token: 'Invalid / expired token', forbidden_admin: 'Blocked: not an admin', upload_rejected: 'Upload rejected',
  cors_blocked: 'Blocked origin', db_unavailable_write_blocked: 'Database down — write refused',
};
const tone = (t: string) => (/admin_login_failed|forbidden|locked|db_unavailable/.test(t) ? 'bg-red-50 text-red-700' : /failed|rate|invalid|rejected|cors/.test(t) ? 'bg-amber-50 text-amber-800' : 'bg-neutral-100 text-neutral-600');
const when = (d: string) => new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', second: '2-digit' });

/** Security events and admin audit trail (read-only) */
export const AdminSecurityPage: React.FC = () => {
  const [tab, setTab] = useState<'events' | 'audit'>('events');
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState('');
  const load = () => { setRows(null); get(`/api/security/${tab}`).then(setRows).catch(e => { setErr(e.message); setRows([]); }); };
  useEffect(load, [tab]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Security</h1>
          <p className="text-sm text-neutral-500">Sign-in attempts, blocked requests and every change made in the admin panel.</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-lg bg-neutral-100 p-0.5">
            <button onClick={() => setTab('events')} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${tab === 'events' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}><ShieldAlert className="h-3.5 w-3.5" /> Security events</button>
            <button onClick={() => setTab('audit')} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${tab === 'audit' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}><ScrollText className="h-3.5 w-3.5" /> Admin activity</button>
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-neutral-200 cursor-pointer"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200">
          {!rows ? <p className="flex items-center gap-2 p-6 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
            : !rows.length ? <p className="p-10 text-center text-sm text-neutral-500">Nothing recorded yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-neutral-50 text-left text-[11px] uppercase tracking-wider text-neutral-400">
                  {tab === 'events'
                    ? <tr><th className="px-4 py-2">Time</th><th className="px-4 py-2">Event</th><th className="px-4 py-2">Account</th><th className="px-4 py-2">IP</th><th className="px-4 py-2">Detail</th></tr>
                    : <tr><th className="px-4 py-2">Time</th><th className="px-4 py-2">Admin</th><th className="px-4 py-2">Action</th><th className="px-4 py-2">Result</th><th className="px-4 py-2">IP</th></tr>}
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.map(r => tab === 'events' ? (
                    <tr key={r.id}><td className="px-4 py-2 text-xs text-neutral-500">{when(r.at)}</td>
                      <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone(r.type)}`}>{LABEL[r.type] || r.type}</span></td>
                      <td className="px-4 py-2 text-xs">{r.user || '—'}</td><td className="px-4 py-2 font-mono text-xs">{r.ip}</td><td className="px-4 py-2 text-xs text-neutral-500">{r.detail}</td></tr>
                  ) : (
                    <tr key={r.id}><td className="px-4 py-2 text-xs text-neutral-500">{when(r.at)}</td><td className="px-4 py-2 text-xs">{r.user}</td>
                      <td className="px-4 py-2 font-mono text-xs">{r.method} {r.path}</td>
                      <td className="px-4 py-2 text-xs"><span className={r.status < 400 ? 'text-emerald-700' : 'text-red-600'}>{r.status}</span></td><td className="px-4 py-2 font-mono text-xs">{r.ip}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
