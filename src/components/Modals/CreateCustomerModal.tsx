import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Phone,
  User,
  Building,
  Calendar,
  Lock,
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { EidUploader } from '../EidUploader';
import { ScannedEidData } from '../../utils/eidScanner';
import {
  createCustomerWhatsAppShareUrl,
  formatEmiratesId,
  isValidEmiratesId,
} from '../../utils/uaeValidation';
import { store } from '../../services/store';
import { Customer, Shop } from '../../types';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop?: Shop;
  onCustomerCreated: (customer: Customer) => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  shop,
  onCustomerCreated,
}) => {
  const currency = shop?.currency || 'AED';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emiratesIdNumber, setEmiratesIdNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(5000);
  const [autoReminder, setAutoReminder] = useState(true);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  // Requirement: IF EID exists in system database, freeze all fields!
  const [isFrozen, setIsFrozen] = useState(false);
  const [existingCustomerId, setExistingCustomerId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);

  if (!isOpen) return null;

  // Auto-generate Customer ID
  const nextCustomerId = existingCustomerId || `CUST${1001 + store.getCustomers().length}`;

  const handleScanComplete = (data: Partial<ScannedEidData>) => {
    setError(null);
    if (data.frontImageBase64) setFrontImage(data.frontImageBase64);
    if (data.backImageBase64) setBackImage(data.backImageBase64);

    const targetEid = data.emiratesIdNumber || emiratesIdNumber;

    if (targetEid) {
      // Check if Emirates ID already exists in system database
      const existing = store.findCustomerByEmiratesId(targetEid);
      if (existing) {
        // REQUIREMENT: "IF the Emirates ID already exists in the system database,
        // automatically pull and show the existing Customer ID and information.
        // In this case, ALL fetched customer information fields MUST BE FROZEN (read-only) and cannot be edited."
        setName(existing.name);
        setPhone(existing.phone);
        setEmiratesIdNumber(existing.emiratesIdNumber);
        setCompanyName(existing.companyName || '');
        setDob(existing.dob || '');
        setAddress(existing.address || '');
        setCreditLimit(existing.creditLimit);
        setAutoReminder(existing.autoReminder);
        setExistingCustomerId(existing.customerId);
        setIsFrozen(true);
        return;
      }
    }

    // Otherwise, new customer: allow manual verification / adjustment
    setIsFrozen(false);
    setExistingCustomerId(null);
    if (data.name) setName(data.name);
    if (data.emiratesIdNumber) setEmiratesIdNumber(data.emiratesIdNumber);
    if (data.companyName) setCompanyName(data.companyName);
    if (data.dob) setDob(data.dob);
  };

  const handleEmiratesIdChange = (val: string) => {
    if (isFrozen) return;
    const formatted = formatEmiratesId(val);
    setEmiratesIdNumber(formatted);

    // Live check if EID exists
    if (formatted.length >= 18) {
      const existing = store.findCustomerByEmiratesId(formatted);
      if (existing) {
        setName(existing.name);
        setPhone(existing.phone);
        setCompanyName(existing.companyName || '');
        setDob(existing.dob || '');
        setAddress(existing.address || '');
        setCreditLimit(existing.creditLimit);
        setAutoReminder(existing.autoReminder);
        setExistingCustomerId(existing.customerId);
        setIsFrozen(true);
      }
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!frontImage || !backImage) {
      setError('Uploading both Front & Back images of Emirates ID is MANDATORY.');
      return;
    }

    if (!name.trim()) {
      setError('Customer Full Name is required.');
      return;
    }

    if (!phone.trim()) {
      setError('Customer Mobile Number is required.');
      return;
    }

    if (!emiratesIdNumber.trim()) {
      setError('Valid Emirates ID is required.');
      return;
    }

    // If new user (not an existing pulled customer), verify unique constraints
    if (!isFrozen) {
      const { phoneInUse, eidInUse } = store.checkUniqueConstraints(phone, emiratesIdNumber);
      if (phoneInUse) {
        setError('This Mobile Number is already in use by another account in the system.');
        return;
      }
      if (eidInUse) {
        setError('This Emirates ID is already registered in the system.');
        return;
      }
    }

    if (!shop) {
      setError('Please select or create a shop first.');
      return;
    }

    setIsSaving(true);
    try {
      const newCust = await store.createCustomer({
        customerId: nextCustomerId,
        shopId: shop.shopId,
        name: name.trim(),
        phone: phone.trim(),
        emiratesIdNumber: emiratesIdNumber.trim(),
        companyName: companyName.trim(),
        dob: dob.trim(),
        address: address.trim() || 'Dubai, UAE',
        creditLimit: Number(creditLimit) || 5000,
        autoReminder,
        emiratesIdFrontUrl: frontImage,
        emiratesIdBackUrl: backImage,
      });

      setCreatedCustomer(newCust);
      onCustomerCreated(newCust);
    } catch (err: any) {
      setError(err?.message || 'Failed to create customer record.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg my-6 rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0c4a42] to-[#12584e] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">New Customer Onboarding</h2>
              <p className="text-[11px] text-emerald-200">
                {shop?.shopName || 'Shop'} {shop?.shopId ? `(${shop.shopId})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {createdCustomer ? (
            /* Success View with Share To USER WhatsApp button */
            <div className="text-center py-3 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Customer Onboarded Successfully!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Customer ID: <strong className="text-emerald-700 font-mono text-sm">{createdCustomer.customerId}</strong>
                </p>
              </div>

              {/* Exact WhatsApp Message Format Required */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-left text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap select-all">
                {`                 **CONGRATULATIONS**

                     Successfully
               Generate Your Customer ID
                       Details:
                 Shop Name: ${shop?.shopName || ''}
                 Shop ID: ${shop?.shopId || ''}
                 Owner Name: ${shop?.ownerName || ''}
                 Address: ${shop?.address || ''}
               Owner Mobile Number: ${shop?.phone || ''}

                App Link: ${window.location.origin}`}
              </div>

              {/* Share To USER WhatsApp Button */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href={createCustomerWhatsAppShareUrl({
                    customerPhone: createdCustomer.phone,
                    shopName: shop?.shopName || '',
                    shopId: shop?.shopId || '',
                    ownerName: shop?.ownerName || '',
                    shopAddress: shop?.address || '',
                    ownerPhone: shop?.phone || '',
                    customerId: createdCustomer.customerId,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm shadow-md transition-transform active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share To USER (WhatsApp)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>

                <button
                  onClick={onClose}
                  className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Notice if record is frozen */}
              {isFrozen && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-bold">Existing Customer Profile Found</div>
                    <div className="text-[11px] text-amber-700">
                      Customer ID {existingCustomerId} is already registered. In accordance with system policy, fetched profile details are frozen.
                    </div>
                  </div>
                </div>
              )}

              {/* Emirates ID Auto-Scan Component */}
              <EidUploader
                isCustomerMode={true}
                onScanComplete={handleScanComplete}
                frontImagePreview={frontImage}
                backImagePreview={backImage}
                setFrontImagePreview={setFrontImage}
                setBackImagePreview={setBackImage}
              />

              {/* Generated Customer ID */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Customer ID
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-800">
                    {nextCustomerId}
                  </span>
                </div>
                {isFrozen && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    Fields Frozen
                  </span>
                )}
              </div>

              {/* Customer Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Full Name (from EID) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      readOnly={isFrozen}
                      placeholder="e.g. Hamdan Mohammed"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border ${
                        isFrozen
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : 'border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Emirates ID Number *
                    </label>
                    <input
                      type="text"
                      required
                      readOnly={isFrozen}
                      placeholder="784-YYYY-XXXXXXX-X"
                      value={emiratesIdNumber}
                      onChange={(e) => handleEmiratesIdChange(e.target.value)}
                      className={`w-full px-3 py-2 text-sm font-mono rounded-xl border ${
                        isFrozen
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : 'border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        readOnly={isFrozen}
                        placeholder="0521234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border ${
                          isFrozen
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                            : 'border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Company / Sponsor Name
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        readOnly={isFrozen}
                        placeholder="e.g. Al Futtaim Group"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border ${
                          isFrozen
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                            : 'border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="date"
                        readOnly={isFrozen}
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border ${
                          isFrozen
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                            : 'border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Credit Limit & Automated WhatsApp Over-limit Reminder Toggle */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-emerald-950 block mb-1">
                      Credit Limit ({currency}) *
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      required
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-bold text-slate-800 bg-white rounded-xl border border-slate-300 focus:border-emerald-600"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Maximum credit allowed before warning alerts.
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Automated WhatsApp Over-Limit Reminders
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Sends payment reminders if current due exceeds credit limit.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoReminder}
                        onChange={(e) => setAutoReminder(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0c4a42] hover:bg-[#093933] text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save & Generate ID</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
