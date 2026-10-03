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
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-lavender-100 bg-white text-left shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
    >
      <button onClick={onClick} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-lavender-50">
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
            className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-soft ${
              isAvailable ? 'bg-mint-500' : 'bg-gray-400'
            }`}
          >
            {isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
          </div>
          {!isAvailable && (
            <div className="absolute inset-0 bg-gray-900/30" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-1 text-sm font-semibold text-gray-800 group-hover:text-lavender-600">
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
            <span className="text-base font-bold text-lavender-600">
              {formatPrice(item.pricePerDay, item.pricingType)}
            </span>
            <span className="rounded-full bg-lavender-50 px-2.5 py-0.5 text-xs font-medium text-lavender-600">{item.category}</span>
          </div>
        </div>
      </button>
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 translate-y-8 items-center justify-center rounded-full bg-white/90 shadow-soft transition-all hover:bg-white"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          />
        </button>
      )}
    </div>
  );
}
