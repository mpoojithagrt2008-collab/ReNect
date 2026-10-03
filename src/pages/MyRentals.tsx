import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../store';
import type { Page } from '../components/Navigation';
import type { BorrowRequest, RequestStatus } from '../types';
import { RatingReview } from '../components/RatingReview';

interface Props {
  navigate: (p: Page) => void;
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-red-50 text-red-600 ring-red-200',
  completed: 'bg-teal-50 text-teal-700 ring-teal-200',
};

const STATUS_ICONS: Record<RequestStatus, typeof Clock> = {
  pending: Clock,
  accepted: CheckCircle2,
  rejected: XCircle,
  completed: CheckCircle2,
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MyRentals({ navigate }: Props) {
  const { requests, user, setActiveChatRequestId, reviewedRequestIds, submitReview } = useApp();
  const [reviewingReq, setReviewingReq] = useState<BorrowRequest | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const myRequests = requests.filter((r) => r.requesterId === user?.id);
  const activeRentals = myRequests.filter((r) => r.status === 'pending' || r.status === 'accepted');
  const completedRentals = myRequests.filter((r) => r.status === 'completed');
  const rejectedRentals = myRequests.filter((r) => r.status === 'rejected');

  const handleReviewSubmit = async (rating: number, feedback: string) => {
    if (!reviewingReq) return;
    setReviewError(null);
    const result = await submitReview(reviewingReq.id, reviewingReq.listingId, rating, feedback);
    if (result.error) {
      setReviewError(result.error);
    } else {
      setReviewSuccess('Review submitted successfully!');
      setTimeout(() => setReviewSuccess(null), 3000);
      setReviewingReq(null);
    }
  };

  const RentalCard = ({ req }: { req: BorrowRequest }) => {
    const StatusIcon = STATUS_ICONS[req.status];
    const canReview = req.status === 'completed' && !reviewedRequestIds.has(req.id);
    const hasReviewed = req.status === 'completed' && reviewedRequestIds.has(req.id);

    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm sm:flex-row sm:items-center">
        <img src={req.itemImage} alt={req.itemName} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900">{req.itemName}</h3>
          <p className="text-xs text-gray-500">From {req.ownerName}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
            <span>{formatDate(req.startDate)} → {formatDate(req.endDate)}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ring-inset ${STATUS_STYLES[req.status]}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {req.status}
          </div>
          {req.status === 'accepted' && (
            <button
              onClick={() => { setActiveChatRequestId(req.id); navigate('messages'); }}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Chat
            </button>
          )}
          {canReview && (
            <button
              onClick={() => setReviewingReq(req)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
            >
              <Star className="h-3.5 w-3.5" /> Rate
            </button>
          )}
          {hasReviewed && (
            <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Reviewed
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">My Rentals</h1>
      <p className="mb-6 text-sm text-gray-500">Track your borrow requests and active rentals</p>

      {reviewSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-xs text-emerald-700">{reviewSuccess}</p>
        </div>
      )}

      {myRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CalendarCheck className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No rentals yet</h3>
          <p className="mt-1 max-w-xs text-sm text-gray-500">Browse items on campus and send a borrow request to get started.</p>
          <button onClick={() => navigate('explore')} className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700">
            Explore Items
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeRentals.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-700">Active ({activeRentals.length})</h2>
              <div className="space-y-3">{activeRentals.map((req) => <RentalCard key={req.id} req={req} />)}</div>
            </div>
          )}
          {completedRentals.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-700">Completed ({completedRentals.length})</h2>
              <div className="space-y-3">{completedRentals.map((req) => <RentalCard key={req.id} req={req} />)}</div>
            </div>
          )}
          {rejectedRentals.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-700">Rejected ({rejectedRentals.length})</h2>
              <div className="space-y-3">{rejectedRentals.map((req) => <RentalCard key={req.id} req={req} />)}</div>
            </div>
          )}
        </div>
      )}

      {reviewingReq && (
        <RatingReview
          itemName={reviewingReq.itemName}
          ownerName={reviewingReq.ownerName}
          onSubmit={handleReviewSubmit}
          onClose={() => { setReviewingReq(null); setReviewError(null); }}
        />
      )}

      {reviewError && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-red-200 bg-white px-4 py-3 shadow-lg">
          <p className="text-xs text-red-600">{reviewError}</p>
        </div>
      )}
    </div>
  );
}
