import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Package, Check, X, AlertTriangle,
  Camera, Image as ImageIcon, Loader2, AlertCircle, Trash2,
} from 'lucide-react';
import { useApp } from '../store';
import { CATEGORIES, CONDITIONS } from '../data';
import { ItemCard } from '../components/ItemCard';
import { ItemDetails } from './ItemDetails';
import type { Category, Condition, PricingType, Item } from '../types';

export function MyItems({ navigate }: { navigate: (p: import('../components/Navigation').Page) => void }) {
  const { user, items, addListing, deleteListing } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'unavailable'>('available');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Books');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<Condition>('Good');
  const [pricePerHour, setPricePerHour] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [pricingType, setPricingType] = useState<PricingType>('day');
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

  const myListings = useMemo(() => items.filter((i) => i.ownerId === user?.id), [items, user]);
  const availableListings = useMemo(() => myListings.filter((i) => i.availability === 'available'), [myListings]);
  const unavailableListings = useMemo(() => myListings.filter((i) => i.availability !== 'available'), [myListings]);

  useEffect(() => {
    if (selectedItem) {
      const fresh = items.find((i) => i.id === selectedItem.id);
      if (fresh && fresh.availability !== selectedItem.availability) {
        setSelectedItem(fresh);
      }
    }
  }, [items, selectedItem]);

  const resetForm = () => {
    setName(''); setCategory('Books'); setDescription(''); setCondition('Good');
    setPricePerHour(''); setPricePerDay(''); setPricingType('day');
    setLocation('');
    setImageFile(null); setImagePreview(null); setSubmitError(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setSubmitError('Please select an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setSubmitError('Image must be less than 10MB.'); return; }
    setSubmitError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = () => { setImageFile(null); setImagePreview(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitError(null); setSubmitting(true);
    const hourly = pricePerHour ? Number(pricePerHour) : 0;
    const daily = pricePerDay ? Number(pricePerDay) : 0;
    if (hourly === 0 && daily === 0) {
      setSubmitting(false);
      setSubmitError('Please set at least one price (hourly or daily).');
      return;
    }
    const result = await addListing({
      name, category, description, condition,
      pricePerHour: hourly,
      pricePerDay: daily,
      pricingType,
      location: location || 'Campus', imageFile,
    });
    setSubmitting(false);
    if (result.error) { setSubmitError(result.error); }
    else { resetForm(); setShowForm(false); }
  };

  const handleDeleteClick = (itemId: string, itemName: string) => {
    setDeleteError(null); setDeleteTarget({ id: itemId, name: itemName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteListing(deleteTarget.id);
    setDeleting(false);
    if (result.success) {
      setDeleteSuccess(`"${deleteTarget.name}" has been deleted.`);
      setTimeout(() => setDeleteSuccess(null), 3000);
    } else { setDeleteError(result.message ?? 'Unable to delete item.'); }
    setDeleteTarget(null);
  };

  const inputClass = 'w-full rounded-2xl border border-lavender-100 bg-lavender-50/40 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-lavender-400 focus:bg-white focus:ring-2 focus:ring-lavender-100';

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">My Items</h1>
          <p className="mt-1 text-sm text-gray-400">Manage your listed items</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg active:scale-[0.98]">
          <Plus className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">List an Item</span>
          <span className="sm:hidden">List</span>
        </button>
      </div>

      {deleteSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3">
          <Check className="h-4 w-4 shrink-0 text-mint-600" />
          <p className="text-xs text-mint-700">{deleteSuccess}</p>
        </div>
      )}

      {deleteError && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-700">{deleteError}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-3xl border border-lavender-100 bg-white p-5 shadow-card md:p-6">
          <h3 className="mb-4 text-base font-semibold text-gray-800">List a new item</h3>

          {submitError && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-xs text-red-600">{submitError}</p>
            </div>
          )}

          {/* Image upload */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-600">Item Photo</label>
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-2xl border border-lavender-100">
                <img src={imagePreview} alt="Preview" className="aspect-[4/3] w-full object-cover" />
                <button type="button" onClick={removeImage}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-soft transition-colors hover:bg-red-50">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-lavender-200 bg-lavender-50/50 py-6 transition-all hover:border-lavender-300 hover:bg-lavender-50">
                  <Camera className="h-7 w-7 text-lavender-500" />
                  <span className="text-sm font-medium text-lavender-700">Take Photo</span>
                  <span className="text-[11px] text-gray-400">Use your camera</span>
                </button>
                <button type="button" onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-6 transition-all hover:border-gray-300 hover:bg-gray-50">
                  <ImageIcon className="h-7 w-7 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">Choose from Gallery</span>
                  <span className="text-[11px] text-gray-400">Select an existing image</span>
                </button>
              </div>
            )}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            {!imagePreview && <p className="mt-2 text-[11px] text-gray-400">Optional — a category placeholder will be used if no photo is uploaded.</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Item Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mechanical Pencil Set" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={inputClass}>
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Description</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe your item..." className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value as Condition)} className={inputClass}>
                {CONDITIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Hostel H-4, Campus" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Price per Hour (₹) <span className="text-gray-400">— 0 if not applicable</span></label>
              <input type="number" min="0" value={pricePerHour} onChange={(e) => setPricePerHour(e.target.value)} placeholder="e.g. 20" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Price per Day (₹) <span className="text-gray-400">— 0 if not applicable</span></label>
              <input type="number" min="0" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} placeholder="e.g. 150" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Primary Pricing Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPricingType('hour')}
                  className={`rounded-2xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${pricingType === 'hour' ? 'border-lavender-300 bg-lavender-50 text-lavender-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                  Per Hour
                </button>
                <button type="button" onClick={() => setPricingType('day')}
                  className={`rounded-2xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${pricingType === 'day' ? 'border-lavender-300 bg-lavender-50 text-lavender-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                  Per Day
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">Set both prices if you want to offer both hourly and daily rentals. The primary type determines how the item is displayed first.</p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 py-2.5 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50">
              {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Publishing...</>) : 'Publish Item'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }} disabled={submitting}
              className="rounded-2xl border border-lavender-100 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-lavender-50 disabled:opacity-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Listings — only items the current user has listed */}
      {myListings.length > 0 ? (
        <>
          {/* Tabs */}
          <div className="mb-4 flex gap-2">
            <button onClick={() => setActiveTab('available')}
              className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${activeTab === 'available' ? 'bg-lavender-100 text-lavender-700' : 'text-gray-500 hover:bg-lavender-50'}`}>
              Available ({availableListings.length})
            </button>
            <button onClick={() => setActiveTab('unavailable')}
              className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${activeTab === 'unavailable' ? 'bg-lavender-100 text-lavender-700' : 'text-gray-500 hover:bg-lavender-50'}`}>
              Unavailable ({unavailableListings.length})
            </button>
          </div>

          {activeTab === 'available' ? (
            availableListings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {availableListings.map((item) => (
                  <div key={item.id} className="relative group">
                    <ItemCard item={item} onClick={() => {}} />
                    <button onClick={() => handleDeleteClick(item.id, item.name)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 opacity-0 shadow-soft transition-all hover:bg-red-50 group-hover:opacity-100"
                      title="Delete item">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-lavender-200 bg-white py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint-50">
                  <Package className="h-8 w-8 text-mint-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">No available items</h3>
                <p className="mt-1 max-w-xs text-sm text-gray-400">All your items are currently rented out.</p>
              </div>
            )
          ) : (
            unavailableListings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {unavailableListings.map((item) => (
                  <div key={item.id} className="relative group">
                    <ItemCard item={item} onClick={() => setSelectedItem(item)} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-lavender-200 bg-white py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-babyblue-50">
                  <Package className="h-8 w-8 text-babyblue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">No rented items</h3>
                <p className="mt-1 max-w-xs text-sm text-gray-400">None of your items are currently rented out.</p>
              </div>
            )
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-lavender-200 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lavender-50">
            <Package className="h-8 w-8 text-lavender-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-800">No items listed yet</h3>
          <p className="mt-1 max-w-xs text-sm text-gray-400">List your first item to start lending to fellow students.</p>
          <button onClick={() => setShowForm(true)}
            className="mt-5 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg">
            <Plus className="h-4 w-4" /> List an Item
          </button>
        </div>
      )}

      {/* Item details view for unavailable items */}
      {selectedItem && (
        <ItemDetails item={selectedItem} onBack={() => setSelectedItem(null)} />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-4xl bg-white p-6 shadow-soft-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50"><Trash2 className="h-6 w-6 text-red-500" /></div>
            <h2 className="text-lg font-bold text-gray-800">Delete this item?</h2>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to permanently delete <span className="font-semibold text-gray-700">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={handleDeleteConfirm} disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-50">
                {deleting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>) : 'Yes, Delete'}
              </button>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="rounded-2xl border border-lavender-100 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-lavender-50 disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
