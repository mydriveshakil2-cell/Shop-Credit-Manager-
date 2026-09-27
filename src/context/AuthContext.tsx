import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { store, DEFAULT_ADMIN } from '../services/store';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole | null;
  loading: boolean;
  loginAsAdmin: (password?: string) => Promise<boolean>;
  loginAsShop: (shopId: string, password?: string) => Promise<{ success: boolean; requiresPasswordSetup?: boolean; message?: string }>;
  loginAsCustomer: (customerId: string, password?: string) => Promise<{ success: boolean; requiresPasswordSetup?: boolean; message?: string }>;
  completeFirstTimePasswordSetup: (password: string) => Promise<boolean>;
  logout: () => void;
  switchRoleQuick: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'scm_persistent_session_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [pendingSetupUser, setPendingSetupUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load persistent session on startup
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession) as UserProfile;
        // Verify user still exists in store
        const liveUser = store.getUserProfileByUid(parsed.uid);
        if (liveUser) {
          setCurrentUser(liveUser);
        } else if (parsed.role === 'admin' || parsed.uid === DEFAULT_ADMIN.uid) {
          const admin = store.getUserProfileByUid(DEFAULT_ADMIN.uid) || DEFAULT_ADMIN;
          setCurrentUser(admin);
        } else {
          // Stale session from removed demo accounts
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setCurrentUser(null);
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }

    // Initialize firestore background sync
    store.initFirestoreSync();

    // Subscribe to store updates
    const unsubscribe = store.subscribe(() => {
      if (currentUser) {
        const refreshed = store.getUserProfileByUid(currentUser.uid);
        if (refreshed) {
          setCurrentUser(refreshed);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const saveSession = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  };

  const loginAsAdmin = async (password?: string): Promise<boolean> => {
    if (password && password !== 'Uae@@2024') {
      return false;
    }
    const adminUser = store.getUserProfileByUid(DEFAULT_ADMIN.uid) || DEFAULT_ADMIN;
    saveSession(adminUser);
    return true;
  };

  /**
   * Shop Owner Panel Login:
   * First-time login requires ONLY Shop ID. System triggers a pop-up prompt to create a password.
   * Future logins require Shop ID + Created Password.
   */
  const loginAsShop = async (
    shopId: string,
    password?: string
  ): Promise<{ success: boolean; requiresPasswordSetup?: boolean; message?: string }> => {
    const cleanId = shopId.trim().toUpperCase();
    const user = store.getUserByShopId(cleanId);

    if (!user) {
      return { success: false, message: `Shop ID "${cleanId}" not found in system.` };
    }

    if (user.isFirstLogin || !user.password) {
      // Prompt first-time password setup
      setPendingSetupUser(user);
      return { success: true, requiresPasswordSetup: true };
    }

    // Standard login requires password
    if (!password) {
      return { success: false, message: 'Password is required.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Invalid password. Please check and try again.' };
    }

    saveSession(user);
    return { success: true, requiresPasswordSetup: false };
  };

  /**
   * Customer Panel Login:
   * Login using assigned Customer ID + set password.
   */
  const loginAsCustomer = async (
    customerId: string,
    password?: string
  ): Promise<{ success: boolean; requiresPasswordSetup?: boolean; message?: string }> => {
    const cleanId = customerId.trim().toUpperCase();
    const user = store.getUserByCustomerId(cleanId);

    if (!user) {
      return { success: false, message: `Customer ID "${cleanId}" was not found.` };
    }

    if (user.isFirstLogin || !user.password) {
      setPendingSetupUser(user);
      return { success: true, requiresPasswordSetup: true };
    }

    if (!password) {
      return { success: false, message: 'Password is required.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Incorrect password.' };
    }

    saveSession(user);
    return { success: true, requiresPasswordSetup: false };
  };

  const completeFirstTimePasswordSetup = async (newPassword: string): Promise<boolean> => {
    const target = pendingSetupUser || currentUser;
    if (!target) return false;

    const identifier = target.role === 'shop' ? target.shopId! : target.customerId!;
    const updated = await store.setPasswordForUser(identifier, target.role, newPassword);
    setPendingSetupUser(null);
    saveSession(updated);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setPendingSetupUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const switchRoleQuick = (role: UserRole) => {
    if (role === 'admin') {
      const admin = store.getUserProfileByUid(DEFAULT_ADMIN.uid) || DEFAULT_ADMIN;
      saveSession(admin);
    } else if (role === 'shop') {
      const shops = store.getShops();
      if (shops.length > 0) {
        const u = store.getUserByShopId(shops[0].shopId);
        if (u) saveSession(u);
      }
    } else if (role === 'customer') {
      const custs = store.getCustomers();
      if (custs.length > 0) {
        const u = store.getUserByCustomerId(custs[0].customerId);
        if (u) saveSession(u);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role || null,
        loading,
        loginAsAdmin,
        loginAsShop,
        loginAsCustomer,
        completeFirstTimePasswordSetup,
        logout,
        switchRoleQuick,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
