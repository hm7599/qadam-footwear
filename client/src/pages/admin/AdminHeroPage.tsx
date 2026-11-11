import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { api } from '../../utils/api';
import { DEFAULT_HERO, HeroContent, HeroSlide, normalizeHero } from '../../data/heroDefaults';
import { Plus, Trash2, Save, RotateCcw, ExternalLink, ChevronUp, ChevronDown, Upload, Loader2, Images } from 'lucide-react';
import { confirmDialog } from '../../components/common/Dialog';

const EMPTY_SLIDE: HeroSlide = {
  tag: '',
  titleLine1: 'New',
  titleLine2: 'Slide',
  tagline: '',
  description: '',
  buttonText: 'Shop Now',
  buttonLink: '/shop',
  image: '',
};

const MAX_ORIGINAL = 25 * 1024 * 1024; // before compression

const inputCls =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900';

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold text-neutral-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span>}
  </label>
);

export const AdminHeroPage: React.FC = () => {
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    api.getSetting('hero')
      .then(d => { if (d) setHero(normalizeHero(d)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateSlide = (i: number, patch: Partial<HeroSlide>) =>
    setHero(h => ({ ...h, slides: h.slides.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  const moveSlide = (i: number, dir: -1 | 1) =>
    setHero(h => {
      const j = i + dir;
      if (j < 0 || j >= h.slides.length) return h;
      const slides = [...h.slides];
      [slides[i], slides[j]] = [slides[j], slides[i]];
      return { ...h, slides };
    });

  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const handleUpload = async (i: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'err', msg: 'Please choose an image file.' });
      return;
    }
    if (file.size > MAX_ORIGINAL) {
      setStatus({ type: 'err', msg: 'Image is too large (max 25 MB).' });
      return;
    }
    setUploadingIdx(i);
    setStatus(null);
    try {
      const url = await api.uploadImage(file);
      updateSlide(i, { image: url });
      setStatus({ type: 'ok', msg: 'Photo uploaded. Click Save to publish it.' });
    } catch (e: any) {
      setStatus({ type: 'err', msg: e.message || 'Upload failed.' });
    } finally {
      setUploadingIdx(null);
    }
  };

  // Upload many photos at once → one new slide per photo
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);

  const handleBulkUpload = async (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/') && f.size <= MAX_ORIGINAL);
    const skipped = Array.from(files).length - list.length;
    if (!list.length) {
      setStatus({ type: 'err', msg: 'No valid images selected (images only, max 25 MB each).' });
      return;
    }
    setStatus(null);
    setBulk({ done: 0, total: list.length });
    let failed = 0;
    for (const file of list) {
      try {
        const url = await api.uploadImage(file);
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
        setHero(h => ({ ...h, slides: [...h.slides, { ...EMPTY_SLIDE, titleLine1: name || 'New', titleLine2: '', image: url }] }));
      } catch {
        failed++;
      }
      setBulk(b => (b ? { ...b, done: b.done + 1 } : b));
    }
    setBulk(null);
    const added = list.length - failed;
    setStatus({
      type: failed || skipped ? 'err' : 'ok',
      msg: `${added} slide${added === 1 ? '' : 's'} added${failed ? `, ${failed} failed` : ''}${skipped ? `, ${skipped} skipped` : ''}. Edit the text, then click Save.`,
    });
  };

  const updateStat =(i: number, patch: Partial<{ value: string; label: string }>) =>
    setHero(h => ({ ...h, stats: h.stats.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  const save = async () => {
    if (!hero.slides.length) {
      setStatus({ type: 'err', msg: 'Add at least one slide.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await api.updateSetting('hero', hero);
      setStatus({ type: 'ok', msg: 'Saved! The homepage is now updated.' });
    } catch (e: any) {
      setStatus({ type: 'err', msg: e.message || 'Could not save.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-950">Homepage Banner</h1>
            <p className="text-sm text-neutral-500">Edit the text, button and image shown at the top of the homepage.</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <ExternalLink className="h-4 w-4" /> View site
            </a>
            <button
              onClick={async () => { if (await confirmDialog('Reset all banner text to the default? (Not saved until you click Save)')) setHero(DEFAULT_HERO); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button
              onClick={save}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {status && (
          <div className={`rounded-lg px-4 py-3 text-sm ${status.type === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
            {status.msg}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : (
          <>
            {/* Slides */}
            {hero.slides.map((s, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold text-neutral-900">Slide {i + 1}</h2>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveSlide(i, -1)} disabled={i === 0} title="Move up" className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"><ChevronUp className="h-4 w-4" /></button>
                    <button onClick={() => moveSlide(i, 1)} disabled={i === hero.slides.length - 1} title="Move down" className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"><ChevronDown className="h-4 w-4" /></button>
                    <button
                      onClick={() => setHero(h => ({ ...h, slides: h.slides.filter((_, j) => j !== i) }))}
                      disabled={hero.slides.length === 1}
                      title="Delete slide"
                      className="rounded-md p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-2">
                    <div className="sm:col-span-2">
                      <Field label="Small top label" hint='e.g. "QADAM · New Season 2026"'>
                        <input className={inputCls} value={s.tag} onChange={e => updateSlide(i, { tag: e.target.value })} />
                      </Field>
                    </div>
                    <Field label="Title – line 1 (bold)">
                      <input className={inputCls} value={s.titleLine1} onChange={e => updateSlide(i, { titleLine1: e.target.value })} />
                    </Field>
                    <Field label="Title – line 2 (italic)">
                      <input className={inputCls} value={s.titleLine2} onChange={e => updateSlide(i, { titleLine2: e.target.value })} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Short line under title">
                        <input className={inputCls} value={s.tagline} onChange={e => updateSlide(i, { tagline: e.target.value })} />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Description">
                        <textarea rows={3} className={inputCls} value={s.description} onChange={e => updateSlide(i, { description: e.target.value })} />
                      </Field>
                    </div>
                    <Field label="Button text" hint="Leave empty to hide the button">
                      <input className={inputCls} value={s.buttonText} onChange={e => updateSlide(i, { buttonText: e.target.value })} />
                    </Field>
                    <Field label="Button link" hint='e.g. "/shop" or a full https:// link'>
                      <input className={inputCls} value={s.buttonLink} onChange={e => updateSlide(i, { buttonLink: e.target.value })} />
                    </Field>
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-semibold text-neutral-700">Shoe image</span>
                    <label
                      className={`relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                        uploadingIdx === i ? 'border-neutral-400 bg-neutral-50' : 'border-neutral-200 bg-neutral-100 hover:border-neutral-400'
                      }`}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(i, f); }}
                    >
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(i, f); e.target.value = ''; }}
                      />
                      {s.image ? (
                        <>
                          <img src={s.image} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                          <span className="absolute bottom-2 rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white">
                            Click to change
                          </span>
                        </>
                      ) : (
                        <span className="flex flex-col items-center gap-1 text-neutral-500">
                          <Upload className="h-6 w-6" />
                          <span className="text-xs font-semibold">Upload photo</span>
                          <span className="text-[11px] text-neutral-400">Click or drag & drop · auto-compressed</span>
                        </span>
                      )}
                      {uploadingIdx === i && (
                        <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-semibold text-neutral-700">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…
                        </span>
                      )}
                    </label>

                    {s.image && (
                      <button
                        onClick={() => updateSlide(i, { image: '' })}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove photo
                      </button>
                    )}
                    <p className="mt-1 text-[11px] text-neutral-400">Tip: a photo with a white or plain background looks best.</p>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setHero(h => ({ ...h, slides: [...h.slides, { ...EMPTY_SLIDE }] }))}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 py-4 text-sm font-semibold text-neutral-600 hover:border-neutral-500 hover:text-neutral-900 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add slide
            </button>

            <label
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (!bulk && e.dataTransfer.files?.length) handleBulkUpload(e.dataTransfer.files); }}
              className={`flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed py-6 text-sm transition-colors ${
                bulk ? 'border-neutral-400 bg-neutral-50 cursor-wait' : 'border-neutral-300 text-neutral-600 hover:border-neutral-500 hover:text-neutral-900 cursor-pointer'
              }`}
            >
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                disabled={!!bulk}
                onChange={e => { if (e.target.files?.length) handleBulkUpload(e.target.files); e.target.value = ''; }}
              />
              {bulk ? (
                <span className="flex items-center gap-2 font-semibold text-neutral-700">
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading {bulk.done} / {bulk.total}…
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-2 font-semibold"><Images className="h-4 w-4" /> Upload multiple photos</span>
                  <span className="text-[11px] text-neutral-400">Select or drop several photos — each one becomes a new slide</span>
                </>
              )}
            </label>

            {/* Stats */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-neutral-900">Bottom highlights bar</h2>
                  <p className="text-xs text-neutral-500">Short facts shown under the banner (e.g. "30 Days – Easy Returns").</p>
                </div>
                <button
                  onClick={() => setHero(h => ({ ...h, stats: [...h.stats, { value: '', label: '' }] }))}
                  disabled={hero.stats.length >= 5}
                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <div className="space-y-3">
                {hero.stats.map((st, i) => (
                  <div key={i} className="flex items-end gap-3">
                    <div className="w-32">
                      <Field label="Big text"><input className={inputCls} value={st.value} onChange={e => updateStat(i, { value: e.target.value })} /></Field>
                    </div>
                    <div className="flex-1">
                      <Field label="Small text"><input className={inputCls} value={st.label} onChange={e => updateStat(i, { label: e.target.value })} /></Field>
                    </div>
                    <button
                      onClick={() => setHero(h => ({ ...h, stats: h.stats.filter((_, j) => j !== i) }))}
                      title="Remove"
                      className="mb-0.5 rounded-md p-2 text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};
