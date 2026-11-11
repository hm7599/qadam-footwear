import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DatabaseBackup, Download, X, Check } from 'lucide-react';
import { backupApi, backupPrefs, BackupFile, fmtSize } from '../../utils/backupApi';

/**
 * Shows a popup in the admin panel when a new automatic backup is ready.
 * If "auto-download" is on for this computer, the file downloads by itself.
 */
export const BackupAlert: React.FC = () => {
  const [fresh, setFresh] = useState<BackupFile | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let stop = false;
    const check = async () => {
      try {
        const info = await backupApi.info();
        const latest = info.backups.find(b => b.kind === 'auto');
        if (!latest || stop) return;
        if (!backupPrefs.seen) { backupPrefs.seen = latest.name; return; } // first visit: don't alert for old files
        if (latest.name === backupPrefs.seen) return;
        backupPrefs.seen = latest.name;
        setDone(false);
        setFresh(latest);
        if (backupPrefs.autoDownload) {
          await backupApi.download(latest.name);
          setDone(true);
        }
      } catch { /* not critical */ }
    };
    check();
    const iv = setInterval(check, 60000);
    return () => { stop = true; clearInterval(iv); };
  }, []);

  if (!fresh) return null;
  return (
    <div role="alert" className="fixed bottom-4 right-4 z-[70] w-[min(92vw,360px)] rounded-xl bg-white p-4 shadow-2xl ring-1 ring-neutral-200">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><DatabaseBackup className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-950">Backup ready</p>
          <p className="text-xs text-neutral-500">
            Automatic backup · {new Date(fresh.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {fmtSize(fresh.size)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {done ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"><Check className="h-3.5 w-3.5" /> Downloaded to this computer</span>
            ) : (
              <button onClick={async () => { await backupApi.download(fresh.name); setDone(true); }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 cursor-pointer">
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            )}
            <Link to="/admin/backups" onClick={() => setFresh(null)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:ring-neutral-400">All backups</Link>
          </div>
        </div>
        <button onClick={() => setFresh(null)} aria-label="Close" className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
};
