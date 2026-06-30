// The auto-project gate — ONE pure implementation shared by main (the reducer's
// policy view) and the renderer (the live tab that performs the projection). A
// single source of truth so the off-by-default safety rule (R8) can never drift
// between the policy and the UI control that claims to honor it (CLAUDE.md §1.9).
//
// Returns true ONLY when AI is enabled, auto-project is explicitly turned on, AND
// the candidate clears the configured confidence threshold. The default config
// (auto-project disabled) returns false for everything — nothing reaches the
// audience without an operator click.

export type AutoProjectGate = {
  enabled: boolean; // master kill-switch (status.enabled)
  autoProject: { enabled: boolean; minConfidence: number };
};

export function shouldAutoProject(gate: AutoProjectGate, confidence: number): boolean {
  if (!gate.enabled) return false; // kill-switch wins
  if (!gate.autoProject.enabled) return false; // off by default (R8)
  return confidence >= gate.autoProject.minConfidence;
}
