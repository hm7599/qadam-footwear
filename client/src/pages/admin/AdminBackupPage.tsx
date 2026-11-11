import React, { useEffect, useState } from 'react';
import { DatabaseBackup, Download, Trash2, Loader2, Clock, Check, AlertCircle } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { backupApi, backupPrefs, BackupInfo, fmtSize } from '../../utils/backupApi';
import { confirmDialog } from '../../components/common/Dialog';

const card = 'rounded-xl bg-white ring-1 ring-neutral-200';
const when = (d: string) => new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
// ISO → value for <input type="datetime-local"> in the admin's own time zone
const toLocalInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
const tonightAt = (h: number) => { const d = new Date(); d.setHours(h, 0, 0, 0); if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1); return d.toISOString(); };
const EVERY = [{ h: 1, l: 'Every hour' }, { h: 6, l: 'Every 6 hours' }, { h: 12, l: 'Every 12 hours' }, { h: 24, l: 'Every day' }, { h: 72, l: 'Every 3 days' }, { h: 168, l: 'Every week' }];

export const AdminBackupPage: React.FC = () => {
  const [info, setInfo] = useState<BackupInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [autoDl, setAutoDl] = useState(backupPrefs.autoDownload);

  const load = () => backupApi.info().then(setInfo).catch(e => setMsg({ ok: false, text: e.message }));
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 4000); return () => clearTimeout(t); }, [msg]);

  const backupNow = async () => {
    setBusy(true);
    try {
      const b = await backupApi.create();
      await backupApi.download(b.name);
      setMsg({ ok: true, text: 'Backup created and downloaded.' });
      load();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  };

  const save = async (patch: Partial<BackupInfo['settings']>) => {
    if (!info) return;
    try {
      const s = await backupApi.saveSettings({ ...info.settings, ...patch });
      setInfo({ ...info, settings: s });
      setMsg({ ok: true, text: 'Backup timer saved.' });
      load();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); }
  };

  const remove = async (name: string) => {
    if (!await confirmDialog('Delete this backup from the server?')) return;
    try { await backupApi.remove(name); load(); } catch (e: any) { setMsg({ ok: false, text: e.message }); }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Backups</h1>
            <p className="text-sm text-neutral-500">A copy of all products, orders, customers and settings.</p>
          </div>
          <button onClick={backupNow} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackup className="h-4 w-4" />} Backup now &amp; download
          </button>
        </div>

        {!info ? <div className={`${card} flex items-center gap-2 p-6 text-sm text-neutral-500`}><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div> : (
          <>
            {/* Timer */}
            <div className={`${card} space-y-4 p-5`}>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-neutral-400" /><h2 className="text-sm font-semibold text-neutral-950">Automatic backup</h2></div>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input type="checkbox" checked={info.settings.enabled} onChange={e => save({ enabled: e.target.checked })} className="h-4 w-4 accent-neutral-900" />
                Make a backup automatically
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-neutral-700">How often
                  <select value={info.settings.everyHours} onChange={e => save({ everyHours: Number(e.target.value) })} disabled={!info.settings.enabled}
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm font-normal outline-none focus:border-neutral-900 disabled:opacity-50">
                    {EVERY.map(o => <option key={o.h} value={o.h}>{o.l}</option>)}
                    {!EVERY.some(o => o.h === info.settings.everyHours) && <option value={info.settings.everyHours}>Every {info.settings.everyHours} hours</option>}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-neutral-700">Keep the last
                  <select value={info.settings.keep} onChange={e => save({ keep: Number(e.target.value) })}
                    className="mt-1 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm font-normal outline-none focus:border-neutral-900">
                    {[3, 7, 14, 30, 60].map(n => <option key={n} value={n}>{n} backups</option>)}
                  </select>
                </label>
              </div>
              <div className={`space-y-2 rounded-lg bg-neutral-50 p-3 ${info.settings.enabled ? '' : 'pointer-events-none opacity-50'}`}>
                <label className="block text-xs font-semibold text-neutral-700">Start date &amp; time
                  <span className="block font-normal text-neutral-500">The first automatic backup runs at this time, then repeats {EVERY.find(o => o.h === info.settings.everyHours)?.l.toLowerCase() || `every ${info.settings.everyHours} hours`}.</span>
                  <input type="datetime-local" value={toLocalInput(info.settings.startAt)}
                    onChange={e => e.target.value && save({ startAt: new Date(e.target.value).toISOString() })}
                    className="mt-1.5 h-10 w-full max-w-xs rounded-lg border border-neutral-200 bg-white px-3 text-sm font-normal outline-none focus:border-neutral-900" />
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[{ l: 'Tonight 2:00 AM', h: 2 }, { l: 'Today 11:00 PM', h: 23 }, { l: 'Tomorrow 9:00 AM', h: 9 }].map(q => (
                    <button key={q.l} type="button" onClick={() => save({ startAt: tonightAt(q.h) })}
                      className="rounded-md bg-white px-2.5 py-1 text-xs text-neutral-700 ring-1 ring-neutral-200 hover:ring-neutral-400 cursor-pointer">{q.l}</button>
                  ))}
                  {info.settings.startAt && (
                    <button type="button" onClick={() => save({ startAt: null })} className="rounded-md px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer">Clear (no fixed time)</button>
                  )}
                </div>
              </div>
              {info.settings.enabled && info.nextAt && (
                <p className="text-xs text-neutral-500">Next automatic backup: <strong className="text-neutral-800">{new Date(info.nextAt).getTime() < Date.now() ? 'within a minute' : when(info.nextAt)}</strong></p>
              )}
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-neutral-50 p-3 text-sm">
                <input type="checkbox" checked={autoDl} onChange={e => { backupPrefs.autoDownload = e.target.checked; setAutoDl(e.target.checked); }} className="mt-0.5 h-4 w-4 accent-neutral-900" />
                <span>Also download new automatic backups to <strong>this computer</strong>
                  <span className="block text-xs text-neutral-500">Works while the admin panel is open. A popup tells you each time a new backup is ready.</span></span>
              </label>
            </div>

            {/* List */}
            <div className={`${card} overflow-hidden`}>
              <div className="border-b border-neutral-100 px-4 py-3"><h2 className="text-sm font-semibold text-neutral-950">Saved on the server ({info.backups.length})</h2></div>
              {!info.backups.length ? <p className="px-4 py-10 text-center text-sm text-neutral-500">No backups yet. Click "Backup now".</p> : (
                <ul className="divide-y divide-neutral-100">
                  {info.backups.map(b => (
                    <li key={b.name} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900">{when(b.createdAt)}</p>
                        <p className="truncate text-xs text-neutral-500">{b.kind === 'auto' ? 'Automatic' : 'Manual'} · {fmtSize(b.size)} · {b.name}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => backupApi.download(b.name).catch(e => setMsg({ ok: false, text: e.message }))}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200 hover:ring-neutral-400 cursor-pointer">
                          <Download className="h-3.5 w-3.5" /> Download
                        </button>
                        <button onClick={() => remove(b.name)} aria-label="Delete backup" className="rounded-lg px-2.5 py-1.5 text-red-600 ring-1 ring-red-200 hover:bg-red-50 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-neutral-400">Backups are compressed JSON (.json.gz). Passwords and secret keys are never included. Keep downloaded files somewhere safe — they contain customer details.</p>
          </>
        )}
      </div>
      {msg && (
        <div className={`fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${msg.ok ? 'bg-neutral-950' : 'bg-red-600'}`}>
          {msg.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {msg.text}
        </div>
      )}
    </AdminLayout>
  );
};
