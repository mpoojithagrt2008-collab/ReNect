import { useEffect } from 'react';
import {
  Bell,
  Package,
  CheckCircle2,
  XCircle,
  Recycle,
  CheckCheck,
  Inbox,
} from 'lucide-react';
import { useApp } from '../store';
import type { Page } from '../components/Navigation';
import type { AppNotification } from '../types';

interface Props {
  navigate: (p: Page) => void;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  new_request: Package,
  accepted: CheckCircle2,
  rejected: XCircle,
  available: Recycle,
  info: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  new_request: 'bg-amber-50 text-amber-600',
  accepted: 'bg-emerald-50 text-emerald-600',
  rejected: 'bg-red-50 text-red-500',
  available: 'bg-teal-50 text-teal-600',
  info: 'bg-gray-50 text-gray-500',
};

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Notifications({ navigate }: Props) {
  const { notifications, markNotificationRead, markAllNotificationsRead, setSelectedItemId, unreadCount } = useApp();

  useEffect(() => {
    markAllNotificationsRead();
  }, []);

  const handleClick = (notif: AppNotification) => {
    markNotificationRead(notif.id);
    if (notif.listingId) {
      setSelectedItemId(notif.listingId);
      navigate('explore');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = TYPE_ICONS[notif.type] || Bell;
            const colorClass = TYPE_COLORS[notif.type] || TYPE_COLORS.info;
            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:shadow-sm ${
                  notif.read
                    ? 'border-gray-200 bg-white'
                    : 'border-emerald-200 bg-emerald-50/40'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`truncate text-sm ${notif.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  {notif.body && (
                    <p className="mt-0.5 text-xs text-gray-500">{notif.body}</p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-400">{timeAgo(notif.createdAt)}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <Inbox className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No notifications yet</h3>
          <p className="mt-1 max-w-xs text-sm text-gray-500">
            You'll be notified when someone requests your items or responds to your requests.
          </p>
          <button
            onClick={() => navigate('explore')}
            className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700"
          >
            Explore Items
          </button>
        </div>
      )}
    </div>
  );
}
