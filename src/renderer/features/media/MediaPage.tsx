import { FiImage } from 'react-icons/fi';

// Honest placeholder until the Media domain (Phase 3 · D4) lands. The sidebar
// link must resolve to a real page (§1.9) — not a blank route. No fake controls
// (§1.5): this only states what is coming, it does not pretend to do anything.
export default function MediaPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FiImage className="h-8 w-8" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Media library</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Images, video, and audio for the audience screen are coming in Phase 3 (D4). Nothing to show
        here yet.
      </p>
    </div>
  );
}
