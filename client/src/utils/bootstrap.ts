// Loads public store data (settings, active promo, shipping info) in ONE request on first page load.
// Storefront helpers read from it first and fall back to their own endpoint if it fails.
// Admin pages skip it so they always see fresh values right after an edit.

interface BootstrapData {
  settings: Record<string, any>;
  activePromo: any;
  shippingInfo: any;
}

let promise: Promise<BootstrapData | null> | null = null;
const loadedAt = Date.now();
// Bundle values are reused for the first minute (several components ask for the same thing on load)
const FRESH_MS = 60_000;

const isAdmin = () => typeof location !== 'undefined' && location.pathname.startsWith('/admin');

function load(): Promise<BootstrapData | null> {
  if (!promise) {
    promise = fetch('/api/bootstrap')
      .then(r => (r.ok ? r.json() : null))
      .then(j => (j?.success ? (j.data as BootstrapData) : null))
      .catch(() => null);
  }
  return promise;
}

/**
 * Value from the bootstrap bundle, or `undefined` when the caller should fetch it itself
 * (admin page, bootstrap failed, or the page has been open over a minute — then fresh data is fetched).
 */
export async function fromBootstrap<T = any>(pick: (d: BootstrapData) => T, _id?: string): Promise<T | undefined> {
  if (isAdmin() || Date.now() - loadedAt > FRESH_MS) return undefined;
  const d = await load();
  if (!d) return undefined;
  const v = pick(d);
  return v === undefined ? undefined : v;
}

/** Start the request as early as possible */
export function prefetchBootstrap() {
  if (!isAdmin()) load();
}
