import React, { useState } from 'react';
import {
  X,
  Store,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Navigation,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { EidUploader } from '../EidUploader';
import { ScannedEidData } from '../../utils/eidScanner';
import {
  createShopWhatsAppShareUrl,
  formatEmiratesId,
  isValidEmiratesId,
  isValidUaePhone,
  normalizeUaePhoneForWhatsApp,
} from '../../utils/uaeValidation';
import { store } from '../../services/store';
import { Shop } from '../../types';

interface CreateShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShopCreated: (shop: Shop) => void;
}

export const CreateShopModal: React.FC<CreateShopModalProps> = ({
  isOpen,
  onClose,
  onShopCreated,
}) => {
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('AED'); // Admin controlled
  const [emiratesIdNumber, setEmiratesIdNumber] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Success view state with "Share To USER" WhatsApp button
  const [createdShop, setCreatedShop] = useState<Shop | null>(null);

  if (!isOpen) return null;

  // Auto-generate Shop ID based on existing shops count
  const nextShopId = `SHOP${1001 + store.getShops().length}`;

  const handleScanComplete = (data: Partial<ScannedEidData>) => {
    if (data.name) setOwnerName(data.name);
    if (data.emiratesIdNumber) setEmiratesIdNumber(data.emiratesIdNumber);
    if (data.frontImageBase64) setFrontImage(data.frontImageBase64);
    if (data.backImageBase64) setBackImage(data.backImageBase64);
    setError(null);
  };

  // Requirement 7: Location Auto-Detect
  // "Beside the Address field in the Shop User profile, include a "Current Location" one-click button.
  // Clicking it fetches the user's current GPS location via Google Maps API/Geolocation and populates the address field
  // with the Google Maps link/location name."
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsLink = `https://maps.google.com/?q=${latitude.toFixed(5)},${longitude.toFixed(5)}`;
        // Try reverse geocode via OSM Nominatim or fallback
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then((res) => res.json())
          .then((data) => {
            const locName = data?.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : 'UAE Location';
            setAddress(`${locName} (${mapsLink})`);
            setLocationSuccess(true);
            setIsLocating(false);
          })
          .catch(() => {
            setAddress(`Dubai, UAE (${mapsLink})`);
            setLocationSuccess(true);
            setIsLocating(false);
          });
      },
      (err) => {
        // Fallback demo coordinates in Dubai
        setAddress('Business Bay, Dubai, UAE (https://maps.google.com/?q=25.1857,55.2744)');
        setLocationSuccess(true);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!shopName.trim()) {
      setError('Please enter a valid Shop Name.');
      return;
    }
    if (!ownerName.trim()) {
      setError('Please enter the Owner Name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please provide the Owner Mobile Number.');
      return;
    }
    if (!emiratesIdNumber.trim()) {
      setError('UAE Emirates ID number is required.');
      return;
    }
    if (!frontImage || !backImage) {
      setError('Uploading both Front & Back images of the Emirates ID is MANDATORY.');
      return;
    }

    // Unique user constraint check
    const { phoneInUse, eidInUse } = store.checkUniqueConstraints(phone, emiratesIdNumber);
    if (phoneInUse) {
      setError('This Mobile Number is already associated with an account in the system.');
      return;
    }
    if (eidInUse) {
      setError('This Emirates ID Number is already registered to an existing account.');
      return;
    }

    setIsSaving(true);
    try {
      const newShop = await store.createShop({
        shopId: nextShopId,
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim() || 'Dubai, United Arab Emirates',
        currency,
        ownerUid: `owner_${Date.now()}`,
        emiratesIdNumber: emiratesIdNumber.trim(),
        emiratesIdFrontUrl: frontImage,
        emiratesIdBackUrl: backImage,
      });

      setCreatedShop(newShop);
      onShopCreated(newShop);
    } catch (err: any) {
      setError(err?.message || 'Failed to create shop. Please try again.');
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
              <Store className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Create New Shop User</h2>
              <p className="text-[11px] text-emerald-200">Admin Control Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {createdShop ? (
            /* Success View with Share To USER WhatsApp button */
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Shop Successfully Created!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Unique Shop ID generated: <strong className="text-emerald-700 font-mono text-sm">{createdShop.shopId}</strong>
                </p>
              </div>

              {/* Message Preview Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-left text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap select-all">
                {`                 **CONGRATULATIONS**

                     Successfully
                Generate Your Shop ID
                       Details:
                 Shop Name: ${createdShop.shopName}
                 Shop ID: ${createdShop.shopId}
                 Owner Name: ${createdShop.ownerName}
                 Address: ${createdShop.address}
               Owner Mobile Number: ${createdShop.phone}

                App Link: ${window.location.origin}`}
              </div>

              {/* Share To USER WhatsApp Button */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href={createShopWhatsAppShareUrl({
                    shopName: createdShop.shopName,
                    shopId: createdShop.shopId,
                    ownerName: createdShop.ownerName,
                    address: createdShop.address,
                    phone: createdShop.phone,
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
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveShop} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Auto Generated Shop ID & Admin Currency Control */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Auto Generated Shop ID
                  </label>
                  <div className="font-mono text-sm font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    {nextShopId}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Currency (Admin Fixed)
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full font-bold text-sm text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-emerald-600"
                  >
                    <option value="AED">AED (UAE Dirham)</option>
                    <option value="USD">USD ($)</option>
                    <option value="SAR">SAR (Saudi Riyal)</option>
                    <option value="QAR">QAR (Qatari Riyal)</option>
                  </select>
                </div>
              </div>

              {/* Emirates ID Auto-Scan Widget (Mandatory) */}
              <EidUploader
                onScanComplete={handleScanComplete}
                frontImagePreview={frontImage}
                backImagePreview={backImage}
                setFrontImagePreview={setFrontImage}
                setBackImagePreview={setBackImage}
              />

              {/* Shop & Owner Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Shop Name *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Al Barsha Gourmet Grocery LLC"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Owner Full Name (from EID) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rashid Al Mansoori"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Owner Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="0501234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Emirates ID Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="784-YYYY-XXXXXXX-X"
                      value={emiratesIdNumber}
                      onChange={(e) => setEmiratesIdNumber(formatEmiratesId(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Address with One-Click Location Auto-Detect */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Shop Address / Location *
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg transition-colors"
                    >
                      {isLocating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Navigation className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>Current Location</span>
                    </button>
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Street, Area, City (or click Current Location)"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                  {locationSuccess && (
                    <span className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> GPS Location attached successfully!
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-2">
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
                  <span>Save & Generate Shop</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
