import React, { useState } from 'react';
import { X, Star, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { store } from '../../services/store';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId?: string; // target shopId or customerId
  targetName?: string;
  targetRole?: 'shop' | 'customer';
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetName,
  targetRole,
}) => {
  const { currentUser } = useAuth();
  const [stars, setStars] = useState(5);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  // Determine who is being rated
  const defaultTargetId = targetId || (currentUser.role === 'customer' ? (currentUser.shopId || 'SHOP1001') : 'CUST1001');
  const defaultTargetName = targetName || (currentUser.role === 'customer' ? 'Al Barsha Gourmet Grocery' : 'Hamdan Mohammed');
  const defaultTargetRole = targetRole || (currentUser.role === 'customer' ? 'shop' : 'customer');

  // Existing reviews for target
  const existingReviews = store.getRatings(defaultTargetId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await store.addRating({
        fromUid: currentUser.uid,
        fromRole: currentUser.role,
        fromName: currentUser.name,
        toUid: defaultTargetId,
        toRole: defaultTargetRole,
        targetId: defaultTargetId,
        stars,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1200);
    } catch {
      // Ignored
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
              <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">5-Star Rating & Reviews</h2>
              <p className="text-[11px] text-emerald-200">UAE Community Trust Score</p>
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
        <div className="p-5 max-h-[80vh] overflow-y-auto space-y-4">
          {submitted ? (
            <div className="text-center py-6 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Rating Submitted!</h3>
              <p className="text-xs text-slate-500">Thank you for rating {defaultTargetName}.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center pb-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Rate your experience with
                </div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">
                  {defaultTargetName}
                </div>
              </div>

              {/* Star Rating Selector */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((s) => {
                  const active = (hoverStars !== null ? hoverStars : stars) >= s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverStars(s)}
                      onMouseLeave={() => setHoverStars(null)}
                      onClick={() => setStars(s)}
                      className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          active
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200 fill-slate-100'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="text-center text-xs font-bold text-amber-600">
                {stars === 5 && 'Outstanding & Trusted ★★★★★'}
                {stars === 4 && 'Very Good ★★★★☆'}
                {stars === 3 && 'Good / Average ★★★☆☆'}
                {stars === 2 && 'Needs Improvement ★★☆☆☆'}
                {stars === 1 && 'Poor Experience ★☆☆☆☆'}
              </div>

              {/* Feedback Note */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Review Comment (Optional)
                </label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share feedback on payment punctuality, customer service, or khata accuracy..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#0c4a42] hover:bg-[#093933] text-white font-bold text-xs shadow-md transition-colors"
              >
                Submit Rating
              </button>
            </form>
          )}

          {/* Existing Community Reviews */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-800 mb-2">
              Recent Feedback ({existingReviews.length})
            </div>
            {existingReviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No feedback submitted yet.</p>
            ) : (
              <div className="space-y-2">
                {existingReviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
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
      </div>
    </div>
  );
};
