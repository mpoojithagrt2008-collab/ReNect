import { useState } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  CreditCard,
  Banknote,
  CheckCircle2,
  Clock,
  XCircle,
  Info,
} from 'lucide-react';
import type { PaymentMethod, PaymentRecord } from '../types';

interface Props {
  itemName: string;
  amount: number;
  purpose: 'rental' | 'penalty';
  existingPayments: PaymentRecord[];
  onSubmit: (method: PaymentMethod) => Promise<{ error: string | null }>;
  onVerify?: (paymentId: string, approved: boolean) => Promise<{ error: string | null }>;
  isOwner: boolean;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-50 text-amber-700' },
  pending_verification: { label: 'Awaiting Verification', icon: Clock, color: 'bg-sky-50 text-sky-700' },
  paid: { label: 'Paid', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700' },
  failed: { label: 'Failed', icon: XCircle, color: 'bg-red-50 text-red-600' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-gray-100 text-gray-500' },
};

export function PaymentModal({ itemName, amount, purpose, existingPayments, onSubmit, onVerify, isOwner, onClose }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('offline');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await onSubmit(method);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    }
  };

  const handleVerify = async (paymentId: string, approved: boolean) => {
    if (!onVerify) return;
    setVerifying(true);
    setError(null);
    const result = await onVerify(paymentId, approved);
    setVerifying(false);
    if (result.error) setError(result.error);
  };

  const hasPendingPayment = existingPayments.some(p => p.status === 'pending' || p.status === 'pending_verification');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {purpose === 'rental' ? 'Rental Payment' : 'Damage Penalty Payment'}
          </h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">{itemName}</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">₹{amount}</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Existing payments */}
        {existingPayments.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-medium text-gray-500">Payment History</p>
            {existingPayments.map((p) => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              return (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    {p.method === 'online' ? <CreditCard className="h-4 w-4 text-gray-400" /> : <Banknote className="h-4 w-4 text-gray-400" />}
                    <span className="text-xs font-medium capitalize text-gray-700">{p.method}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                    {isOwner && p.status === 'pending_verification' && onVerify && (
                      <div className="flex gap-1">
                        <button onClick={() => handleVerify(p.id, true)} disabled={verifying} className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60">
                          Verify
                        </button>
                        <button onClick={() => handleVerify(p.id, false)} disabled={verifying} className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New payment form — only for borrower, and only if no pending payment */}
        {!isOwner && !hasPendingPayment && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setMethod('online')} className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all ${method === 'online' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                  <CreditCard className="h-6 w-6" />
                  <span className="text-sm font-medium">Online</span>
                </button>
                <button type="button" onClick={() => setMethod('offline')} className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all ${method === 'offline' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                  <Banknote className="h-6 w-6" />
                  <span className="text-sm font-medium">Offline</span>
                </button>
              </div>
            </div>

            {method === 'offline' && (
              <div className="flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                <p className="text-xs text-sky-700">Offline payments require verification by the owner before being marked as paid.</p>
              </div>
            )}
            {method === 'online' && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-700">Online payment requires Stripe configuration. Please select Offline for now or contact support.</p>
              </div>
            )}

            <button type="submit" disabled={submitting || (method === 'online')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
              {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>) : `Submit ${method === 'online' ? 'Online' : 'Offline'} Payment`}
            </button>
          </form>
        )}

        {!isOwner && hasPendingPayment && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-700">A payment is already in progress. Please wait for it to be resolved before submitting another.</p>
          </div>
        )}

        {isOwner && existingPayments.length === 0 && (
          <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <p className="text-xs text-gray-500">No payments have been submitted yet. The borrower will see payment options here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
