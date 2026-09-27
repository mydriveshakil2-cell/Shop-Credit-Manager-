import React, { useState } from 'react';
import {
  Users,
  Search,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Share2,
  Calendar,
  Filter,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { Customer, Shop, Transaction } from '../../types';
import { store } from '../../services/store';
import { HeroBalanceCard } from '../HeroBalanceCard';
import { formatAED, createOverLimitWhatsAppReminderUrl } from '../../utils/uaeValidation';
import { calculateCustomerAccounting } from '../../utils/accounting';

interface ShopDashboardProps {
  shop?: Shop;
  customers: Customer[];
  transactions: Transaction[];
  onOpenAddCredit: (customer?: Customer) => void;
  onOpenRecordPayment: (customer?: Customer) => void;
  onOpenCreateCustomer: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onOpenRatingModal: () => void;
}

export const ShopDashboard: React.FC<ShopDashboardProps> = ({
  shop,
  customers,
  transactions,
  onOpenAddCredit,
  onOpenRecordPayment,
  onOpenCreateCustomer,
  onSelectCustomer,
  onOpenRatingModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'overlimit'>('all');

  const currency = shop?.currency || 'AED';

  // Compute aggregate numbers
  const totalCredit = transactions
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaid = transactions
    .filter((t) => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDue = totalCredit - totalPaid;

  // Enrich customer records with dynamic due balances
  const enrichedCustomers = customers.map((c) => {
    const custTxs = transactions.filter((t) => t.customerId === c.customerId);
    const { totalNetDue } = calculateCustomerAccounting(custTxs);
    const isOverLimit = totalNetDue > c.creditLimit;
    return {
      ...c,
      currentDue: totalNetDue,
      isOverLimit,
    };
  });

  const overLimitCustomers = enrichedCustomers.filter((c) => c.isOverLimit);

  // Filter customers
  const filteredCustomers = enrichedCustomers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.customerId.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'overlimit') return c.isOverLimit;
    if (filterMode === 'due') return c.currentDue > 0;
    return true;
  });

  // Recent 5 transactions
  const recentTransactions = [...transactions].slice(0, 5);

  return (
    <div className="space-y-5 pb-24">
      {/* Hero Financial Banner */}
      <HeroBalanceCard
        title="Total Khata Due Balance"
        totalDue={totalDue}
        totalCredit={totalCredit}
        totalPaid={totalPaid}
        currency={currency}
        customerCount={customers.length}
        onAddCredit={() => onOpenAddCredit()}
        onRecordPayment={() => onOpenRecordPayment()}
        onCreateCustomer={onOpenCreateCustomer}
        onSendOverlimitReminders={() => setFilterMode('overlimit')}
      />

      {/* Automated Over-Limit Alert Bar (if any customer exceeded their limit) */}
      {overLimitCustomers.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-950">
                {overLimitCustomers.length} Customer{overLimitCustomers.length > 1 ? 's' : ''} Over Credit Limit
              </div>
              <div className="text-[11px] text-amber-700">
                Automated WhatsApp payment reminders ready to send.
              </div>
            </div>
          </div>
          <button
            onClick={() => setFilterMode('overlimit')}
            className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            Review ({overLimitCustomers.length})
          </button>
        </div>
      )}

      {/* Customers Section Header & Search */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Customer Khata Directory
            </h2>
            <p className="text-xs text-slate-500">
              Carry-forward statements & credit tracking
            </p>
          </div>
          <button
            onClick={onOpenCreateCustomer}
            className="text-xs font-bold text-[#0c4a42] hover:text-[#083832] bg-emerald-100/70 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            + New Customer
          </button>
        </div>

        {/* Search Bar & Filter Pills */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, phone, or Customer ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl bg-white border border-slate-200/90 shadow-xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-[#0c4a42] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterMode('due')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'due'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Has Due
            </button>
            <button
              onClick={() => setFilterMode('overlimit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'overlimit'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              Over-Limit ({overLimitCustomers.length})
            </button>
          </div>
        </div>

        {/* Customer Cards List (styled after minimal cards in IMG_8769.jpeg) */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 p-6 text-slate-400 text-xs">
            No customers match the current filter or search criteria.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredCustomers.map((c) => (
              <div
                key={c.customerId}
                onClick={() => onSelectCustomer(c)}
                className="group relative p-3.5 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-950/5 group-hover:bg-[#0c4a42] group-hover:text-white text-emerald-950 flex items-center justify-center font-bold text-sm transition-colors shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {c.name}
                      </span>
                      {c.isOverLimit && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700">
                          OVER LIMIT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {c.customerId} • {c.phone}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-sm font-extrabold ${
                      c.currentDue > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {formatAED(c.currentDue, currency)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Limit: {formatAED(c.creditLimit, currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Ledger Feed */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">
            Recent Ledger Entries
          </h3>
          <span className="text-xs text-slate-400 font-medium">Last 5 records</span>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-6 bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs">
            No transactions logged yet. Click &quot;Add Credit&quot; to begin.
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const cust = customers.find((c) => c.customerId === tx.customerId);
              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        tx.type === 'CREDIT'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? 'CR' : 'REC'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        {cust?.name || tx.customerId}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {tx.date} • {tx.note}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-extrabold text-xs ${
                      tx.type === 'CREDIT' ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? '+' : '-'} {formatAED(tx.amount, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
