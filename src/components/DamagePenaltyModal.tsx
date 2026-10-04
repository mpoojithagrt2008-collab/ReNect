import { useState } from 'react';
import { X, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { formatOwnerName } from './ui';

interface Props {
  itemName: string;
  borrowerName: string;
  borrowerStudentId?: string;
  onSubmit: (amount: number, reason: string) => Promise<{ error: string | null }>;
  onClose: () => void;
}

export function DamagePenaltyModal({ itemName, borrowerName, borrowerStudentId, onSubmit, onClose }: Props) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError('Please enter a valid penalty amount.'); return; }
    setError(null);
    setSubmitting(true);
    const result = await onSubmit(amt, reason);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Damage Penalty</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-700">
            Issue a penalty to <span className="font-semibold">{formatOwnerName(borrowerName, borrowerStudentId || '')}</span> for damage to <span className="font-semibold">{itemName}</span>. The borrower will be notified and can pay via online or offline method.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Penalty Amount (₹)</label>
            <input type="number" min="1" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Reason <span className="text-gray-400">(optional)</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="e.g. Screen scratch on the calculator." className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
          </div>

          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-200 transition-all hover:bg-amber-700 active:scale-[0.98] disabled:opacity-60">
            {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>) : 'Issue Penalty'}
          </button>
        </form>
      </div>
    </div>
  );
}
