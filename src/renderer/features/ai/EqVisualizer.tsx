import { cn } from '@/renderer/lib/utils';

// A six-bar audio-equalizer affordance for the "listening" state (B1 tokens, no
// hex — §5.6). Pure presentational: `active` toggles the `animate-pp-eq` bounce
// (staggered per bar); idle bars sit short and dim. Decorative only — the truthful
// listening state is conveyed in text/aria by the caller, so this is aria-hidden.

const BARS = [
  { h: 'h-2', delay: '0ms' },
  { h: 'h-4', delay: '120ms' },
  { h: 'h-3', delay: '240ms' },
  { h: 'h-5', delay: '90ms' },
  { h: 'h-3', delay: '300ms' },
  { h: 'h-2', delay: '180ms' },
] as const;

export function EqVisualizer({ active, className }: { active: boolean; className?: string }) {
  return (
    <div className={cn('flex h-5 items-end gap-0.5', className)} aria-hidden>
      {BARS.map((bar, i) => (
        <span
          key={i}
          className={cn(
            'w-1 origin-bottom rounded-full',
            bar.h,
            active ? 'animate-pp-eq bg-pp-accent' : 'h-1.5 bg-pp-border-strong',
          )}
          style={active ? { animationDelay: bar.delay } : undefined}
        />
      ))}
    </div>
  );
}

export default EqVisualizer;
