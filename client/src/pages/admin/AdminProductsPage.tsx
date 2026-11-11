import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ImageUploader } from '../../components/admin/ImageUploader';
import { useCurrency, CURRENCIES } from '../../context/CurrencyContext';
import { api } from '../../utils/api';
import { Product } from '../../types';
import { SIZE_OPTIONS, sizeLabel } from '../../utils/sizes';
import { Plus, Edit, Trash2, Search, X, ChevronDown, Loader2, Package, FileSpreadsheet, Eye, EyeOff, ImageOff } from 'lucide-react';
import { BulkProductUpload } from '../../components/admin/BulkProductUpload';
import { alertDialog, confirmDialog } from '../../components/common/Dialog';

// Prices are stored in the base unit and shown in Rupees; admins type Rupees.
const RATE = CURRENCIES.PKR.rate;
const toRupees = (base: number) => Math.round((base || 0) * RATE);
const fromRupees = (rs: number) => Math.round((rs / RATE) * 100) / 100;

const CATEGORIES = [
  { value: 'casuals', label: 'Casuals' },
  { value: 'formals', label: 'Formals / Dress Shoes' },
  { value: 'sandals', label: 'Sandals' },
  { value: 'slides', label: 'Slides & Mules' },
  { value: 'chelsea-boots', label: 'Chelsea Boots' },
];
const categoryLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label || v;

interface ColorRow { name: string; hex: string }

interface FormState {
  name: string;
  tagline: string;
  priceRs: string;
  salePriceRs: string;
  category: string;
  gender: string;
  stock: string;
  description: string;
  images: string[];
  colors: ColorRow[];
  sizes: number[];
  trackStock: boolean;
  sizeStock: Record<string, string>;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isLimitedEdition: boolean;
  // optional extra details
  weight: string;
  upperMaterial: string;
  soleMaterial: string;
  cushioning: string;
  heelDrop: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  tagline: '',
  priceRs: '',
  salePriceRs: '',
  category: 'lifestyle',
  gender: 'men',
  stock: '20',
  description: '',
  images: [],
  colors: [{ name: 'Black', hex: '#111111' }],
  sizes: [...SIZE_OPTIONS],
  trackStock: false,
  sizeStock: {},
  isNewArrival: true,
  isBestSeller: false,
  isTrending: false,
  isLimitedEdition: false,
  weight: '',
  upperMaterial: '',
  soleMaterial: '',
  cushioning: '',
  heelDrop: '',
};

const inputCls =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900';

