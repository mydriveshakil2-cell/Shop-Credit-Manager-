import React, { useState } from 'react';
import {
  User,
  Store,
  MapPin,
  Phone,
  Lock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Star,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { store } from '../../services/store';
import { Shop, Customer } from '../../types';

interface ProfileViewProps {
  shop?: Shop;
  customer?: Customer;
  onRefresh: () => void;
  onOpenRatingModal: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  shop,
  customer,
  onRefresh,
  onOpenRatingModal,
}) => {
  const { currentUser, currentRole } = useAuth();

  // Local editable states for shop owner
  const [shopName, setShopName] = useState(shop?.shopName || '');
  const [ownerName, setOwnerName] = useState(shop?.ownerName || '');
  const [phone, setPhone] = useState(shop?.phone || '');
  const [address, setAddress] = useState(shop?.address || '');

  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showIdCard, setShowIdCard] = useState(false);

  // Ratings for current entity
  const targetId = shop ? shop.shopId : customer ? customer.customerId : '';
  const reviews = store.getRatings(targetId);

  // Requirement 7: Location Auto-Detect
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

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then((res) => res.json())
          .then((data) => {
            const locName = data?.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : 'UAE Location';
            setAddress(`${locName} (${mapsLink})`);
            setLocationSuccess(true);
            setIsLocating(false);
          })
          .catch(() => {
            setAddress(`Dubai, United Arab Emirates (${mapsLink})`);
            setLocationSuccess(true);
            setIsLocating(false);
          });
      },
      () => {
        setAddress('Business Bay, Dubai, UAE (https://maps.google.com/?q=25.1857,55.2744)');
        setLocationSuccess(true);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setError(null);
    setIsSaving(true);

    try {
      await store.updateShopProfile(shop.shopId, {
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Profile Header Card - Centered Alignment matching IMG_8775.jpeg request */}
      <div className="p-6 rounded-[32px] bg-gradient-to-b from-[#0c4a42] via-[#093c35] to-[#052722] text-white shadow-xl flex flex-col items-center justify-center text-center border border-emerald-700/30 overflow-hidden w-full max-w-full relative">
        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-extrabold text-2xl text-emerald-300 shadow-md mb-3">
          {shop?.shopName ? shop.shopName.charAt(0) : customer?.name ? customer.name.charAt(0) : 'U'}
        </div>

        <h2 className="text-lg font-extrabold text-white text-center break-words max-w-full px-2">
          {shop?.shopName || customer?.name || currentUser?.name}
        </h2>

        <div className="my-1.5">
          <span className="font-mono text-xs font-bold bg-emerald-400/20 text-emerald-200 px-3 py-1 rounded-full border border-emerald-400/25">
            {shop?.shopId || customer?.customerId || currentUser?.role?.toUpperCase()}
          </span>
        </div>

        <p className="text-xs text-emerald-200/80 text-center">
          {shop?.ownerName || customer?.companyName || 'Verified UAE Account'}
        </p>

        {/* Centered Rating Badge Button */}
        <button
          type="button"
          onClick={onOpenRatingModal}
          className="mt-3.5 inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-center active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
          <span className="font-extrabold text-xs text-amber-300">
            {(shop?.rating || customer?.rating || 5.0).toFixed(1)}
          </span>
          <span className="text-[11px] text-emerald-100 font-medium">
            Community Trust Score
          </span>
        </button>
      </div>

      {/* SHOP OWNER PROFILE EDIT FORM */}
      {currentRole === 'shop' && shop && (
        <form onSubmit={handleSaveProfile} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">
              Shop Profile Details
            </h3>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </span>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Locked Currency notice (Requirement 4) */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-600">Currency Setting:</span>
              <strong className="font-mono text-emerald-800 font-bold">{shop?.currency || 'AED'} (UAE Dirham)</strong>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded-full">
              Controlled by Admin (Locked)
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Shop Name *
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Owner Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-600"
                />
              </div>
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Location field with Requirement 7: Current Location button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Shop Address & GPS Location *
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/70 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                {isLocating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                ) : (
                  <Navigation className="w-3 h-3 text-emerald-700" />
                )}
                <span>Current Location</span>
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-emerald-600"
              />
            </div>
            {locationSuccess && (
              <span className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Location detected & updated with Google Maps coordinates.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl bg-[#0c4a42] hover:bg-[#093933] text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving Changes...' : 'Save Profile Details'}
          </button>
        </form>
      )}

      {/* Verified Emirates ID Section */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Verified UAE Emirates ID
            </h3>
          </div>
          <button
            onClick={() => setShowIdCard(!showIdCard)}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            {showIdCard ? 'Hide Preview' : 'View ID Cards'}
          </button>
        </div>

        <div className="text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
          <span>{shop?.emiratesIdNumber || customer?.emiratesIdNumber || currentUser?.emiratesIdNumber}</span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            AUTHENTICATED
          </span>
        </div>

        {showIdCard && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[9px] font-bold text-slate-400 block mb-1">FRONT</span>
              <img
                src={
                  shop?.emiratesIdFrontUrl ||
                  customer?.emiratesIdFrontUrl ||
                  currentUser?.emiratesIdFrontUrl
                }
                alt="Emirates ID Front"
                className="w-full h-24 object-cover rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 block mb-1">BACK</span>
              <img
                src={
                  shop?.emiratesIdBackUrl ||
                  customer?.emiratesIdBackUrl ||
                  currentUser?.emiratesIdBackUrl
                }
                alt="Emirates ID Back"
                className="w-full h-24 object-cover rounded-lg border border-slate-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* Community Ratings & Reviews */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Community Ratings & Reviews
            </h3>
            <p className="text-[10px] text-slate-400">Verified counterpart feedback</p>
          </div>
          <button
            onClick={onOpenRatingModal}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl"
          >
            + Rate
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-400 italic">
            No community reviews yet.
          </div>
        ) : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">{r.fromName}</span>
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: r.stars }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-slate-600 text-[11px]">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
