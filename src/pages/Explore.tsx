import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Loader2, Package } from 'lucide-react';
import { useApp } from '../store';
import { CATEGORIES } from '../data';
import { ItemCard } from '../components/ItemCard';
import { ItemDetails } from './ItemDetails';

export function Explore() {
  const { items, itemsLoading, selectedItemId, setSelectedItemId } = useApp();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, activeCategory]);

  if (selectedItem) {
    return <ItemDetails item={selectedItem} onBack={() => setSelectedItemId(null)} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">Explore</h1>
      <p className="mb-5 text-sm text-gray-500">Discover items available on campus</p>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
        <div className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        {['All', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:text-emerald-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {itemsLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-gray-400">Loading items...</p>
        </div>
      ) : (
        <>
          <div className="mb-3 text-sm text-gray-500">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'} found
          </div>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItemId(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                <Package className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-400">
                {items.length === 0
                  ? 'No items have been listed yet. Be the first!'
                  : 'No items found. Try a different search or category.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
