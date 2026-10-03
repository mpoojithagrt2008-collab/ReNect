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
  Heart,
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
  Books: 'from-mint-400 to-mint-500',
  Calculators: 'from-babyblue-300 to-babyblue-400',
  Electronics: 'from-lavender-400 to-lavender-500',
  Cycles: 'from-orange-400 to-amber-400',
  Sports: 'from-rose-300 to-pink-400',
  'Lab Equipment': 'from-lavender-300 to-lavender-400',
  Other: 'from-gray-300 to-gray-400',
};

export function Home({ navigate }: Props) {
  const { user, exploreItems, items, itemsLoading, setSelectedItemId, favoriteIds, toggleFavorite, ratingsMap } = useApp();
  const [search, setSearch] = useState('');

  const recommended = useMemo(() => {
    const userCats = items
      .filter((i) => i.ownerId === user?.id)
      .map((i) => i.category);
    const scored = exploreItems
      .map((i) => ({
        item: i,
        score: (userCats.includes(i.category) ? 2 : 0) + (i.condition === 'Like New' || i.condition === 'New' ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, 4).map((s) => s.item);
  }, [exploreItems, items]);

  const recentlyAdded = useMemo(() => exploreItems.slice(0, 4), [exploreItems]);

  const filtered = useMemo(() => {
    if (!search.trim()) return exploreItems.slice(0, 8);
    const q = search.toLowerCase();
    return exploreItems.filter((i) =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q),
    );
  }, [exploreItems, search]);

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
      {/* Hero greeting — pastel lavender gradient */}
      <div className="mb-6 overflow-hidden rounded-4xl bg-gradient-to-br from-lavender-400 via-lavender-500 to-babyblue-400 p-6 text-white shadow-soft-lg md:p-8">
        <div className="flex items-center gap-2 text-sm font-medium text-lavender-50/90">
          <Sparkles className="h-4 w-4" />
          Welcome back
        </div>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight md:text-3xl">
          Hi {user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="mt-1.5 max-w-lg text-sm text-lavender-50/80 md:text-base">
          Find what you need on campus — borrow, rent, or reuse from fellow students instead of buying new.
        </p>

        {/* Rounded search bar */}
        <form onSubmit={handleSearchSubmit}>
          <div className="relative mt-5">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for books, calculators, cycles..."
              className="w-full rounded-2xl border-0 bg-white py-3 pl-12 pr-24 text-sm text-gray-800 shadow-lg outline-none ring-2 ring-transparent transition-all placeholder:text-gray-400 focus:ring-white/50"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-xl bg-lavender-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-lavender-700"
            >
              Search
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>

        {/* Quick stats */}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5 text-lavender-50/90">
            <Package className="h-4 w-4" />
            {exploreItems.length} items available
          </span>
          <span className="flex items-center gap-1.5 text-lavender-50/90">
            <Repeat className="h-4 w-4" />
            {CATEGORIES.length} categories
          </span>
        </div>
      </div>

      {/* Quick action cards */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <button
          onClick={() => navigate('rentals')}
          className="flex flex-col items-center gap-2 rounded-3xl border border-lavender-100 bg-white p-4 shadow-card transition-all hover:shadow-soft-lg hover:-translate-y-0.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lavender-100">
            <Repeat className="h-5 w-5 text-lavender-600" />
          </div>
          <span className="text-xs font-medium text-gray-600">My Rentals</span>
        </button>
        <button
          onClick={() => navigate('favorites')}
          className="flex flex-col items-center gap-2 rounded-3xl border border-lavender-100 bg-white p-4 shadow-card transition-all hover:shadow-soft-lg hover:-translate-y-0.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50">
            <Heart className="h-5 w-5 text-red-500" />
          </div>
          <span className="text-xs font-medium text-gray-600">Favorites</span>
        </button>
        <button
          onClick={() => navigate('notifications')}
          className="flex flex-col items-center gap-2 rounded-3xl border border-lavender-100 bg-white p-4 shadow-card transition-all hover:shadow-soft-lg hover:-translate-y-0.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-babyblue-100">
            <TrendingUp className="h-5 w-5 text-babyblue-600" />
          </div>
          <span className="text-xs font-medium text-gray-600">Alerts</span>
        </button>
      </div>

      {/* List an item CTA */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 rounded-3xl border border-lavender-100 bg-white px-4 py-3 shadow-card">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint-100">
            <TrendingUp className="h-5 w-5 text-mint-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{exploreItems.length} items available</p>
            <p className="text-xs text-gray-400">Across {CATEGORIES.length} categories</p>
          </div>
        </div>
        <button
          onClick={() => navigate('items')}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 px-5 py-3 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg active:scale-[0.98]"
        >
          <Plus className="h-4.5 w-4.5" />
          List an Item
        </button>
      </div>

      {/* Categories — pill style */}
      <h2 className="mb-3 text-base font-semibold text-gray-800">Browse by category</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {CATEGORIES.map((cat: Category) => (
          <button
            key={cat}
            onClick={handleCategoryClick}
            className="group flex flex-col items-center gap-2 rounded-3xl border border-lavender-100 bg-white px-3 py-4 shadow-card transition-all hover:border-lavender-200 hover:shadow-soft-lg"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${CATEGORY_GRADIENTS[cat]} text-lg shadow-soft transition-transform group-hover:scale-110`}>
              <span>{CATEGORY_ICONS[cat]}</span>
            </div>
            <span className="text-xs font-medium text-gray-600">{cat}</span>
          </button>
        ))}
      </div>

      {/* Recommended items */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Sparkles className="h-4.5 w-4.5 text-lavender-500" />
            Recommended for you
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">Based on your listings and popular items</p>
        </div>
        <button
          onClick={() => navigate('explore')}
          className="shrink-0 rounded-full bg-lavender-50 px-3 py-1.5 text-sm font-medium text-lavender-600 transition-colors hover:bg-lavender-100"
        >
          View all →
        </button>
      </div>
      {itemsLoading ? (
        <div className="mb-8 flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-lavender-500" />
        </div>
      ) : recommended.length > 0 ? (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {recommended.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item.id)} isFavorite={favoriteIds.has(item.id)} onToggleFavorite={() => toggleFavorite(item.id)} rating={ratingsMap[item.id] || null} />
          ))}
        </div>
      ) : (
        <div className="mb-8 rounded-3xl border border-dashed border-lavender-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-400">No items available yet. Be the first to list one!</p>
        </div>
      )}

      {/* Recently added items */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Clock className="h-4.5 w-4.5 text-babyblue-500" />
            Recently added
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">Latest items listed on campus</p>
        </div>
        <button
          onClick={() => navigate('explore')}
          className="shrink-0 rounded-full bg-lavender-50 px-3 py-1.5 text-sm font-medium text-lavender-600 transition-colors hover:bg-lavender-100"
        >
          View all →
        </button>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {recentlyAdded.length > 0 ? (
          recentlyAdded.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item.id)} isFavorite={favoriteIds.has(item.id)} onToggleFavorite={() => toggleFavorite(item.id)} rating={ratingsMap[item.id] || null} />
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-dashed border-lavender-200 bg-white py-12 text-center">
            <p className="text-sm text-gray-400">No items have been listed yet.</p>
          </div>
        )}
      </div>

      {/* Search results preview */}
      {search.trim() && (
        <div className="mt-8">
          <h2 className="mb-3 text-base font-semibold text-gray-800">
            Search results for "{search}" ({filtered.length})
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item.id)} isFavorite={favoriteIds.has(item.id)} onToggleFavorite={() => toggleFavorite(item.id)} rating={ratingsMap[item.id] || null} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-gray-400">No items match "{search}"</p>
              <button
                onClick={() => navigate('explore')}
                className="mt-4 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg"
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
