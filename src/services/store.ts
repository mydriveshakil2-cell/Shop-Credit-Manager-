import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  UserProfile,
  Shop,
  Customer,
  Transaction,
  Rating,
  AppNotification,
  UserRole,
} from '../types';
import { generateEidCardPreviewSvg } from '../utils/eidScanner';

// Default Admin Profile
export const DEFAULT_ADMIN: UserProfile = {
  uid: 'admin_master_uid',
  role: 'admin',
  name: 'System Admin',
  phone: '0500000000',
  email: 'admin@shopcredit.ae',
  address: 'Dubai, United Arab Emirates',
  emiratesIdNumber: '784-1980-0000000-1',
  averageRating: 5.0,
  ratingCount: 1,
  isFirstLogin: false,
  password: 'Uae@@2024',
  createdAt: '2026-01-01T00:00:00.000Z',
};

// Local state cache with LocalStorage synchronization
class StoreManager {
  private users: UserProfile[] = [];
  private shops: Shop[] = [];
  private customers: Customer[] = [];
  private transactions: Transaction[] = [];
  private ratings: Rating[] = [];
  private notifications: AppNotification[] = [];
  private initialized = false;
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    try {
      // Clear legacy demo cache if present
      localStorage.removeItem('scm_database_cache');

      const stored = localStorage.getItem('scm_database_prod_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.users = parsed.users && parsed.users.length > 0 ? parsed.users : [DEFAULT_ADMIN];
        this.shops = parsed.shops || [];
        this.customers = parsed.customers || [];
        this.transactions = parsed.transactions || [];
        this.ratings = parsed.ratings || [];
        this.notifications = parsed.notifications || [];
        this.initialized = true;
      }
    } catch {
      // fallback
    }

