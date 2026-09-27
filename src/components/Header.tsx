import React, { useState } from 'react';
import {
  Bell,
  Star,
  LogOut,
  ShieldCheck,
  Store,
  User,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { store } from '../services/store';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenRatingModal: () => void;
  onOpenLoginModal: () => void;
  unreadNotifsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenRatingModal,
  onOpenLoginModal,
  unreadNotifsCount,
}) => {
  const { currentUser, currentRole, logout, switchRoleQuick } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Determine current shop or customer rating
  let displayRating = 5.0;
  if (currentUser) {
    if (currentUser.role === 'shop' && currentUser.shopId) {
      const s = store.getShopById(currentUser.shopId);
      if (s) displayRating = s.rating;
    } else if (currentUser.role === 'customer' && currentUser.customerId) {
      const c = store.getCustomerById(currentUser.customerId);
      if (c) displayRating = c.rating;
    }
  }

  const roleColors: Record<UserRole, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    admin: {
      bg: 'bg-amber-100 text-amber-900 border-amber-300',
      text: 'text-amber-700',
      label: 'Admin Central',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />,
    },
    shop: {
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      text: 'text-emerald-700',
      label: 'Shop Owner (Dukandar)',
      icon: <Store className="w-3.5 h-3.5 text-emerald-600" />,
    },
    customer: {
      bg: 'bg-blue-100 text-blue-900 border-blue-300',
      text: 'text-blue-700',
      label: 'Customer (Buyer)',
      icon: <User className="w-3.5 h-3.5 text-blue-600" />,
    },
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  return (
    <header className="sticky top-0 z-30 bg-[#F2F6F4]/95 backdrop-blur-md px-4 pt-3 pb-3 border-b border-emerald-900/5">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* User Identity / Greeting */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0c4a42] to-[#146b60] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-950/10">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium tracking-tight">
                {getGreeting()}
              </span>
              {/* Quick Persona Switcher dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border bg-white/80 shadow-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  {currentRole && roleColors[currentRole].icon}
                  <span className="truncate max-w-[90px]">
                    {currentRole === 'admin' ? 'Admin' : currentRole === 'shop' ? 'Shop' : 'Customer'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showRoleMenu && (
                  <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Role (Demo)
                    </div>
                    <button
                      onClick={() => {
                        switchRoleQuick('admin');
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-amber-50"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-semibold text-slate-900">Admin Panel</div>
                        <div className="text-[10px] text-slate-400">System admin & shops</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        switchRoleQuick('shop');
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50"
                    >
                      <Store className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-semibold text-slate-900">Shop Owner (Dukandar)</div>
                        <div className="text-[10px] text-slate-400">Manage Khata & Credit</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        switchRoleQuick('customer');
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50"
                    >
                      <User className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-semibold text-slate-900">Customer (Buyer)</div>
                        <div className="text-[10px] text-slate-400">Read-only credit view</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-sm font-bold text-slate-900 truncate">
              {currentUser?.name || 'Guest User'}
            </h1>
          </div>
        </div>

        {/* Right Action Icons: Star Rating Badge, Notifications, Sign In / Out */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Star Rating Button */}
          {currentUser && (
            <button
              onClick={onOpenRatingModal}
              title="Click to view & submit ratings"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-950/5 hover:bg-emerald-950/10 border border-emerald-900/10 text-emerald-900 transition-all active:scale-95"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="text-xs font-bold text-emerald-950">
                {displayRating.toFixed(1)}
              </span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            aria-label="View notifications"
            className="relative w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-700 active:scale-95 transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white ring-1 ring-rose-300 animate-pulse" />
            )}
          </button>

          {/* Login or Logout */}
          {currentUser ? (
            <button
              onClick={logout}
              title="Log out"
              className="w-9 h-9 rounded-full bg-white hover:bg-rose-50 border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-500 hover:text-rose-600 active:scale-95 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="px-3 py-1.5 rounded-full bg-[#0c4a42] text-white text-xs font-semibold shadow-sm hover:bg-[#083832] transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
