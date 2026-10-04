import { useState, useRef } from 'react';
import {
  GraduationCap, Mail, IdCard, BadgeCheck, Package, Repeat, Trash2, AlertTriangle, X,
  Loader2, Camera, Image as ImageIcon, Heart, CalendarCheck, Settings, LogOut,
} from 'lucide-react';
import { useApp } from '../store';
import type { Page } from '../components/Navigation';
import { formatOwnerName } from '../components/ui';

interface Props { navigate: (p: Page) => void; }

export function Profile({ navigate }: Props) {
  const { user, items, requests, deleteAccount, updateAvatar, removeAvatar, logout } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const myListingCount = items.filter((i) => i.ownerId === user.id).length;
  const completedCount = requests.filter((r) => r.requesterId === user.id && r.status === 'completed').length;
  const ownerCompletedCount = requests.filter((r) => r.ownerId === user.id && r.status === 'completed').length;
  const totalExchanges = completedCount + ownerCompletedCount;

  const handleDeleteAccount = async () => {
    setDeleting(true); setDeleteError(null);
    const result = await deleteAccount();
    setDeleting(false);
    if (result.error) setDeleteError(result.error);
  };

  const canDelete = confirmText === 'DELETE';

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setAvatarError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setAvatarError('Image must be less than 5MB.'); return; }
    setAvatarError(null); setAvatarUploading(true);
    const result = await updateAvatar(file);
    setAvatarUploading(false);
    if (result.error) setAvatarError(result.error);
    e.target.value = '';
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    const result = await removeAvatar();
    setAvatarUploading(false);
    if (result.error) setAvatarError(result.error);
  };

  const menuItems = [
    { icon: Package, label: 'My Items', page: 'items' as Page, color: 'text-lavender-600', bg: 'bg-lavender-50' },
    { icon: CalendarCheck, label: 'My Rentals', page: 'rentals' as Page, color: 'text-babyblue-600', bg: 'bg-babyblue-50' },
    { icon: Heart, label: 'Favorites', page: 'favorites' as Page, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
      {/* Profile header — pastel gradient */}
      <div className="overflow-hidden rounded-4xl border border-lavender-100 bg-white shadow-card">
        <div className="h-28 bg-gradient-to-r from-lavender-300 via-lavender-400 to-babyblue-300 md:h-36" />
        <div className="px-6 pb-6">
          <div className="-mt-14 mb-4 flex items-end justify-between">
            <div className="relative">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-24 w-24 rounded-3xl border-4 border-white object-cover shadow-soft" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-lavender-100 text-4xl font-bold text-lavender-600 shadow-soft">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl border-4 border-white bg-white/70">
                  <Loader2 className="h-6 w-6 animate-spin text-lavender-600" />
                </div>
              )}
            </div>
          </div>

          {/* Avatar upload controls */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button onClick={() => cameraInputRef.current?.click()} disabled={avatarUploading}
              className="flex items-center gap-1.5 rounded-full bg-lavender-50 px-3 py-1.5 text-xs font-semibold text-lavender-700 transition-colors hover:bg-lavender-100 disabled:opacity-50">
              <Camera className="h-3.5 w-3.5" /> Camera
            </button>
            <button onClick={() => galleryInputRef.current?.click()} disabled={avatarUploading}
              className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50">
              <ImageIcon className="h-3.5 w-3.5" /> Gallery
            </button>
            {user.avatarUrl && (
              <button onClick={handleRemoveAvatar} disabled={avatarUploading}
                className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            )}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleAvatarSelect} className="hidden" />
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
          </div>

          {avatarError && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-xs text-red-600">{avatarError}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-800">{formatOwnerName(user.fullName, user.studentId)}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2.5 py-0.5 text-xs font-medium text-mint-600">
              <BadgeCheck className="h-4 w-4" /> Verified
            </span>
          </div>

          {/* Info cards */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-lavender-100 bg-lavender-50/40 p-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender-100"><GraduationCap className="h-5 w-5 text-lavender-600" /></div>
              <div><p className="text-xs text-gray-400">College</p><p className="text-sm font-semibold text-gray-800">{user.college || 'Not set'}</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-lavender-100 bg-lavender-50/40 p-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-babyblue-100"><Mail className="h-5 w-5 text-babyblue-600" /></div>
              <div><p className="text-xs text-gray-400">Email</p><p className="truncate text-sm font-semibold text-gray-800">{user.email}</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-lavender-100 bg-lavender-50/40 p-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-100"><IdCard className="h-5 w-5 text-mint-600" /></div>
              <div><p className="text-xs text-gray-400">College ID</p><p className="text-sm font-semibold text-gray-800">{user.studentId || 'Not set'}</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-lavender-100 bg-lavender-50/40 p-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-100"><BadgeCheck className="h-5 w-5 text-mint-600" /></div>
              <div><p className="text-xs text-gray-400">Status</p><p className="text-sm font-semibold text-gray-800">Verified Student</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-lavender-100 bg-white p-5 text-center shadow-card">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-lavender-100"><Package className="h-6 w-6 text-lavender-600" /></div>
          <p className="text-2xl font-bold text-gray-800">{myListingCount}</p>
          <p className="mt-1 text-xs text-gray-400">Items Listed</p>
        </div>
        <div className="rounded-3xl border border-lavender-100 bg-white p-5 text-center shadow-card">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-babyblue-100"><Repeat className="h-6 w-6 text-babyblue-600" /></div>
          <p className="text-2xl font-bold text-gray-800">{totalExchanges}</p>
          <p className="mt-1 text-xs text-gray-400">Successful Exchanges</p>
        </div>
        <div className="col-span-2 rounded-3xl border border-lavender-100 bg-white p-5 text-center shadow-card lg:col-span-1">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-100"><BadgeCheck className="h-6 w-6 text-mint-600" /></div>
          <p className="text-2xl font-bold text-gray-800">Active</p>
          <p className="mt-1 text-xs text-gray-400">Community Member</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 rounded-3xl border border-lavender-100 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-gray-800">Quick Links</h2>
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={() => navigate(item.page)}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-lavender-50">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.bg}`}><Icon className={`h-4.5 w-4.5 ${item.color}`} /></div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Settings */}
      <div className="mt-6 rounded-3xl border border-lavender-100 bg-white p-5 shadow-card">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-800"><Settings className="h-4.5 w-4.5 text-gray-400" /> Account Settings</h2>
        <p className="mb-4 text-xs text-gray-400">Manage your account and data</p>

        {deleteError && (
          <div className="mb-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-red-600">{deleteError}</p>
          </div>
        )}

        <button onClick={() => setShowSignOutConfirm(true)}
          className="mb-3 flex items-center gap-2 rounded-2xl border border-lavender-200 bg-lavender-50 px-4 py-2.5 text-sm font-semibold text-lavender-700 transition-colors hover:bg-lavender-100">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>

        <button onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100">
          <Trash2 className="h-4 w-4" /> Delete Account
        </button>
        <p className="mt-2 text-[11px] text-gray-400">This will permanently remove your account, listed items, rental history, and profile data.</p>
      </div>

      {/* Sign out confirmation */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-4xl bg-white p-6 shadow-soft-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-lavender-50">
              <LogOut className="h-6 w-6 text-lavender-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Sign out?</h2>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to sign out? You'll need to sign in again to access your rentals, items, and messages.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => { logout(); setShowSignOutConfirm(false); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-lavender-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-lavender-700 active:scale-[0.98]">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
              <button onClick={() => setShowSignOutConfirm(false)}
                className="rounded-2xl border border-lavender-100 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-lavender-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-4xl bg-white p-6 shadow-soft-lg">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50"><AlertTriangle className="h-6 w-6 text-red-500" /></div>
              <button onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); setDeleteError(null); }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <h2 className="text-lg font-bold text-gray-800">Delete your account?</h2>
            <p className="mt-2 text-sm text-gray-500">
              <span className="font-semibold text-red-600">Warning:</span> This action is permanent and cannot be undone. All of the following will be permanently deleted:
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-gray-600">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Your listed items</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Your rental and request history</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Your profile data</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Your login session</li>
            </ul>
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Type <span className="font-bold text-red-600">DELETE</span> to confirm</label>
              <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE"
                className="w-full rounded-2xl border border-lavender-100 bg-lavender-50/40 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100" />
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={handleDeleteAccount} disabled={!canDelete || deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
                {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : 'Permanently Delete Account'}
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); setDeleteError(null); }} disabled={deleting}
                className="rounded-2xl border border-lavender-100 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-lavender-50 disabled:opacity-60">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
