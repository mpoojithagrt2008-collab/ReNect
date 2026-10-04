import { useState } from 'react';
import { Leaf, ArrowRight } from 'lucide-react';
import { CAMPUS_IMAGE } from '../components/Onboarding';

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
        <div className="mb-3 flex flex-col items-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-800">
            Re<span className="text-lavender-600">Nect</span>
          </h1>
          <Leaf className="mt-1.5 h-5 w-5 text-lavender-500" strokeWidth={2.5} />
        </div>

        {/* Campus image */}
        <div className="mb-6 mt-4 w-full overflow-hidden rounded-3xl shadow-soft-lg">
          <img
            src={CAMPUS_IMAGE}
            alt="College campus"
            className="h-44 w-full object-cover"
          />
        </div>

        {/* Heading */}
        <h2 className="mb-3 text-center text-2xl font-bold tracking-tight text-gray-800">
          Welcome to ReNect!
        </h2>

        {/* Explanation */}
        <p className="mb-8 text-center text-sm leading-relaxed text-gray-500">
          ReNect allows students to rent out their items to others or rent the items they need, all within our campus.
        </p>

        {/* Action buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => handleAction(onSignUp)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 py-3.5 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg active:scale-[0.97]"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Onboarding indicators */}
        <div className="mt-6 flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-lavender-300" />
          <span className="h-2 w-2 rounded-full bg-lavender-500" />
          <span className="h-2 w-2 rounded-full bg-lavender-300" />
        </div>
      </div>
    </div>
  );
}
