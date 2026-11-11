import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Store, CreditCard, BellRing, Loader2, Check, AlertCircle, Plus, Trash2, MessageCircle } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { NewOrderAlert } from '../../components/admin/NewOrderAlert';
import { api } from '../../utils/api';
import {
  StoreInfo, PaymentSettings, normalizeStore, normalizePayments, notifySettingsSaved, DEFAULT_STORE,
} from '../../utils/storeSettings';

const TABS = [
  { id: 'store', label: 'Store information', icon: Store },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'alerts', label: 'Order alerts', icon: BellRing },
] as const;

const card = 'rounded-xl bg-white ring-1 ring-neutral-200';
const inputCls = 'h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-400';

const Field: React.FC<{ label: string; hint?: string; className?: string; children: React.ReactNode }> = ({ label, hint, className, children }) => (
  <label className={`block ${className || ''}`}>
    <span className="mb-1 block text-xs font-semibold text-neutral-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span>}
  </label>
);

const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }> = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-start justify-between gap-4">
    <span>
      <span className="block text-sm font-medium text-neutral-900">{label}</span>
      {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
    </span>
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${checked ? 'bg-emerald-600' : 'bg-neutral-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </label>
);

/** Save bar shared by both forms */
const useSaver = (key: 'store' | 'payments') => {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 3500); return () => clearTimeout(t); }, [msg]);
  const save = async (value: any) => {
    setBusy(true);
    try { await api.updateSetting(key, value); notifySettingsSaved(key); setMsg({ ok: true, text: 'Saved. The website shows the new details now.' }); }
    catch (e: any) { setMsg({ ok: false, text: e.message || 'Could not save.' }); }
    finally { setBusy(false); }
  };
  const toast = msg && (
    <div className={`fixed bottom-5 left-1/2 z-[60] flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${msg.ok ? 'bg-neutral-950' : 'bg-red-600'}`}>
      {msg.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {msg.text}
    </div>
  );
  return { busy, save, toast };
};

