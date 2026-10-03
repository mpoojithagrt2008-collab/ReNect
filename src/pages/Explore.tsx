import { useState, useMemo } from 'react';
import { Search, Loader2, Package } from 'lucide-react';
import { useApp } from '../store';
import { CATEGORIES } from '../data';
import { ItemCard } from '../components/ItemCard';
import { ItemDetails } from './ItemDetails';

export function Explore() {
  const { exploreItems, itemsLoading, selectedItemId, setSelectedItemId, favoriteIds, toggleFavorite, ratingsMap } = useApp();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const selectedItem = useMemo(
    () => exploreItems.find((i) => i.id === selectedItemId) ?? null,
    [exploreItems, selectedItemId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exploreItems.filter((item) => {
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exploreItems, search, activeCategory]);

  if (selectedItem) {
    return <ItemDetails item={selectedItem} onBack={() => setSelectedItemId(null)} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-800">Explore</h1>
      <p className="mb-5 text-sm text-gray-400">Discover items available on campus</p>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-lavender-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="w-full rounded-2xl border border-lavender-100 bg-white py-3 pl-12 pr-4 text-sm text-gray-800 outline-none transition-all focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100"
        />
      </div>

      <div className="no-scrollbar mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        {['All', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-lavender-500 to-lavender-600 text-white shadow-soft'
                : 'border border-lavender-100 bg-white text-gray-500 hover:border-lavender-200 hover:text-lavender-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {itemsLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-lavender-500" />
          <p className="text-sm text-gray-400">Loading items...</p>
        </div>
      ) : (
        <>
          <div className="mb-3 text-sm text-gray-400">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'} found
          </div>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItemId(item.id)}
                  isFavorite={favoriteIds.has(item.id)}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                  rating={ratingsMap[item.id] || null}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lavender-50">
                <Package className="h-8 w-8 text-lavender-300" />
              </div>
              <p className="text-gray-400">
                {exploreItems.length === 0 ? 'No items have been listed yet. Be the first!' : 'No items found. Try a different search or category.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
