export function formatMoney(amount: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
}

export function formatDateLabel(date: Date) {
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function depositAmount(price: number, depositAmt: number | null, isPercent: boolean) {
  if (!depositAmt) return 0;
  return isPercent ? Number(((price * depositAmt) / 100).toFixed(2)) : Number(depositAmt);
}

export function amountDueForService(service: { price: number; payment_type: string; deposit_amount: number | null; deposit_is_percent: boolean }) {
  if (service.payment_type === 'full') return service.price;
  if (service.payment_type === 'deposit') return depositAmount(service.price, service.deposit_amount, service.deposit_is_percent);
  return 0;
}