// ── Store information ─────────────────────────────────
const StoreForm: React.FC = () => {
  const [s, setS] = useState<StoreInfo | null>(null);
  const { busy, save, toast } = useSaver('store');
  useEffect(() => { api.getSetting('store').then(r => setS(normalizeStore(r))).catch(() => setS(normalizeStore(null))); }, []);
  if (!s) return <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>;
  const set = (k: keyof StoreInfo, v: any) => setS({ ...s, [k]: v });
  const setBranch = (i: number, k: string, v: string) => set('branches', s.branches.map((b, j) => (j === i ? { ...b, [k]: v } : b)));
  const emailOk = !s.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email);

  return (
    <div className="space-y-4">
      <section className={`${card} space-y-4 p-5`}>
        <h2 className="text-sm font-semibold text-neutral-950">Contact details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name"><input value={s.storeName} onChange={e => set('storeName', e.target.value)} className={inputCls} /></Field>
          <Field label="Email" hint={emailOk ? undefined : 'This email does not look right.'}><input type="email" value={s.email} onChange={e => set('email', e.target.value)} className={inputCls} /></Field>
          <Field label="Phone"><input value={s.phone} onChange={e => set('phone', e.target.value)} placeholder="+92 300 1234567" className={inputCls} /></Field>
          <Field label="Opening hours"><input value={s.hours} onChange={e => set('hours', e.target.value)} placeholder="Mon – Sat: 11:00 – 21:00" className={inputCls} /></Field>
          <Field label="Address" className="sm:col-span-2"><input value={s.address} onChange={e => set('address', e.target.value)} placeholder="Shop #, road, area" className={inputCls} /></Field>
          <Field label="City"><input value={s.city} onChange={e => set('city', e.target.value)} className={inputCls} /></Field>
          <Field label="Google Maps link (optional)"><input value={s.mapsUrl} onChange={e => set('mapsUrl', e.target.value)} placeholder="https://maps.google.com/…" className={inputCls} /></Field>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-neutral-500"><MessageCircle className="h-3.5 w-3.5" /> The WhatsApp number is set in <Link to="/admin/whatsapp" className="font-medium text-neutral-800 underline">WhatsApp Center</Link>.</p>
      </section>

      <section className={`${card} space-y-3 p-5`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-950">Stores / branches</h2>
            <p className="text-xs text-neutral-500">Shown on the Contact Us page.</p>
          </div>
          <button type="button" onClick={() => set('branches', [...s.branches, { city: '', name: '', address: '', hours: s.hours, phone: s.phone }])}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-neutral-200 hover:ring-neutral-400 cursor-pointer"><Plus className="h-3.5 w-3.5" /> Add store</button>
        </div>
        {!s.branches.length && <p className="text-xs text-neutral-400">No stores listed.</p>}
        {s.branches.map((b, i) => (
          <div key={i} className="grid gap-3 rounded-lg bg-neutral-50 p-3 sm:grid-cols-2">
            <Field label="City"><input value={b.city} onChange={e => setBranch(i, 'city', e.target.value)} className={inputCls} /></Field>
            <Field label="Store name"><input value={b.name} onChange={e => setBranch(i, 'name', e.target.value)} className={inputCls} /></Field>
            <Field label="Address" className="sm:col-span-2"><input value={b.address} onChange={e => setBranch(i, 'address', e.target.value)} className={inputCls} /></Field>
            <Field label="Hours"><input value={b.hours} onChange={e => setBranch(i, 'hours', e.target.value)} className={inputCls} /></Field>
            <Field label="Phone"><input value={b.phone} onChange={e => setBranch(i, 'phone', e.target.value)} className={inputCls} /></Field>
            <div className="sm:col-span-2 flex justify-end">
              <button type="button" onClick={() => set('branches', s.branches.filter((_, j) => j !== i))} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline cursor-pointer"><Trash2 className="h-3.5 w-3.5" /> Remove store</button>
            </div>
          </div>
        ))}
      </section>

      <section className={`${card} space-y-4 p-5`}>
        <h2 className="text-sm font-semibold text-neutral-950">Social media</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(['instagram', 'facebook', 'tiktok', 'youtube'] as const).map(k => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)} hint="Leave empty to hide"><input value={s.socials[k]} onChange={e => set('socials', { ...s.socials, [k]: e.target.value })} placeholder="https://" className={inputCls} /></Field>
          ))}
        </div>
      </section>

      <div className="flex justify-between gap-2">
        <button type="button" onClick={() => setS({ ...DEFAULT_STORE })} className="text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer">Reset to defaults</button>
        <button onClick={() => save(s)} disabled={busy || !emailOk} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save store information
        </button>
      </div>
      {toast}
    </div>
  );
};

