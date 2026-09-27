import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import { LockIcon } from '../LockIcon';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface LoginPageProps {
  onLoginSuccess: (role: UserRole) => void;
  onRequiresPasswordSetup: (role: 'shop' | 'customer', identifier: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onRequiresPasswordSetup,
}) => {
  const { loginAsAdmin, loginAsShop, loginAsCustomer } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('shop');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleTabChange = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    setIsUnlocked(false);
    if (role === 'admin') {
      setIdentifier('Admin');
      setPassword('Uae@@2024');
    } else {
      setIdentifier('');
      setPassword('');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError(`Please enter your ${selectedRole === 'admin' ? 'Admin ID' : selectedRole === 'shop' ? 'Shop ID' : 'Customer ID'}.`);
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedRole === 'admin') {
        const cleanId = identifier.trim().toLowerCase();
        if (cleanId !== 'admin') {
          setError('Invalid Admin User ID. Please enter "Admin".');
          setIsSubmitting(false);
          return;
        }

        const ok = await loginAsAdmin(password);
        if (ok) {
          triggerUnlockAndProceed('admin');
        } else {
          setError('Invalid Admin password. Correct password is "Uae@@2024".');
          setIsSubmitting(false);
        }
      } else if (selectedRole === 'shop') {
        const res = await loginAsShop(identifier.trim(), password.trim() || undefined);
        if (res.requiresPasswordSetup) {
          triggerUnlockAndProceed('shop', () => {
            onRequiresPasswordSetup('shop', identifier.trim().toUpperCase());
          });
        } else if (res.success) {
          triggerUnlockAndProceed('shop');
        } else {
          setError(res.message || 'Login failed. Please check Shop ID and Password.');
          setIsSubmitting(false);
        }
      } else if (selectedRole === 'customer') {
        const res = await loginAsCustomer(identifier.trim(), password.trim() || undefined);
        if (res.requiresPasswordSetup) {
          triggerUnlockAndProceed('customer', () => {
            onRequiresPasswordSetup('customer', identifier.trim().toUpperCase());
          });
        } else if (res.success) {
          triggerUnlockAndProceed('customer');
        } else {
          setError(res.message || 'Login failed. Please check Customer ID and Password.');
          setIsSubmitting(false);
        }
      }
    } catch {
      setError('An unexpected error occurred during login.');
      setIsSubmitting(false);
    }
  };

  // Requirement: "login button e click korla lock icon ti animation hoya unlock hoya jabe"
  const triggerUnlockAndProceed = (role: UserRole, customNext?: () => void) => {
    setIsUnlocked(true);
    // Wait for the shackle unlock animation to complete, then open shutter
    setTimeout(() => {
      if (customNext) {
        customNext();
      } else {
        onLoginSuccess(role);
      }
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#08362f] via-[#0c4a42] to-[#042420] flex items-center justify-center p-4 py-8 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

      {/* Main Card Container exactly styled as image.jpeg */}
      <div className="relative w-full max-w-[340px] sm:max-w-[360px] bg-white rounded-[40px] shadow-[0_25px_60px_rgba(0,0,0,0.45)] px-7 py-9 border border-white/40 flex flex-col items-center">
        {/* Metallic 3D Padlock centered at top matching image.jpeg */}
        <div className="mb-6 mt-1">
          <LockIcon isUnlocked={isUnlocked} className="w-24 h-28" />
        </div>

        {/* Role Selector Pills */}
        <div className="w-full flex items-center justify-between p-1 bg-slate-100/90 rounded-full text-xs font-semibold mb-5">
          <button
            type="button"
            onClick={() => handleRoleTabChange('shop')}
            className={`flex-1 py-1.5 rounded-full transition-all text-center ${
              selectedRole === 'shop'
                ? 'bg-[#0c4a42] text-white font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Shop Owner
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('customer')}
            className={`flex-1 py-1.5 rounded-full transition-all text-center ${
              selectedRole === 'customer'
                ? 'bg-[#0c4a42] text-white font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('admin')}
            className={`flex-1 py-1.5 rounded-full transition-all text-center ${
              selectedRole === 'admin'
                ? 'bg-[#0c4a42] text-white font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Login Form matching image.jpeg */}
        <form onSubmit={handleLoginSubmit} className="w-full space-y-4">
          {/* USER ID Field */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 ml-1">
              {selectedRole === 'admin' ? 'ADMIN USER' : selectedRole === 'shop' ? 'SHOP ID' : 'CUSTOMER ID'}
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
              placeholder={
                selectedRole === 'admin'
                  ? 'admin@shopcredit.ae'
                  : selectedRole === 'shop'
                  ? 'SHOP1001'
                  : 'CUST1001'
              }
              className="w-full px-5 py-3.5 rounded-full bg-[#e8ecea]/70 hover:bg-[#e8ecea] focus:bg-white text-slate-800 font-mono font-medium text-base border border-slate-200/90 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#0c4a42] transition-all"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 ml-1">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-5 pr-12 py-3.5 rounded-full bg-[#e8ecea]/70 hover:bg-[#e8ecea] focus:bg-white text-slate-800 font-medium text-base border border-slate-200/90 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#0c4a42] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Login Button with Arrow matching image.jpeg */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#0c4a42] via-[#0d554c] to-[#083832] hover:from-[#083832] hover:to-[#052823] text-white font-bold text-base shadow-[0_8px_20px_rgba(12,74,66,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Login'}</span>
              <span className="text-lg">➔</span>
            </button>
          </div>
        </form>

        {/* Official Portal Notice */}
        <div className="w-full mt-6 pt-4 border-t border-slate-100 flex items-center justify-center text-[11px] text-slate-400">
          <span>Shop Credit Master • UAE Central Gateway</span>
        </div>
      </div>
    </div>
  );
};
