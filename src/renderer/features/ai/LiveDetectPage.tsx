import { useState } from 'react';
import { FiZap, FiChevronRight } from 'react-icons/fi';
import type { AiCandidate } from '@/shared/schemas/ai';
import type { BibleVerse } from '@/shared/schemas/scripture';

// Live Detect (Phase 4 text path): paste/type what's being said; detected
// scripture references appear in a review queue with confidence. The operator
// clicks to project — nothing is ever auto-projected (human-in-the-loop, R8).
// Detection + resolution run in main behind window.api.ai (§5.2). Spoken audio
// (online/offline ASR) will feed this same queue later.

function deckFor(verses: BibleVerse[]) {
  return verses.map((v) => ({
    id: `${v.bookNumber}-${v.chapter}-${v.verse}`,
    lines: [v.text],
    reference: `${v.bookName} ${v.chapter}:${v.verse}`,
  }));
}

function confidenceLabel(c: number): { text: string; cls: string } {
  if (c >= 0.8) return { text: 'High', cls: 'bg-primary/15 text-primary' };
  if (c >= 0.6) return { text: 'Medium', cls: 'bg-secondary text-secondary-foreground' };
  return { text: 'Low', cls: 'bg-muted text-muted-foreground' };
}

export default function LiveDetectPage() {
  const [text, setText] = useState('');
  const [candidates, setCandidates] = useState<AiCandidate[]>([]);
  const [ran, setRan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = async () => {
    setError(null);
    if (!text.trim()) return;
    const res = await window.api.ai.submitText(text);
    if (res.ok) {
      setCandidates(res.data);
      setRan(true);
    } else {
      setError(res.error);
    }
  };

  // Project the candidate as a verse-per-slide deck (reuses the D2 present path).
  const present = (c: AiCandidate) => void window.api.present.setDeck(deckFor(c.verses), 0);
  const black = () => window.api.present.black();

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-background p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiZap className="h-6 w-6 text-primary" aria-hidden />
          <h1 className="text-2xl font-bold text-foreground">Live Detect</h1>
        </div>
        <button
          onClick={black}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          Black
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        <label htmlFor="detect-input" className="text-sm font-medium text-foreground">
          Paste or type what's being said — detected references appear below for you to project.
        </label>
        <textarea
          id="detect-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="e.g. Turn with me to John three sixteen, and then to Romans 8:28…"
          className="w-full resize-y rounded border bg-background px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        />
        <div>
          <button
            onClick={detect}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Detect references
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {candidates.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Detected references">
          {candidates.map((c, i) => {
            const conf = confidenceLabel(c.confidence);
            const preview = c.verses[0]?.text ?? '';
            return (
              <li key={`${c.reference}-${i}`}>
                <button
                  onClick={() => present(c)}
                  className="group flex w-full items-start gap-4 rounded-lg border p-4 text-left transition hover:border-primary/50 hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                  title={`Present ${c.reference}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{c.reference}</span>
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${conf.cls}`}>
                        {conf.text}
                      </span>
                      {c.verses.length > 1 && (
                        <span className="text-xs text-muted-foreground">
                          {c.verses.length} verses
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-foreground">{preview}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      matched: “{c.triggerText}”
                    </p>
                  </div>
                  <FiChevronRight
                    className="mt-1 h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100"
                    aria-hidden
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {ran && candidates.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">
          No scripture references detected in that text.
        </p>
      )}
    </div>
  );
}
