import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { BottomNav, TabKey } from './components/BottomNav';
import { ShopDashboard } from './components/Views/ShopDashboard';
import { AdminDashboard } from './components/Views/AdminDashboard';
import { CustomerDashboard } from './components/Views/CustomerDashboard';
import { KhataView } from './components/Views/KhataView';
import { ActivityView } from './components/Views/ActivityView';
import { ProfileView } from './components/Views/ProfileView';
import { ReportsView } from './components/Views/ReportsView';
import { LoginPage } from './components/Views/LoginPage';
import { ShopShutter } from './components/ShopShutter';

// Modals
import { PasswordSetupModal } from './components/Modals/PasswordSetupModal';
import { CreateShopModal } from './components/Modals/CreateShopModal';
import { CreateCustomerModal } from './components/Modals/CreateCustomerModal';
import { AddCreditModal } from './components/Modals/AddCreditModal';
import { RecordPaymentModal } from './components/Modals/RecordPaymentModal';
import { RatingModal } from './components/Modals/RatingModal';
import { CustomerDetailSlideOver } from './components/Modals/CustomerDetailSlideOver';
import { CustomerNotificationModal } from './components/Modals/CustomerNotificationModal';

import { store } from './services/store';
import { Customer, Shop, Transaction, AppNotification, UserRole } from './types';

