import React from 'react';
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  UserPlus,
  MessageCircle,
  Lock,
} from 'lucide-react';
import { formatAED } from '../utils/uaeValidation';

interface HeroBalanceCardProps {
  title?: string;
  totalDue: number;
  totalCredit: number;
  totalPaid: number;
  currency?: string;
  customerCount?: number;
  canEditCurrency?: boolean;
  isReadOnly?: boolean;
  onAddCredit?: () => void;
  onRecordPayment?: () => void;
  onCreateCustomer?: () => void;
  onSendOverlimitReminders?: () => void;
}

export const HeroBalanceCard: React.FC<HeroBalanceCardProps> = ({
  title = 'Total Due Balance',
  totalDue,
  totalCredit,
  totalPaid,
  currency = 'AED',
  customerCount,
  isReadOnly = false,
  onAddCredit,
  onRecordPayment,
  onCreateCustomer,
  onSendOverlimitReminders,
}) => {
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#0d4c44] via-[#093c35] to-[#052d27] p-5 text-white shadow-xl shadow-emerald-950/20 border border-emerald-700/30">
      {/* Background Organic Ambient Spheres & Wave Texture */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-teal-400/10 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Top Header inside Hero: Title + Currency pill */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-emerald-200/90 tracking-wide uppercase">
            {title}
          </span>
          {customerCount !== undefined && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-semibold border border-emerald-400/20">
              {customerCount} {customerCount === 1 ? 'Customer' : 'Customers'}
            </span>
          )}
        </div>

        {/* Currency badge - locked by admin */}
        <div
          title="Currency fixed by Admin (Locked)"
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-600/30 text-[11px] font-bold text-emerald-300 shadow-inner"
        >
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>{currency} (Fixed)</span>
        </div>
      </div>

      {/* Main Big Metric */}
      <div className="relative z-10 mt-3 mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans drop-shadow-sm text-white">
            {formatAED(totalDue, currency)}
          </span>
          <span className="text-xs font-semibold text-emerald-300/80">
            Net Remaining Due
          </span>
        </div>
      </div>

      {/* 3 Metrics Cards (as styled in IMG_8769.jpeg) */}
      <div className="relative z-10 grid grid-cols-3 gap-2 pt-1">
        {/* Credit Given */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-md p-2.5 border border-white/10 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-200/90 mb-1">
            <ArrowUpRight className="w-3 h-3 text-rose-300" />
            <span className="truncate">Credit Due</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-white truncate">
            {formatAED(totalCredit, currency)}
          </div>
        </div>

        {/* Paid / Received */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-md p-2.5 border border-white/10 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-200/90 mb-1">
            <ArrowDownLeft className="w-3 h-3 text-emerald-300" />
            <span className="truncate">Received</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-emerald-300 truncate">
            {formatAED(totalPaid, currency)}
          </div>
        </div>

        {/* Recovery Rate */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-md p-2.5 border border-white/10 shadow-xs">
          <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-200/90 mb-1">
            <TrendingUp className="w-3 h-3 text-teal-300" />
            <span className="truncate">Recovery</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-teal-200 truncate">
            {totalCredit > 0 ? Math.round((totalPaid / totalCredit) * 100) : 100}%
          </div>
        </div>
      </div>

      {/* Quick Action Pills underneath - Hidden if Read-Only (e.g. for customer) */}
      {!isReadOnly && (
        <div className="relative z-10 mt-4 pt-3 border-t border-emerald-700/40 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {onAddCredit && (
            <button
              onClick={onAddCredit}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Credit</span>
            </button>
          )}

          {onRecordPayment && (
            <button
              onClick={onRecordPayment}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 transition-all active:scale-95"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" />
              <span>Record Pay</span>
            </button>
          )}

          {onCreateCustomer && (
            <button
              onClick={onCreateCustomer}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 transition-all active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-300" />
              <span>New Customer</span>
            </button>
          )}

          {onSendOverlimitReminders && (
            <button
              onClick={onSendOverlimitReminders}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 font-semibold text-xs border border-amber-400/30 transition-all active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Over-Limit</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