    if (!this.initialized) {
      this.resetToSeedData();
    }
  }

  private saveToLocalStorage() {
    try {
      const payload = {
        users: this.users,
        shops: this.shops,
        customers: this.customers,
        transactions: this.transactions,
        ratings: this.ratings,
        notifications: this.notifications,
      };
      localStorage.setItem('scm_database_prod_v1', JSON.stringify(payload));
    } catch {
      // localStorage storage limits handled gracefully
    }
    this.notifyListeners();
  }

  private resetToSeedData() {
    // Clean production initial state with ONLY the configured Admin account
    this.users = [DEFAULT_ADMIN];
    this.shops = [];
    this.customers = [];
    this.transactions = [];
    this.ratings = [];
    this.notifications = [];
    this.initialized = true;
    this.saveToLocalStorage();
  }

  // Sync to and from Firestore in background
  public async initFirestoreSync() {
    try {
      // Try to load any remote docs
      const shopsSnap = await getDocs(collection(db, 'shops'));
      if (!shopsSnap.empty) {
        const remoteShops: Shop[] = [];
        shopsSnap.forEach((d) => remoteShops.push(d.data() as Shop));
        if (remoteShops.length > 0) {
          this.shops = remoteShops;
        }
      } else {
        // Seed remote
        for (const s of this.shops) {
          await setDoc(doc(db, 'shops', s.id), s);
        }
      }

      const custSnap = await getDocs(collection(db, 'customers'));
      if (!custSnap.empty) {
        const remoteCusts: Customer[] = [];
        custSnap.forEach((d) => remoteCusts.push(d.data() as Customer));
        if (remoteCusts.length > 0) {
          this.customers = remoteCusts;
        }
      } else {
        for (const c of this.customers) {
          await setDoc(doc(db, 'customers', c.id), c);
        }
      }

      const txSnap = await getDocs(collection(db, 'transactions'));
      if (!txSnap.empty) {
        const remoteTxs: Transaction[] = [];
        txSnap.forEach((d) => remoteTxs.push(d.data() as Transaction));
        if (remoteTxs.length > 0) {
          this.transactions = remoteTxs;
        }
      } else {
        for (const t of this.transactions) {
          await setDoc(doc(db, 'transactions', t.id), t);
        }
      }

      this.saveToLocalStorage();
    } catch {
      // Network latency or offline mode handled smoothly
    }
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  // --- UNIQUE USER CONSTRAINT CHECKS ---
  public checkUniqueConstraints(
    phone: string,
    emiratesIdNumber: string,
    excludeUid?: string
  ): { phoneInUse: boolean; eidInUse: boolean } {
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    const cleanEid = emiratesIdNumber.replace(/\D/g, '');

    const phoneInUse = this.users.some((u) => {
      if (excludeUid && u.uid === excludeUid) return false;
      return u.phone.replace(/[\s\-\(\)\+]/g, '') === cleanPhone;
    });

    const eidInUse = this.users.some((u) => {
      if (excludeUid && u.uid === excludeUid) return false;
      return u.emiratesIdNumber.replace(/\D/g, '') === cleanEid;
    });

    return { phoneInUse, eidInUse };
  }

  // Find customer by Emirates ID (for auto-pulling existing profile and freezing fields)
  public findCustomerByEmiratesId(emiratesIdNumber: string): Customer | undefined {
    const clean = emiratesIdNumber.replace(/\D/g, '');
    return this.customers.find((c) => c.emiratesIdNumber.replace(/\D/g, '') === clean);
  }

  // --- SHOPS ---
  public getShops(): Shop[] {
    return [...this.shops];
  }

  public getShopById(shopId: string): Shop | undefined {
    return this.shops.find((s) => s.shopId === shopId || s.id === shopId);
  }

  public async createShop(shopData: Omit<Shop, 'id' | 'createdAt' | 'rating' | 'ratingCount'>): Promise<Shop> {
    const id = `shop_${Date.now()}`;
    const newShop: Shop = {
      ...shopData,
      id,
      rating: 5.0,
      ratingCount: 1,
      createdAt: new Date().toISOString(),
    };

    // Also create user record for shop owner
    const newUser: UserProfile = {
      uid: newShop.ownerUid || `user_${id}`,
      role: 'shop',
      shopId: newShop.shopId,
      name: newShop.ownerName,
      phone: newShop.phone,
      address: newShop.address,
      emiratesIdNumber: newShop.emiratesIdNumber,
      emiratesIdFrontUrl: newShop.emiratesIdFrontUrl,
      emiratesIdBackUrl: newShop.emiratesIdBackUrl,
      averageRating: 5.0,
      ratingCount: 1,
      isFirstLogin: true, // Needs to set password on first login
      createdAt: newShop.createdAt,
    };

    this.shops.unshift(newShop);
    this.users.unshift(newUser);
    this.saveToLocalStorage();

    // Async Firestore write
    try {
      await setDoc(doc(db, 'shops', newShop.id), newShop);
      await setDoc(doc(db, 'users', newUser.uid), newUser);
    } catch {
      // Stored locally
    }

    return newShop;
  }

  public async updateShopProfile(
    shopId: string,
    updates: Partial<Pick<Shop, 'shopName' | 'ownerName' | 'phone' | 'address' | 'locationLink'>>
  ): Promise<Shop> {
    const idx = this.shops.findIndex((s) => s.shopId === shopId);
    if (idx === -1) throw new Error('Shop not found');

    const updated = { ...this.shops[idx], ...updates };
    this.shops[idx] = updated;

    // Sync to user record
    const uIdx = this.users.findIndex((u) => u.shopId === shopId && u.role === 'shop');
    if (uIdx !== -1) {
      this.users[uIdx] = {
        ...this.users[uIdx],
        name: updated.ownerName,
        phone: updated.phone,
        address: updated.address,
      };
    }

    this.saveToLocalStorage();

    try {
      await updateDoc(doc(db, 'shops', updated.id), updates);
    } catch {
      // Local fallback
    }

    return updated;
  }

  public async deleteShop(shopId: string): Promise<void> {
    const shop = this.shops.find((s) => s.shopId === shopId);
    this.shops = this.shops.filter((s) => s.shopId !== shopId);
    this.users = this.users.filter((u) => u.shopId !== shopId);
    this.customers = this.customers.filter((c) => c.shopId !== shopId);
    this.transactions = this.transactions.filter((t) => t.shopId !== shopId);

    this.saveToLocalStorage();

    if (shop) {
      try {
        await deleteDoc(doc(db, 'shops', shop.id));
      } catch {
        // Ignored
      }
    }
  }

  // --- CUSTOMERS ---
  public getCustomers(shopId?: string): Customer[] {
    if (shopId) {
      return this.customers.filter((c) => c.shopId === shopId);
    }
    return [...this.customers];
  }

  public getCustomerById(customerId: string): Customer | undefined {
    return this.customers.find((c) => c.customerId === customerId || c.id === customerId);
  }

  public async createCustomer(
    custData: Omit<Customer, 'id' | 'createdAt' | 'rating' | 'ratingCount' | 'isFirstLogin'>
  ): Promise<Customer> {
    const id = `cust_${Date.now()}`;
    const newCustomer: Customer = {
      ...custData,
      id,
      rating: 5.0,
      ratingCount: 1,
      isFirstLogin: true,
      createdAt: new Date().toISOString(),
    };

    // User record for customer login
    const newUser: UserProfile = {
      uid: id,
      role: 'customer',
      customerId: newCustomer.customerId,
      shopId: newCustomer.shopId,
      name: newCustomer.name,
      phone: newCustomer.phone,
      address: newCustomer.address,
      emiratesIdNumber: newCustomer.emiratesIdNumber,
      emiratesIdFrontUrl: newCustomer.emiratesIdFrontUrl,
      emiratesIdBackUrl: newCustomer.emiratesIdBackUrl,
      companyName: newCustomer.companyName,
      dob: newCustomer.dob,
      averageRating: 5.0,
      ratingCount: 1,
      isFirstLogin: true,
      createdAt: newCustomer.createdAt,
    };

    this.customers.unshift(newCustomer);
    this.users.unshift(newUser);
    this.saveToLocalStorage();

    try {
      await setDoc(doc(db, 'customers', newCustomer.id), newCustomer);
      await setDoc(doc(db, 'users', newUser.uid), newUser);
    } catch {
      // Saved locally
    }

    return newCustomer;
  }

  public async deleteCustomer(customerId: string): Promise<void> {
    const cust = this.customers.find((c) => c.customerId === customerId);
    this.customers = this.customers.filter((c) => c.customerId !== customerId);
    this.users = this.users.filter((u) => u.customerId !== customerId);
    this.transactions = this.transactions.filter((t) => t.customerId !== customerId);

    this.saveToLocalStorage();

    if (cust) {
      try {
        await deleteDoc(doc(db, 'customers', cust.id));
      } catch {
        // Local
      }
    }
  }

  // --- TRANSACTIONS ---
  public getTransactions(filter?: { shopId?: string; customerId?: string }): Transaction[] {
    let result = [...this.transactions];
    if (filter?.shopId) {
      result = result.filter((t) => t.shopId === filter.shopId);
    }
    if (filter?.customerId) {
      result = result.filter((t) => t.customerId === filter.customerId);
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }

  public async addTransaction(
    txData: Omit<Transaction, 'id' | 'createdAt' | 'monthYear'> & { monthYear?: string }
  ): Promise<Transaction> {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const monthYear = txData.monthYear || txData.date.slice(0, 7);

    const newTx: Transaction = {
      ...txData,
      id,
      monthYear,
      createdAt: new Date().toISOString(),
    };

    this.transactions.unshift(newTx);

    // Compute updated balances for this customer
    const custTxs = this.transactions.filter(
      (t) => t.shopId === newTx.shopId && t.customerId === newTx.customerId
    );

    const totalCredits = custTxs
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPayments = custTxs
      .filter((t) => t.type === 'PAYMENT')
      .reduce((sum, t) => sum + t.amount, 0);
    const newTotalDue = totalCredits - totalPayments;

    const shop = this.getShopById(newTx.shopId);
    const customer = this.getCustomerById(newTx.customerId);

    // Create Customer Notification
    if (customer && shop) {
      const currency = shop.currency || 'AED';
      let notifMessage = '';
      if (newTx.type === 'CREDIT') {
        notifMessage = `Shop: ${shop.shopName} (${shop.shopId}). Newly Added Credit Amount: ${currency} ${newTx.amount.toFixed(2)}. Updated Total Due Balance: ${currency} ${newTotalDue.toFixed(2)}.`;
      } else {
        // Payment notification requirement format:
        // "Successfully add your [Received amount] to [Shop Name] [Shop Id] Now Your Current Due Amount is [Closing Balance] - [Received amount] = [Total Amount]."
        const previousBalance = newTotalDue + newTx.amount;
        notifMessage = `Successfully add your ${currency} ${newTx.amount.toFixed(2)} to ${shop.shopName} ${shop.shopId} Now Your Current Due Amount is ${currency} ${previousBalance.toFixed(2)} - ${currency} ${newTx.amount.toFixed(2)} = ${currency} ${newTotalDue.toFixed(2)}.`;
      }

      const notif: AppNotification = {
        id: `notif_${Date.now()}`,
        targetCustomerId: customer.customerId,
        shopId: shop.shopId,
        shopName: shop.shopName,
        type: newTx.type === 'CREDIT' ? 'CREDIT_ADDED' : 'PAYMENT_RECEIVED',
        amount: newTx.amount,
        closingBalance: newTotalDue + (newTx.type === 'PAYMENT' ? newTx.amount : 0),
        newTotalDue,
        message: notifMessage,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      this.notifications.unshift(notif);
      try {
        await setDoc(doc(db, 'notifications', notif.id), notif);
      } catch {
        // Local
      }
    }

    this.saveToLocalStorage();

    try {
      await setDoc(doc(db, 'transactions', newTx.id), newTx);
    } catch {
      // Local
    }

    return newTx;
  }

  // --- NOTIFICATIONS ---
  public getCustomerNotifications(customerId: string): AppNotification[] {
    return this.notifications.filter((n) => n.targetCustomerId === customerId);
  }

  public getUnreadCustomerNotifications(customerId: string): AppNotification[] {
    return this.notifications.filter((n) => n.targetCustomerId === customerId && !n.isRead);
  }

  public async markNotificationAsRead(id: string): Promise<void> {
    const idx = this.notifications.findIndex((n) => n.id === id);
    if (idx !== -1) {
      this.notifications[idx].isRead = true;
      this.saveToLocalStorage();
      try {
        await updateDoc(doc(db, 'notifications', id), { isRead: true });
      } catch {
        // Local
      }
    }
  }

  // --- RATINGS ---
  public getRatings(targetId: string): Rating[] {
    return this.ratings.filter((r) => r.targetId === targetId);
  }

  public async addRating(ratingData: Omit<Rating, 'id' | 'createdAt'>): Promise<Rating> {
    const id = `rate_${Date.now()}`;
    const newRating: Rating = {
      ...ratingData,
      id,
      createdAt: new Date().toISOString(),
    };

    this.ratings.unshift(newRating);

    // Recalculate average rating for target
    const targetRatings = this.ratings.filter((r) => r.targetId === ratingData.targetId);
    const avg = targetRatings.reduce((sum, r) => sum + r.stars, 0) / targetRatings.length;
    const roundedAvg = Math.round(avg * 10) / 10;

    if (ratingData.toRole === 'shop') {
      const sIdx = this.shops.findIndex((s) => s.shopId === ratingData.targetId);
      if (sIdx !== -1) {
        this.shops[sIdx].rating = roundedAvg;
        this.shops[sIdx].ratingCount = targetRatings.length;
      }
    } else if (ratingData.toRole === 'customer') {
      const cIdx = this.customers.findIndex((c) => c.customerId === ratingData.targetId);
      if (cIdx !== -1) {
        this.customers[cIdx].rating = roundedAvg;
        this.customers[cIdx].ratingCount = targetRatings.length;
      }
    }

    this.saveToLocalStorage();

    try {
      await setDoc(doc(db, 'ratings', newRating.id), newRating);
    } catch {
      // Local
    }

    return newRating;
  }

  // --- AUTH / USER VERIFICATION ---
  public getUserProfileByUid(uid: string): UserProfile | undefined {
    return this.users.find((u) => u.uid === uid);
  }

  public getUserByShopId(shopId: string): UserProfile | undefined {
    return this.users.find((u) => u.shopId === shopId && u.role === 'shop');
  }

  public getUserByCustomerId(customerId: string): UserProfile | undefined {
    return this.users.find((u) => u.customerId === customerId && u.role === 'customer');
  }

  public async setPasswordForUser(identifier: string, role: UserRole, password: string): Promise<UserProfile> {
    let user: UserProfile | undefined;
    if (role === 'shop') {
      user = this.users.find((u) => u.shopId === identifier);
    } else if (role === 'customer') {
      user = this.users.find((u) => u.customerId === identifier);
    }

    if (!user) throw new Error('User not found');

    user.password = password;
    user.isFirstLogin = false;

    // Update in customers/shops collection as well
    if (role === 'customer') {
      const c = this.customers.find((cust) => cust.customerId === identifier);
      if (c) {
        c.password = password;
        c.isFirstLogin = false;
      }
    }

    this.saveToLocalStorage();

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        password,
        isFirstLogin: false,
      });
    } catch {
      // Local
    }

    return user;
  }
}

export const store = new StoreManager();
