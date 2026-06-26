import { z } from 'zod';

// Typed application config (CLAUDE.md §5.1). Held in main; extended as features
// need non-user-facing settings.
const appConfigSchema = z.object({
  // Extra origins the renderer may reach — appended to the CSP connect-src so
  // later phases (Bible/AI endpoints) can widen the policy declaratively.
  connectSources: z.array(z.string()).default([]),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

let config: AppConfig = appConfigSchema.parse({});

export function getConfig(): AppConfig {
  return config;
}

export function setConfig(partial: Partial<AppConfig>): void {
  config = appConfigSchema.parse({ ...config, ...partial });
}

// Register an allowed connect-src origin (idempotent).
export function allowConnectSource(origin: string): void {
  if (!config.connectSources.includes(origin)) {
    setConfig({ connectSources: [...config.connectSources, origin] });
  }
}
