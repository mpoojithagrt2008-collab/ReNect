import { useState, useMemo, useRef } from 'react';
import {
  Plus,
  Package,
  Check,
  X,
  Clock,
  MessageSquare,
  Calendar,
  Inbox,
  Trash2,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../store';
import { CATEGORIES, CONDITIONS } from '../data';
import { ItemCard } from '../components/ItemCard';
import type { Category, Condition } from '../types';

export function MyItems() {
  const { user, items, addListing, deleteListing, requests, updateRequestStatus, markReturned } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Books');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<Condition>('Good');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const myListings = useMemo(
    () => items.filter((i) => i.ownerId === user?.id),
    [items, user],
  );

  const incomingRequests = useMemo(
    () => requests.filter((r) => r.ownerId === user?.id),
    [requests, user],
  );

  const resetForm = () => {
    setName('');
    setCategory('Books');
    setDescription('');
    setCondition('Good');
    setPrice('');
    setLocation('');
    setImageFile(null);
    setImagePreview(null);
    setSubmitError(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSubmitError('Please select an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('Image must be less than 10MB.');
      return;
    }
    setSubmitError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    const result = await addListing({
      name,
      category,
      description,
      condition,
      pricePerDay: price ? Number(price) : 0,
      location: location || 'Campus',
      imageFile,
    });

    setSubmitting(false);

    if (result.error) {
      setSubmitError(result.error);
    } else {
      resetForm();
      setShowForm(false);
    }
  };

  const handleDeleteClick = (itemId: string, itemName: string) => {
    setDeleteError(null);
    setDeleteTarget({ id: itemId, name: itemName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteListing(deleteTarget.id);
    setDeleting(false);
    if (result.success) {
      setDeleteSuccess(`"${deleteTarget.name}" has been deleted.`);
      setTimeout(() => setDeleteSuccess(null), 3000);
    } else {
      setDeleteError(result.message ?? 'Unable to delete item.');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Items</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your listed items</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98]"
        >
          <Plus className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">List an Item</span>
          <span className="sm:hidden">List</span>
        </button>
      </div>

      {deleteSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-xs text-emerald-700">{deleteSuccess}</p>
        </div>
      )}

      {deleteError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-700">{deleteError}</p>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
        >
          <h3 className="mb-4 text-base font-semibold text-gray-900">List a new item</h3>

          {submitError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-xs text-red-600">{submitError}</p>
            </div>
          )}

          {/* Image upload section */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Item Photo</label>
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-xl border border-gray-200">
                <img src={imagePreview} alt="Preview" className="aspect-[4/3] w-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-red-500 shadow-sm transition-colors hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 py-6 transition-all hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <Camera className="h-7 w-7 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700">Take Photo</span>
                  <span className="text-[11px] text-gray-400">Use your camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-6 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  <ImageIcon className="h-7 w-7 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Choose from Gallery</span>
                  <span className="text-[11px] text-gray-400">Select an existing image</span>
                </button>
              </div>
            )}
            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {!imagePreview && (
              <p className="mt-2 text-[11px] text-gray-400">
                Optional — a category placeholder will be used if no photo is uploaded.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Item Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mechanical Pencil Set"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe your item..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as Condition)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Price per day (₹) <span className="text-gray-400">— 0 for free</span>
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Hostel H-4, IIT Bombay"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Item'
              )}
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              disabled={submitting}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Incoming requests */}
      {incomingRequests.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Inbox className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-gray-900">Incoming Requests</h2>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {incomingRequests.length}
            </span>
          </div>
          <div className="space-y-3">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={req.itemImage}
                    alt={req.itemName}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-gray-900">{req.itemName}</h3>
                    <p className="text-xs text-gray-500">
                      Requested by <span className="font-medium text-gray-700">{req.requesterName}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {req.startDate} → {req.endDate}
                      </span>
                    </div>
                    {req.message && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span>{req.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
                      req.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 ring-amber-200'
                        : req.status === 'accepted'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : req.status === 'completed'
                            ? 'bg-teal-50 text-teal-700 ring-teal-200'
                            : 'bg-red-50 text-red-600 ring-red-200'
                    }`}
                  >
                    {req.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                    {req.status === 'accepted' && <Check className="h-3.5 w-3.5" />}
                    {req.status === 'rejected' && <X className="h-3.5 w-3.5" />}
                    {req.status === 'completed' && <Check className="h-3.5 w-3.5" />}
                    {req.status}
                  </span>

                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const result = await updateRequestStatus(req.id, 'accepted');
                          if (result?.error) {
                            setDeleteError(result.error);
                            setTimeout(() => setDeleteError(null), 4000);
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={async () => {
                          await updateRequestStatus(req.id, 'rejected');
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                  {req.status === 'accepted' && (
                    <button
                      onClick={async () => {
                        const result = await markReturned(req.id);
                        if (result?.error) {
                          setDeleteError(result.error);
                          setTimeout(() => setDeleteError(null), 4000);
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Mark Returned
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listings */}
      {myListings.length > 0 ? (
        <>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Your listings ({myListings.length})
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {myListings.map((item) => (
              <div key={item.id} className="relative group">
                <ItemCard item={item} onClick={() => {}} />
                <button
                  onClick={() => handleDeleteClick(item.id, item.name)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-red-500 opacity-0 shadow-sm transition-all hover:bg-red-50 group-hover:opacity-100"
                  title="Delete item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <Package className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No items listed yet</h3>
          <p className="mt-1 max-w-xs text-sm text-gray-500">
            List your first item to start lending to fellow students.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            List an Item
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Delete this item?</h2>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to permanently delete <span className="font-semibold text-gray-700">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-200 transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
