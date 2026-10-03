import { useState } from 'react';
import {
  Bell, Package, CheckCircle2, XCircle, Recycle, CheckCheck, Inbox, Star, Loader2, AlertCircle,
  MessageCircle, PackageCheck, ClipboardCheck, Ban,
} from 'lucide-react';
import { useApp } from '../store';
import type { Page } from '../components/Navigation';
import type { AppNotification } from '../types';
import { ReturnReviewModal } from '../components/ReturnReviewModal';

interface Props { navigate: (p: Page) => void; }

const TYPE_ICONS: Record<string, typeof Bell> = {
  new_request: Package, accepted: CheckCircle2, rejected: XCircle,
  available: Recycle, rental_completed: Star, return_submitted: Package,
  request_cancelled: Ban, info: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  new_request: 'bg-amber-50 text-amber-600', accepted: 'bg-mint-50 text-mint-600',
  rejected: 'bg-red-50 text-red-500', available: 'bg-babyblue-50 text-babyblue-600',
  rental_completed: 'bg-amber-50 text-amber-500', return_submitted: 'bg-babyblue-50 text-babyblue-600',
  request_cancelled: 'bg-gray-100 text-gray-500', info: 'bg-gray-50 text-gray-500',
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
  const { user, notifications, markNotificationRead, markAllNotificationsRead, setSelectedItemId, unreadCount, updateRequestStatus, markReturned, setActiveChatRequestId, requests, returnsMap } = useApp();
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [reviewingReturnId, setReviewingReturnId] = useState<string | null>(null);

  const pendingRequestIds = new Set(
    requests.filter((r) => r.status === 'pending' && r.ownerId === user?.id).map((r) => r.id)
  );
  const acceptedRequestIds = new Set(
    requests.filter((r) => r.status === 'accepted' && r.ownerId === user?.id).map((r) => r.id)
  );

  const handleClick = (notif: AppNotification) => {
    markNotificationRead(notif.id);
    if (notif.type === 'rental_completed') navigate('rentals');
    else if (notif.listingId) { setSelectedItemId(notif.listingId); navigate('explore'); }
  };

  const handleMarkReturned = async (e: React.MouseEvent, requestId: string) => {
    e.stopPropagation();
    setActionError(null);
    setActingRequestId(requestId);
    const result = await markReturned(requestId);
    setActingRequestId(null);
    if (result?.error) { setActionError(result.error); setTimeout(() => setActionError(null), 4000); }
  };

  const handleChat = (e: React.MouseEvent, requestId: string) => {
    e.stopPropagation();
    setActiveChatRequestId(requestId);
    navigate('messages');
  };

  const handleAccept = async (e: React.MouseEvent, requestId: string) => {
    e.stopPropagation();
    if (actingRequestId) return;
    setActionError(null); setActionSuccess(null);
    setActingRequestId(requestId);
    const result = await updateRequestStatus(requestId, 'accepted');
    setActingRequestId(null);
    if (result?.error) {
      setActionError(result.error);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess('Request accepted successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const handleReject = async (e: React.MouseEvent, requestId: string) => {
    e.stopPropagation();
    if (actingRequestId) return;
    setActionError(null); setActionSuccess(null);
    setActingRequestId(requestId);
    const result = await updateRequestStatus(requestId, 'rejected');
    setActingRequestId(null);
    if (result?.error) {
      setActionError(result.error);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess('Request rejected.');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const handleReviewReturn = (e: React.MouseEvent, requestId: string) => {
    e.stopPropagation();
    const returnRecord = returnsMap[requestId];
    if (returnRecord) {
      markNotificationRead(
        notifications.find((n) => n.requestId === requestId && n.type === 'return_submitted')?.id || ''
      );
      setReviewingReturnId(returnRecord.id);
    }
  };

  const isPendingRequest = (n: AppNotification) => n.type === 'new_request' && n.requestId && pendingRequestIds.has(n.requestId);
  const isResolvedRequest = (n: AppNotification) => (n.type === 'accepted' || n.type === 'rejected') && n.requestId;
  const isAcceptedRequest = (n: AppNotification) => n.type === 'accepted' && n.requestId && acceptedRequestIds.has(n.requestId);
  const isStalePending = (n: AppNotification) => n.type === 'new_request' && n.requestId && !pendingRequestIds.has(n.requestId);
  const isRequestCancelled = (n: AppNotification) => n.type === 'request_cancelled' && n.requestId;
  const isReturnSubmitted = (n: AppNotification) => n.type === 'return_submitted' && n.requestId && returnsMap[n.requestId];
  const isReturnReviewed = (n: AppNotification) => n.type === 'return_submitted' && n.requestId && returnsMap[n.requestId]?.status === 'reviewed';

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Notifications</h1>
          <p className="mt-1 text-sm text-gray-400">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {notifications.length > 0 && (
          <button onClick={markAllNotificationsRead} className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-lavender-600 transition-colors hover:bg-lavender-50">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {actionError && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-600">{actionError}</p>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-mint-600" />
          <p className="text-xs text-mint-700">{actionSuccess}</p>
        </div>
      )}

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = TYPE_ICONS[notif.type] || Bell;
            const colorClass = TYPE_COLORS[notif.type] || TYPE_COLORS.info;
            const showActions = isPendingRequest(notif);
            const resolved = isResolvedRequest(notif);
            return (
              <div key={notif.id} onClick={() => handleClick(notif)}
                className={`flex w-full cursor-pointer items-start gap-3 rounded-3xl border p-4 text-left transition-all hover:shadow-soft ${
                  notif.read ? 'border-lavender-100 bg-white' : 'border-lavender-200 bg-lavender-50/40'
                }`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`truncate text-sm ${notif.read ? 'font-medium text-gray-600' : 'font-semibold text-gray-800'}`}>{notif.title}</h3>
                    {!notif.read && <span className="h-2 w-2 shrink-0 rounded-full bg-lavender-500" />}
                  </div>
                  {notif.body && <p className="mt-0.5 text-xs text-gray-500">{notif.body}</p>}
                  <p className="mt-1 text-[11px] text-gray-400">{timeAgo(notif.createdAt)}</p>

                  {showActions && (
                    <div className="mt-3 flex gap-2">
                      <button onClick={(e) => handleAccept(e, notif.requestId!)} disabled={actingRequestId === notif.requestId}
                        className="flex items-center gap-1.5 rounded-full bg-mint-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-mint-600 disabled:opacity-50">
                        {actingRequestId === notif.requestId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Accept
                      </button>
                      <button onClick={(e) => handleReject(e, notif.requestId!)} disabled={actingRequestId === notif.requestId}
                        className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                        <XCircle className="h-3.5 w-3.5" /> Decline
                      </button>
                    </div>
                  )}

                  {isAcceptedRequest(notif) && (
                    <div className="mt-3 flex gap-2">
                      <button onClick={(e) => handleChat(e, notif.requestId!)}
                        className="flex items-center gap-1.5 rounded-full bg-lavender-50 px-4 py-1.5 text-xs font-semibold text-lavender-700 transition-colors hover:bg-lavender-100">
                        <MessageCircle className="h-3.5 w-3.5" /> Chat
                      </button>
                      <button onClick={(e) => handleMarkReturned(e, notif.requestId!)} disabled={actingRequestId === notif.requestId}
                        className="flex items-center gap-1.5 rounded-full bg-babyblue-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-babyblue-600 disabled:opacity-50">
                        {actingRequestId === notif.requestId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PackageCheck className="h-3.5 w-3.5" />}
                        Mark Returned
                      </button>
                    </div>
                  )}

                  {isReturnSubmitted(notif) && !isReturnReviewed(notif) && (
                    <div className="mt-3">
                      <button onClick={(e) => handleReviewReturn(e, notif.requestId!)}
                        className="flex items-center gap-1.5 rounded-full bg-babyblue-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-babyblue-600">
                        <ClipboardCheck className="h-3.5 w-3.5" /> Review Return
                      </button>
                    </div>
                  )}

                  {isReturnReviewed(notif) && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-mint-600">
                      <CheckCircle2 className="h-3 w-3 text-mint-500" /> Return confirmed — item is now available
                    </div>
                  )}

                  {resolved && !isAcceptedRequest(notif) && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                      {notif.type === 'accepted' ? <><CheckCircle2 className="h-3 w-3 text-mint-500" /> You accepted this request</> : <><XCircle className="h-3 w-3 text-red-400" /> You rejected this request</>}
                    </div>
                  )}

                  {isStalePending(notif) && !isAcceptedRequest(notif) && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                      {acceptedRequestIds.has(notif.requestId!) ? (
                        <><CheckCircle2 className="h-3 w-3 text-mint-500" /> Request accepted</>
                      ) : (
                        <><XCircle className="h-3 w-3 text-gray-400" /> This request has been processed</>
                      )}
                    </div>
                  )}

                  {isRequestCancelled(notif) && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                      <Ban className="h-3 w-3 text-gray-400" /> This request was cancelled by the requester
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-lavender-200 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lavender-50">
            <Inbox className="h-8 w-8 text-lavender-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-800">No notifications yet</h3>
          <p className="mt-1 max-w-xs text-sm text-gray-400">You'll be notified when someone requests your items or responds to your requests.</p>
          <button onClick={() => navigate('explore')} className="mt-5 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg">
            Explore Items
          </button>
        </div>
      )}

      {reviewingReturnId && (
        <ReturnReviewModal
          returnId={reviewingReturnId}
          onClose={() => setReviewingReturnId(null)}
        />
      )}
    </div>
  );
}
