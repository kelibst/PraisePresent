import { z } from 'zod';
import { CHANNELS } from '@/shared/constants/channels';
import { setTierOverrideInput } from '@/shared/schemas/capability';
import { capabilityService } from '../services/capabilityService';
import { handle } from './registry';

// Capability IPC (B6a) — read the resolved tier/signals and set the operator
// override. Every payload zod-validated at the main boundary (§5.3); GPU/os signals
// never leave main except as the typed CapabilityInfo view (§1.3).
export function registerCapabilityHandlers(): void {
  handle(CHANNELS.capability.get, z.undefined(), () => capabilityService.get());
  handle(CHANNELS.capability.setOverride, setTierOverrideInput, ({ override }) =>
    capabilityService.setOverride(override),
  );
}
