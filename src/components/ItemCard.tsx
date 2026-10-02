import { VerifiedBadge, ConditionBadge, formatPrice } from './ui';
import type { Item } from '../types';

interface Props {
  item: Item;
  onClick: () => void;
}

export function ItemCard({ item, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100/50 hover:border-emerald-200"
    >
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
        {item.pricePerDay === 0 && (
          <div className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
            FREE
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 group-hover:text-emerald-700">
          {item.name}
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">by {item.ownerName}</span>
          <VerifiedBadge verified={item.verified} />
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-bold text-emerald-600">
            {formatPrice(item.pricePerDay)}
          </span>
          <span className="text-xs text-gray-400">{item.category}</span>
        </div>
      </div>
    </button>
  );
}
