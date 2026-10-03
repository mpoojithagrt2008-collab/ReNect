import { useState } from 'react';
import {
  Leaf,
  ArrowRight,
  GraduationCap,
  Mail,
  IdCard,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader2,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../store';

type Mode = 'login' | 'signup' | 'otp';

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'College email is required.';
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'Please enter a valid email address (e.g. name@college.edu).';
  return null;
}

function validateCollegeId(studentId: string, email: string): string | null {
  if (!studentId.trim()) return 'College ID is required.';
  const id = studentId.trim().toUpperCase();
  if (!/^[RSON][0-9]{6}$/.test(id)) {
    return 'College ID must be 7 characters: R/S/O/N followed by 6 digits (e.g. R123456).';
  }
  const emailLocalPart = email.trim().split('@')[0].toUpperCase();
  const expectedId = emailLocalPart.substring(0, 7);
  if (id !== expectedId) {
    return 'College ID must match the first 7 characters of your email address.';
  }
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least 1 uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least 1 lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least 1 number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least 1 special character.';
  return null;
}

function passwordChecks(password: string) {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: '1 uppercase letter', met: /[A-Z]/.test(password) },
    { label: '1 lowercase letter', met: /[a-z]/.test(password) },
    { label: '1 number', met: /[0-9]/.test(password) },
    { label: '1 special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function Login() {
  const { login, signup, verifyOtp, resendOtp } = useApp();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    setFieldErrors({});
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const emailErr = validateEmail(email);
    if (emailErr) { setFieldErrors({ email: emailErr }); return; }
    if (!password) { setFieldErrors({ password: 'Password is required.' }); return; }
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.error) setError(result.error);
    } catch {
      setError('Unable to connect to the server. Please check your internet connection and try again.');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Student name is required.';
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;
    if (!studentId.trim()) errors.studentId = 'College ID is required.';
    else {
      const idErr = validateCollegeId(studentId, email);
      if (idErr) errors.studentId = idErr;
    }
    const pwErr = validatePassword(password);
    if (pwErr) errors.password = pwErr;
    if (!college.trim()) errors.college = 'College name is required.';
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoading(true);
    try {
      const result = await signup(name.trim(), email.trim(), password, studentId.trim(), college.trim() || 'IIT Bombay');
      if (result.error) {
        setError(result.error);
      } else if (result.needsEmailConfirmation) {
        setMode('otp');
        setSuccess(`A verification code has been sent to ${email.trim()}. Please enter it below.`);
        startResendCooldown();
      } else {
        setSuccess('Account created successfully! You can now sign in.');
        setMode('login');
        setPassword('');
      }
    } catch {
      setError('Unable to connect to the server. Please check your internet connection and try again.');
    }
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = pasted.split('');
      while (newDigits.length < 6) newDigits.push('');
      setOtpDigits(newDigits);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpDigits.join('');
    if (token.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp(email.trim(), token);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Email verified successfully! You can now sign in.');
        setMode('login');
        setPassword('');
        setOtpDigits(['', '', '', '', '', '']);
      }
    } catch {
      setError('Failed to verify code. Please try again.');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const result = await resendOtp(email.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('A new verification code has been sent to your email.');
        startResendCooldown();
      }
    } catch {
      setError('Failed to resend code.');
    }
    setLoading(false);
  };

  const checks = passwordChecks(password);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 py-8">
      <div className="flex w-full max-w-md flex-col">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Re<span className="text-emerald-600">Nect</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Borrow, lend and reuse within your campus
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-emerald-100/40">
          {mode !== 'otp' && (
            <div className="mb-5 flex gap-2 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  mode === 'login' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  mode === 'signup' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <p className="text-xs text-emerald-600">{success}</p>
            </div>
          )}

          {mode === 'otp' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                  <KeyRound className="h-6 w-6 text-emerald-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Verify your email</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the 6-digit code sent to <span className="font-medium text-gray-700">{email}</span>
                </p>
              </div>

              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="h-12 w-12 rounded-xl border border-gray-200 bg-gray-50 text-center text-lg font-bold text-gray-900 outline-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:shadow-emerald-300 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Code
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  Back to sign in
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 disabled:text-gray-400"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          ) : mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">College Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' })); }}
                    placeholder="name@college.edu"
                    className={`w-full rounded-xl border bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:bg-white focus:ring-2 ${fieldErrors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-100'}`}
                  />
                </div>
                {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' })); }}
                    placeholder="Enter your password"
                    className={`w-full rounded-xl border bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:bg-white focus:ring-2 ${fieldErrors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-100'}`}
                  />
                </div>
                {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:shadow-emerald-300 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>) : (<>Sign In <ArrowRight className="h-4 w-4" /></>)}
              </button>
              <p className="text-center text-xs text-gray-400">
                Don't have an account?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-emerald-600 hover:text-emerald-700">Sign up here</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Student Name</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' })); }}
                    placeholder="e.g. Aarav Sharma"
                    className={`w-full rounded-xl border bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:bg-white focus:ring-2 ${fieldErrors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-100'}`}
                  />
                </div>
                {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">College Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' })); }}
                    placeholder="name@college.edu"
                    className={`w-full rounded-xl border bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:bg-white focus:ring-2 ${fieldErrors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-100'}`}
                  />
                </div>
                {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">College ID</label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => { setStudentId(e.target.value); if (fieldErrors.studentId) setFieldErrors((p) => ({ ...p, studentId: '' })); }}
                    placeholder="e.g. R123456"
                    className={`w-full rounded-xl border bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:bg-white focus:ring-2 ${fieldErrors.studentId ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-100'}`}
                  />
                </div>
                {fieldErrors.studentId && <p className="mt-1 text-xs text-red-500">{fieldErrors.studentId}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">College</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => { setCollege(e.target.value); if (fieldErrors.college) setFieldErrors((p) => ({ ...p, college: '' })); }}
                    placeholder="e.g. IIT Bombay"
                    className={`w-full rounded-xl border bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:bg-white focus:ring-2 ${fieldErrors.college ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-100'}`}
                  />
                </div>
                {fieldErrors.college && <p className="mt-1 text-xs text-red-500">{fieldErrors.college}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setShowPasswordReqs(true); if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' })); }}
                    onFocus={() => setShowPasswordReqs(true)}
                    placeholder="Create a strong password"
                    className={`w-full rounded-xl border bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:bg-white focus:ring-2 ${fieldErrors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-100'}`}
                  />
                </div>
                {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
                {showPasswordReqs && (
                  <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2.5">
                    <p className="mb-1.5 text-[11px] font-medium text-gray-500">Password requirements:</p>
                    <div className="space-y-1">
                      {checks.map((check) => (
                        <div key={check.label} className="flex items-center gap-1.5">
                          {check.met ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <div className="h-3 w-3 rounded-full border border-gray-300" />}
                          <span className={`text-[11px] ${check.met ? 'text-emerald-600' : 'text-gray-400'}`}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:shadow-emerald-300 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>) : (<>Create Account <ArrowRight className="h-4 w-4" /></>)}
              </button>
              <p className="text-center text-xs text-gray-400">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')} className="font-semibold text-emerald-600 hover:text-emerald-700">Sign in here</button>
              </p>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          By signing in you agree to ReNect's community guidelines
        </p>
      </div>
    </div>
  );
}