const Field: React.FC<{ label: string; hint?: string; className?: string; children: React.ReactNode }> = ({ label, hint, className, children }) => (
  <label className={`block ${className || ''}`}>
    <span className="mb-1 block text-xs font-semibold text-neutral-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span>}
  </label>
);

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
      checked ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
    }`}
  >
    {checked ? '✓ ' : ''}{label}
  </button>
);

export const AdminProductsPage: React.FC = () => {
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingStatus, setEditingStatus] = useState<'draft' | 'live'>('live');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'draft'>('all');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }));

  const loadProducts = async () => {
    setLoading(true);
    try {
      setProducts(await api.getAdminProducts());
    } catch (err) {
      console.warn('Load products error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setEditingStatus('live');
    setForm(EMPTY_FORM);
    setShowMore(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingId(p.id);
    setEditingStatus(p.status === 'draft' ? 'draft' : 'live');
    const euSizes = (p.sizes || []).filter(s => s >= 30);
    setForm({
      name: p.name,
      tagline: p.tagline || '',
      priceRs: String(toRupees(p.price)),
      salePriceRs: p.salePrice ? String(toRupees(p.salePrice)) : '',
      category: p.category,
      gender: p.gender || 'men',
      stock: String(p.stock ?? 0),
      description: p.description || '',
      images: p.images || [],
      colors: p.colors?.length ? p.colors.map(c => ({ name: c.name, hex: c.hex })) : EMPTY_FORM.colors,
      sizes: euSizes.length ? euSizes : [...SIZE_OPTIONS],
      trackStock: !!p.sizeStock && Object.keys(p.sizeStock).length > 0,
      sizeStock: Object.fromEntries(Object.entries(p.sizeStock || {}).map(([k, v]) => [k, String(v)])),
      isNewArrival: !!p.isNewArrival,
      isBestSeller: !!p.isBestSeller,
      isTrending: !!p.isTrending,
      isLimitedEdition: !!p.isLimitedEdition,
      weight: p.specs?.weight || '',
      upperMaterial: p.specs?.upperMaterial || '',
      soleMaterial: p.specs?.soleMaterial || '',
      cushioning: p.specs?.cushioning || '',
      heelDrop: p.specs?.heelDrop || '',
    });
    setShowMore(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!await confirmDialog(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id && p._id !== id));
    } catch (e: any) {
      alertDialog(e.message || 'Delete failed');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const price = Number(form.priceRs);
    const sale = Number(form.salePriceRs);
    if (!form.name.trim()) return setFormError('Please enter the product name.');
    if (!price || price <= 0) return setFormError('Please enter a valid price.');
    if (form.salePriceRs && (sale <= 0 || sale >= price)) return setFormError('Sale price must be lower than the price.');
    if (!form.images.length && editingStatus === 'live') return setFormError('Please add at least one photo (or keep the product as a draft).');
    if (!form.sizes.length) return setFormError('Please select at least one size.');

    const colors = form.colors
      .filter(c => c.name.trim())
      .map((c, i) => ({
        name: c.name.trim(),
        hex: c.hex,
        previewImage: form.images[i] || form.images[0],
        modelTint: c.hex,
      }));

    const payload = {
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      brand: 'QADAM',
      price: fromRupees(price),
      salePrice: form.salePriceRs ? fromRupees(sale) : 0, // 0 = no sale (undefined was dropped and never cleared the old sale)
      category: form.category as Product['category'],
      gender: form.gender as Product['gender'],
      stock: 9999, // stock is not tracked
      description: form.description.trim() || form.tagline.trim() || form.name.trim(),
      images: form.images,
      colors: colors.length ? colors : [{ name: 'Black', hex: '#111111', previewImage: form.images[0] || '', modelTint: '#111111' }],
      status: editingStatus,
      sizes: [...form.sizes].sort((a, b) => a - b),
      // Per-size stock (null = not tracked, every offered size counts as in stock)
      sizeStock: form.trackStock
        ? Object.fromEntries(form.sizes.map(sz => [String(sz), Math.max(0, Math.floor(Number(form.sizeStock[String(sz)]) || 0))]))
        : null,
      specs: {
        weight: form.weight,
        cushioning: form.cushioning,
        upperMaterial: form.upperMaterial,
        soleMaterial: form.soleMaterial,
        heelDrop: form.heelDrop,
        fit: 'True to size',
      },
      isNewArrival: form.isNewArrival,
      isBestSeller: form.isBestSeller,
      isTrending: form.isTrending,
      isLimitedEdition: form.isLimitedEdition,
    };

    setSaving(true);
    try {
      if (editingId) await api.updateProduct(editingId, payload as any);
      else await api.createProduct(payload as any);
      setIsModalOpen(false);
      await loadProducts();
    } catch (err: any) {
      setFormError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleSize = (s: number) =>
    set('sizes', form.sizes.includes(s) ? form.sizes.filter(x => x !== s) : [...form.sizes, s]);

  // Publish / unpublish a product
  const setLive = async (p: Product, live: boolean) => {
    if (live && !(p.images?.length)) {
      alertDialog('Add at least one photo before going live. Click Edit to add photos.');
      return;
    }
    setBusyId(p.id);
    try {
      await api.updateProduct(p.id, { status: live ? 'live' : 'draft' } as any);
      setProducts(list => list.map(x => (x.id === p.id ? { ...x, status: live ? 'live' : 'draft' } : x)));
    } catch (e: any) {
      alertDialog(e.message || 'Could not update');
    } finally {
      setBusyId(null);
    }
  };

  const draftCount = products.filter(p => p.status === 'draft').length;

  const filtered = products.filter(p => {
    if (statusFilter === 'draft' && p.status !== 'draft') return false;
    if (statusFilter === 'live' && p.status === 'draft') return false;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || categoryLabel(p.category).toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1>Products</h1>
            <p className="mt-1 text-sm text-neutral-500">{products.length} products · add, edit or remove shoes from your store.</p>
          </div>
          <div className="flex gap-2 self-start">
            <button
              onClick={() => setBulkOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" /> Bulk Upload
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Product
            </button>
          </div>
        </div>

        {draftCount > 0 && statusFilter !== 'draft' && (
          <button
            onClick={() => setStatusFilter('draft')}
            className="flex w-full items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100 cursor-pointer"
          >
            <EyeOff className="h-5 w-5 shrink-0" />
            <span><b>{draftCount}</b> draft product{draftCount > 1 ? 's are' : ' is'} hidden from the shop. Add photos and click <b>Go live</b>.</span>
          </button>
        )}

        <div className="flex flex-wrap gap-2">
          {([['all', 'All', products.length], ['live', 'Live', products.length - draftCount], ['draft', 'Drafts', draftCount]] as const).map(([id, label, n]) => (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${statusFilter === id ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:ring-neutral-400'}`}
            >
              {label} <span className="opacity-60">({n})</span>
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading products…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-neutral-300 py-16 text-sm text-neutral-500">
            <Package className="h-8 w-8 text-neutral-300" /> No products found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Tags</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map(p => (
                    <tr key={p.id} className={`hover:bg-neutral-50 ${p.status === 'draft' ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-neutral-300"><ImageOff className="h-5 w-5" /></div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-neutral-900">{p.name}</p>
                            <p className={`text-xs ${p.images?.length ? 'text-neutral-400' : 'font-semibold text-amber-700'}`}>{p.images?.length ? `${p.images.length} photo(s)` : 'No photo yet'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{categoryLabel(p.category)}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-neutral-900">{formatPrice(p.salePrice || p.price)}</p>
                        {p.salePrice && <p className="text-xs text-neutral-400 line-through">{formatPrice(p.price)}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'draft' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800"><EyeOff className="h-3 w-3" /> Draft</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700"><Eye className="h-3 w-3" /> Live</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 text-[11px] font-semibold">
                          {p.isNewArrival && <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-white">New</span>}
                          {p.isBestSeller && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-700">Best Seller</span>}
                          {p.isTrending && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">Trending</span>}
                          {p.isLimitedEdition && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">Limited</span>}
                        </div>
                      </td>
                      <td className="space-x-1.5 whitespace-nowrap px-4 py-3 text-right">
                        {p.status === 'draft' ? (
                          <button disabled={busyId === p.id} onClick={() => setLive(p, true)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">
                            Go live
                          </button>
                        ) : (
                          <button disabled={busyId === p.id} onClick={() => setLive(p, false)} title="Hide from shop" className="rounded-lg px-3 py-2 text-xs font-semibold text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 disabled:opacity-50 cursor-pointer">
                            Unpublish
                          </button>
                        )}
                        <button onClick={() => handleOpenEdit(p)} title="Edit" className="rounded-lg p-2 text-neutral-600 ring-1 ring-neutral-200 hover:text-black hover:ring-neutral-400 cursor-pointer">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)} title="Delete" className="rounded-lg p-2 text-neutral-400 ring-1 ring-neutral-200 hover:text-red-600 hover:ring-red-300 cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {bulkOpen && <BulkProductUpload onClose={() => setBulkOpen(false)} onDone={() => { loadProducts(); setStatusFilter('draft'); }} />}

        {/* Add / Edit dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center">
            <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                <h3 className="text-lg font-bold text-neutral-950">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-black cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-5">
                {/* Name first */}
                <Field label="Product name *">
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Classic Brown Oxford" className={inputCls} autoFocus />
                </Field>

                {/* Photos */}
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-neutral-900">Photos *</h4>
                  <ImageUploader images={form.images} onChange={imgs => set('images', imgs)} />
                </section>

                {/* Basic info */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Price (Rs.) *">
                    <input type="number" min="0" inputMode="numeric" value={form.priceRs} onChange={e => set('priceRs', e.target.value)} placeholder="12000" className={inputCls} />
                  </Field>
                  <Field label="Sale price (Rs.)" hint="Leave empty if there is no discount">
                    <input type="number" min="0" inputMode="numeric" value={form.salePriceRs} onChange={e => set('salePriceRs', e.target.value)} placeholder="9999" className={inputCls} />
                  </Field>
                  <Field label="Category">
                    <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="For">
                    <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="unisex">Everyone</option>
                    </select>
                  </Field>
                  <Field label="Short line" hint="One line shown under the name">
                    <input value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Soft leather, handmade" className={inputCls} />
                  </Field>
                  <Field label="Description" className="sm:col-span-2">
                    <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Tell customers about this shoe…" className={inputCls} />
                  </Field>
                </section>

                {/* Sizes */}
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-neutral-900">Available sizes (UK · EU) *</h4>
                    <button type="button" onClick={() => set('sizes', form.sizes.length === SIZE_OPTIONS.length ? [] : [...SIZE_OPTIONS])} className="text-xs font-semibold text-neutral-500 hover:text-black cursor-pointer">
                      {form.sizes.length === SIZE_OPTIONS.length ? 'Clear all' : 'Select all'}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {SIZE_OPTIONS.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSize(s)}
                        className={`h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          form.sizes.includes(s) ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-400 ring-1 ring-neutral-200 line-through hover:text-neutral-700'
                        }`}
                      >
                        {sizeLabel(s)}
                      </button>
                    ))}
                  </div>

                  {/* Stock per size */}
                  <label className="mt-4 flex items-center gap-2 text-sm text-neutral-800 cursor-pointer">
                    <input type="checkbox" checked={form.trackStock} onChange={e => set('trackStock', e.target.checked)} className="h-4 w-4 accent-neutral-900" />
                    Track stock for each size
                  </label>
                  <p className="mt-0.5 text-xs text-neutral-500">Sizes with 0 show "Out of Stock" and customers can ask to be notified. Saving a size above 0 sends their alert automatically.</p>
                  {form.trackStock && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {[...form.sizes].sort((a, b) => a - b).map(sz => {
                        const v = form.sizeStock[String(sz)] ?? '';
                        const zero = v === '' || Number(v) === 0;
                        return (
                          <label key={sz} className={`rounded-lg px-2 py-1.5 ring-1 ${zero ? 'bg-red-50/60 ring-red-200' : 'bg-white ring-neutral-200'}`}>
                            <span className="block text-[11px] font-medium text-neutral-500">Size {sizeLabel(sz)}</span>
                            <input value={v} inputMode="numeric" placeholder="0"
                              onChange={e => set('sizeStock', { ...form.sizeStock, [String(sz)]: e.target.value.replace(/[^d]/g, '') })}
                              className="w-full bg-transparent text-sm font-semibold text-neutral-900 outline-none" />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Colours */}
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-neutral-900">Colours</h4>
                  <div className="space-y-2">
                    {form.colors.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={c.hex}
                          onChange={e => set('colors', form.colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                          className="h-10 w-12 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1"
                          title="Pick colour"
                        />
                        <input
                          value={c.name}
                          onChange={e => set('colors', form.colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                          placeholder="Colour name, e.g. Brown"
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={() => set('colors', form.colors.filter((_, j) => j !== i))}
                          disabled={form.colors.length === 1}
                          className="rounded-lg p-2.5 text-red-500 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                          title="Remove colour"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => set('colors', [...form.colors, { name: '', hex: '#8B5A2B' }])} className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-black cursor-pointer">
                      <Plus className="h-3.5 w-3.5" /> Add colour
                    </button>
                  </div>
                </section>

                {/* Tags */}
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-neutral-900">Show this product in</h4>
                  <div className="flex flex-wrap gap-2">
                    <Toggle label="New Arrivals" checked={form.isNewArrival} onChange={v => set('isNewArrival', v)} />
                    <Toggle label="Best Sellers" checked={form.isBestSeller} onChange={v => set('isBestSeller', v)} />
                    <Toggle label="Trending" checked={form.isTrending} onChange={v => set('isTrending', v)} />
                    <Toggle label="Limited Edition" checked={form.isLimitedEdition} onChange={v => set('isLimitedEdition', v)} />
                  </div>
                </section>

                {/* Optional details */}
                <section className="rounded-xl bg-neutral-50 ring-1 ring-neutral-100">
                  <button type="button" onClick={() => setShowMore(s => !s)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-neutral-700 cursor-pointer">
                    More details (optional)
                    <ChevronDown className={`h-4 w-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                  </button>
                  {showMore && (
                    <div className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2">
                      <Field label="Upper material"><input value={form.upperMaterial} onChange={e => set('upperMaterial', e.target.value)} placeholder="Genuine leather" className={inputCls} /></Field>
                      <Field label="Sole"><input value={form.soleMaterial} onChange={e => set('soleMaterial', e.target.value)} placeholder="Rubber" className={inputCls} /></Field>
                      <Field label="Inside / cushioning"><input value={form.cushioning} onChange={e => set('cushioning', e.target.value)} placeholder="Soft foam insole" className={inputCls} /></Field>
                      <Field label="Weight"><input value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="350g" className={inputCls} /></Field>
                      <Field label="Heel height"><input value={form.heelDrop} onChange={e => set('heelDrop', e.target.value)} placeholder="2 cm" className={inputCls} /></Field>
                    </div>
                  )}
                </section>

                {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

                <div className="sticky bottom-0 -mx-6 flex justify-end gap-2 border-t border-neutral-100 bg-white px-6 py-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-6 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editingId ? 'Save Changes' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
