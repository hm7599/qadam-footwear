import React, { useEffect, useRef, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { api } from '../../utils/api';
import { DEFAULT_CATEGORIES, CategoriesContent, CategoryTile, normalizeCategories } from '../../data/categoryDefaults';
import { Plus, Trash2, Save, RotateCcw, ExternalLink, ChevronUp, ChevronDown, Upload, Loader2, Eye, EyeOff, ImageOff } from 'lucide-react';
import { confirmDialog } from '../../components/common/Dialog';

const MAX_ORIGINAL = 25 * 1024 * 1024;

const inputCls =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900';

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold text-neutral-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span>}
  </label>
);

const EMPTY: CategoryTile = { label: 'New Category', hint: '', link: '/shop', image: '', visible: true };

export const AdminCategoriesPage: React.FC = () => {
  const [content, setContent] = useState<CategoriesContent>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    api.getSetting('categories')
      .then(d => { if (d) setContent(normalizeCategories(d)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (i: number, patch: Partial<CategoryTile>) =>
    setContent(c => ({ ...c, items: c.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }));

  const move = (i: number, dir: -1 | 1) =>
    setContent(c => {
      const j = i + dir;
      if (j < 0 || j >= c.items.length) return c;
      const items = [...c.items];
      [items[i], items[j]] = [items[j], items[i]];
      return { ...c, items };
    });

  const remove = async (i: number) => {
    if (!await confirmDialog(`Remove "${content.items[i].label}"?`)) return;
    setContent(c => ({ ...c, items: c.items.filter((_, j) => j !== i) }));
  };

  const handleUpload = async (i: number, file: File) => {
    if (!file.type.startsWith('image/')) return setStatus({ type: 'err', msg: 'Please choose an image file.' });
    if (file.size > MAX_ORIGINAL) return setStatus({ type: 'err', msg: 'Image is too large (max 25 MB).' });
    setUploadingIdx(i);
    setStatus(null);
    try {
      const url = await api.uploadImage(file);
      update(i, { image: url });
      setStatus({ type: 'ok', msg: 'Photo uploaded. Click Save to publish it.' });
    } catch (e: any) {
      setStatus({ type: 'err', msg: e.message || 'Upload failed.' });
    } finally {
      setUploadingIdx(null);
    }
  };

  const save = async () => {
    if (content.items.some(i => !i.label.trim())) return setStatus({ type: 'err', msg: 'Every category needs a name.' });
    setSaving(true);
    setStatus(null);
    try {
      const saved = await api.updateSetting('categories', content);
      setContent(normalizeCategories(saved));
      setStatus({ type: 'ok', msg: 'Categories saved. The homepage is updated.' });
    } catch (e: any) {
      setStatus({ type: 'err', msg: e.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (await confirmDialog('Restore the default categories? Unsaved changes will be lost.')) setContent(DEFAULT_CATEGORIES);
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-950">Shop by Category</h1>
            <p className="text-sm text-neutral-500">Edit the category tiles shown on the homepage.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              <ExternalLink className="h-4 w-4" /> View site
            </a>
            <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer">
              <RotateCcw className="h-4 w-4" /> Defaults
            </button>
            <button onClick={save} disabled={saving || loading} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
          </div>
        </div>

        {status && (
          <div className={`rounded-lg px-4 py-3 text-sm ${status.type === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{status.msg}</div>
        )}

        <div className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-5 sm:grid-cols-2">
          <Field label="Section title">
            <input className={inputCls} value={content.title} onChange={e => setContent(c => ({ ...c, title: e.target.value }))} />
          </Field>
          <Field label="Subtitle">
            <input className={inputCls} value={content.subtitle} onChange={e => setContent(c => ({ ...c, subtitle: e.target.value }))} />
          </Field>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-neutral-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {content.items.map((it, i) => (
              <div key={i} className={`flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-5 sm:flex-row ${it.visible ? '' : 'opacity-60'}`}>
                <div className="w-full shrink-0 sm:w-40">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100">
                    {it.image ? (
                      <img src={it.image} alt={it.label} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-400"><ImageOff className="h-6 w-6" /></div>
                    )}
                    {uploadingIdx === i && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    )}
                  </div>
                  <input
                    ref={el => { fileRefs.current[i] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(i, f); e.target.value = ''; }}
                  />
                  <button
                    onClick={() => fileRefs.current[i]?.click()}
                    disabled={uploadingIdx !== null}
                    className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload photo
                  </button>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Name">
                      <input className={inputCls} value={it.label} onChange={e => update(i, { label: e.target.value })} />
                    </Field>
                    <Field label="Short line">
                      <input className={inputCls} value={it.hint} onChange={e => update(i, { hint: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Link" hint="Where the tile goes, e.g. /shop?category=sandals">
                    <input className={inputCls} value={it.link} onChange={e => update(i, { link: e.target.value })} />
                  </Field>
                  <Field label="Photo URL" hint="Filled in automatically when you upload a photo.">
                    <input className={inputCls} value={it.image} onChange={e => update(i, { image: e.target.value })} />
                  </Field>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button onClick={() => update(i, { visible: !it.visible })} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer">
                      {it.visible ? <><Eye className="h-3.5 w-3.5" /> Shown</> : <><EyeOff className="h-3.5 w-3.5" /> Hidden</>}
                    </button>
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg border border-neutral-200 p-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 cursor-pointer" aria-label="Move up">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === content.items.length - 1} className="rounded-lg border border-neutral-200 p-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 cursor-pointer" aria-label="Move down">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(i)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setContent(c => ({ ...c, items: [...c.items, { ...EMPTY }] }))}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 py-4 text-sm font-semibold text-neutral-500 hover:border-neutral-400 hover:text-neutral-800 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add category
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
