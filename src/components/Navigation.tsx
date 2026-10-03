import {
  Home,
  Compass,
  CalendarCheck,
  Package,
  User,
  Leaf,
  LogOut,
  MessageCircle,
  Bell,
  Heart,
} from 'lucide-react';
import { useApp } from '../store';

export type Page = 'home' | 'explore' | 'rentals' | 'items' | 'messages' | 'notifications' | 'favorites' | 'profile';

interface Props {
  current: Page;
  navigate: (p: Page) => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: typeof Home }[] = [
  { page: 'home', label: 'Home', icon: Home },
  { page: 'explore', label: 'Explore', icon: Compass },
  { page: 'rentals', label: 'Rentals', icon: CalendarCheck },
  { page: 'items', label: 'My Items', icon: Package },
  { page: 'messages', label: 'Messages', icon: MessageCircle },
  { page: 'favorites', label: 'Favorites', icon: Heart },
  { page: 'notifications', label: 'Alerts', icon: Bell },
  { page: 'profile', label: 'Profile', icon: User },
];

function Avatar({ url, name, size = 'h-8 w-8 text-sm' }: { url: string | null; name: string; size?: string }) {
  if (url) {
    return <img src={url} alt={name} className={`${size} rounded-full object-cover`} />;
  }
  return (
    <div className={`flex ${size} items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700`}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

export function Navigation({ current, navigate }: Props) {
  const { user, logout, unreadCount } = useApp();

  return (
    <>
      {/* Desktop header */}
      <header className="sticky top-0 z-40 hidden border-b border-gray-200 bg-white/80 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2 transition-transform hover:scale-105"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Re<span className="text-emerald-600">Nect</span>
            </span>
          </button>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = current === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => navigate(item.page)}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.page === 'notifications' && unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar url={user?.avatarUrl ?? null} name={user?.fullName ?? ''} />
              <span className="text-sm font-medium text-gray-700">{user?.fullName}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Leaf className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-gray-900">
              Re<span className="text-emerald-600">Nect</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('notifications')}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={logout}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around px-1 py-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = current === item.page;
            return (
              <button
                key={item.page}
                onClick={() => navigate(item.page)}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors ${
                  active ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[9px] font-medium">{item.label}</span>
                {item.page === 'notifications' && unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
