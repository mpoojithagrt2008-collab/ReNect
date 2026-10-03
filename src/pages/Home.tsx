import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Package,
  Repeat,
  Clock,
  Loader2,
} from 'lucide-react';
import { useApp } from '../store';
import { CATEGORIES } from '../data';
import { ItemCard } from '../components/ItemCard';
import type { Category } from '../types';
import type { Page } from '../components/Navigation';

interface Props {
  navigate: (p: Page) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Books: '📚',
  Calculators: '🧮',
  Electronics: '💻',
  Cycles: '🚲',
  Sports: '🏏',
  'Lab Equipment': '🔬',
  Other: '📦',
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  Books: 'from-emerald-400 to-teal-500',
  Calculators: 'from-sky-400 to-cyan-500',
  Electronics: 'from-indigo-400 to-blue-500',
  Cycles: 'from-orange-400 to-amber-500',
  Sports: 'from-rose-400 to-pink-500',
  'Lab Equipment': 'from-violet-400 to-purple-500',
  Other: 'from-slate-400 to-gray-500',
};

export function Home({ navigate }: Props) {
  const { user, items, itemsLoading, setSelectedItemId } = useApp();
  const [search, setSearch] = useState('');

  const recommended = useMemo(() => {
    const userCats = items
      .filter((i) => i.ownerId === user?.id)
      .map((i) => i.category);
    const scored = items
      .filter((i) => i.ownerId !== user?.id)
      .map((i) => ({
        item: i,
        score: (userCats.includes(i.category) ? 2 : 0) + (i.condition === 'Like New' || i.condition === 'New' ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, 4).map((s) => s.item);
  }, [items]);

  const recentlyAdded = useMemo(() => items.slice(0, 4), [items]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items.slice(0, 8);
    return items.filter((i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase()),
    );
  }, [items, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('explore');
  };

  const handleItemClick = (id: string) => {
    setSelectedItemId(id);
    navigate('explore');
  };

  const handleCategoryClick = () => {
    navigate('explore');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      {/* Hero greeting */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-lg shadow-emerald-200/50 md:p-8">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-50/90">
          <Sparkles className="h-4 w-4" />
          Welcome back
        </div>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight md:text-3xl">
          Hi {user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="mt-1.5 max-w-lg text-sm text-emerald-50/80 md:text-base">
          Find what you need on campus — borrow, rent, or reuse from fellow students instead of buying new.
        </p>

        {/* Search bar — shortcut to Explore */}
        <form onSubmit={handleSearchSubmit}>
          <div className="relative mt-5">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for books, calculators, cycles..."
              className="w-full rounded-xl border-0 bg-white py-3 pl-12 pr-24 text-sm text-gray-900 shadow-lg outline-none ring-2 ring-transparent transition-all placeholder:text-gray-400 focus:ring-white/50"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Search
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

        {/* Quick stats inline */}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-50/90">
            <Package className="h-4 w-4" />
            {items.length} items available
          </span>
          <span className="flex items-center gap-1.5 text-emerald-50/90">
            <Repeat className="h-4 w-4" />
            {CATEGORIES.length} categories
          </span>
        </div>
      </div>

      {/* List an item CTA + item count */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{items.length} items available</p>
            <p className="text-xs text-gray-500">Across {CATEGORIES.length} categories</p>
          </div>
        </div>
        <button
          onClick={() => navigate('items')}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98]"
        >
          <Plus className="h-4.5 w-4.5" />
          List an Item
        </button>
      </div>

      {/* Categories */}
      <h2 className="mb-3 text-base font-semibold text-gray-900">Browse by category</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {CATEGORIES.map((cat: Category) => (
          <button
            key={cat}
            onClick={handleCategoryClick}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-4 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-sm"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${CATEGORY_GRADIENTS[cat]} text-lg shadow-sm transition-transform group-hover:scale-110`}>
              <span>{CATEGORY_ICONS[cat]}</span>
            </div>
            <span className="text-xs font-medium text-gray-700">{cat}</span>
          </button>
        ))}
      </div>

      {/* Recommended items */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Sparkles className="h-4.5 w-4.5 text-emerald-500" />
            Recommended for you
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">Based on your listings and popular items</p>
        </div>
        <button
          onClick={() => navigate('explore')}
          className="shrink-0 text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          View all →
        </button>
      </div>
      {itemsLoading ? (
        <div className="mb-8 flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : recommended.length > 0 ? (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {recommended.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item.id)} />
          ))}
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-400">No items available yet. Be the first to list one!</p>
        </div>
      )}

      {/* Recently added items */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Clock className="h-4.5 w-4.5 text-teal-500" />
            Recently added
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">Latest items listed on campus</p>
        </div>
        <button
          onClick={() => navigate('explore')}
          className="shrink-0 text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          View all →
        </button>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {recentlyAdded.length > 0 ? (
          recentlyAdded.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item.id)} />
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
            <p className="text-sm text-gray-400">No items have been listed yet.</p>
          </div>
        )}
      </div>

      {/* Search results preview (only when searching) */}
      {search.trim() && (
        <div className="mt-8">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            Search results for "{search}" ({filtered.length})
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item.id)} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-gray-400">No items match "{search}"</p>
              <button
                onClick={() => navigate('explore')}
                className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700"
              >
                Browse All Items
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