function MainApp() {
  const { currentUser, currentRole, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  // Shutter opening animation (2 seconds upon successful login)
  const [showShutterAnimation, setShowShutterAnimation] = useState(false);

  // Modals visibility
  const [passwordSetupData, setPasswordSetupData] = useState<{
    isOpen: boolean;
    role: 'shop' | 'customer';
    identifier: string;
  }>({ isOpen: false, role: 'shop', identifier: '' });

  const [isCreateShopModalOpen, setIsCreateShopModalOpen] = useState(false);
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false);
  const [isAddCreditModalOpen, setIsAddCreditModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{
    id?: string;
    name?: string;
    role?: 'shop' | 'customer';
  }>({});

  // Slide-Over for Customer detail
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Selected customer for modal actions
  const [targetCustomerForModal, setTargetCustomerForModal] = useState<Customer | undefined>(undefined);

  // One-Time Customer Login Pop-up Notification (Requirement)
  const [activeCustomerNotification, setActiveCustomerNotification] = useState<AppNotification | null>(null);

  // Local state copy synced with store
  const [shops, setShops] = useState<Shop[]>(store.getShops());
  const [customers, setCustomers] = useState<Customer[]>(store.getCustomers());
  const [transactions, setTransactions] = useState<Transaction[]>(store.getTransactions());
  const [, setTick] = useState(0);

  const refreshData = () => {
    setShops(store.getShops());
    setCustomers(store.getCustomers());
    setTransactions(store.getTransactions());
    setTick((t) => t + 1);
  };

  useEffect(() => {
    const unsub = store.subscribe(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  // Current Shop entity
  const currentShopId = currentUser?.shopId || shops[0]?.shopId || 'SHOP1001';
  const currentShop = shops.find((s) => s.shopId === currentShopId) || shops[0];

  // Current Customer entity
  const currentCustomer = customers.find((c) => c.customerId === currentUser?.customerId);

  // Filtered dataset for current scope
  const activeCustomers =
    currentRole === 'shop'
      ? customers.filter((c) => c.shopId === currentShop?.shopId)
      : customers;

  const activeTransactions =
    currentRole === 'customer' && currentCustomer
      ? transactions.filter((t) => t.customerId === currentCustomer.customerId)
      : currentRole === 'shop' && currentShop
      ? transactions.filter((t) => t.shopId === currentShop.shopId)
      : transactions;

  // Unread customer notifications check
  const unreadNotifs =
    currentUser?.role === 'customer' && currentUser.customerId
      ? store.getUnreadCustomerNotifications(currentUser.customerId)
      : [];

  // Check one-time login pop-up notification on mount or when customer changes
  useEffect(() => {
    if (currentUser?.role === 'customer' && currentUser.customerId) {
      const unread = store.getUnreadCustomerNotifications(currentUser.customerId);
      if (unread.length > 0 && !activeCustomerNotification) {
        // Automatically pop up the first unread notification on login!
        setActiveCustomerNotification(unread[0]);
      }
    }
  }, [currentUser?.role, currentUser?.customerId]);

  // Keep selectedCustomer updated if updated in store
  useEffect(() => {
    if (selectedCustomer) {
      const refreshed = customers.find((c) => c.customerId === selectedCustomer.customerId);
      if (refreshed) {
        setSelectedCustomer(refreshed);
      }
    }
  }, [customers]);

  const handleOpenAddCredit = (cust?: Customer) => {
    setTargetCustomerForModal(cust);
    setIsAddCreditModalOpen(true);
  };

  const handleOpenRecordPayment = (cust?: Customer) => {
    setTargetCustomerForModal(cust);
    setIsRecordPaymentModalOpen(true);
  };

  const handleOpenRating = (target?: { id?: string; name?: string; role?: 'shop' | 'customer' }) => {
    if (target) {
      setRatingTarget(target);
    } else if (currentRole === 'customer' && currentShop) {
      setRatingTarget({
        id: currentShop.shopId,
        name: currentShop.shopName,
        role: 'shop',
      });
    } else if (selectedCustomer) {
      setRatingTarget({
        id: selectedCustomer.customerId,
        name: selectedCustomer.name,
        role: 'customer',
      });
    }
    setIsRatingModalOpen(true);
  };

  // Requirement: "Successfully login hole application ti open howar age puro screen e akti shutter close obostay thakbe 2 sec er akti animation hoya shutter uporer dika uta jabe & application ti open hobe"
  const handleLoginSuccess = (_role: UserRole) => {
    setShowShutterAnimation(true);
    refreshData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c4a42] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Requirement: "Logout e click korla direct login page e nia jabe & login page ti main page e show hobe."
  // When user is not logged in, render LoginPage as the full-screen main page!
  if (!currentUser) {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onRequiresPasswordSetup={(role, identifier) => {
            setPasswordSetupData({ isOpen: true, role, identifier });
          }}
        />

        {/* First Time Password Setup Modal if needed */}
        <PasswordSetupModal
          isOpen={passwordSetupData.isOpen}
          role={passwordSetupData.role}
          identifier={passwordSetupData.identifier}
          onSuccess={() => {
            setPasswordSetupData({ isOpen: false, role: 'shop', identifier: '' });
            setShowShutterAnimation(true);
            refreshData();
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F6F4] text-slate-800 font-sans flex flex-col relative w-full max-w-full overflow-x-hidden">
      {/* 2-Second Shop Shutter Opening Animation */}
      {showShutterAnimation && (
        <ShopShutter
          shopName={currentShop?.shopName || 'Shop Credit Master'}
          onShutterComplete={() => setShowShutterAnimation(false)}
        />
      )}

      {/* Top Header */}
      <Header
        onOpenNotifications={() => {
          if (unreadNotifs.length > 0) {
            setActiveCustomerNotification(unreadNotifs[0]);
          } else {
            alert('You have no new unread notifications.');
          }
        }}
        onOpenRatingModal={() => handleOpenRating()}
        onOpenLoginModal={() => {}}
        unreadNotifsCount={unreadNotifs.length}
      />

      {/* Main Single Page View Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3 overflow-x-hidden">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <>
            {currentRole === 'admin' ? (
              <AdminDashboard
                shops={shops}
                customers={customers}
                transactions={transactions}
                onOpenCreateShop={() => setIsCreateShopModalOpen(true)}
                onRefresh={refreshData}
              />
            ) : currentRole === 'customer' && currentCustomer && currentShop ? (
              <CustomerDashboard
                customer={currentCustomer}
                shop={currentShop}
                transactions={activeTransactions}
                onOpenRatingModal={(s) =>
                  handleOpenRating({ id: s.shopId, name: s.shopName, role: 'shop' })
                }
              />
            ) : (
              <ShopDashboard
                shop={currentShop}
                customers={activeCustomers}
                transactions={activeTransactions}
                onOpenAddCredit={handleOpenAddCredit}
                onOpenRecordPayment={handleOpenRecordPayment}
                onOpenCreateCustomer={() => setIsCreateCustomerModalOpen(true)}
                onSelectCustomer={(c) => setSelectedCustomer(c)}
                onOpenRatingModal={() => handleOpenRating()}
              />
            )}
          </>
        )}

        {/* TAB 2: KHATA / SHOPS / CUSTOMERS */}
        {activeTab === 'customers' && (
          <>
            {currentRole === 'admin' ? (
              <AdminDashboard
                shops={shops}
                customers={customers}
                transactions={transactions}
                onOpenCreateShop={() => setIsCreateShopModalOpen(true)}
                onRefresh={refreshData}
              />
            ) : currentRole === 'customer' && currentCustomer && currentShop ? (
              <CustomerDashboard
                customer={currentCustomer}
                shop={currentShop}
                transactions={activeTransactions}
                onOpenRatingModal={(s) =>
                  handleOpenRating({ id: s.shopId, name: s.shopName, role: 'shop' })
                }
              />
            ) : (
              <KhataView
                customers={activeCustomers}
                shop={currentShop}
                transactions={activeTransactions}
                onSelectCustomer={(c) => setSelectedCustomer(c)}
                onOpenCreateCustomer={() => setIsCreateCustomerModalOpen(true)}
              />
            )}
          </>
        )}

        {/* TAB 3: REPORTS (Full Shop Report with Month & Date Filters & Direct Device Share) */}
        {activeTab === 'reports' && (
          <>
            {currentShop ? (
              <ReportsView
                shop={currentShop}
                customers={activeCustomers}
                transactions={activeTransactions}
              />
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl p-6 text-slate-400 text-xs">
                No shop registered yet. Admin must create a shop first.
              </div>
            )}
          </>
        )}

        {/* TAB 4: ACTIVITY / TRANSACTIONS LEDGER */}
        {activeTab === 'activity' && (
          <ActivityView
            transactions={activeTransactions}
            customers={customers}
            currency={currentShop?.currency || 'AED'}
            onSelectCustomer={(c) => setSelectedCustomer(c)}
          />
        )}

        {/* TAB 5: PROFILE */}
        {activeTab === 'profile' && (
          <ProfileView
            shop={currentShop}
            customer={currentCustomer}
            onRefresh={refreshData}
            onOpenRatingModal={() => handleOpenRating()}
          />
        )}
      </main>

      {/* Floating Bottom Navigation (as in IMG_8769.jpeg) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(t) => setActiveTab(t)}
        customerCount={activeCustomers.length}
      />

      {/* MODALS */}
      {/* 1. First Time Password Setup Modal */}
      <PasswordSetupModal
        isOpen={passwordSetupData.isOpen}
        role={passwordSetupData.role}
        identifier={passwordSetupData.identifier}
        onSuccess={() => {
          setPasswordSetupData({ isOpen: false, role: 'shop', identifier: '' });
          refreshData();
        }}
      />

      {/* 2. Create Shop Modal (Admin) */}
      <CreateShopModal
        isOpen={isCreateShopModalOpen}
        onClose={() => setIsCreateShopModalOpen(false)}
        onShopCreated={() => {
          refreshData();
        }}
      />

      {/* 3. Create Customer Modal (Shop Owner) */}
      <CreateCustomerModal
        isOpen={isCreateCustomerModalOpen}
        onClose={() => setIsCreateCustomerModalOpen(false)}
        shop={currentShop}
        onCustomerCreated={() => {
          refreshData();
        }}
      />

      {/* 4. Add Credit Modal */}
      <AddCreditModal
        isOpen={isAddCreditModalOpen}
        onClose={() => {
          setIsAddCreditModalOpen(false);
          setTargetCustomerForModal(undefined);
        }}
        shop={currentShop}
        customers={activeCustomers}
        preselectedCustomer={targetCustomerForModal || selectedCustomer || undefined}
        onSuccess={() => refreshData()}
      />

      {/* 5. Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentModalOpen}
        onClose={() => {
          setIsRecordPaymentModalOpen(false);
          setTargetCustomerForModal(undefined);
        }}
        shop={currentShop}
        customers={activeCustomers}
        preselectedCustomer={targetCustomerForModal || selectedCustomer || undefined}
        onSuccess={() => refreshData()}
      />

      {/* 6. Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        targetId={ratingTarget.id}
        targetName={ratingTarget.name}
        targetRole={ratingTarget.role}
      />

      {/* 7. Customer Detail Slide-Over */}
      <CustomerDetailSlideOver
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        shop={currentShop}
        onAddCredit={(c) => {
          setTargetCustomerForModal(c);
          setIsAddCreditModalOpen(true);
        }}
        onRecordPayment={(c) => {
          setTargetCustomerForModal(c);
          setIsRecordPaymentModalOpen(true);
        }}
        onOpenRating={(c) => {
          handleOpenRating({
            id: c.customerId,
            name: c.name,
            role: 'customer',
          });
        }}
      />

      {/* 8. One-Time Customer Login Pop-up Notification (styled after IMG_8772.jpeg) */}
      <CustomerNotificationModal
        notification={activeCustomerNotification}
        onDismiss={() => {
          setActiveCustomerNotification(null);
          refreshData();
        }}
        onViewStatement={() => {
          setActiveCustomerNotification(null);
          setActiveTab('home');
          refreshData();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
