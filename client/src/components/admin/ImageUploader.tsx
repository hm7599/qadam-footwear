import React, { useRef, useState } from 'react';
import { api } from '../../utils/api';
import { ImagePlus, Loader2, Star, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const MAX_ORIGINAL = 25 * 1024 * 1024; // before compression

export const formatBytes = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
const savedPct = (before: number, after: number) => Math.max(0, Math.round((1 - after / before) * 100));

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
}

/**
 * Upload one or many photos (click or drag & drop). Each photo is compressed
 * in the browser before upload. The first photo is the main photo.
 */
export const ImageUploader: React.FC<Props> = ({ images, onChange, max = 10 }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  // Size before/after compression, per uploaded photo and for the last batch
  const [sizes, setSizes] = useState<Record<string, { before: number; after: number }>>({});
  const [report, setReport] = useState<{ count: number; before: number; after: number } | null>(null);

  const upload = async (files: FileList | File[]) => {
    setError('');
    const all = Array.from(files);
    const valid = all.filter(f => f.type.startsWith('image/') && f.size <= MAX_ORIGINAL);
    const room = Math.max(0, max - images.length);
    const list = valid.slice(0, room);
    if (!list.length) {
      setError(room === 0 ? `Maximum ${max} photos.` : 'Please choose image files (max 25 MB each).');
      return;
    }

    setProgress({ done: 0, total: list.length });
    setReport(null);
    const urls: string[] = [];
    const newSizes: Record<string, { before: number; after: number }> = {};
    let failed = 0;
    let before = 0;
    let after = 0;
    for (const file of list) {
      try {
        const r = await api.uploadImageWithStats(file);
        urls.push(r.url);
        newSizes[r.url] = { before: r.before, after: r.after };
        before += r.before;
        after += r.after;
      } catch {
        failed++;
      }
      setProgress(p => (p ? { ...p, done: p.done + 1 } : p));
    }
    setProgress(null);
    onChange([...images, ...urls]);
    setSizes(s => ({ ...s, ...newSizes }));
    if (urls.length) setReport({ count: urls.length, before, after });

    const skipped = all.length - list.length;
    if (failed || skipped) {
      setError([failed && `${failed} failed to upload`, skipped && `${skipped} skipped`].filter(Boolean).join(', ') + '.');
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const makeMain = (i: number) => {
    if (i === 0) return;
    const next = [...images];
    const [img] = next.splice(i, 1);
    onChange([img, ...next]);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {images.map((src, i) => (
          <div key={src + i} className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-neutral-200">
            <img src={src} alt="" className="h-full w-full object-contain mix-blend-multiply" />
            {sizes[src] && (
              <span className="absolute right-1 top-1 rounded-full bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white" title={`${formatBytes(sizes[src].before)} → ${formatBytes(sizes[src].after)}`}>
                -{savedPct(sizes[src].before, sizes[src].after)}%
              </span>
            )}
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded-full bg-neutral-950 px-1.5 py-0.5 text-[9px] font-semibold text-white">Main</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-0.5 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Move left" className="rounded-md bg-white/90 p-1 text-neutral-800 disabled:opacity-40 cursor-pointer"><ChevronLeft className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} title="Move right" className="rounded-md bg-white/90 p-1 text-neutral-800 disabled:opacity-40 cursor-pointer"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex gap-1">
                {i !== 0 && (
                  <button type="button" onClick={() => makeMain(i)} title="Make main photo" className="rounded-md bg-white/90 p-1 text-amber-600 cursor-pointer"><Star className="h-3.5 w-3.5" /></button>
                )}
                <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} title="Remove" className="rounded-md bg-white/90 p-1 text-red-600 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => !progress && inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (!progress && e.dataTransfer.files?.length) upload(e.dataTransfer.files); }}
            className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center transition-colors cursor-pointer ${
              dragOver ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-300 text-neutral-500 hover:border-neutral-500 hover:text-neutral-900'
            }`}
          >
            {progress ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-[11px] font-semibold">{progress.done}/{progress.total}</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="px-1 text-[10px] font-semibold leading-tight">Add photos</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={e => { if (e.target.files?.length) upload(e.target.files); e.target.value = ''; }}
      />

      <p className="text-[11px] text-neutral-400">
        Select several photos at once or drag them here. Photos are compressed automatically without losing quality. The first photo is the main photo.
      </p>
      {report && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-100">
          <span className="font-semibold">
            ✓ {report.count} photo{report.count === 1 ? '' : 's'} uploaded
          </span>
          <span>
            Before: <b>{formatBytes(report.before)}</b> → After: <b>{formatBytes(report.after)}</b>
          </span>
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 font-bold text-white">
            {savedPct(report.before, report.after)}% smaller
          </span>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};
