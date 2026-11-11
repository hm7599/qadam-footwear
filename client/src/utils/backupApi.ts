// Admin backups: list, create, download, settings
const token = () => { try { return localStorage.getItem('aura_token') || ''; } catch { return ''; } };
const auth = () => ({ Authorization: `Bearer ${token()}` });

async function json(res: Response) {
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.message || `Request failed (${res.status})`);
  return j;
}

export interface BackupFile { name: string; size: number; createdAt: string; kind: 'auto' | 'manual' }
export interface BackupInfo { settings: { enabled: boolean; everyHours: number; keep: number; startAt: string | null }; backups: BackupFile[]; nextAt: string | null }

export const backupApi = {
  info: async (): Promise<BackupInfo> => (await json(await fetch('/api/backups', { headers: auth() }))).data,
  create: async (): Promise<BackupFile> => (await json(await fetch('/api/backups', { method: 'POST', headers: auth() }))).data,
  saveSettings: async (s: BackupInfo['settings']) =>
    (await json(await fetch('/api/backups/settings', { method: 'PUT', headers: { ...auth(), 'Content-Type': 'application/json' }, body: JSON.stringify(s) }))).data,
  remove: async (name: string) => json(await fetch(`/api/backups/${encodeURIComponent(name)}`, { method: 'DELETE', headers: auth() })),
  /** Downloads a backup file to this computer */
  download: async (name: string) => {
    const res = await fetch(`/api/backups/download/${encodeURIComponent(name)}`, { headers: auth() });
    if (!res.ok) throw new Error('Download failed.');
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  },
};

export const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);

// Remembered on this computer
export const backupPrefs = {
  get autoDownload() { try { return localStorage.getItem('aura_backup_autodl') === '1'; } catch { return false; } },
  set autoDownload(v: boolean) { try { localStorage.setItem('aura_backup_autodl', v ? '1' : '0'); } catch { /* ignore */ } },
  get seen() { try { return localStorage.getItem('aura_backup_seen') || ''; } catch { return ''; } },
  set seen(v: string) { try { localStorage.setItem('aura_backup_seen', v); } catch { /* ignore */ } },
};
