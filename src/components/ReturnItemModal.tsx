import { useState, useRef } from 'react';
import {
  X,
  Camera,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import type { ReturnCondition } from '../types';

interface Props {
  itemName: string;
  onSubmit: (photoFile: File, condition: ReturnCondition, note: string) => Promise<{ error: string | null }>;
  onClose: () => void;
}

const CONDITIONS: { value: ReturnCondition; label: string; color: string }[] = [
  { value: 'good', label: 'Good condition', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'minor_damage', label: 'Minor damage', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'damaged', label: 'Damaged', color: 'border-red-300 bg-red-50 text-red-700' },
];

export function ReturnItemModal({ itemName, onSubmit, onClose }: Props) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [condition, setCondition] = useState<ReturnCondition>('good');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be less than 10MB.'); return; }
    setError(null);
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) { setError('Please upload a return-condition photo.'); return; }
    setError(null);
    setSubmitting(true);
    const result = await onSubmit(photoFile, condition, note);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Return Submitted</h2>
          <p className="mt-2 text-sm text-gray-500">
            Your return for <span className="font-semibold text-gray-700">{itemName}</span> has been submitted. The owner will review the return photo and confirm.
          </p>
          <button onClick={onClose} className="mt-6 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Return Item</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-gray-50 px-4 py-2.5">
          <p className="text-sm font-semibold text-gray-900">{itemName}</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Return Photo <span className="text-red-500">*</span></label>
            {photoPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-gray-200">
                <img src={photoPreview} alt="Return proof" className="aspect-[4/3] w-full object-cover" />
                <button type="button" onClick={removePhoto} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-red-500 shadow-sm transition-colors hover:bg-red-50">
                  <X className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => { removePhoto(); cameraInputRef.current?.click(); }} className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-white">
                  <RotateCcw className="h-3.5 w-3.5" /> Change
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 py-6 transition-all hover:border-emerald-300 hover:bg-emerald-50">
                  <Camera className="h-7 w-7 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700">Take Photo</span>
                </button>
                <button type="button" onClick={() => galleryInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-6 transition-all hover:border-gray-300 hover:bg-gray-50">
                  <ImageIcon className="h-7 w-7 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Gallery</span>
                </button>
              </div>
            )}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Item Condition</label>
            <div className="space-y-2">
              {CONDITIONS.map((c) => (
                <button key={c.value} type="button" onClick={() => setCondition(c.value)} className={`flex w-full items-center gap-2.5 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${condition === c.value ? c.color : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${condition === c.value ? 'border-current' : 'border-gray-300'}`}>
                    {condition === c.value && <div className="h-2 w-2 rounded-full bg-current" />}
                  </div>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Return Note <span className="text-gray-400">(optional)</span></label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. Returned in the same condition." className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
          </div>

          <button type="submit" disabled={submitting || !photoFile} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
            {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>) : 'Submit Return'}
          </button>
        </form>
      </div>
    </div>
  );
}
