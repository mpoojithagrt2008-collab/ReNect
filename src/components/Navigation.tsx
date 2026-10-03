import {
  Home as HomeIcon,
  Compass,
  CalendarCheck,
  Package,
  Leaf,
  LogOut,
  Bell,
  Heart,
} from 'lucide-react';
import { useApp } from '../store';

export type Page = 'home' | 'explore' | 'rentals' | 'items' | 'messages' | 'notifications' | 'favorites' | 'profile';

interface Props {
  current: Page;
  navigate: (p: Page) => void;
}

const BOTTOM_NAV: { page: Page; label: string; icon: typeof HomeIcon }[] = [
  { page: 'home', label: 'Home', icon: HomeIcon },
  { page: 'explore', label: 'Explore', icon: Compass },
  { page: 'rentals', label: 'Rentals', icon: CalendarCheck },
  { page: 'items', label: 'My Items', icon: Package },
];

function MiniAvatar({ url, name }: { url: string | null; name: string }) {
  if (url) return <img src={url} alt={name} className="h-8 w-8 rounded-full object-cover" />;
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lavender-100 font-bold text-xs text-lavender-600">
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

export function Navigation({ current, navigate }: Props) {
  const { user, logout, unreadCount } = useApp();

  return (
    <>
      {/* Desktop header */}
      <header className="sticky top-0 z-40 hidden border-b border-lavender-100 bg-white/70 backdrop-blur-xl md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <button onClick={() => navigate('home')} className="flex items-center gap-2 transition-transform hover:scale-105">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-lavender-400 to-lavender-600 shadow-soft">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-800">Re<span className="text-lavender-600">Nect</span></span>
          </button>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate('favorites')} className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${current === 'favorites' ? 'bg-red-50 text-red-500' : 'text-gray-400 hover:bg-lavender-50 hover:text-lavender-600'}`}>
              <Heart className="h-5 w-5" />
            </button>
            <button onClick={() => navigate('notifications')} className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all ${current === 'notifications' ? 'bg-lavender-100 text-lavender-600' : 'text-gray-400 hover:bg-lavender-50 hover:text-lavender-600'}`}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-babyblue-500 px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            <button onClick={() => navigate('profile')} className={`flex items-center gap-1.5 rounded-full p-0.5 pr-2 transition-all ${current === 'profile' ? 'bg-lavender-100' : 'hover:bg-lavender-50'}`}>
              <MiniAvatar url={user?.avatarUrl ?? null} name={user?.fullName ?? ''} />
              <span className="text-sm font-medium text-gray-700">{user?.fullName?.split(' ')[0]}</span>
            </button>
            <button onClick={logout} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile header — logo left, top-right actions */}
      <header className="sticky top-0 z-40 border-b border-lavender-100 bg-white/70 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('home')} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-lavender-400 to-lavender-600 shadow-soft">
              <Leaf className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-gray-800">Re<span className="text-lavender-600">Nect</span></span>
          </button>
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate('favorites')} className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${current === 'favorites' ? 'bg-red-50 text-red-500' : 'text-gray-400 hover:bg-lavender-50'}`}>
              <Heart className="h-5 w-5" />
            </button>
            <button onClick={() => navigate('notifications')} className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all ${current === 'notifications' ? 'bg-lavender-100 text-lavender-600' : 'text-gray-400 hover:bg-lavender-50'}`}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-babyblue-500 px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            <button onClick={() => navigate('profile')} className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${current === 'profile' ? 'bg-lavender-100' : 'hover:bg-lavender-50'}`}>
              <MiniAvatar url={user?.avatarUrl ?? null} name={user?.fullName ?? ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Bottom navigation — required primary sections */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-3">
        <div className="mx-auto flex max-w-lg items-center justify-around rounded-full border border-lavender-100 bg-white/90 px-2 py-2.5 shadow-soft-lg backdrop-blur-xl">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active = current === item.page;
            return (
              <button key={item.page} onClick={() => navigate(item.page)}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-1 transition-colors ${active ? 'text-lavender-600' : 'text-gray-400'}`}>
                <Icon className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`} />
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
