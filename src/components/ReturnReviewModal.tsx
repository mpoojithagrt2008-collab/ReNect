import { useState, useEffect } from 'react';
import {
  X, Loader2, AlertCircle, CheckCircle2, Package, User, Calendar, Clock,
} from 'lucide-react';
import { useApp } from '../store';
import type { ReturnRecord, BorrowRequest, UserProfile, ReturnCondition } from '../types';
import { formatOwnerName, formatRentalDuration } from './ui';

interface Props {
  returnId: string;
  onClose: () => void;
}

const CONDITION_LABELS: Record<ReturnCondition, string> = {
  good: 'Good condition',
  minor_damage: 'Minor damage',
  damaged: 'Damaged',
};

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function ReturnReviewModal({ returnId, onClose }: Props) {
  const { getReturnDetails, confirmReturn } = useApp();
  const [loading, setLoading] = useState(true);
  const [returnRecord, setReturnRecord] = useState<ReturnRecord | null>(null);
  const [request, setRequest] = useState<BorrowRequest | null>(null);
  const [renterProfile, setRenterProfile] = useState<UserProfile | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [photoEnlarged, setPhotoEnlarged] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getReturnDetails(returnId).then((details) => {
      if (!mounted) return;
      setReturnRecord(details.returnRecord);
      setRequest(details.request);
      setRenterProfile(details.renterProfile);
      setPhotoUrl(details.photoUrl);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [returnId, getReturnDetails]);

  const handleConfirm = async () => {
    if (confirming || !returnRecord) return;
    setConfirming(true);
    setError(null);
    const result = await confirmReturn(returnRecord.id);
    setConfirming(false);
    if (result.error) {
      setError(result.error);
    } else {
      setConfirmed(true);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 shadow-xl">
          <Loader2 className="h-8 w-8 animate-spin text-lavender-500" />
          <p className="text-sm text-gray-500">Loading return details...</p>
        </div>
      </div>
    );
  }

  if (!returnRecord) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-red-600">Return record not found.</p>
          </div>
          <button onClick={onClose} className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mint-50">
            <CheckCircle2 className="h-7 w-7 text-mint-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Return Confirmed</h2>
          <p className="mt-2 text-sm text-gray-500">
            Return successfully confirmed. The item is now available for rent.
          </p>
          <button onClick={onClose} className="mt-6 w-full rounded-xl bg-mint-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-mint-200 transition-all hover:bg-mint-700">
            Done
          </button>
        </div>
      </div>
    );
  }

  const isAlreadyReviewed = returnRecord.status === 'reviewed';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
            <h2 className="text-lg font-bold text-gray-900">Return Review</h2>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5 px-6 py-5">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Product info */}
            {request && (
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                {request.itemImage && (
                  <img src={request.itemImage} alt={request.itemName} className="h-14 w-14 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Package className="h-3.5 w-3.5" /> Product
                  </div>
                  <p className="truncate text-sm font-semibold text-gray-900">{request.itemName}</p>
                </div>
              </div>
            )}

            {/* Renter info */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Rented By</span>
                <span className="ml-auto font-medium text-gray-900">
                  {renterProfile ? formatOwnerName(renterProfile.fullName, renterProfile.studentId) : 'Unknown'}
                </span>
              </div>
              {request && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Rental Duration</span>
                    <span className="ml-auto font-medium text-gray-900">{formatRentalDuration(request.startDate, request.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDateTime(request.startDate)} → {formatDateTime(request.endDate)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Return photo */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Return Photo</label>
              {photoUrl ? (
                <button type="button" onClick={() => setPhotoEnlarged(true)} className="relative overflow-hidden rounded-xl border border-gray-200 transition-all hover:opacity-90">
                  <img src={photoUrl} alt="Return proof" className="aspect-[4/3] w-full object-cover" />
                  <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-medium text-white">Tap to enlarge</span>
                </button>
              ) : (
                <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-8 text-sm text-gray-400">
                  No photo available
                </div>
              )}
            </div>

            {/* Return condition */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Condition Reported</label>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                returnRecord.returnCondition === 'good' ? 'bg-mint-50 text-mint-700' :
                returnRecord.returnCondition === 'minor_damage' ? 'bg-amber-50 text-amber-700' :
                'bg-red-50 text-red-600'
              }`}>
                {CONDITION_LABELS[returnRecord.returnCondition]}
              </span>
            </div>

            {/* Renter's review */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Renter's Review</label>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-sm text-gray-700">
                  {returnRecord.returnNote || 'No review provided.'}
                </p>
              </div>
            </div>

            {/* Submitted time */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Submitted: {formatDateTime(returnRecord.createdAt)}</span>
            </div>

            {/* Confirm button */}
            {!isAlreadyReviewed ? (
              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-mint-600 py-3 text-sm font-semibold text-white shadow-md shadow-mint-200 transition-all hover:bg-mint-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {confirming ? (<><Loader2 className="h-4 w-4 animate-spin" /> Confirming...</>) : <><CheckCircle2 className="h-4 w-4" /> Confirm Return</>}
                </button>
                <p className="mt-2 text-center text-[11px] text-gray-400">
                  Confirming this means you have received and reviewed the returned item.
                </p>
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-center gap-2 rounded-xl bg-mint-50 py-3 text-sm font-medium text-mint-700">
                  <CheckCircle2 className="h-4 w-4" /> Return already confirmed
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enlarged photo overlay */}
      {photoEnlarged && photoUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setPhotoEnlarged(false)}>
          <button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="h-6 w-6" />
          </button>
          <img src={photoUrl} alt="Return proof enlarged" className="max-h-[90vh] max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}