// ── Payments ──────────────────────────────────────────
const PaymentsForm: React.FC = () => {
  const [p, setP] = useState<PaymentSettings | null>(null);
  const { busy, save, toast } = useSaver('payments');
  useEffect(() => { api.getSetting('payments').then(r => setP(normalizePayments(r))).catch(() => setP(normalizePayments(null))); }, []);
  if (!p) return <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>;
  const sub = <K extends 'bank' | 'easypaisa' | 'jazzcash' | 'raast'>(k: K, patch: Partial<PaymentSettings[K]>) => setP({ ...p, [k]: { ...p[k], ...patch } });
  const anyOnline = p.bank.enabled || p.easypaisa.enabled || p.jazzcash.enabled || p.raast.enabled;
  const problem = !p.codEnabled && !(p.onlineEnabled && anyOnline) ? 'Turn on at least one way to pay, or customers cannot order.' : '';

  return (
    <div className="space-y-4">
      <section className={`${card} space-y-4 p-5`}>
        <Switch checked={p.codEnabled} onChange={v => setP({ ...p, codEnabled: v })} label="Cash on Delivery" hint="Customer pays the courier when the order arrives." />
        {p.codEnabled && <Field label="Text shown at checkout"><input value={p.codNote} onChange={e => setP({ ...p, codNote: e.target.value })} className={inputCls} /></Field>}
      </section>

      <section className={`${card} space-y-5 p-5`}>
        <Switch checked={p.onlineEnabled} onChange={v => setP({ ...p, onlineEnabled: v })} label="Online payment" hint="Customer pays in advance; the account details below are shown at checkout and on the order page." />

        <div className={`space-y-5 ${p.onlineEnabled ? '' : 'pointer-events-none opacity-50'}`}>
          <div className="space-y-3 rounded-lg bg-neutral-50 p-4">
            <Switch checked={p.bank.enabled} onChange={v => sub('bank', { enabled: v })} label="Bank transfer" />
            {p.bank.enabled && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Bank name"><input value={p.bank.bankName} onChange={e => sub('bank', { bankName: e.target.value })} placeholder="Meezan Bank" className={inputCls} /></Field>
                <Field label="Account title"><input value={p.bank.accountTitle} onChange={e => sub('bank', { accountTitle: e.target.value })} placeholder="QADAM Men's Footwear" className={inputCls} /></Field>
                <Field label="Account number"><input value={p.bank.accountNumber} onChange={e => sub('bank', { accountNumber: e.target.value })} className={inputCls} /></Field>
                <Field label="IBAN"><input value={p.bank.iban} onChange={e => sub('bank', { iban: e.target.value.toUpperCase() })} placeholder="PK00XXXX0000000000000000" className={`${inputCls} font-mono`} /></Field>
              </div>
            )}
          </div>
          {(['easypaisa', 'jazzcash'] as const).map(k => (
            <div key={k} className="space-y-3 rounded-lg bg-neutral-50 p-4">
              <Switch checked={p[k].enabled} onChange={v => sub(k, { enabled: v })} label={k === 'easypaisa' ? 'Easypaisa' : 'JazzCash'} />
              {p[k].enabled && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Account title"><input value={p[k].accountTitle} onChange={e => sub(k, { accountTitle: e.target.value })} className={inputCls} /></Field>
                  <Field label="Mobile account number"><input value={p[k].number} onChange={e => sub(k, { number: e.target.value })} placeholder="0300 1234567" className={inputCls} /></Field>
                </div>
              )}
            </div>
          ))}
          <div className="space-y-3 rounded-lg bg-neutral-50 p-4">
            <Switch checked={p.raast.enabled} onChange={v => sub('raast', { enabled: v })} label="Raast" />
            {p.raast.enabled && <Field label="Raast ID (mobile number)"><input value={p.raast.raastId} onChange={e => sub('raast', { raastId: e.target.value })} className={inputCls} /></Field>}
          </div>
          <Field label="Payment instructions for customers"><textarea rows={3} value={p.instructions} onChange={e => setP({ ...p, instructions: e.target.value })} className={`${inputCls} h-auto py-2`} /></Field>
          {p.onlineEnabled && !anyOnline && <p className="text-xs text-amber-700">Online payment is on, but no method is switched on — customers won't see it.</p>}
        </div>
      </section>

      <p className="text-xs text-neutral-500">Card payments are not shown because no card payment gateway is connected. Online payments are confirmed by you — mark the order as Paid in Orders → Manage.</p>

      <div className="flex items-center justify-end gap-3">
        {problem && <p className="text-sm text-red-600">{problem}</p>}
        <button onClick={() => save(p)} disabled={busy || !!problem} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save payment settings
        </button>
      </div>
      {toast}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────
export const AdminSettingsPage: React.FC = () => {
  const { tab = 'store' } = useParams();
  const navigate = useNavigate();
  const active = TABS.some(t => t.id === tab) ? tab : 'store';
  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Settings</h1>
          <p className="text-sm text-neutral-500">Store details, payment methods and order alerts.</p>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none]">
          <div className="flex w-max gap-1 border-b border-neutral-200">
            {TABS.map(t => (
              <button key={t.id} onClick={() => navigate(`/admin/settings/${t.id}`)}
                className={`relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[13px] font-medium cursor-pointer ${active === t.id ? 'text-neutral-950' : 'text-neutral-500 hover:text-neutral-900'}`}>
                <t.icon className="h-4 w-4" /> {t.label}
                {active === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-neutral-950" />}
              </button>
            ))}
          </div>
        </div>
        <div className="max-w-3xl">
          {active === 'store' && <StoreForm />}
          {active === 'payments' && <PaymentsForm />}
          {active === 'alerts' && (
            <div className={`${card} p-5`}>
              <p className="mb-4 text-xs text-neutral-500">These settings are saved on this computer / phone. Set them on every device you use for the admin panel.</p>
              <NewOrderAlert embedded />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
