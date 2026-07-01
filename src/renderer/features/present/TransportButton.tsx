import { cn } from '@/renderer/lib/utils';

// One transport button in the live cockpit footer. `primary` is the big sage
// Next; `secondary` is the muted surface variant. `kbd` renders a small key hint
// chip (§5.4 — keyboard-first). `grow` lets the primary Next flex to fill the
// row, matching the design. Pure presentational atom — no data, no IPC (§1.3).

export type TransportButtonProps = {
  label: string;
  kbd?: string;
  tone: 'primary' | 'secondary';
  grow?: boolean;
  onClick: () => void;
};

export default function TransportButton({ label, kbd, tone, grow, onClick }: TransportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        grow && 'flex-1',
        tone === 'primary'
          ? 'bg-pp-success text-pp-surface-live hover:bg-pp-success/90'
          : 'bg-pp-surface-2 text-pp-text-body ring-1 ring-inset ring-pp-border-strong/60 hover:bg-pp-surface-alt',
      )}
    >
      {label}
      {kbd && (
        <kbd
          className={cn(
            'rounded px-1.5 py-0.5 text-[10px] font-medium leading-none',
            tone === 'primary'
              ? 'bg-pp-surface-live/25 text-pp-surface-live'
              : 'bg-pp-surface-1 text-pp-text-muted',
          )}
        >
          {kbd}
        </kbd>
      )}
    </button>
  );
}
