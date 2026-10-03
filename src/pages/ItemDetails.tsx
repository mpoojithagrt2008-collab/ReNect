import { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  User,
  Tag,
  Calendar,
  MessageSquare,
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { Item } from '../types';
import { useApp } from '../store';
import { VerifiedBadge, ConditionBadge, formatPrice } from '../components/ui';

interface Props {
  item: Item;
  onBack: () => void;
}

export function ItemDetails({ item, onBack }: Props) {
  const { user, addRequest, deleteListing } = useApp();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isOwnItem = item.ownerId === user?.id;
  const isAvailable = item.availability === 'available';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await addRequest({
      listingId: item.id,
      ownerId: item.ownerId,
      startDate,
      endDate,
      message,
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSubmitted(true);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteListing(item.id);
    setDeleting(false);
    if (result.success) {
      setShowDeleteConfirm(false);
      onBack();
    } else {
      setDeleteError(result.message ?? 'Unable to delete item.');
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Explore
        </button>
        <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm md:p-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Request Sent</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Your request to borrow <span className="font-semibold text-gray-700">{item.name}</span> from{' '}
            <span className="font-semibold text-gray-700">{item.ownerName}</span> has been sent.
            You'll be notified once they respond.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={onBack}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Continue Exploring
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
          <img src={item.image} alt={item.name} className="aspect-[4/3] w-full object-cover" />
          <div
            className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm ${
              isAvailable ? 'bg-emerald-500' : 'bg-gray-500'
            }`}
          >
            {isAvailable ? 'Available' : 'Unavailable'}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <ConditionBadge condition={item.condition} />
              <span className="text-xs text-gray-400">{item.category}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
              {item.name}
            </h1>
          </div>

          <div className="rounded-xl bg-emerald-50 px-4 py-3">
            <span className="text-2xl font-bold text-emerald-600">
              {formatPrice(item.pricePerDay)}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>

          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4.5 w-4.5 text-gray-400" />
              <span className="text-gray-500">Location</span>
              <span className="ml-auto font-medium text-gray-900">{item.location}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Tag className="h-4.5 w-4.5 text-gray-400" />
              <span className="text-gray-500">Condition</span>
              <span className="ml-auto font-medium text-gray-900">{item.condition}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4.5 w-4.5 text-gray-400" />
              <span className="text-gray-500">Owner</span>
              <span className="ml-auto flex items-center gap-1.5 font-medium text-gray-900">
                {item.ownerName}
                <VerifiedBadge verified={item.verified} />
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {isOwnItem ? (
            <>
              <div
                className={`rounded-xl border px-4 py-3 text-center text-sm font-medium ${
                  isAvailable
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                {isAvailable
                  ? 'This item is available for rent'
                  : 'This item is currently rented out'}
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Delete Listing
              </button>
            </>
          ) : !isAvailable ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500">
              <XCircle className="h-4 w-4 text-gray-400" />
              This item is currently unavailable
            </div>
          ) : showRequestForm ? (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-xl border border-gray-200 bg-white p-4"
            >
              <h3 className="text-sm font-semibold text-gray-900">Request to Borrow</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-2 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-2 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Message to owner
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Hi! I'd like to borrow this for..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending request...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowRequestForm(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              Request to Borrow
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            {deleteError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-xs text-red-600">{deleteError}</p>
              </div>
            )}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Delete this item?</h2>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to permanently delete <span className="font-semibold text-gray-700">{item.name}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-200 transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
