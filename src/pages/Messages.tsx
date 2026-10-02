import { useState } from 'react';
import { MessageCircle, Package, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../store';
import type { Page } from '../components/Navigation';
import type { BorrowRequest, RequestStatus } from '../types';

interface Props {
  navigate: (p: Page) => void;
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-red-50 text-red-600 ring-red-200',
  completed: 'bg-teal-50 text-teal-700 ring-teal-200',
};

const STATUS_ICONS: Record<RequestStatus, typeof Clock> = {
  pending: Clock,
  accepted: CheckCircle2,
  rejected: XCircle,
  completed: CheckCircle2,
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Messages({ navigate }: Props) {
  const { requests, user } = useApp();

  // Show accepted requests as active conversations
  const myConversations = requests.filter(
    (r) =>
      (r.requesterId === user?.id || r.ownerId === user?.id) &&
      (r.status === 'accepted' || r.status === 'completed'),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">Messages</h1>
      <p className="mb-6 text-sm text-gray-500">
        Active conversations about accepted borrow requests
      </p>

      {myConversations.length > 0 ? (
        <div className="space-y-3">
          {myConversations.map((req) => {
            const isOwner = req.ownerId === user?.id;
            const otherName = isOwner ? req.requesterName : req.ownerName;
            const StatusIcon = STATUS_ICONS[req.status];
            return (
              <div
                key={req.id}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
              >
                <img
                  src={req.itemImage}
                  alt={req.itemName}
                  className="h-12 w-12 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-gray-900">{otherName}</h3>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${STATUS_STYLES[req.status]}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {req.status}
                    </span>
                  </div>
                  <p className="truncate text-xs text-gray-500">{req.itemName}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatDate(req.startDate)} → {formatDate(req.endDate)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <MessageCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No conversations yet</h3>
          <p className="mt-1 max-w-xs text-sm text-gray-500">
            Conversations appear here when a borrow request is accepted.
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
