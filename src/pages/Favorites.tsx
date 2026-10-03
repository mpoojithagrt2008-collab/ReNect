import { useState, useEffect } from 'react';
import { Heart, Package, Loader2 } from 'lucide-react';
import { useApp } from '../store';
import { ItemCard } from '../components/ItemCard';
import type { Page } from '../components/Navigation';

interface Props {
  navigate: (p: Page) => void;
}

export function Favorites({ navigate }: Props) {
  const { items, favorites, favoriteIds, toggleFavorite, ratingsMap, itemsLoading, setSelectedItemId } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemsLoading) setLoading(false);
  }, [itemsLoading]);

  const favoriteItems = favorites
    .map((fav) => items.find((i) => i.id === fav.listingId))
    .filter((i): i is NonNullable<typeof i> => i !== undefined);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-center gap-2">
        <Heart className="h-6 w-6 text-red-500" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Favorites</h1>
          <p className="text-sm text-gray-500">Items you've saved for later</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : favoriteItems.length > 0 ? (
        <>
          <div className="mb-3 text-sm text-gray-500">
            {favoriteItems.length} {favoriteItems.length === 1 ? 'item' : 'items'}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {favoriteItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => { setSelectedItemId(item.id); navigate('explore'); }}
                isFavorite={true}
                onToggleFavorite={() => toggleFavorite(item.id)}
                rating={ratingsMap[item.id] || null}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <Heart className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No favorites yet</h3>
          <p className="mt-1 max-w-xs text-sm text-gray-500">
            Tap the heart icon on any item to save it here for later.
          </p>
          <button
            onClick={() => navigate('explore')}
            className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700"
          >
            <Package className="h-4 w-4" />
            Explore Items
          </button>
        </div>
      )}
    </div>
  );
}
