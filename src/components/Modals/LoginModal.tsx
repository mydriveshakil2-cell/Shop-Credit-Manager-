import React, { useState } from 'react';
import {
  X,
  Store,
  User,
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequiresPasswordSetup: (role: 'shop' | 'customer', identifier: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onRequiresPasswordSetup,
}) => {
  const { loginAsAdmin, loginAsShop, loginAsCustomer } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('shop');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (selectedRole === 'admin') {
        const ok = await loginAsAdmin(password || 'admin');
        if (ok) {
          onClose();
        } else {
          setError('Invalid Admin credentials.');
        }
      } else if (selectedRole === 'shop') {
        if (!identifier.trim()) {
          setError('Please enter your Shop ID.');
          setIsSubmitting(false);
          return;
        }

        const res = await loginAsShop(identifier.trim(), password.trim() || undefined);
        if (res.requiresPasswordSetup) {
          onClose();
          onRequiresPasswordSetup('shop', identifier.trim().toUpperCase());
        } else if (res.success) {
          onClose();
        } else {
          setError(res.message || 'Login failed. Please check your Shop ID and Password.');
        }
      } else if (selectedRole === 'customer') {
        if (!identifier.trim()) {
          setError('Please enter your Customer ID.');
          setIsSubmitting(false);
          return;
        }

        const res = await loginAsCustomer(identifier.trim(), password.trim() || undefined);
        if (res.requiresPasswordSetup) {
          onClose();
          onRequiresPasswordSetup('customer', identifier.trim().toUpperCase());
        } else if (res.success) {
          onClose();
        } else {
          setError(res.message || 'Login failed. Please check Customer ID and Password.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Login error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'admin') {
      setIdentifier('admin@shopcredit.ae');
      setPassword('admin');
    } else if (role === 'shop') {
      setIdentifier('SHOP1001');
      setPassword('shop');
    } else if (role === 'customer') {
      setIdentifier('CUST1001');
      setPassword('cust');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0c4a42] to-[#12584e] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center font-bold">
              SC
            </div>
            <div>
              <h2 className="text-base font-bold">Shop Credit Master</h2>
              <p className="text-[11px] text-emerald-200">Secure Access Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Persona selector tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('shop');
                setIdentifier('');
                setPassword('');
                setError(null);
              }}
              className={`py-2 rounded-xl transition-all ${
                selectedRole === 'shop'
                  ? 'bg-white text-emerald-950 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Shop Owner
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('customer');
                setIdentifier('');
                setPassword('');
                setError(null);
              }}
              className={`py-2 rounded-xl transition-all ${
                selectedRole === 'customer'
                  ? 'bg-white text-blue-950 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setIdentifier('admin@shopcredit.ae');
                setPassword('admin');
                setError(null);
              }}
              className={`py-2 rounded-xl transition-all ${
                selectedRole === 'admin'
                  ? 'bg-white text-amber-950 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Admin
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            {selectedRole === 'shop' && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Shop ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SHOP1001"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm font-mono uppercase rounded-xl border border-slate-300 focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    First-time login requires ONLY Shop ID.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Password (leave empty if first login)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-600"
                  />
                </div>
              </>
            )}

            {selectedRole === 'customer' && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Customer ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CUST1001"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm font-mono uppercase rounded-xl border border-slate-300 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-600"
                  />
                </div>
              </>
            )}

            {selectedRole === 'admin' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Master Admin Password
                </label>
                <input
                  type="password"
                  value={password}
                  placeholder="admin"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-600"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-[#0c4a42] hover:bg-[#093933] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Sign In to {selectedRole === 'shop' ? 'Shop' : selectedRole === 'customer' ? 'Customer' : 'Admin'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo 1-Click Buttons */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-2">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick Test Logins
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('shop')}
                className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 transition-colors"
              >
                Demo Shop
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('customer')}
                className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200 transition-colors"
              >
                Demo Cust
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 transition-colors"
              >
                Demo Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
