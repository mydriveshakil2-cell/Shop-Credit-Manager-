import React from 'react';
import { Home, Users, ReceiptText, UserCheck, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type TabKey = 'home' | 'customers' | 'reports' | 'activity' | 'profile';

interface BottomNavProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  customerCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  customerCount = 0,
}) => {
  const { currentRole } = useAuth();

  const getCustomersLabel = () => {
    if (currentRole === 'admin') return 'Shops';
    if (currentRole === 'customer') return 'My Shop';
    return 'Khata';
  };

  const navItems = [
    { key: 'home' as TabKey, label: 'Home', icon: Home },
    {
      key: 'customers' as TabKey,
      label: getCustomersLabel(),
      icon: currentRole === 'admin' ? ShieldCheck : Users,
      badge: currentRole === 'shop' && customerCount > 0 ? customerCount : undefined,
    },
    { key: 'reports' as TabKey, label: 'Reports', icon: FileSpreadsheet },
    { key: 'activity' as TabKey, label: 'Activity', icon: ReceiptText },
    { key: 'profile' as TabKey, label: 'Profile', icon: UserCheck },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none pb-2 pt-1 max-w-full overflow-x-hidden">
      <div className="max-w-md mx-auto px-3">
        <nav className="pointer-events-auto bg-[#0c4a42]/95 backdrop-blur-xl border border-emerald-800/40 rounded-3xl p-1.5 shadow-2xl shadow-emerald-950/25 flex items-center justify-around gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onChangeTab(item.key)}
                className={`relative flex items-center justify-center gap-1 py-2 px-2.5 sm:px-3 rounded-2xl transition-all duration-200 select-none cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/25 text-emerald-300 font-bold'
                    : 'text-emerald-100/70 hover:text-white hover:bg-white/5 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-emerald-300' : ''}`} />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-rose-500 text-white text-[8px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] transition-opacity duration-200 ${isActive ? 'block' : 'hidden sm:block'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
