import type { Condition } from '../types';

const CONDITION_STYLES: Record<Condition, string> = {
  New: 'bg-mint-100 text-mint-700 ring-mint-200',
  'Like New': 'bg-babyblue-100 text-babyblue-700 ring-babyblue-200',
  Good: 'bg-lavender-100 text-lavender-700 ring-lavender-200',
  Fair: 'bg-amber-100 text-amber-700 ring-amber-200',
};

export function ConditionBadge({ condition }: { condition: Condition }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${CONDITION_STYLES[condition]}`}
    >
      {condition}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-babyblue-50 px-2 py-0.5 text-xs font-medium text-babyblue-600">
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M6.267 1.456a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 .75.75v.75h1.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-.15l-.55 6.712a2.25 2.25 0 0 1-2.244 2.075H7.09a2.25 2.25 0 0 1-2.244-2.075l-.55-6.712H4.5a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1 .75-.75h1.5v-.75Zm5.25 3.75a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0v-4.5Z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </span>
  );
}

export function formatPrice(pricePerDay: number, pricingType: 'hour' | 'day' = 'day'): string {
  if (pricePerDay === 0) return 'Free';
  return `₹${pricePerDay}/${pricingType === 'hour' ? 'hour' : 'day'}`;
}

export function formatOwnerName(name: string, studentId: string): string {
  if (!studentId) return name;
  return `${name} (${studentId})`;
}

export function formatRentalDuration(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '—';
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  return `${days} ${days === 1 ? 'Day' : 'Days'}`;
}

export function StarRatingDisplay({ rating, count, size = 'h-4 w-4' }: { rating: number; count?: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${size} ${star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 0 0-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.366-2.446a1 1 0 0 0-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 0 0-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.286-3.957Z" />
          </svg>
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs font-medium text-gray-500">
          {rating.toFixed(1)} ⭐ ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </span>
  );
}
