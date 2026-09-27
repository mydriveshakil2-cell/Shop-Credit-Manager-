import React, { useState } from 'react';
import { X, ArrowDownLeft, AlertCircle, Calendar, FileText } from 'lucide-react';
import { Customer, Shop } from '../../types';
import { store } from '../../services/store';
import { formatAED } from '../../utils/uaeValidation';
import { calculateCustomerAccounting } from '../../utils/accounting';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop?: Shop;
  customers: Customer[];
  preselectedCustomer?: Customer;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  shop,
  customers,
  preselectedCustomer,
  onSuccess,
}) => {
  const currency = shop?.currency || 'AED';
  const shopId = shop?.shopId || '';
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    preselectedCustomer?.customerId || (customers[0]?.customerId ?? '')
  );
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentCust = customers.find((c) => c.customerId === selectedCustomerId);
  const custTxs = currentCust ? store.getTransactions({ shopId: shopId, customerId: currentCust.customerId }) : [];
  const { totalNetDue } = calculateCustomerAccounting(custTxs);

  const numAmount = parseFloat(amount) || 0;
  // Real-time calculation showing net remaining due balance:
  const remainingDue = Math.max(0, totalNetDue - numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid payment received amount.');
      return;
    }
    if (!shop) {
      setError('Please select or create a shop first.');
      return;
    }

    setIsSubmitting(true);
    try {
      await store.addTransaction({
        shopId: shop.shopId,
        customerId: selectedCustomerId,
        type: 'PAYMENT',
        amount: numAmount,
        date,
        note: note.trim() || 'Payment Received (Cash / Card)',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0c4a42] to-[#12584e] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Record Received Payment</h2>
              <p className="text-[11px] text-emerald-200">Customer Due Settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Select Customer / Buyer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-medium focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            >
              {customers.map((c) => (
                <option key={c.customerId} value={c.customerId}>
                  {c.name} ({c.customerId})
                </option>
              ))}
            </select>
          </div>

          {/* Real-time Calculation: Remaining Due Balance */}
          {currentCust && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Current Outstanding Due:</span>
                <span className="font-bold text-slate-800">{formatAED(totalNetDue, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Payment Received:</span>
                <span className="font-bold text-emerald-700">- {formatAED(numAmount, currency)}</span>
              </div>
              <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-emerald-950">Net Remaining Due:</span>
                <span className="text-sm font-extrabold text-[#0c4a42]">
                  {formatAED(remainingDue, currency)}
                </span>
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Payment Amount ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 font-bold text-sm text-slate-400">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.5"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-14 pr-3 py-2.5 text-base font-bold rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-emerald-800"
              />
            </div>
          </div>

          {/* Quick Pay Full button */}
          {totalNetDue > 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAmount(totalNetDue.toFixed(2))}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                Clear Full Due ({formatAED(totalNetDue, currency)})
              </button>
            </div>
          )}

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Settlement Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Payment Method / Note
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Cash / Bank Transfer"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
