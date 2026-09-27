/**
 * UAE specific validation and formatting utilities
 * Strictly English UI, AED currency, Emirates ID (784-YYYY-XXXXXXX-X), UAE mobile numbers
 */

export const APP_PUBLIC_URL = typeof window !== 'undefined' ? window.location.origin : 'https://demolink.vercel.app';

/**
 * Validates UAE Emirates ID format: 784-YYYY-XXXXXXX-X (15 digits total)
 */
export function isValidEmiratesId(eid: string): boolean {
  // Strip non-digits
  const clean = eid.replace(/\D/g, '');
  if (clean.length !== 15) return false;
  if (!clean.startsWith('784')) return false;

  // Year check (index 3 to 7)
  const year = parseInt(clean.substring(3, 7), 10);
  const currentYear = new Date().getFullYear();
  if (year < 1920 || year > currentYear) return false;

  return true;
}

/**
 * Formats digits into standard UAE Emirates ID: 784-YYYY-XXXXXXX-X
 */
export function formatEmiratesId(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 15);
  let res = '';
  if (digits.length > 0) {
    res += digits.slice(0, 3);
  }
  if (digits.length > 3) {
    res += '-' + digits.slice(3, 7);
  }
  if (digits.length > 7) {
    res += '-' + digits.slice(7, 14);
  }
  if (digits.length > 14) {
    res += '-' + digits.slice(14, 15);
  }
  return res;
}

/**
 * Validates UAE Mobile number (e.g., 0501234567, +971501234567, 971501234567)
 */
export function isValidUaePhone(phone: string): boolean {
  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  // Matches 050, 052, 054, 055, 056, 058, etc. or 9715...
  const uaeRegex = /^(?:(?:\+?971)|0)?5[0-9]{8}$/;
  return uaeRegex.test(clean);
}

/**
 * Cleans phone number to international WhatsApp format: 9715XXXXXXXX
 */
export function normalizeUaePhoneForWhatsApp(phone: string): string {
  let clean = phone.replace(/[\s\-\(\)\+]/g, '');
  if (clean.startsWith('0')) {
    clean = '971' + clean.slice(1);
  } else if (!clean.startsWith('971')) {
    clean = '971' + clean;
  }
  return clean;
}

/**
 * Formats UAE phone for readable display (e.g. +971 50 123 4567)
 */
export function formatUaePhoneDisplay(phone: string): string {
  const clean = normalizeUaePhoneForWhatsApp(phone);
  if (clean.length === 12 && clean.startsWith('971')) {
    return `+971 ${clean.slice(3, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
  }
  return phone;
}

/**
 * Format currency amount in AED
 */
export function formatAED(amount: number, currency = 'AED'): string {
  const formatted = new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `${currency} ${formatted}`;
}

/**
 * Centered WhatsApp message template for Shop creation:
 *
 *                  **CONGRATULATIONS**
 *
 *                      Successfully
 *                 Generate Your Shop ID
 *                        Details:
 *                  Shop Name: [Shop Name]
 *                  Shop ID: [auto Generated ID]
 *                  Owner Name: [Owner Name]
 *                  Address: [Location]
 *                Owner Mobile Number: [Mobile Number]
 *
 *                 App Link: [demolink.vercel.app]
 */
export function createShopWhatsAppShareUrl(shop: {
  shopName: string;
  shopId: string;
  ownerName: string;
  address: string;
  phone: string;
}): string {
  const phone = normalizeUaePhoneForWhatsApp(shop.phone);
  const message = `                 **CONGRATULATIONS**

                     Successfully
                Generate Your Shop ID
                       Details:
                 Shop Name: ${shop.shopName}
                 Shop ID: ${shop.shopId}
                 Owner Name: ${shop.ownerName}
                 Address: ${shop.address}
               Owner Mobile Number: ${shop.phone}

                App Link: ${APP_PUBLIC_URL}`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Centered WhatsApp message template for Customer creation:
 *
 *                  **CONGRATULATIONS**
 *
 *                      Successfully
 *                Generate Your Customer ID
 *                        Details:
 *                  Shop Name: [Shop Name]
 *                  Shop ID: [auto Generated ID]
 *                  Owner Name: [Owner Name]
 *                  Address: [Location]
 *                Owner Mobile Number: [Mobile Number]
 *
 *                 App Link: [demolink.vercel.app]
 */
export function createCustomerWhatsAppShareUrl(data: {
  customerPhone: string;
  shopName: string;
  shopId: string;
  ownerName: string;
  shopAddress: string;
  ownerPhone: string;
  customerId: string;
}): string {
  const phone = normalizeUaePhoneForWhatsApp(data.customerPhone);
  const message = `                 **CONGRATULATIONS**

                     Successfully
               Generate Your Customer ID
                       Details:
                 Shop Name: ${data.shopName}
                 Shop ID: ${data.shopId}
                 Owner Name: ${data.ownerName}
                 Address: ${data.shopAddress}
               Owner Mobile Number: ${data.ownerPhone}

                App Link: ${APP_PUBLIC_URL}`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * WhatsApp message template for Over-Limit Reminder
 */
export function createOverLimitWhatsAppReminderUrl(data: {
  customerName: string;
  customerPhone: string;
  shopName: string;
  shopId: string;
  creditLimit: number;
  currentDue: number;
  currency: string;
}): string {
  const phone = normalizeUaePhoneForWhatsApp(data.customerPhone);
  const message = `                 *PAYMENT REMINDER*
                 *Shop Credit Master*

Dear ${data.customerName},
This is a courteous reminder from *${data.shopName}* (Shop ID: ${data.shopId}).

Your assigned credit limit is ${data.currency} ${data.creditLimit.toLocaleString()}.
Your current outstanding due balance has reached *${data.currency} ${data.currentDue.toLocaleString()}*.

Please arrange to settle the outstanding due amount at your earliest convenience.

Thank you for your business!
App Link: ${APP_PUBLIC_URL}`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Sample simulated UAE Emirates ID preset records for easy testing
 */
export const SAMPLE_EID_PRESETS = [
  {
    name: 'Rashid Bin Tariq Al Mansoori',
    emiratesIdNumber: '784-1988-1428591-3',
    companyName: 'Al Barsha Trading & Logistics LLC',
    dob: '1988-06-15',
    phone: '0501234567',
    address: 'Al Barsha 1, Dubai, UAE',
  },
  {
    name: 'Zayed Sultan Al Nuaimi',
    emiratesIdNumber: '784-1992-2983710-4',
    companyName: 'Emirates Falcon Supermarket',
    dob: '1992-11-20',
    phone: '0559876543',
    address: 'Deira Gold Souk Area, Dubai, UAE',
  },
  {
    name: 'Hamdan Mohammed Al Maktoum',
    emiratesIdNumber: '784-1985-6543210-9',
    companyName: 'Gulf Sunrise Mart LLC',
    dob: '1985-03-10',
    phone: '0528765432',
    address: 'Business Bay, Dubai, UAE',
  },
];
