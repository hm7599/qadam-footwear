export const formatPrice = (amount: number, currency = 'Rs. '): string => {
  return `${currency}${Math.round(amount).toLocaleString('en-PK')}`;
};

export const formatPKR = (amount: number): string => {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
};

export const PAKISTAN_CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Abbottabad',
  'Bahawalpur',
  'Sargodha',
  'Sukkur',
  'Wah Cantt',
  'Mardan',
  'Gujrat',
];

export const PAKISTAN_PROVINCES = [
  'Punjab',
  'Sindh',
  'Islamabad Capital Territory',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Azad Jammu & Kashmir',
  'Gilgit-Baltistan',
];

export const COURIERS = [
  { id: 'tcs', label: 'TCS Express Courier (Nationwide Overnight)', eta: '1-2 business days' },
  { id: 'leopards', label: 'Leopards Priority Air Courier', eta: '2-3 business days' },
  { id: 'trax', label: 'Trax Logistics Special Delivery', eta: '2-3 business days' },
  { id: 'whiteglove', label: 'QADAM VIP Concierge Hand-Delivery (Lahore & Karachi)', eta: 'Same-day / Next-day' },
];

