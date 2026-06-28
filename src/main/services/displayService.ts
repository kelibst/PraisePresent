import { screen } from 'electron';
import { settingsRepository } from '../db/repositories/settingsRepository';
import { setConfiguredAudienceDisplay } from '../windows/windowManager';
import log from '../infra/logger';
import type { DisplayInfo, AudienceSelection } from '@/shared/schemas/display';

// Display/output service — the ONLY place that touches electron `screen`
// (CLAUDE.md §1.3/§5.2). Enumerates monitors, persists the operator's audience
// choice via the settings repository (§1.5), and tells the window manager to
// honor it. The renderer reaches all of this only through window.api.display.*.

const AUDIENCE_KEY = 'display.audienceId';
const AUTO = 'auto'; // persisted sentinel for "no explicit choice"

function describe(d: Electron.Display, primaryId: number): DisplayInfo {
  // electron exposes a friendly `label` on modern versions; fall back to the id.
  const label = d.label && d.label.trim() ? d.label : `Display ${d.id}`;
  return {
    id: d.id,
    label,
    width: d.bounds.width,
    height: d.bounds.height,
    isPrimary: d.id === primaryId,
  };
}

export const displayService = {
  listDisplays(): DisplayInfo[] {
    const primaryId = screen.getPrimaryDisplay().id;
    return screen.getAllDisplays().map((d) => describe(d, primaryId));
  },

  getAudienceSelection(): AudienceSelection {
    const raw = settingsRepository.get(AUDIENCE_KEY);
    if (!raw || raw === AUTO) return { displayId: null };
    const id = Number(raw);
    return { displayId: Number.isFinite(id) ? id : null };
  },

  // Persist the choice (null = auto), then re-place the audience window so the
  // change takes effect live. Returns the stored selection.
  setAudienceSelection(displayId: number | null): AudienceSelection {
    settingsRepository.set(AUDIENCE_KEY, displayId === null ? AUTO : String(displayId));
    setConfiguredAudienceDisplay(displayId);
    return { displayId };
  },

  // Load the persisted choice into the window manager on startup, BEFORE the
  // audience window is created, so the first placement already honors it.
  init(): void {
    const { displayId } = displayService.getAudienceSelection();
    setConfiguredAudienceDisplay(displayId);
    log.info(`Display service init: audience target = ${displayId ?? 'auto'}.`);
  },
};
