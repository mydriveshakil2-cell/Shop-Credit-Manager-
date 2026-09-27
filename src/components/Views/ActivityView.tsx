import React, { useState } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import { Customer, Shop, Transaction } from '../../types';
import { formatAED } from '../../utils/uaeValidation';

interface ActivityViewProps {
  transactions: Transaction[];
  customers: Customer[];
  shop?: Shop;
  currency?: string;
  onSelectCustomer?: (customer: Customer) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  transactions,
  customers,
  currency = 'AED',
  onSelectCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CREDIT' | 'PAYMENT'>('ALL');

  const filtered = transactions.filter((tx) => {
    const cust = customers.find((c) => c.customerId === tx.customerId);
    const matchesSearch =
      tx.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.date.includes(searchTerm) ||
      (cust && cust.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      tx.customerId.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 pb-24">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Activity Ledger</h2>
        <p className="text-xs text-slate-500">
          Chronological record of credits issued and payments received
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by note, customer, date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl bg-white border border-slate-200 shadow-xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              typeFilter === 'ALL'
                ? 'bg-[#0c4a42] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All Activity ({transactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('CREDIT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              typeFilter === 'CREDIT'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Credits Only (+)
          </button>
          <button
            onClick={() => setTypeFilter('PAYMENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              typeFilter === 'PAYMENT'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Payments Only (-)
          </button>
        </div>
      </div>

      {/* Ledger Entries List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-6 text-slate-400 text-xs">
          No ledger records found.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => {
            const cust = customers.find((c) => c.customerId === tx.customerId);
            return (
              <div
                key={tx.id}
                onClick={() => cust && onSelectCustomer && onSelectCustomer(cust)}
                className={`p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 text-xs ${
                  onSelectCustomer && cust ? 'hover:bg-slate-50 cursor-pointer' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                      tx.type === 'CREDIT'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">
                        {cust?.name || tx.customerId}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                          tx.type === 'CREDIT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? 'Credit Due' : 'Payment'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {tx.date} • {tx.note}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-extrabold ${
                      tx.type === 'CREDIT' ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? '+' : '-'} {formatAED(tx.amount, currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
