import { imgUrl } from '../utils/img';
import React, { useEffect, useState } from 'react';
import { sizeLabel } from '../utils/sizes';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../utils/api';
import { CouponBox, FreeShippingBar, PriceSummary } from '../components/cart/PromoWidgets';
import { usePaymentSettings, onlineMethodNames } from '../utils/storeSettings';
import confetti from 'canvas-confetti';
import {
  CreditCard, Truck, Lock, ArrowRight, ShoppingBag, X, Zap, Check,
  User, Mail, Phone, MapPin, Building2, Loader2, ShieldCheck, RotateCcw, AlertCircle,
} from 'lucide-react';

interface CheckoutPageProps {
  modal?: boolean;
}

const EXPRESS_FEE = 15; // base currency; shown in Rs. via formatPrice

// Pakistani mobile: 03XXXXXXXXX, +923XXXXXXXXX or 923XXXXXXXXX (spaces / dashes allowed)
export const isPkMobile = (v: string) => /^(?:\+92|0092|92|0)3\d{9}$/.test(v.replace(/[\s-]/g, ''));
const PK_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Abbottabad', 'Mardan', 'Gujrat', 'Sahiwal', 'Okara', 'Rahim Yar Khan', 'Sheikhupura', 'Jhang', 'Dera Ghazi Khan', 'Larkana', 'Mirpur', 'Muzaffarabad', 'Gilgit', 'Skardu', 'Swat', 'Kasur', 'Wah Cantt', 'Jhelum', 'Chiniot', 'Kamoke', 'Nawabshah', 'Mingora', 'Attock', 'Taxila', 'Murree'];

const PROVINCES = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad Capital Territory', 'Gilgit-Baltistan', 'Azad Kashmir'];

const fieldWrap =
  'flex items-center gap-2.5 rounded-xl bg-white px-3.5 ring-1 ring-neutral-200 transition-all focus-within:ring-2 focus-within:ring-[#9A6440]';
const fieldInput = 'h-12 w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400';

const Field: React.FC<{ label: string; icon?: React.ElementType; className?: string; children: React.ReactNode }> = ({ label, icon: Icon, className, children }) => (
  <label className={`block ${className || ''}`}>
    <span className="mb-1.5 block text-xs font-medium text-neutral-600">{label}</span>
    <div className={fieldWrap}>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-neutral-400" />}
      {children}
    </div>
  </label>
);

