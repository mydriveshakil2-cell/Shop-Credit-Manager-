import React, { useState } from 'react';
import {
  Store,
  Calendar,
  Download,
  CreditCard,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Star,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Customer, Shop, Transaction } from '../../types';
import { store } from '../../services/store';
import { HeroBalanceCard } from '../HeroBalanceCard';
import { formatAED } from '../../utils/uaeValidation';
import { calculateCustomerAccounting } from '../../utils/accounting';
import { shareCustomerPdfStatement } from '../../utils/pdfGenerator';

interface CustomerDashboardProps {
  customer: Customer;
  shop?: Shop;
  transactions: Transaction[];
  onOpenRatingModal: (shop: Shop) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  customer,
  shop,
  transactions,
  onOpenRatingModal,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const currency = shop?.currency || 'AED';

  const { allMonths, currentStatement, totalLifetimeCredit, totalLifetimePaid, totalNetDue } =
    calculateCustomerAccounting(transactions, selectedMonth);

  const handleSharePdf = async () => {
    if (!shop) return;
    await shareCustomerPdfStatement(shop, customer, currentStatement);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Read-Only Banner notice */}
      <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Customer Portal (Buyer):</strong> Read-only transparent statement directly verified by{' '}
            {shop?.shopName || 'Shop'}.
          </span>
        </div>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
          Read-Only Mode
        </span>
      </div>

      {/* Hero Balance Card */}
      <HeroBalanceCard
        title="My Outstanding Due Balance"
        totalDue={totalNetDue}
        totalCredit={totalLifetimeCredit}
        totalPaid={totalLifetimePaid}
        currency={currency}
        isReadOnly={true}
      />

      {/* Shop Information Card with Star Rating trigger */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0c4a42] text-white flex items-center justify-center font-bold text-base shrink-0">
            <Store className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">{shop?.shopName || 'Shop'}</h3>
              <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                {shop?.shopId || ''}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Owner: {shop?.ownerName || 'Owner'} • {shop?.phone || ''}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{(shop?.rating ?? 5.0).toFixed(1)} Shop Rating</span>
            </div>
          </div>
        </div>

        {shop && (
          <button
            onClick={() => onOpenRatingModal(shop)}
            className="text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-2 rounded-xl transition-colors shrink-0"
          >
            Rate Shop ★
          </button>
        )}
      </div>

      {/* CARRY FORWARD MONTHLY ACCOUNTING SECTION */}
      <div className="p-4 rounded-3xl bg-[#F0F7F4] border border-emerald-800/15 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold text-[#0c4a42] uppercase tracking-wider block">
              Month-Wise Khata Accounting
            </span>
            <span className="text-[10px] text-slate-500">
              Opening balance automatically carries forward
            </span>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold text-[#0c4a42] bg-white border border-emerald-300 rounded-xl px-2.5 py-1.5 focus:outline-none"
          >
            {allMonths.map((m) => (
              <option key={m.monthYear} value={m.monthYear}>
                {m.monthName}
              </option>
            ))}
          </select>
        </div>

        {/* 4 Metrics Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[9px] font-bold text-slate-400 block">OPENING BAL</span>
            <span className="font-extrabold text-slate-700 block mt-0.5">
              {formatAED(currentStatement.openingBalance, currency)}
            </span>
            <span className="text-[8px] text-slate-400">Previous month carry</span>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-[9px] font-bold text-rose-600 block">MONTH CREDIT</span>
            <span className="font-extrabold text-rose-700 block mt-0.5">
              +{formatAED(currentStatement.creditAmount, currency)}
            </span>
            <span className="text-[8px] text-rose-500">Added dues</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[9px] font-bold text-emerald-700 block">PAID / SETTLED</span>
            <span className="font-extrabold text-emerald-800 block mt-0.5">
              -{formatAED(currentStatement.paidAmount, currency)}
            </span>
            <span className="text-[8px] text-emerald-600">Payments made</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0c4a42] text-white">
            <span className="text-[9px] font-bold text-emerald-200 block">CLOSING DUE</span>
            <span className="font-extrabold text-white block mt-0.5">
              {formatAED(currentStatement.closingBalance, currency)}
            </span>
            <span className="text-[8px] text-emerald-300">Net month due</span>
          </div>
        </div>

        {/* Direct Share PDF Report Button */}
        <div className="pt-2">
          <button
            onClick={handleSharePdf}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#0c4a42] hover:bg-[#083832] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>Share Official PDF Statement (Device Share)</span>
          </button>
        </div>
      </div>

      {/* Date-Wise Transaction History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">
            Statement Ledger Entries
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {currentStatement.monthName} ({currentStatement.transactions.length})
          </span>
        </div>

        {currentStatement.transactions.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs">
            No entries found for this month period.
          </div>
        ) : (
          <div className="space-y-2">
            {currentStatement.transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
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
                  <div>
                    <div className="font-bold text-slate-900">
                      {tx.type === 'CREDIT' ? 'Store Credit' : 'Payment Settled'}
                    </div>
                    <div className="text-[11px] text-slate-400">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
