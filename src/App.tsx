import { useState } from 'react';
import { Loader2, Leaf } from 'lucide-react';
import { AppProvider, useApp } from './store';
import { Navigation, type Page } from './components/Navigation';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { MyRentals } from './pages/MyRentals';
import { MyItems } from './pages/MyItems';
import { Messages } from './pages/Messages';
import { Notifications } from './pages/Notifications';
import { Favorites } from './pages/Favorites';
import { Profile } from './pages/Profile';

function AppContent() {
  const { user, authLoading } = useApp();
  const [page, setPage] = useState<Page>('home');

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-lavender-50 via-white to-babyblue-50">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-lavender-400 to-lavender-600 shadow-soft-lg">
          <Leaf className="h-8 w-8 text-white" />
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading ReNect...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  const navigate = (p: Page) => setPage(p);

  return (
    <div className="min-h-screen">
      <Navigation current={page} navigate={navigate} />
      <main className="pb-24 md:pb-0">
        {page === 'home' && <Home navigate={navigate} />}
        {page === 'explore' && <Explore />}
        {page === 'rentals' && <MyRentals navigate={navigate} />}
        {page === 'items' && <MyItems navigate={navigate} />}
        {page === 'messages' && <Messages navigate={navigate} />}
        {page === 'notifications' && <Notifications navigate={navigate} />}
        {page === 'favorites' && <Favorites navigate={navigate} />}
        {page === 'profile' && <Profile navigate={navigate} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
