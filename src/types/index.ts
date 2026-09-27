export type UserRole = 'admin' | 'shop' | 'customer';

export interface UserProfile {
  uid: string;
  role: UserRole;
  shopId?: string;
  customerId?: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  emiratesIdNumber: string;
  emiratesIdFrontUrl?: string;
  emiratesIdBackUrl?: string;
  companyName?: string;
  dob?: string;
  averageRating: number;
  ratingCount: number;
  isFirstLogin: boolean;
  password?: string;
  createdAt: string;
}

export interface Shop {
  id: string;
  shopId: string; // e.g. "SHOP1001"
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  locationLink?: string;
  currency: string; // Admin sets this, e.g. "AED"
  ownerUid: string;
  emiratesIdNumber: string;
  emiratesIdFrontUrl?: string;
  emiratesIdBackUrl?: string;
  rating: number;
  ratingCount: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  customerId: string; // e.g. "CUST1001"
  shopId: string;
  name: string;
  phone: string;
  emiratesIdNumber: string;
  emiratesIdFrontUrl?: string;
  emiratesIdBackUrl?: string;
  companyName?: string;
  dob?: string;
  address: string;
  creditLimit: number; // e.g. 5000 AED
  autoReminder: boolean; // toggle for automated WhatsApp over-limit reminders
  rating: number;
  ratingCount: number;
  isFirstLogin: boolean;
  password?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  shopId: string;
  customerId: string;
  type: 'CREDIT' | 'PAYMENT'; // Never "loan"
  amount: number;
  date: string; // YYYY-MM-DD
  monthYear: string; // YYYY-MM
  note: string;
  invoiceNumber?: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  fromUid: string;
  fromRole: UserRole;
  fromName: string;
  toUid: string;
  toRole: UserRole;
  targetId: string; // shopId or customerId
  stars: number; // 1-5
  comment?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  targetCustomerId: string;
  shopId: string;
  shopName: string;
  type: 'CREDIT_ADDED' | 'PAYMENT_RECEIVED' | 'LIMIT_EXCEEDED';
  amount: number;
  closingBalance: number;
  newTotalDue: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface MonthSummary {
  monthYear: string; // "2026-09"
  monthName: string; // "September 2026"
  openingBalance: number; // Carried forward from previous month closing balance
  creditAmount: number;
  paidAmount: number;
  closingBalance: number; // openingBalance + creditAmount - paidAmount
  transactions: Transaction[];
}
