import { Order } from '../types';
import { sizeLabel } from './sizes';

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const PAYMENT: Record<string, string> = {
  cod: 'Cash on Delivery',
  card: 'Card (paid)',
  apple_pay: 'Apple Pay (paid)',
  google_pay: 'Google Pay (paid)',
};

/**
 * Opens a clean, printable invoice in a new tab and starts the print dialog,
 * where the customer can choose "Save as PDF" to download it.
 */
export function downloadInvoice(order: Order, formatPrice: (usd: number) => string) {
  const c = order.customer;
  const date = new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });
  const rows = order.items
    .map(
      (i, n) => `
      <tr>
        <td>${n + 1}</td>
        <td><b>${esc(i.name)}</b><br><span class="muted">${esc(i.color)} · Size ${esc(sizeLabel(i.size))}</span></td>
        <td class="c">${i.quantity}</td>
        <td class="r">${esc(formatPrice(i.price))}</td>
        <td class="r">${esc(formatPrice(i.price * i.quantity))}</td>
      </tr>`
    )
    .join('');

  const paid = order.paymentStatus === 'paid';
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Invoice ${esc(order.orderNumber)} – QADAM</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{box-sizing:border-box} body{margin:0;background:#F4F1EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1B1714}
  .page{max-width:800px;margin:24px auto;background:#fff;padding:48px;border-radius:16px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;border-bottom:2px solid #1B1714;padding-bottom:24px}
  .brand{font-family:Georgia,'Times New Roman',serif;font-size:32px;letter-spacing:.25em;font-weight:700}
  .brand small{display:block;font-family:inherit;font-size:10px;letter-spacing:.35em;color:#81776C;margin-top:4px;font-weight:400}
  h1{margin:0;font-size:22px;letter-spacing:.08em;text-transform:uppercase;text-align:right}
  .meta{text-align:right;font-size:13px;color:#4C453D;line-height:1.7;margin-top:6px}
  .grid{display:flex;gap:24px;margin:28px 0}
  .box{flex:1;background:#FAF8F5;border:1px solid #E8E2DA;border-radius:12px;padding:16px;font-size:13px;line-height:1.6}
  .label{font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:#81776C;margin-bottom:6px;font-weight:600}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#81776C;border-bottom:1px solid #E8E2DA;padding:10px 8px}
  td{padding:12px 8px;border-bottom:1px solid #F0EBE4;vertical-align:top}
  .c{text-align:center} .r{text-align:right} .muted{color:#81776C;font-size:12px}
  .totals{margin-left:auto;width:280px;margin-top:16px;font-size:13px}
  .totals div{display:flex;justify-content:space-between;padding:6px 8px}
  .totals .grand{border-top:2px solid #1B1714;margin-top:6px;padding-top:10px;font-size:16px;font-weight:700}
  .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:${paid ? '#E7F5EC' : '#FDF3E1'};color:${paid ? '#1F7A45' : '#9A6212'}}
  .foot{margin-top:40px;padding-top:20px;border-top:1px solid #E8E2DA;font-size:12px;color:#81776C;text-align:center;line-height:1.7}
  .actions{max-width:800px;margin:0 auto 24px;text-align:center}
  .actions button{background:#1B1714;color:#fff;border:0;border-radius:999px;padding:12px 28px;font-size:14px;font-weight:600;cursor:pointer}
  @media print{body{background:#fff}.page{margin:0;border-radius:0;padding:24px}.actions{display:none}}
  @media (max-width:600px){.page{padding:24px}.top,.grid{flex-direction:column}h1,.meta{text-align:left}.totals{width:100%}}
</style></head>
<body>
  <div class="page">
    <div class="top">
      <div class="brand"><img src="${location.origin}/logo.png" alt="QADAM Men's Footwear" style="height:64px;width:auto;display:block"></div>
      <div>
        <h1>Invoice</h1>
        <div class="meta">
          Invoice #: <b>INV-${esc(order.orderNumber)}</b><br>
          Order #: ${esc(order.orderNumber)}<br>
          Date: ${esc(date)}
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="label">Bill to / Ship to</div>
        <b>${esc(c.name)}</b><br>
        ${esc([c.address, c.apartment].filter(Boolean).join(', '))}<br>
        ${esc([c.city, c.state, c.postalCode].filter(Boolean).join(', '))}<br>
        ${esc(c.phone)}${c.email && !c.email.includes('aura.local') && !c.email.includes('qadam.local') ? '<br>' + esc(c.email) : ''}
      </div>
      <div class="box">
        <div class="label">Payment</div>
        ${esc(PAYMENT[order.paymentMethod] || order.paymentMethod)}<br>
        <span class="badge">${paid ? 'PAID' : 'PAYMENT DUE ON DELIVERY'}</span>
        <div class="label" style="margin-top:12px">Delivery</div>
        ${esc(order.shippingMethod || 'Standard delivery')}
        ${order.trackingNumber && order.orderStatus !== 'pending' ? `<br><span class="muted">Tracking: ${esc(order.trackingCarrier || '')} ${esc(order.trackingNumber)}</span>` : ''}
      </div>
    </div>

    <table>
      <thead><tr><th>#</th><th>Item</th><th class="c">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div><span>Subtotal</span><span>${esc(formatPrice(order.subtotal))}</span></div>
      <div><span>Delivery</span><span>${order.shippingCost ? esc(formatPrice(order.shippingCost)) : 'Free'}</span></div>
      ${order.discount ? `<div><span>Discount</span><span>− ${esc(formatPrice(order.discount))}</span></div>` : ''}
      <div class="grand"><span>Total</span><span>${esc(formatPrice(order.totalAmount))}</span></div>
    </div>

    <div class="foot">
      Thank you for shopping with QADAM!<br>
      Questions about your order? WhatsApp us or email support@qadamshoes.com · Easy 30-day returns on unworn shoes.
    </div>
  </div>
  <div class="actions"><button onclick="window.print()">Download / Print PDF</button></div>
  <script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})</script>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) {
    // Pop-up blocked: download as an HTML file instead
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `QADAM-Invoice-${order.orderNumber}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
