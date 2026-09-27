import React, { useState } from 'react';
import {
  ShieldCheck,
  Store,
  Users,
  CreditCard,
  Plus,
  Trash2,
  ExternalLink,
  MapPin,
  Phone,
  Search,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { Shop, Customer, Transaction } from '../../types';
import { store } from '../../services/store';
import { formatAED, createShopWhatsAppShareUrl } from '../../utils/uaeValidation';

interface AdminDashboardProps {
  shops: Shop[];
  customers: Customer[];
  transactions: Transaction[];
  onOpenCreateShop: () => void;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  shops,
  customers,
  transactions,
  onOpenCreateShop,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  // System-wide statistics
  const totalCreditIssued = transactions
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceived = transactions
    .filter((t) => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutstandingDue = totalCreditIssued - totalReceived;

  const filteredShops = shops.filter(
    (s) =>
      s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.shopId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
  );

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${shopName} (${shopId})? All its customers and transactions will be cleared.`
      )
    ) {
      await store.deleteShop(shopId);
      onRefresh();
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Admin Executive Header Card */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#1c382f] via-[#114035] to-[#0a2c24] p-5 text-white shadow-xl border border-emerald-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                UAE Central Administrator Panel
              </span>
              <h1 className="text-lg font-extrabold text-white">System Executive Overview</h1>
            </div>
          </div>

          <button
            onClick={onOpenCreateShop}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Shop</span>
          </button>
        </div>

        {/* System Financial Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <span className="text-[10px] text-emerald-200 block font-semibold">REGISTERED SHOPS</span>
            <span className="text-xl font-extrabold text-white block mt-0.5">{shops.length}</span>
            <span className="text-[9px] text-emerald-300">Across Dubai & UAE</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <span className="text-[10px] text-emerald-200 block font-semibold">TOTAL CUSTOMERS</span>
            <span className="text-xl font-extrabold text-white block mt-0.5">{customers.length}</span>
            <span className="text-[9px] text-emerald-300">Verified by Emirates ID</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <span className="text-[10px] text-emerald-200 block font-semibold">TOTAL SYSTEM CREDIT</span>
            <span className="text-base font-extrabold text-white block mt-0.5 truncate">
              {formatAED(totalCreditIssued, 'AED')}
            </span>
            <span className="text-[9px] text-rose-300">Gross credit given</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <span className="text-[10px] text-emerald-200 block font-semibold">NET DUE OUTSTANDING</span>
            <span className="text-base font-extrabold text-amber-300 block mt-0.5 truncate">
              {formatAED(totalOutstandingDue, 'AED')}
            </span>
            <span className="text-[9px] text-emerald-300">Recv: {formatAED(totalReceived, 'AED')}</span>
          </div>
        </div>
      </div>

      {/* Registered Shops Directory */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Registered UAE Shops</h2>
            <p className="text-xs text-slate-500">Manage shop users, currency locks, and permissions</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
            {shops.length} Active Shops
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by shop name, shop ID, owner, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl bg-white border border-slate-200 shadow-xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        {/* Shops Card List */}
        <div className="space-y-3">
          {filteredShops.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto font-bold">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Registered Shops Yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                All demo data has been cleared. Click &ldquo;Create Shop&rdquo; above to onboard your first UAE Shop Owner with Emirates ID verification.
              </p>
              <button
                type="button"
                onClick={onOpenCreateShop}
                className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-full bg-[#0c4a42] hover:bg-[#083832] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Shop</span>
              </button>
            </div>
          ) : (
            filteredShops.map((s) => {
            const shopCusts = customers.filter((c) => c.shopId === s.shopId);
            const shopTxs = transactions.filter((t) => t.shopId === s.shopId);
            const shopCredits = shopTxs
              .filter((t) => t.type === 'CREDIT')
              .reduce((sum, t) => sum + t.amount, 0);
            const shopPayments = shopTxs
              .filter((t) => t.type === 'PAYMENT')
              .reduce((sum, t) => sum + t.amount, 0);
            const shopDue = shopCredits - shopPayments;

            return (
              <div
                key={s.shopId}
                className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#0c4a42] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      <Store className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900">{s.shopName}</h3>
                        <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {s.shopId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        Owner: {s.ownerName} • {s.phone}
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Share & Remove Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={createShopWhatsAppShareUrl({
                        shopName: s.shopName,
                        shopId: s.shopId,
                        ownerName: s.ownerName,
                        address: s.address,
                        phone: s.phone,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Share Shop Details to User on WhatsApp"
                      className="p-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => handleDeleteShop(s.shopId, s.shopName)}
                      title="Delete shop"
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">CURRENCY (FIXED)</span>
                    <span className="font-bold text-slate-800">{s.currency}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">CUSTOMERS</span>
                    <span className="font-bold text-slate-800">{shopCusts.length} Buyers</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">CREDIT ISSUED</span>
                    <span className="font-bold text-rose-600">{formatAED(shopCredits, s.currency)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">NET DUE</span>
                    <span className="font-bold text-emerald-800">{formatAED(shopDue, s.currency)}</span>
                  </div>
                </div>

                {/* Location snippet */}
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{s.address}</span>
                </div>
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
};
