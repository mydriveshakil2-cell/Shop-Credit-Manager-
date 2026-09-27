import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Building,
  CreditCard,
  Download,
  Share2,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Star,
  FileText,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { Customer, Shop, Transaction } from '../../types';
import { store } from '../../services/store';
import { formatAED, createOverLimitWhatsAppReminderUrl } from '../../utils/uaeValidation';
import { calculateCustomerAccounting } from '../../utils/accounting';
import { shareCustomerPdfStatement } from '../../utils/pdfGenerator';

interface CustomerDetailSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  shop?: Shop;
  onAddCredit: (customer: Customer) => void;
  onRecordPayment: (customer: Customer) => void;
  onOpenRating: (customer: Customer) => void;
}

export const CustomerDetailSlideOver: React.FC<CustomerDetailSlideOverProps> = ({
  isOpen,
  onClose,
  customer,
  shop,
  onAddCredit,
  onRecordPayment,
  onOpenRating,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [showIdCard, setShowIdCard] = useState(false);

  const currency = shop?.currency || 'AED';
  const shopId = shop?.shopId || '';
  const shopName = shop?.shopName || 'Shop';

  if (!isOpen || !customer) return null;

  const transactions = store.getTransactions({
    shopId: shopId,
    customerId: customer.customerId,
  });

  const { allMonths, currentStatement, totalNetDue, totalLifetimeCredit, totalLifetimePaid } =
    calculateCustomerAccounting(transactions, selectedMonth);

  const isOverLimit = totalNetDue > customer.creditLimit;

  // Direct Device Share PDF Generation
  const handleSharePdf = async () => {
    if (!shop) {
      alert('Shop details required for PDF generation.');
      return;
    }
    await shareCustomerPdfStatement(shop, customer, currentStatement);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0c4a42] to-[#12584e] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-sm">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold truncate max-w-[200px]">{customer.name}</h2>
                <span className="font-mono text-[10px] bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  {customer.customerId}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200">{customer.phone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Over-Limit Alert Bar */}
          {isOverLimit && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold">Credit Limit Exceeded!</div>
                  <div className="text-[11px] text-rose-700">
                    Current due {formatAED(totalNetDue, currency)} exceeds assigned limit of {formatAED(customer.creditLimit, currency)}.
                  </div>
                </div>
              </div>
              {/* WhatsApp Over-Limit Reminder */}
              <a
                href={createOverLimitWhatsAppReminderUrl({
                  customerName: customer.name,
                  customerPhone: customer.phone,
                  shopName: shopName,
                  shopId: shopId,
                  creditLimit: customer.creditLimit,
                  currentDue: totalNetDue,
                  currency: currency,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          )}

          {/* Customer Summary Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#0c4a42] text-white">
              <div className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">
                Total Due Balance
              </div>
              <div className="text-xl font-extrabold mt-0.5">
                {formatAED(totalNetDue, currency)}
              </div>
              <div className="text-[10px] text-emerald-300 mt-1">
                Limit: {formatAED(customer.creditLimit, currency)}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Buyer Trust Score
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span className="text-lg font-bold text-slate-800">
                  {customer.rating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">({customer.ratingCount} reviews)</span>
              </div>
              <button
                onClick={() => onOpenRating(customer)}
                className="mt-1 text-[11px] font-bold text-emerald-700 hover:underline block"
              >
                + Submit Rating
              </button>
            </div>
          </div>

          {/* Quick Transaction Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onAddCredit(customer)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Credit Entry</span>
            </button>
            <button
              onClick={() => onRecordPayment(customer)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <span>Record Payment</span>
            </button>
          </div>

          {/* Verified Emirates ID Card Details */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                Verified Emirates ID
              </span>
              <button
                onClick={() => setShowIdCard(!showIdCard)}
                className="text-[11px] font-bold text-emerald-700 hover:underline"
              >
                {showIdCard ? 'Hide Card Images' : 'View ID Images'}
              </button>
            </div>
            <div className="font-mono text-xs font-semibold text-slate-700">
              {customer.emiratesIdNumber}
            </div>
            {customer.companyName && (
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.companyName}</span>
              </div>
            )}

            {/* Expandable ID Images */}
            {showIdCard && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                {customer.emiratesIdFrontUrl && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block mb-1">FRONT</span>
                    <img
                      src={customer.emiratesIdFrontUrl}
                      alt="EID Front"
                      className="w-full h-24 object-cover rounded-lg border border-slate-300"
                    />
                  </div>
                )}
                {customer.emiratesIdBackUrl && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block mb-1">BACK</span>
                    <img
                      src={customer.emiratesIdBackUrl}
                      alt="EID Back"
                      className="w-full h-24 object-cover rounded-lg border border-slate-300"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CARRY FORWARD MONTHLY ACCOUNTING SECTION */}
          <div className="p-4 rounded-3xl bg-[#F0F7F4] border border-emerald-800/15 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-[#0c4a42] uppercase tracking-wider block">
                  Monthly Statement & Khata
                </span>
                <span className="text-[10px] text-slate-500">
                  With Carry-Forward Opening Balance
                </span>
              </div>

              {/* Month Selector */}
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

            {/* Carry-Forward 4-Box Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[9px] font-bold text-slate-400 block">OPENING BAL</span>
                <span className="font-extrabold text-slate-700 block mt-0.5">
                  {formatAED(currentStatement.openingBalance, currency)}
                </span>
                <span className="text-[8px] text-slate-400">Carried forward</span>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-[9px] font-bold text-rose-600 block">MONTH CREDIT</span>
                <span className="font-extrabold text-rose-700 block mt-0.5">
                  +{formatAED(currentStatement.creditAmount, currency)}
                </span>
                <span className="text-[8px] text-rose-500">New dues</span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[9px] font-bold text-emerald-700 block">RECEIVED</span>
                <span className="font-extrabold text-emerald-800 block mt-0.5">
                  -{formatAED(currentStatement.paidAmount, currency)}
                </span>
                <span className="text-[8px] text-emerald-600">Settlements</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0c4a42] text-white">
                <span className="text-[9px] font-bold text-emerald-200 block">CLOSING DUE</span>
                <span className="font-extrabold text-white block mt-0.5">
                  {formatAED(currentStatement.closingBalance, currency)}
                </span>
                <span className="text-[8px] text-emerald-300">Carries to next</span>
              </div>
            </div>

            {/* Direct Device Share PDF Report Button */}
            <div className="pt-2">
              <button
                onClick={handleSharePdf}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#0c4a42] hover:bg-[#083832] text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-300" />
                <span>Share Statement PDF (Device Share)</span>
              </button>
              <div className="text-[10px] text-slate-500 text-center mt-1.5">
                Opens native share options (WhatsApp, AirDrop, Messages, Gmail, Drive)
              </div>
            </div>
          </div>

          {/* Month Transaction Ledger */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800">
                Transactions ({currentStatement.transactions.length})
              </h4>
              <span className="text-[11px] text-slate-400">{currentStatement.monthName}</span>
            </div>

            {currentStatement.transactions.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                No transactions recorded for this month.
              </div>
            ) : (
              <div className="space-y-2">
                {currentStatement.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
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
                          {tx.type === 'CREDIT' ? 'Store Credit' : 'Payment Received'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {tx.date} • {tx.note}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-extrabold ${
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
      </div>
    </div>
  );
};
