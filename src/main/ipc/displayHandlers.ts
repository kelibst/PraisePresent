import { z } from 'zod';
import { CHANNELS } from '@/shared/constants/channels';
import { audienceSelection } from '@/shared/schemas/display';
import { displayService } from '../services/displayService';
import { handle } from './registry';

const noInput = z.undefined();

// Display/output IPC — monitor enumeration and the audience-screen choice. Every
// payload zod-validated at the main boundary (§5.3); `screen`/placement never
// leave main (§1.3).
export function registerDisplayHandlers(): void {
  handle(CHANNELS.display.list, noInput, () => displayService.listDisplays());
  handle(CHANNELS.display.getAudience, noInput, () => displayService.getAudienceSelection());
  handle(CHANNELS.display.setAudience, audienceSelection, ({ displayId }) =>
    displayService.setAudienceSelection(displayId),
  );
}
