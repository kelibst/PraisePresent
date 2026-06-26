import { z } from 'zod';
import { CHANNELS } from '@/shared/constants/channels';
import { plan, planCreate, planId } from '@/shared/schemas/plan';
import { planService } from '../services/planService';
import { handle } from './registry';

const noInput = z.undefined();

// Plans domain IPC — every payload zod-validated at the main boundary (§5.3).
export function registerPlanHandlers(): void {
  handle(CHANNELS.plans.list, noInput, () => planService.list());
  handle(CHANNELS.plans.get, planId, ({ id }) => planService.get(id));
  handle(CHANNELS.plans.create, planCreate, (input) => planService.create(input));
  handle(CHANNELS.plans.update, plan, (input) => {
    planService.update(input);
  });
  handle(CHANNELS.plans.delete, planId, ({ id }) => {
    planService.delete(id);
  });
}
