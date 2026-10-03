import { useState } from 'react';
import { Leaf, ArrowRight, GraduationCap, LogIn } from 'lucide-react';

export function Welcome({ onSignUp, onSignIn }: { onSignUp: () => void; onSignIn: () => void }) {
  const [transitioning, setTransitioning] = useState(false);

  const handleAction = (callback: () => void) => {
    setTransitioning(true);
    setTimeout(callback, 300);
  };

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-lavender-50 via-white to-babyblue-50 px-6 py-8 transition-opacity duration-300 ${
        transitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex w-full max-w-sm flex-col items-center">
        {/* Logo */}
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-lavender-400 to-lavender-600 shadow-soft-lg">
          <Leaf className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-800">
          Welcome to <span className="text-lavender-600">ReNeCT</span>
        </h1>
        <p className="mb-10 text-center text-sm text-gray-400">
          Your campus community for borrowing, lending, and reusing. Let's get started.
        </p>

        {/* Action buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => handleAction(onSignUp)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 py-3.5 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg active:scale-[0.97]"
          >
            <GraduationCap className="h-4 w-4" />
            Sign Up
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleAction(onSignIn)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-lavender-100 bg-white py-3.5 text-sm font-semibold text-gray-600 transition-all hover:bg-lavender-50 active:scale-[0.97]"
          >
            <LogIn className="h-4 w-4" />
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