const StepHeader: React.FC<{ n: number; title: string; hint?: string }> = ({ n, title, hint }) => (
  <div className="mb-5 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7A4E30] text-xs font-bold text-white">{n}</span>
      <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
    </div>
    {hint && <span className="text-xs text-neutral-400">{hint}</span>}
  </div>
);

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ modal = false }) => {
  const { cart, clearCart, isCheckoutOpen, setIsCheckoutOpen, quote, total, promoCode, cartId, shippingMethod, setShippingMethod, setCheckoutContact } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.shippingAddress?.address || '',
    apartment: user?.shippingAddress?.apartment || '',
    city: user?.shippingAddress?.city || '',
    state: user?.shippingAddress?.state || 'Punjab',
    postalCode: user?.shippingAddress?.postalCode || '',
    country: user?.shippingAddress?.country || 'Pakistan',
  });

  const [reminderConsent, setReminderConsent] = useState(false);
  // Share contact details with the bag (used for abandoned-cart reminders only with consent)
  useEffect(() => {
    const t = setTimeout(() => setCheckoutContact({ name: customer.name, email: customer.email, phone: customer.phone }, reminderConsent), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.name, customer.email, customer.phone, reminderConsent]);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  // Payment options come from Admin → Settings → Payments
  const pay = usePaymentSettings();
  const onlineNames = onlineMethodNames(pay);
  const showCod = pay.codEnabled;
  const showOnline = pay.onlineEnabled && onlineNames.length > 0;
  useEffect(() => {
    if (paymentMethod === 'cod' && !showCod && showOnline) setPaymentMethod('online');
    if (paymentMethod === 'online' && !showOnline && showCod) setPaymentMethod('cod');
  }, [showCod, showOnline, paymentMethod]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!modal || !isCheckoutOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCheckoutOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCheckoutOpen, modal, setIsCheckoutOpen]);

  if (modal && (!isCheckoutOpen || cart.length === 0)) return null;

  if (!modal && cart.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9] px-4 pb-24 pt-36 text-center">
        <div className="max-w-sm space-y-5">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F3E6D8] text-[#7A4E30]">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-neutral-950">Your bag is empty</h2>
            <p className="mt-1 text-sm text-neutral-500">Add some shoes to your bag to checkout.</p>
          </div>
          <Link to="/shop" className="inline-flex h-12 items-center gap-2 rounded-full bg-neutral-950 px-8 text-sm font-semibold text-white hover:bg-neutral-800">
            Continue Shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);
  const set = (k: keyof typeof customer, v: string) => setCustomer(c => ({ ...c, [k]: v }));

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.phone || !customer.address || !customer.city) {
      setErrorMessage('Please fill in your name, mobile number, address and city.');
      return;
    }
    if (!isPkMobile(customer.phone)) {
      setErrorMessage('Please enter a valid Pakistani mobile number, e.g. 0300 1234567.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const newOrder = await api.createOrder({
        customer: { ...customer, postalCode: customer.postalCode || '00000' },
        items: cart,
        couponCode: promoCode || undefined,
        cartId,
        shippingMethod,
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'card',
      });
      try { confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } }); } catch { /* ignore */ }
      clearCart();
      if (modal) setIsCheckoutOpen(false);
      navigate(`/track-order?orderNumber=${newOrder.orderNumber}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not place the order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const OptionCard: React.FC<{ active: boolean; onClick: () => void; icon: React.ElementType; title: string; text: string; right?: string }> = ({ active, onClick, icon: Icon, title, text, right }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition-all cursor-pointer ${
        active ? 'bg-[#FBF5EE] ring-2 ring-[#9A6440]' : 'bg-white ring-1 ring-neutral-200 hover:ring-neutral-400'
      }`}
    >
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${active ? 'bg-[#7A4E30] text-white' : 'ring-1 ring-neutral-300'}`}>
        {active && <Check className="h-3 w-3" />}
      </span>
      <span className="flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Icon className="h-4 w-4 text-[#7A4E30]" /> {title}
          </span>
          {right && <span className="text-sm font-semibold text-neutral-900">{right}</span>}
        </span>
        <span className="mt-0.5 block text-xs text-neutral-500">{text}</span>
      </span>
    </button>
  );

  return (
    <div className={modal ? 'fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6' : 'min-h-screen bg-[#FAFAF9] pb-24 pt-32'}>
      {modal && <button type="button" aria-label="Close checkout" onClick={() => setIsCheckoutOpen(false)} className="absolute inset-0 cursor-default" />}

      <div
        className={
          modal
            ? 'relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-[#FAFAF9] shadow-2xl sm:rounded-3xl'
            : 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'
        }
      >
        {/* Header */}
        <div className={`flex items-center justify-between gap-4 ${modal ? 'border-b border-neutral-200 bg-white px-5 py-4 sm:px-8' : 'mb-8'}`}>
          <div>
            <h1 className={`font-serif font-semibold tracking-tight text-neutral-950 ${modal ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>Checkout</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
              <Lock className="h-3.5 w-3.5 text-emerald-600" /> Safe & secure checkout
            </p>
          </div>
          {modal && (
            <button type="button" onClick={() => setIsCheckoutOpen(false)} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-black cursor-pointer" aria-label="Close checkout">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmitOrder} className={modal ? 'flex-1 overflow-y-auto px-5 py-6 sm:px-8' : ''}>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
            {/* LEFT */}
            <div className="space-y-6 lg:col-span-7">
              {/* 1. Details */}
              <section className="rounded-3xl bg-white p-5 ring-1 ring-neutral-200/70 sm:p-7">
                <StepHeader n={1} title="Your details" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full name *" icon={User}>
                    <input value={customer.name} onChange={e => set('name', e.target.value)} placeholder="Ali Khan" autoComplete="name" className={fieldInput} />
                  </Field>
                  <Field label="Mobile / WhatsApp *" icon={Phone}>
                    <input value={customer.phone} onChange={e => set('phone', e.target.value)} placeholder="0300 1234567" inputMode="tel" autoComplete="tel" className={fieldInput} />
                  </Field>
                </div>
                <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-neutral-500">
                  <input type="checkbox" checked={reminderConsent} onChange={e => setReminderConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#7A4E30]" />
                  <span>Send me order & parcel tracking updates on WhatsApp.</span>
                </label>
              </section>

              {/* 2. Address */}
              <section className="rounded-3xl bg-white p-5 ring-1 ring-neutral-200/70 sm:p-7">
                <StepHeader n={2} title="Delivery address" hint="All over Pakistan" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Address *" icon={MapPin} className="sm:col-span-2">
                    <input value={customer.address} onChange={e => set('address', e.target.value)} placeholder="House #, street, area" autoComplete="street-address" className={fieldInput} />
                  </Field>
                  <Field label="Apartment / landmark (optional)" icon={Building2} className="sm:col-span-2">
                    <input value={customer.apartment} onChange={e => set('apartment', e.target.value)} placeholder="Near main market" className={fieldInput} />
                  </Field>
                  <Field label="City *">
                    <input value={customer.city} onChange={e => set('city', e.target.value)} placeholder="Lahore" autoComplete="address-level2" list="pk-cities" className={fieldInput} />
                    <datalist id="pk-cities">{PK_CITIES.map(c => <option key={c} value={c} />)}</datalist>
                  </Field>
                  <Field label="Province">
                    <select value={customer.state} onChange={e => set('state', e.target.value)} className={`${fieldInput} cursor-pointer`}>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="Postal code (optional)">
                    <input value={customer.postalCode} onChange={e => set('postalCode', e.target.value)} placeholder="54000" inputMode="numeric" autoComplete="postal-code" className={fieldInput} />
                  </Field>
                </div>
              </section>

              {/* 3. Delivery */}
              <section className="rounded-3xl bg-white p-5 ring-1 ring-neutral-200/70 sm:p-7">
                <StepHeader n={3} title="Delivery" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <OptionCard
                    active={shippingMethod === 'standard'}
                    onClick={() => setShippingMethod('standard')}
                    icon={Truck}
                    title="Standard"
                    text="3–5 working days"
                    right={quote ? (quote.freeShipping.unlocked && shippingMethod === 'standard' ? 'Free' : formatPrice(quote.standardFee)) : '—'}
                  />
                  <OptionCard
                    active={shippingMethod === 'express'}
                    onClick={() => setShippingMethod('express')}
                    icon={Zap}
                    title="Express"
                    text="1–2 working days"
                    right={formatPrice(quote?.expressFee ?? EXPRESS_FEE)}
                  />
                </div>
              </section>

              {/* 4. Payment */}
              <section className="rounded-3xl bg-white p-5 ring-1 ring-neutral-200/70 sm:p-7">
                <StepHeader n={4} title="Payment" />
                <div className="space-y-3">
                  {showCod && (
                    <OptionCard
                      active={paymentMethod === 'cod'}
                      onClick={() => setPaymentMethod('cod')}
                      icon={Truck}
                      title="Cash on Delivery"
                      text={pay.codNote || 'Pay in cash when your order arrives.'}
                    />
                  )}
                  {showOnline && (
                    <OptionCard
                      active={paymentMethod === 'online'}
                      onClick={() => setPaymentMethod('online')}
                      icon={CreditCard}
                      title="Pay online"
                      text={onlineNames.join(' · ')}
                    />
                  )}
                  {showOnline && paymentMethod === 'online' && (
                    <div className="space-y-2.5 rounded-2xl bg-[#FBF5EE] p-4 text-sm ring-1 ring-[#EADFD2]">
                      {pay.bank.enabled && (pay.bank.accountNumber || pay.bank.iban) && (
                        <div><p className="font-semibold text-neutral-900">Bank transfer{pay.bank.bankName ? ` · ${pay.bank.bankName}` : ''}</p>
                          <p className="text-neutral-600">{pay.bank.accountTitle}{pay.bank.accountNumber ? ` · ${pay.bank.accountNumber}` : ''}</p>
                          {pay.bank.iban && <p className="font-mono text-xs text-neutral-600">IBAN {pay.bank.iban}</p>}</div>
                      )}
                      {pay.easypaisa.enabled && pay.easypaisa.number && <div><p className="font-semibold text-neutral-900">Easypaisa</p><p className="text-neutral-600">{pay.easypaisa.accountTitle} · {pay.easypaisa.number}</p></div>}
                      {pay.jazzcash.enabled && pay.jazzcash.number && <div><p className="font-semibold text-neutral-900">JazzCash</p><p className="text-neutral-600">{pay.jazzcash.accountTitle} · {pay.jazzcash.number}</p></div>}
                      {pay.raast.enabled && pay.raast.raastId && <div><p className="font-semibold text-neutral-900">Raast</p><p className="text-neutral-600">{pay.raast.raastId}</p></div>}
                      {pay.instructions && <p className="border-t border-[#EADFD2] pt-2.5 text-xs text-neutral-600">{pay.instructions}</p>}
                    </div>
                  )}
                  {!showCod && !showOnline && <p className="text-sm text-red-600">Ordering is paused right now. Please contact us on WhatsApp.</p>}
                </div>
              </section>
            </div>

            {/* RIGHT: Summary */}
            <aside className="lg:col-span-5 lg:sticky lg:top-6">
              <div className="rounded-3xl bg-white p-5 ring-1 ring-neutral-200/70 sm:p-7">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-neutral-950">Order summary</h3>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">{itemCount} item{itemCount === 1 ? '' : 's'}</span>
                </div>

                <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={`${item.productId}-${item.color}-${item.size}`} className="flex items-center gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        <img src={imgUrl(item.image, 200)} decoding="async" loading="lazy" alt={item.name} className="h-full w-full object-cover" />
                        <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-neutral-900 px-1 text-[10px] font-bold text-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900">{item.name}</p>
                        <p className="text-xs text-neutral-500">{item.color} · Size {sizeLabel(item.size)}</p>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="my-5 h-px bg-neutral-100" />
                <FreeShippingBar className="mb-4" />
                <CouponBox className="mb-5" />
                <PriceSummary />

                {errorMessage && (
                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 text-sm font-semibold text-white shadow-lg shadow-neutral-900/20 transition-all hover:bg-neutral-800 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</>
                  ) : (
                    <>Place Order · {formatPrice(total)} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                  )}
                </button>

                <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] text-neutral-500">
                  <span className="flex flex-col items-center gap-1"><Lock className="h-4 w-4 text-[#7A4E30]" /> Secure</span>
                  <span className="flex flex-col items-center gap-1"><RotateCcw className="h-4 w-4 text-[#7A4E30]" /> 30-day returns</span>
                  <span className="flex flex-col items-center gap-1"><ShieldCheck className="h-4 w-4 text-[#7A4E30]" /> 100% original</span>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
};
