import { Heart, Star } from 'lucide-react';
import { VerifiedBadge, ConditionBadge, formatPrice, formatOwnerName } from './ui';
import type { Item, ListingRating } from '../types';

interface Props {
  item: Item;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  rating?: ListingRating | null;
}

export function ItemCard({ item, onClick, isFavorite, onToggleFavorite, rating }: Props) {
  const isAvailable = item.availability === 'available';

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100/50 hover:border-emerald-200"
    >
      <button onClick={onClick} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <ConditionBadge condition={item.condition} />
          </div>
          <div
            className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-sm ${
              isAvailable ? 'bg-emerald-500' : 'bg-gray-500'
            }`}
          >
            {isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
          </div>
          {!isAvailable && (
            <div className="absolute inset-0 bg-gray-900/30" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 group-hover:text-emerald-700">
            {item.name}
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">by {formatOwnerName(item.ownerName, item.ownerStudentId)}</span>
            <VerifiedBadge verified={item.verified} />
          </div>
          {rating && rating.reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3 w-3 ${s <= Math.round(rating.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-gray-500">
                {rating.averageRating.toFixed(1)} ({rating.reviewCount})
              </span>
            </div>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-base font-bold text-emerald-600">
              {formatPrice(item.pricePerDay, item.pricingType)}
            </span>
            <span className="text-xs text-gray-400">{item.category}</span>
          </div>
        </div>
      </button>
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:bg-white"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          />
        </button>
      )}
    </div>
  );
}
