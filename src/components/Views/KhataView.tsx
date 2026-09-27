import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  AlertTriangle,
  Share2,
  Calendar,
  Filter,
} from 'lucide-react';
import { Customer, Shop, Transaction } from '../../types';
import { formatAED, createOverLimitWhatsAppReminderUrl } from '../../utils/uaeValidation';
import { calculateCustomerAccounting } from '../../utils/accounting';

interface KhataViewProps {
  customers: Customer[];
  shop?: Shop;
  transactions: Transaction[];
  onSelectCustomer: (customer: Customer) => void;
  onOpenCreateCustomer: () => void;
}

export const KhataView: React.FC<KhataViewProps> = ({
  customers,
  shop,
  transactions,
  onSelectCustomer,
  onOpenCreateCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'overlimit'>('all');

  const currency = shop?.currency || 'AED';
  const shopName = shop?.shopName || 'Shop';
  const shopId = shop?.shopId || '';

  const enrichedCustomers = customers.map((c) => {
    const custTxs = transactions.filter((t) => t.customerId === c.customerId);
    const { totalNetDue, currentStatement } = calculateCustomerAccounting(custTxs);
    const isOverLimit = totalNetDue > c.creditLimit;
    return {
      ...c,
      currentDue: totalNetDue,
      isOverLimit,
      statement: currentStatement,
    };
  });

  const filtered = enrichedCustomers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.customerId.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'overlimit') return c.isOverLimit;
    if (filterMode === 'due') return c.currentDue > 0;
    return true;
  });

  return (
    <div className="space-y-4 pb-28 max-w-full overflow-x-hidden">
      {/* Centered Header Section matching IMG_8776.jpeg */}
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Khata Credit Books
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Carry-forward customer credit records & WhatsApp reminders
        </p>
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onOpenCreateCustomer}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-6 rounded-full bg-[#0c4a42] hover:bg-[#083832] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-300" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* Centered Search Bar */}
      <div className="w-full max-w-md mx-auto">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full bg-white border border-slate-200 shadow-xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Centered Filter Tabs matching IMG_8776.jpeg */}
      <div className="flex items-center justify-center gap-2 flex-wrap pb-0.5">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filterMode === 'all'
              ? 'bg-[#0c4a42] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({customers.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('due')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filterMode === 'due'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Outstanding Due
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('overlimit')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filterMode === 'overlimit'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          Over-Limit
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-6 text-slate-400 text-xs">
          No customer records found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.customerId}
              onClick={() => onSelectCustomer(c)}
              className="group p-4 rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#0c4a42]/10 group-hover:bg-[#0c4a42] group-hover:text-white text-[#0c4a42] flex items-center justify-center font-bold text-base transition-colors shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm truncate">
                        {c.name}
                      </h3>
                      {c.isOverLimit && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                          OVER LIMIT
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {c.customerId} • {c.phone}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-base font-extrabold ${
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

              {/* Carry Forward Mini breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[9px] text-slate-400 block font-semibold">OPENING DUE</span>
                  <span className="font-bold text-slate-700">
                    {formatAED(c.statement.openingBalance, currency)}
                  </span>
                </div>
                <div className="bg-rose-50/70 p-2 rounded-xl">
                  <span className="text-[9px] text-rose-500 block font-semibold">THIS MONTH CR</span>
                  <span className="font-bold text-rose-700">
                    +{formatAED(c.statement.creditAmount, currency)}
                  </span>
                </div>
                <div className="bg-emerald-50/70 p-2 rounded-xl">
                  <span className="text-[9px] text-emerald-600 block font-semibold">RECEIVED</span>
                  <span className="font-bold text-emerald-800">
                    -{formatAED(c.statement.paidAmount, currency)}
                  </span>
                </div>
              </div>

              {/* Over-Limit WhatsApp Reminder button (Requirement 10) */}
              {c.isOverLimit && (
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Due exceeds credit limit by {formatAED(c.currentDue - c.creditLimit, currency)}
                  </span>
                  <a
                    href={createOverLimitWhatsAppReminderUrl({
                      customerName: c.name,
                      customerPhone: c.phone,
                      shopName: shopName,
                      shopId: shopId,
                      creditLimit: c.creditLimit,
                      currentDue: c.currentDue,
                      currency: currency,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-[11px] font-bold shadow-xs transition-transform active:scale-95"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>WhatsApp Reminder</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
