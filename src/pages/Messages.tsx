import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Package, ArrowLeft, Send, Loader2,
} from 'lucide-react';
import { useApp } from '../store';
import type { Page } from '../components/Navigation';
import type { RequestStatus } from '../types';

interface Props { navigate: (p: Page) => void; }

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  accepted: 'bg-mint-50 text-mint-700 ring-mint-200',
  rejected: 'bg-red-50 text-red-600 ring-red-200',
  completed: 'bg-babyblue-50 text-babyblue-700 ring-babyblue-200',
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

function ChatAvatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
  if (imageUrl) return <img src={imageUrl} alt={name} className="h-12 w-12 shrink-0 rounded-full object-cover" />;
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lavender-200 to-lavender-400 font-bold text-white">
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

export function Messages({ navigate }: Props) {
  const { requests, user, messages, activeChatRequestId, setActiveChatRequestId, fetchMessages, sendMessage, profilesMap } = useApp();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myConversations = requests.filter(
    (r) => (r.requesterId === user?.id || r.ownerId === user?.id) && (r.status === 'accepted' || r.status === 'completed'),
  );

  const activeChat = myConversations.find((r) => r.id === activeChatRequestId) || null;

  useEffect(() => {
    if (activeChatRequestId) fetchMessages(activeChatRequestId);
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
    if (result.error) { setError(result.error); }
    else { setText(''); fetchMessages(activeChat.id); }
  };

  // Chat view
  if (activeChat) {
    const isOwner = activeChat.ownerId === user?.id;
    const otherName = isOwner ? activeChat.requesterName : activeChat.ownerName;
    const otherProfile = isOwner ? profilesMap[activeChat.requesterId] : profilesMap[activeChat.ownerId];

    return (
      <div className="mx-auto flex max-w-2xl flex-col px-4 py-6 md:px-6 md:py-8" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => setActiveChatRequestId(null)} className="flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-3xl border border-lavender-100 bg-white p-4 shadow-card">
          <ChatAvatar name={otherName} imageUrl={otherProfile?.avatarUrl || undefined} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-gray-800">{otherName}</h3>
            <p className="truncate text-xs text-gray-400">{activeChat.itemName}</p>
            <p className="mt-0.5 text-xs text-gray-400">{formatDate(activeChat.startDate)} → {formatDate(activeChat.endDate)}</p>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{error}</div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl border border-lavender-100 bg-white p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="mb-3 h-8 w-8 text-lavender-200" />
              <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-gradient-to-r from-lavender-500 to-lavender-600 text-white' : 'bg-lavender-50 text-gray-800'}`}>
                    <p className="break-words">{msg.text}</p>
                    <p className={`mt-1 text-[10px] ${isMe ? 'text-lavender-100' : 'text-gray-400'}`}>{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-lavender-100 bg-white px-5 py-2.5 text-sm text-gray-800 outline-none focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100"
          />
          <button type="submit" disabled={!text.trim() || sending}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-lavender-500 to-lavender-600 text-white transition-colors hover:from-lavender-600 hover:to-lavender-700 disabled:opacity-50">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    );
  }

  // Conversation list — Instagram-style
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-800">Messages</h1>
      <p className="mb-6 text-sm text-gray-400">Active conversations about accepted borrow requests</p>

      {myConversations.length > 0 ? (
        <div className="space-y-2">
          {myConversations.map((req) => {
            const isOwner = req.ownerId === user?.id;
            const otherName = isOwner ? req.requesterName : req.ownerName;
            const otherProfile = isOwner ? profilesMap[req.requesterId] : profilesMap[req.ownerId];
            const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

            return (
              <button
                key={req.id}
                onClick={() => setActiveChatRequestId(req.id)}
                className="flex w-full items-center gap-3 rounded-3xl border border-lavender-100 bg-white p-3.5 text-left transition-all hover:shadow-soft"
              >
                <ChatAvatar name={otherName} imageUrl={otherProfile?.avatarUrl || undefined} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-gray-800">{otherName}</h3>
                    <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${STATUS_STYLES[req.status]}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="truncate text-xs text-gray-500">{lastMsg ? lastMsg.text : req.itemName}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">{formatDate(req.startDate)} → {formatDate(req.endDate)}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-lavender-200 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lavender-50">
            <MessageCircle className="h-8 w-8 text-lavender-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-800">No conversations yet</h3>
          <p className="mt-1 max-w-xs text-sm text-gray-400">Conversations appear here when a borrow request is accepted.</p>
          <button onClick={() => navigate('explore')} className="mt-5 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg">
            <Package className="h-4 w-4" /> Explore Items
          </button>
        </div>
      )}
    </div>
  );
}
