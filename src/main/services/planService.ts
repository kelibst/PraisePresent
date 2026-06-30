import { planRepository } from '../db/repositories/planRepository';
import { estimateMinutes } from './planEstimate';
import type { Plan, PlanCreate } from '@/shared/schemas/plan';

export const planService = {
  list: () => planRepository.list(),
  get: (id: number) => planRepository.get(id),
  create: (input: PlanCreate) => planRepository.create(input),
  update: (input: Plan) => planRepository.update(input),
  delete: (id: number) => planRepository.delete(id),
  estimateMinutes: (id: number): number => {
    const plan = planRepository.get(id);
    return plan ? estimateMinutes(plan.items) : 0;
  },
};
