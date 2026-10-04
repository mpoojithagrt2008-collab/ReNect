import { useState } from 'react';
import { Leaf, ArrowRight, IdCard, School, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useApp } from '../store';

function validateCollegeId(studentId: string): string | null {
  if (!studentId.trim()) return 'College ID is required.';
  const id = studentId.trim().toUpperCase();
  if (!/^[RSON][0-9]{6}$/.test(id)) {
    return 'College ID must be 7 characters: R/S/O/N followed by 6 digits (e.g. R123456).';
  }
  return null;
}

function validateCollegeIdWithEmail(studentId: string, email: string): string | null {
  const baseErr = validateCollegeId(studentId);
  if (baseErr) return baseErr;
  const id = studentId.trim().toUpperCase();
  const emailLocalPart = email.trim().split('@')[0].toUpperCase();
  const expectedId = emailLocalPart.substring(0, 7);
  if (id !== expectedId) {
    return 'College ID must match the first 7 characters of your email address.';
  }
  return null;
}

const inputClass = (hasError: boolean) =>
  `w-full rounded-2xl border bg-lavender-50/50 py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-lavender-100 focus:border-lavender-400 focus:ring-lavender-100'
  }`;

export function CompleteProfile() {
  const { user, completeProfileSetup } = useApp();
  const [studentId, setStudentId] = useState('');
  const [college, setCollege] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const email = user?.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    const idErr = validateCollegeIdWithEmail(studentId, email);
    if (idErr) { setFieldError(idErr); return; }
    if (!college.trim()) { setFieldError('College name is required.'); return; }
    setLoading(true);
    try {
      const result = await completeProfileSetup(studentId.trim().toUpperCase(), college.trim());
      if (result.error) setError(result.error);
    } catch {
      setError('Failed to save profile. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-lavender-50 via-white to-babyblue-50 px-4 py-8">
      <div className="flex w-full max-w-md flex-col">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-lavender-400 to-lavender-600 shadow-soft-lg">
            <Leaf className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">
            Re<span className="text-lavender-600">Nect</span>
          </h1>
        </div>

        <div className="rounded-3xl border border-lavender-100 bg-white/80 p-6 shadow-soft-lg backdrop-blur-sm">
          <div className="mb-5 text-center">
            <h2 className="text-lg font-semibold text-gray-800">Complete Your Profile</h2>
            <p className="mt-1 text-xs text-gray-500">
              You're signed in as <span className="font-medium text-gray-700">{email}</span>.<br />
              Please enter your College ID to continue.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">College ID</label>
              <div className="relative">
                <IdCard className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-lavender-400" />
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => { setStudentId(e.target.value); setFieldError(null); }}
                  placeholder="e.g. R123456"
                  className={inputClass(!!fieldError)}
                />
              </div>
              {fieldError && <p className="mt-1 text-xs text-red-500">{fieldError}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">College</label>
              <div className="relative">
                <School className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-lavender-400" />
                <input
                  type="text"
                  value={college}
                  onChange={(e) => { setCollege(e.target.value); setFieldError(null); }}
                  placeholder="e.g. RGUKT RKV"
                  className={inputClass(false)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 py-3 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>) : (<>Complete Setup <ArrowRight className="h-4 w-4" /></>)}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Your College ID must match your college email address
        </p>
      </div>
    </div>
  );
}
