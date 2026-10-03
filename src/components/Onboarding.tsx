import { useState, useEffect, useRef } from 'react';
import { Leaf, ArrowRight } from 'lucide-react';

const ONBOARDING_KEY = 'renect_onboarding_complete';

const LETTERS = [
  { char: 'R', className: 'ob-letter-r', delay: 200 },
  { char: 'e', className: 'ob-letter-e1', delay: 750 },
  { char: 'N', className: 'ob-letter-n', delay: 1250 },
  { char: 'e', className: 'ob-letter-e2', delay: 1750 },
  { char: 'C', className: 'ob-letter-c', delay: 2250 },
  { char: 'T', className: 'ob-letter-t', delay: 2750 },
];

const LETTER_ANIM_MS = 700;
const LAST_LETTER_START = 2750;
const LOGO_SETTLE_START = LAST_LETTER_START + LETTER_ANIM_MS;
const LEAF_START = LOGO_SETTLE_START + 350;
const TAGLINE_START = LOGO_SETTLE_START + 450;
const BUTTON_START = TAGLINE_START + 600;
const ANIMATION_COMPLETE = BUTTON_START + 550;

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markOnboardingComplete() {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {
    // ignore
  }
}

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [pressed, setPressed] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setAnimationComplete(true), ANIMATION_COMPLETE);
    timersRef.current.push(t);
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  const handleStart = () => {
    if (!animationComplete || pressed) return;
    setPressed(true);
    markOnboardingComplete();
    setTimeout(() => {
      setFadingOut(true);
      setTimeout(onComplete, 400);
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-lavender-50 via-white to-babyblue-50 px-6 transition-opacity duration-400 ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Logo container */}
      <div
        className="relative flex items-center justify-center"
        style={{
          animation: `ob-logo-settle 400ms ease-out ${LOGO_SETTLE_START}ms both`,
        }}
      >
        <h1 className="flex items-center text-5xl font-extrabold tracking-tight text-gray-800 sm:text-6xl md:text-7xl">
          {LETTERS.map((letter, i) => (
            <span
              key={i}
              className="inline-block"
              style={{
                animation: `${letter.className} ${LETTER_ANIM_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${letter.delay}ms both`,
              }}
            >
              {letter.char === 'R' || letter.char === 'N' || letter.char === 'C' || letter.char === 'T' ? (
                letter.char
              ) : (
                <span className="text-lavender-600">{letter.char}</span>
              )}
            </span>
          ))}
        </h1>

        {/* Leaf */}
        <div
          className="absolute"
          style={{
            top: '100%',
            left: '50%',
            marginLeft: '-12px',
            marginTop: '16px',
            animation: `ob-leaf-fall 600ms cubic-bezier(0.45, 0.05, 0.55, 0.95) ${LEAF_START}ms both`,
          }}
        >
          <Leaf className="h-6 w-6 text-mint-500" strokeWidth={2.5} />
        </div>
      </div>

      {/* Tagline */}
      <p
        className="mt-16 text-sm font-semibold tracking-wide text-gray-500 sm:text-base"
        style={{
          animation: `ob-tagline 550ms cubic-bezier(0.22, 1, 0.36, 1) ${TAGLINE_START}ms both`,
        }}
      >
        Rent &bull; Share &bull; Connect
      </p>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!animationComplete}
        className={`mt-10 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lavender-500 to-lavender-600 px-8 py-3.5 text-sm font-semibold text-white shadow-soft-lg transition-all hover:shadow-lg ${
          animationComplete ? 'cursor-pointer' : 'cursor-default opacity-0 pointer-events-none'
        } ${pressed ? 'scale-[0.97]' : 'scale-100'}`}
        style={{
          animation: animationComplete
            ? `ob-start-button 500ms cubic-bezier(0.34, 1.56, 0.64, 1) ${BUTTON_START}ms both`
            : 'none',
        }}
      >
        START
        <ArrowRight className="h-4 w-4" />
      </button>

      {/* Subtle decorative dots */}
      <div className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-30">
        <span className="h-1.5 w-1.5 rounded-full bg-lavender-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-lavender-400" />
        <span className="h-1.5 w-1.5 rounded-full bg-lavender-300" />
      </div>
    </div>
  );
}
