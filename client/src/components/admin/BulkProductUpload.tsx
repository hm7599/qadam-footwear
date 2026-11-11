import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../../utils/api';

/** Columns the sheet can have (first row = headers). Only name + price are required. */
const COLUMNS = ['name', 'price', 'salePrice', 'category', 'gender', 'sizes', 'colors', 'tagline', 'description', 'new', 'bestseller', 'trending', 'limited'];

const TEMPLATE = [
  COLUMNS.join(','),
  'Classic Black Oxford,15999,13999,formals,men,"39,40,41,42,43,44",Black,Handmade leather office shoe,Soft Italian leather with a stitched sole.,yes,no,no,no',
  'Brown Leather Loafer,12999,,formals,men,"40,41,42,43",Brown,Easy slip-on loafer,,yes,yes,no,no',
  'Everyday White Sneaker,8999,7999,casuals,unisex,"39,40,41,42,43,44,45",White,Simple white sneaker,,no,no,yes,no',
].join('\n');

/** Small CSV parser: handles quotes, commas inside quotes, CRLF, and tab-separated (Excel paste) */
function parseSheet(text: string): Record<string, string>[] {
  const t = text.replace(/^﻿/, '').trim();
  if (!t) return [];
  const delim = t.split('\n')[0].includes('\t') ? '\t' : ',';
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  row.push(cell); rows.push(row);

  const norm = (h: string) => h.trim().toLowerCase().replace(/[^a-z]/g, '');
  const map: Record<string, string> = {
    name: 'name', productname: 'name', title: 'name',
    price: 'price', pricepkr: 'price', mrp: 'price',
    saleprice: 'salePrice', sale: 'salePrice', discountprice: 'salePrice',
    category: 'category', type: 'category', gender: 'gender',
    sizes: 'sizes', size: 'sizes', colors: 'colors', colours: 'colors', color: 'colors', colour: 'colors',
    tagline: 'tagline', shortdescription: 'tagline', description: 'description', details: 'description',
    new: 'new', newarrival: 'new', bestseller: 'bestseller', trending: 'trending', limited: 'limited', limitededition: 'limited',
  };
  const headers = rows[0].map(h => map[norm(h)] || '');
  return rows
    .slice(1)
    .filter(r => r.some(c => c.trim()))
    .map(r => {
      const o: Record<string, string> = {};
      headers.forEach((h, i) => { if (h) o[h] = (r[i] ?? '').trim(); });
      return o;
    });
}

export const BulkProductUpload: React.FC<{ onClose: () => void; onDone: () => void }> = ({ onClose, onDone }) => {
  const [text, setText] = useState('');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: { row: number; message: string }[]; message: string } | null>(null);
  const [error, setError] = useState('');

  const load = (t: string) => {
    setText(t);
    setResult(null);
    setError('');
    try { setRows(parseSheet(t)); } catch { setRows([]); setError('Could not read this file.'); }
  };

  const onFile = (f?: File) => {
    if (!f) return;
    if (/\.xlsx?$/i.test(f.name)) {
      setError('Excel files: please use File → Save As → CSV, or copy the rows from Excel and paste them below.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => load(String(reader.result || ''));
    reader.readAsText(f);
  };

  const downloadTemplate = () => {
    const blob = new Blob(['﻿' + TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'qadam-products-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const valid = rows.filter(r => r.name && Number(String(r.price).replace(/[^0-9.]/g, '')) > 0);

  const upload = async () => {
    if (!valid.length) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.bulkCreateProducts(rows);
      setResult(res);
      if (res.created) onDone();
    } catch (e: any) {
      setError(e.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div>
            <h3 className="text-lg">Bulk upload products</h3>
            <p className="text-xs text-neutral-500">Products are added as <b>Draft</b>. Add photos, then click <b>Go live</b> on each one.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 cursor-pointer"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          {/* Step 1 */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
            <div className="text-sm">
              <p className="font-semibold text-neutral-900">1. Download the template</p>
              <p className="text-xs text-neutral-500">
                Fill it in Excel or Google Sheets. Only <b>name</b> and <b>price</b> (in Rs.) are required.
              </p>
            </div>
            <button onClick={downloadTemplate} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-100 cursor-pointer">
              <Download className="h-4 w-4" /> Template (.csv)
            </button>
          </div>

          {/* Step 2 */}
          <div>
            <p className="mb-2 text-sm font-semibold text-neutral-900">2. Upload the CSV file, or paste rows from Excel</p>
            <label
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
              className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-neutral-300 py-6 text-sm text-neutral-600 hover:border-neutral-500"
            >
              <input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" className="hidden" onChange={e => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
              <FileSpreadsheet className="h-6 w-6" />
              <span className="font-semibold">Choose CSV file</span>
              <span className="text-[11px] text-neutral-400">or drag & drop it here</span>
            </label>
            <textarea
              value={text}
              onChange={e => load(e.target.value)}
              rows={4}
              placeholder={'…or paste here (include the header row):\nname\tprice\tcategory\tsizes\nClassic Black Oxford\t15999\tformals\t39,40,41,42'}
              className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-xs outline-none focus:border-neutral-900"
            />
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>
          )}

          {/* Step 3: preview */}
          {rows.length > 0 && !result && (
            <div>
              <p className="mb-2 text-sm font-semibold text-neutral-900">
                3. Check the list <span className="font-normal text-neutral-500">— {valid.length} ready{rows.length - valid.length ? `, ${rows.length - valid.length} missing name/price (will be skipped)` : ''}</span>
              </p>
              <div className="max-h-64 overflow-auto rounded-xl ring-1 ring-neutral-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Sale</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Sizes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {rows.slice(0, 200).map((r, i) => {
                      const ok = r.name && Number(String(r.price).replace(/[^0-9.]/g, '')) > 0;
                      return (
                        <tr key={i} className={ok ? '' : 'bg-red-50/60 text-red-700'}>
                          <td className="px-3 py-1.5 text-neutral-400">{i + 1}</td>
                          <td className="px-3 py-1.5 font-medium">{r.name || '— missing —'}</td>
                          <td className="px-3 py-1.5">{r.price ? `Rs. ${r.price}` : '— missing —'}</td>
                          <td className="px-3 py-1.5">{r.salePrice ? `Rs. ${r.salePrice}` : ''}</td>
                          <td className="px-3 py-1.5">{r.category}</td>
                          <td className="px-3 py-1.5">{r.sizes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
              <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" /> {result.message}</p>
              <p className="mt-1 text-xs">They are hidden from the shop. Open each draft, add photos, then click <b>Go live</b>.</p>
              {result.errors.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs text-red-700">
                  {result.errors.slice(0, 20).map(e => <li key={e.row}>Row {e.row}: {e.message}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-100 p-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 cursor-pointer">
            {result ? 'Done' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={upload}
              disabled={busy || !valid.length}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              <Upload className="h-4 w-4" /> {busy ? 'Uploading…' : `Add ${valid.length || ''} as draft`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
