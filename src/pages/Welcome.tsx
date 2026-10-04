import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import campusImage from '../components/images.jpeg';

export function Welcome({ onSignUp }: { onSignUp: () => void; onSignIn: () => void }) {
  const [transitioning, setTransitioning] = useState(false);

  const handleAction = () => {
    setTransitioning(true);
    setTimeout(onSignUp, 300);
  };

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-lavender-50 via-white to-babyblue-50 px-5 py-6 transition-opacity duration-300 sm:px-6 sm:py-8 ${
        transitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex w-full max-w-sm flex-col items-center">
        <div className="w-full overflow-hidden rounded-3xl border border-white/80 bg-white shadow-soft-lg">
          <img
            src={campusImage}
            alt="College campus"
            className="h-52 w-full object-cover sm:h-60"
          />
        </div>

        <h1 className="mt-8 text-center text-2xl font-bold tracking-tight text-gray-800 sm:text-3xl">
          Welcome to ReNect!
        </h1>

        <p className="mt-3 max-w-xs text-center text-sm leading-relaxed text-gray-500 sm:text-base">
          ReNect allows students to rent out their items to others or rent the items they need, all within our campus.
        </p>

        <button
          onClick={handleAction}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 py-3.5 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg active:scale-[0.97]"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="mt-6 flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-lavender-300" />
          <span className="h-2 w-2 rounded-full bg-lavender-500" />
          <span className="h-2 w-2 rounded-full bg-lavender-300" />
        </div>
      </div>
    </div>
  );
}
