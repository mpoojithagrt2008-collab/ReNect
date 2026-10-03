import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Send,
  Loader2,
} from 'lucide-react';
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

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function Messages({ navigate }: Props) {
  const { requests, user, messages, activeChatRequestId, setActiveChatRequestId, fetchMessages, sendMessage } = useApp();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myConversations = requests.filter(
    (r) =>
      (r.requesterId === user?.id || r.ownerId === user?.id) &&
      (r.status === 'accepted' || r.status === 'completed'),
  );

  const activeChat = myConversations.find((r) => r.id === activeChatRequestId) || null;

  useEffect(() => {
    if (activeChatRequestId) {
      fetchMessages(activeChatRequestId);
    }
  }, [activeChatRequestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeChat || !user) return;
    const receiverId = activeChat.ownerId === user.id ? activeChat.requesterId : activeChat.ownerId;
    setSending(true);
    setError(null);
    const result = await sendMessage(activeChat.id, receiverId, text.trim());
    setSending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setText('');
      fetchMessages(activeChat.id);
    }
  };

  // Chat view
  if (activeChat) {
    const isOwner = activeChat.ownerId === user?.id;
    const otherName = isOwner ? activeChat.requesterName : activeChat.ownerName;

    return (
      <div className="mx-auto flex max-w-2xl flex-col px-4 py-6 md:px-6 md:py-8" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Chat header */}
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => setActiveChatRequestId(null)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <img
            src={activeChat.itemImage}
            alt={activeChat.itemName}
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-gray-900">{activeChat.itemName}</h3>
            <p className="text-xs text-gray-500">Chatting with {otherName}</p>
            <p className="mt-0.5 text-xs text-gray-400">
              {formatDate(activeChat.startDate)} → {formatDate(activeChat.endDate)}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      isMe
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="break-words">{msg.text}</p>
                    <p className={`mt-1 text-[10px] ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Send bar */}
        <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    );
  }

  // Conversation list
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
              <button
                key={req.id}
                onClick={() => setActiveChatRequestId(req.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-sm"
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
                <MessageCircle className="h-5 w-5 shrink-0 text-emerald-500" />
              </button>
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
