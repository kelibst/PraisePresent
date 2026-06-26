import { useEffect, useState } from 'react';
import type { PresentState } from '@/shared/schemas/present';

// Full-screen projector view. Subscribes to main's live state and renders it,
// failing safe to black — never a stack trace on the projector (CLAUDE.md §5.7).
const FAILSAFE: PresentState = { mode: 'black', slide: null };

export default function AudienceView() {
  const [state, setState] = useState<PresentState>(FAILSAFE);

  useEffect(() => window.api.present.onState(setState), []);

  if (state.mode === 'slide' && state.slide) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
        <p className="px-16 text-center text-5xl font-semibold leading-tight">{state.slide.text}</p>
      </div>
    );
  }
  if (state.mode === 'blank') {
    return <div className="h-screen w-screen bg-neutral-900" />;
  }
  // black, clear, and any unexpected state -> black (fail-safe).
  return <div className="h-screen w-screen bg-black" />;
}
