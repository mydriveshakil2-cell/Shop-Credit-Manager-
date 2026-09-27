import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Share2,
  Filter,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Download,
  Store,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Customer, Shop, Transaction } from '../../types';
import { formatAED } from '../../utils/uaeValidation';
import { calculateCustomerAccounting } from '../../utils/accounting';
import { shareShopFullReportPdf, shareCustomerPdfStatement } from '../../utils/pdfGenerator';

interface ReportsViewProps {
  shop?: Shop;
  customers: Customer[];
  transactions: Transaction[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  shop,
  customers,
  transactions,
}) => {
  const currency = shop?.currency || 'AED';
  const [filterType, setFilterType] = useState<'month' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  // Extract all unique months from transactions plus current month
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const monthsSet = new Set<string>();
  monthsSet.add(currentMonthStr);
  transactions.forEach((t) => {
    if (t.monthYear) monthsSet.add(t.monthYear);
    else if (t.date) monthsSet.add(t.date.slice(0, 7));
  });
  const availableMonths = Array.from(monthsSet).sort().reverse();

  // Filter transactions according to selected controls
  let filteredTxs = [...transactions];

  if (selectedCustomerId !== 'all') {
    filteredTxs = filteredTxs.filter((t) => t.customerId === selectedCustomerId);
  }

  if (filterType === 'month' && selectedMonth !== 'all') {
    filteredTxs = filteredTxs.filter((t) => (t.monthYear || t.date.slice(0, 7)) === selectedMonth);
  } else if (filterType === 'custom' && startDate && endDate) {
    filteredTxs = filteredTxs.filter((t) => t.date >= startDate && t.date <= endDate);
  }

  // Calculate totals
  const totalCredit = filteredTxs
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaid = filteredTxs
    .filter((t) => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const netPeriodDue = totalCredit - totalPaid;

  // Selected month readable label
  let monthLabel = 'All Time / Complete History';
  if (filterType === 'month' && selectedMonth !== 'all') {
    const [y, m] = selectedMonth.split('-');
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // Directly generate & open device default share option
  const handleShareReport = async () => {
    if (!shop) {
      alert('A shop profile is required to generate the report.');
      return;
    }

    setIsSharing(true);
    setShareSuccess(false);

    try {
      if (selectedCustomerId !== 'all') {
        const cust = customers.find((c) => c.customerId === selectedCustomerId);
        if (cust) {
          const custTxs = transactions.filter((t) => t.customerId === cust.customerId);
          const { currentStatement } = calculateCustomerAccounting(custTxs, selectedMonth !== 'all' ? selectedMonth : undefined);
          await shareCustomerPdfStatement(shop, cust, currentStatement);
        }
      } else {
        await shareShopFullReportPdf(shop, customers, transactions, {
          monthYear: filterType === 'month' ? selectedMonth : undefined,
          monthName: filterType === 'month' ? monthLabel : undefined,
          startDate: filterType === 'custom' ? startDate : undefined,
          endDate: filterType === 'custom' ? endDate : undefined,
        });
      }

      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch {
      // Ignored
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 max-w-full overflow-x-hidden">
      {/* Centered Section Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Shop Financial Reports
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Filter by month or custom date range and share PDF directly via device
        </p>
      </div>

      {/* Filter Card */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        {/* Toggle: By Month vs Custom Date */}
        <div className="flex items-center justify-center p-1 bg-slate-100 rounded-full text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterType('month')}
            className={`flex-1 py-1.5 rounded-full transition-all text-center ${
              filterType === 'month'
                ? 'bg-[#0c4a42] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Filter By Month
          </button>
          <button
            type="button"
            onClick={() => setFilterType('custom')}
            className={`flex-1 py-1.5 rounded-full transition-all text-center ${
              filterType === 'custom'
                ? 'bg-[#0c4a42] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Date Range
          </button>
        </div>

        {/* Month Selector */}
        {filterType === 'month' && (
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Select Statement Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold text-[#0c4a42] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="all">All Months (Lifetime Master Report)</option>
              {availableMonths.map((m) => {
                const [y, mm] = m.split('-');
                const d = new Date(parseInt(y, 10), parseInt(mm, 10) - 1, 1);
                const name = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return (
                  <option key={m} value={m}>
                    {name} ({m})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Custom Date Range Picker */}
        {filterType === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
              />
            </div>
          </div>
        )}

        {/* Customer Scope Selector */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Customer Scope
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="all">All Customers (Complete Shop Master)</option>
            {customers.map((c) => (
              <option key={c.customerId} value={c.customerId}>
                {c.name} ({c.customerId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 block uppercase">Period Credit</span>
          <span className="text-xs sm:text-sm font-extrabold text-rose-600 block mt-0.5 truncate">
            {formatAED(totalCredit, currency)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[9px] font-bold text-slate-400 block uppercase">Period Received</span>
          <span className="text-xs sm:text-sm font-extrabold text-emerald-700 block mt-0.5 truncate">
            {formatAED(totalPaid, currency)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#0c4a42] text-white shadow-xs text-center">
          <span className="text-[9px] font-bold text-emerald-200 block uppercase">Net Period Due</span>
          <span className="text-xs sm:text-sm font-extrabold text-white block mt-0.5 truncate">
            {formatAED(netPeriodDue, currency)}
          </span>
        </div>
      </div>

      {/* DIRECT SHARE BUTTON (Device Default Share Option) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleShareReport}
          disabled={isSharing}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-full bg-[#0c4a42] hover:bg-[#083832] text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isSharing ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
          ) : (
            <Share2 className="w-4 h-4 text-emerald-300" />
          )}
          <span>
            {isSharing ? 'Opening Device Share...' : 'Share PDF Report (Device Default)'}
          </span>
        </button>
        {shareSuccess && (
          <p className="text-[11px] font-bold text-emerald-600 text-center mt-2 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Device Share Sheet opened successfully!
          </p>
        )}
        <p className="text-[10px] text-slate-400 text-center mt-1">
          Opens native WhatsApp, AirDrop, Messages, Drive, or system share sheet
        </p>
      </div>

      {/* Ledger Preview of Filtered Transactions */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>Transactions in Selected Period</span>
          <span className="text-slate-400">({filteredTxs.length} records)</span>
        </div>

        {filteredTxs.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs">
            No transactions match the selected filter.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTxs.slice(0, 8).map((tx) => {
              const cust = customers.find((c) => c.customerId === tx.customerId);
              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        tx.type === 'CREDIT' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? 'CR' : 'REC'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {cust?.name || tx.customerId}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {tx.date} • {tx.note}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-extrabold text-xs shrink-0 ${
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
