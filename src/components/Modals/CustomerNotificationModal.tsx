import React from 'react';
import {
  Check,
  AlertTriangle,
  ArrowUpRight,
  Send,
  ExternalLink,
} from 'lucide-react';
import { AppNotification } from '../../types';
import { store } from '../../services/store';

interface CustomerNotificationModalProps {
  notification: AppNotification | null;
  onDismiss: () => void;
  onViewStatement?: () => void;
}

export const CustomerNotificationModal: React.FC<CustomerNotificationModalProps> = ({
  notification,
  onDismiss,
  onViewStatement,
}) => {
  if (!notification) return null;

  const handleAcknowledge = async () => {
    await store.markNotificationAsRead(notification.id);
    onDismiss();
  };

  const isPayment = notification.type === 'PAYMENT_RECEIVED';
  const isCredit = notification.type === 'CREDIT_ADDED';
  const isLimit = notification.type === 'LIMIT_EXCEEDED';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in select-none">
      {/* Floating Card exactly styled as IMG_8772.jpeg */}
      <div className="relative w-full max-w-sm bg-white rounded-[36px] shadow-[0_25px_50px_rgba(0,0,0,0.35)] p-6 pt-3 pb-6 flex flex-col items-center text-center animate-in slide-in-from-bottom duration-300 border border-slate-100">
        {/* Top Handle Pill matching IMG_8772.jpeg */}
        <div className="w-10 h-1.5 rounded-full bg-slate-200 mx-auto mb-5" />

        {/* Centered Circular Status Badge matching IMG_8772.jpeg */}
        {isPayment && (
          <div className="w-16 h-16 rounded-full bg-[#22c55e] text-white flex items-center justify-center mx-auto mb-4 shadow-[0_8px_20px_rgba(34,197,94,0.35)]">
            <Check className="w-9 h-9 stroke-[3]" />
          </div>
        )}

        {isCredit && (
          <div className="w-16 h-16 rounded-full bg-[#0c4a42] text-white flex items-center justify-center mx-auto mb-4 shadow-[0_8px_20px_rgba(12,74,66,0.35)]">
            <ArrowUpRight className="w-9 h-9 stroke-[2.5] text-emerald-300" />
          </div>
        )}

        {isLimit && (
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 shadow-sm border border-amber-200">
            <AlertTriangle className="w-9 h-9" />
          </div>
        )}

        {/* Headline Title */}
        <h3 className="text-lg font-extrabold text-slate-900 mb-2">
          {isPayment && 'Payment Received! 🎉'}
          {isCredit && 'New Credit Entry Added! 📝'}
          {isLimit && 'Credit Limit Notice ⚠️'}
        </h3>

        {/* Description Text with required formula & notification details */}
        <div className="text-xs text-slate-600 leading-relaxed max-w-xs mb-6 px-1">
          {isPayment && (
            <p className="font-medium bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 text-emerald-950 font-mono text-[11.5px] leading-relaxed">
              {notification.message}
            </p>
          )}

          {isCredit && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5 text-left text-[11px]">
              <div className="font-semibold text-slate-500">
                Shop: <strong className="text-slate-800">{notification.shopName}</strong> ({notification.shopId})
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Newly Added Credit:</span>
                <span className="font-bold text-rose-600">AED {notification.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-800 pt-1 border-t border-slate-200">
                <span className="font-bold">Updated Total Due Balance:</span>
                <span className="font-extrabold text-[#0c4a42]">AED {notification.newTotalDue.toFixed(2)}</span>
              </div>
            </div>
          )}

          {isLimit && (
            <p className="font-medium text-amber-900 bg-amber-50 p-3 rounded-2xl border border-amber-200">
              {notification.message}
            </p>
          )}

          <span className="text-[10px] text-slate-400 block mt-2">
            One-time login notification. Marked as read upon dismissal.
          </span>
        </div>

        {/* Two Pill Buttons matching IMG_8772.jpeg */}
        <div className="w-full flex items-center gap-3">
          <button
            type="button"
            onClick={handleAcknowledge}
            className="flex-1 py-3 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              handleAcknowledge();
              if (onViewStatement) onViewStatement();
            }}
            className="flex-1 py-3 px-4 rounded-full bg-[#18181b] hover:bg-black text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{isPayment ? 'View Live ↗' : 'Acknowledge ↗'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
