import { useState, useEffect } from 'react';
import {
  ArrowLeft, MapPin, User, Tag, Calendar, MessageSquare, Send, CheckCircle2, Loader2, AlertCircle, Trash2, XCircle, Heart, Clock,
} from 'lucide-react';
import type { Item } from '../types';
import { useApp } from '../store';
import { VerifiedBadge, ConditionBadge, formatPrice, StarRatingDisplay, formatOwnerName, formatRentalDuration } from '../components/ui';

interface Props { item: Item; onBack: () => void; }

type DurationPreset = '1h' | '2h' | '3h' | '12h' | '1d' | 'custom';

const PRESET_LABELS: Record<DurationPreset, string> = {
  '1h': '1 Hour',
  '2h': '2 Hours',
  '3h': '3 Hours',
  '12h': '12 Hours',
  '1d': '1 Day',
  custom: 'Custom',
};

function formatDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplayDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function ItemDetails({ item, onBack }: Props) {
  const { user, addRequest, deleteListing, favoriteIds, toggleFavorite, ratingsMap, fetchRating, reviews, fetchReviews } = useApp();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationPreset, setDurationPreset] = useState<DurationPreset>('1h');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isOwnItem = item.ownerId === user?.id;
  const isAvailable = item.availability === 'available';
  const isFavorite = favoriteIds.has(item.id);
  const rating = ratingsMap[item.id];

  // When a preset is selected, auto-calculate start (now) and end times
  useEffect(() => {
    if (durationPreset === 'custom') return;
    const now = new Date();
    const end = new Date(now);
    if (durationPreset === '1h') end.setHours(end.getHours() + 1);
    else if (durationPreset === '2h') end.setHours(end.getHours() + 2);
    else if (durationPreset === '3h') end.setHours(end.getHours() + 3);
    else if (durationPreset === '12h') end.setHours(end.getHours() + 12);
    else if (durationPreset === '1d') end.setDate(end.getDate() + 1);
    setStartDate(formatDateTimeLocal(now));
    setEndDate(formatDateTimeLocal(end));
  }, [durationPreset]);

  const rentalDurationHours = (() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate); const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return 0;
    return Math.round(diffMs / (1000 * 60 * 60));
  })();

  const rentalDurationLabel = (() => {
    if (rentalDurationHours <= 0) return '—';
    if (rentalDurationHours < 24) return `${rentalDurationHours} ${rentalDurationHours === 1 ? 'Hour' : 'Hours'}`;
    const days = Math.ceil(rentalDurationHours / 24);
    return `${days} ${days === 1 ? 'Day' : 'Days'}`;
  })();

  const rentalTotal = (() => {
    if (rentalDurationHours <= 0) return 0;
    if (rentalDurationHours < 24) {
      // Use hourly rate if available, otherwise fall back to daily rate prorated
      if (item.pricePerHour > 0) return rentalDurationHours * item.pricePerHour;
      return Math.ceil(rentalDurationHours / 24) * item.pricePerDay;
    }
    const days = Math.ceil(rentalDurationHours / 24);
    return days * item.pricePerDay;
  })();

  const rateLabel = (() => {
    if (item.pricePerHour > 0 && rentalDurationHours < 24) return `₹${item.pricePerHour}/hour`;
    return `₹${item.pricePerDay}/day`;
  })();

  useEffect(() => { fetchRating(item.id); fetchReviews(item.id); }, [item.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSubmitting(true);
    const startISO = new Date(startDate).toISOString();
    const endISO = new Date(endDate).toISOString();
    const result = await addRequest({ listingId: item.id, ownerId: item.ownerId, startDate: startISO, endDate: endISO, message });
    setSubmitting(false);
    if (result.error) { setError(result.error); } else { setSubmitted(true); }
  };

  const handleDelete = async () => {
    setDeleting(true); setDeleteError(null);
    const result = await deleteListing(item.id);
    setDeleting(false);
    if (result.success) { setShowDeleteConfirm(false); onBack(); }
    else { setDeleteError(result.message ?? 'Unable to delete item.'); }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <button onClick={onBack} className="mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to Explore
        </button>
        <div className="flex flex-col items-center justify-center rounded-4xl border border-lavender-100 bg-white p-8 text-center shadow-card md:p-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint-50"><CheckCircle2 className="h-8 w-8 text-mint-600" /></div>
          <h2 className="text-xl font-bold text-gray-800">Request Sent</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Your request to borrow <span className="font-semibold text-gray-700">{item.name}</span> from{' '}
            <span className="font-semibold text-gray-700">{formatOwnerName(item.ownerName, item.ownerStudentId)}</span> has been sent. You'll be notified once they respond.
          </p>
          <div className="mt-6 flex gap-3">
            <button onClick={onBack} className="rounded-2xl border border-lavender-100 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-lavender-50">Continue Exploring</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <button onClick={onBack} className="mb-5 flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-lavender-100 bg-lavender-50">
          <img src={item.image} alt={item.name} className="aspect-[4/3] w-full object-cover" />
          <div className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white shadow-soft ${isAvailable ? 'bg-mint-500' : 'bg-gray-500'}`}>
            {isAvailable ? 'Available' : 'Unavailable'}
          </div>
          {!isOwnItem && (
            <button onClick={() => toggleFavorite(item.id)} className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-soft transition-all hover:bg-white">
              <Heart className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <ConditionBadge condition={item.condition} />
              <span className="text-xs text-gray-400">{item.category}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800 md:text-2xl">{item.name}</h1>
            {rating && rating.reviewCount > 0 && (
              <div className="mt-2"><StarRatingDisplay rating={rating.averageRating} count={rating.reviewCount} /></div>
            )}
          </div>

          <div className="rounded-2xl bg-lavender-50 px-4 py-3">
            <span className="text-2xl font-bold text-lavender-600">{formatPrice(item.pricePerDay, item.pricingType, item.pricePerHour)}</span>
          </div>

          <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>

          <div className="space-y-3 rounded-2xl border border-lavender-100 bg-white p-4 shadow-card">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4.5 w-4.5 text-lavender-400" />
              <span className="text-gray-400">Location</span>
              <span className="ml-auto font-medium text-gray-800">{item.location}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Tag className="h-4.5 w-4.5 text-lavender-400" />
              <span className="text-gray-400">Condition</span>
              <span className="ml-auto font-medium text-gray-800">{item.condition}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4.5 w-4.5 text-lavender-400" />
              <span className="text-gray-400">Owner</span>
              <span className="ml-auto flex items-center gap-1.5 font-medium text-gray-800">
                {formatOwnerName(item.ownerName, item.ownerStudentId)} <VerifiedBadge verified={item.verified} />
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {isOwnItem ? (
            <>
              <div className={`rounded-2xl border px-4 py-3 text-center text-sm font-medium ${isAvailable ? 'border-mint-200 bg-mint-50 text-mint-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                {isAvailable ? 'This item is available for rent' : 'This item is currently rented out'}
              </div>
              <button onClick={() => setShowDeleteConfirm(true)} disabled={deleting}
                className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60">
                <Trash2 className="h-4 w-4" /> Delete Listing
              </button>
            </>
          ) : !isAvailable ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-400">
              <XCircle className="h-4 w-4 text-gray-400" /> This item is currently unavailable
            </div>
          ) : showRequestForm ? (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-lavender-100 bg-white p-4 shadow-card">
              <h3 className="text-sm font-semibold text-gray-800">Request to Borrow</h3>

              {/* Duration preset selection */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">Select Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1h', '2h', '3h', '12h', '1d', 'custom'] as DurationPreset[]).map((preset) => (
                    <button key={preset} type="button" onClick={() => setDurationPreset(preset)}
                      className={`rounded-xl border-2 px-3 py-2 text-xs font-medium transition-all ${durationPreset === preset
                        ? 'border-lavender-300 bg-lavender-50 text-lavender-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                      {PRESET_LABELS[preset]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom date/time pickers */}
              {durationPreset === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">From: Date + Time</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lavender-400" />
                      <input type="datetime-local" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-lavender-100 bg-lavender-50/40 py-2 pl-9 pr-2 text-sm text-gray-800 outline-none focus:border-lavender-400 focus:bg-white focus:ring-2 focus:ring-lavender-100" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">To: Date + Time</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lavender-400" />
                      <input type="datetime-local" required value={endDate} onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-lavender-100 bg-lavender-50/40 py-2 pl-9 pr-2 text-sm text-gray-800 outline-none focus:border-lavender-400 focus:bg-white focus:ring-2 focus:ring-lavender-100" />
                    </div>
                  </div>
                </div>
              )}

              {/* Rental period summary */}
              {rentalDurationHours > 0 && (
                <div className="rounded-xl bg-lavender-50 px-3 py-3 text-xs">
                  <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <Clock className="h-4 w-4 text-lavender-500" /> Rental Duration: {rentalDurationLabel}
                  </div>
                  <div className="flex items-center justify-between"><span className="text-gray-500">From</span><span className="font-medium text-gray-800">{formatDisplayDateTime(startDate)}</span></div>
                  <div className="mt-1 flex items-center justify-between"><span className="text-gray-500">To</span><span className="font-medium text-gray-800">{formatDisplayDateTime(endDate)}</span></div>
                  <div className="mt-1.5 flex items-center justify-between"><span className="text-gray-500">Rate</span><span className="font-medium text-gray-800">{rateLabel}</span></div>
                  <div className="mt-1.5 flex items-center justify-between border-t border-lavender-200 pt-1.5"><span className="font-semibold text-gray-700">Estimated Price</span><span className="text-base font-bold text-lavender-600">₹{rentalTotal}</span></div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Message to owner</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-lavender-400" />
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Hi! I'd like to borrow this for..."
                    className="w-full rounded-xl border border-lavender-100 bg-lavender-50/40 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none focus:border-lavender-400 focus:bg-white focus:ring-2 focus:ring-lavender-100" />
                </div>
              </div>
              <button type="submit" disabled={submitting || rentalDurationHours <= 0}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 py-2.5 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50">
                {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending request...</>) : (<><Send className="h-4 w-4" /> Submit Request</>)}
              </button>
            </form>
          ) : (
            <button onClick={() => setShowRequestForm(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 py-3 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg active:scale-[0.98]">
              Request to Borrow
            </button>
          )}

          {/* Reviews section */}
          {reviews.length > 0 && (
            <div className="rounded-2xl border border-lavender-100 bg-white p-4 shadow-card">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Reviews ({reviews.length})</h3>
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-lavender-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">
                        {formatOwnerName(review.reviewerName, review.reviewerStudentId)}
                      </span>
                      <div className="flex items-center" title={`${review.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg key={s} className={`h-3 w-3 ${s <= review.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 0 0-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    {review.feedback && <p className="mt-1.5 text-xs text-gray-600">{review.feedback}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-4xl bg-white p-6 shadow-soft-lg">
            {deleteError && (
              <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-xs text-red-600">{deleteError}</p>
              </div>
            )}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50"><Trash2 className="h-6 w-6 text-red-500" /></div>
            <h2 className="text-lg font-bold text-gray-800">Delete this item?</h2>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to permanently delete <span className="font-semibold text-gray-700">{item.name}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={handleDelete} disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-50">
                {deleting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>) : 'Yes, Delete'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                className="rounded-2xl border border-lavender-100 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-lavender-50 disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
