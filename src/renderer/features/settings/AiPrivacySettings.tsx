import { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiWifi, FiWifiOff, FiShield } from 'react-icons/fi';
import type {
  AiStatus,
  AiKeyStatus,
  TranscriptionAgent,
  AutoProjectConfig,
} from '@/shared/schemas/ai';
import { Switch } from '@/renderer/components/ui/switch';
import { Label } from '@/renderer/components/ui/label';
import { Input } from '@/renderer/components/ui/input';
import { Button } from '@/renderer/components/ui/button';
import { Badge } from '@/renderer/components/ui/badge';

// AI & Privacy settings (§1.7 — SECURITY-SENSITIVE). Surfaces the Stage-A
// orchestrator controls over `window.api.ai.*` only (§1.3): the hard kill-switch,
// transcription-agent choice, the online opt-in, the off-by-default auto-project
// guard, and per-agent API-key management.
//
// API-KEY INVARIANT: the secret value NEVER leaves this component and is NEVER
// shown or logged. The input is local-only state, cleared the instant it is
// handed to `ai.setApiKey`; the bridge returns only `hasKey`/an optional masked
// `hint`. We never read the value back, never render it, never console.log it.

// A confidence floor for the auto-project guard when the operator first enables
// it — they can still leave it off entirely (the default, R8).
const DEFAULT_AUTO_PROJECT_MIN = 0.9;

export default function AiPrivacySettings() {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [agents, setAgents] = useState<TranscriptionAgent[]>([]);
  const [keyStatus, setKeyStatus] = useState<AiKeyStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyStatus = useCallback((next: AiStatus) => {
    setStatus(next);
  }, []);

  const refreshKey = useCallback(async (agentId: string) => {
    const res = await window.api.ai.hasKey(agentId);
    if (res.ok) setKeyStatus(res.data);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    const [statusRes, agentsRes] = await Promise.all([
      window.api.ai.status(),
      window.api.ai.listAgents(),
    ]);
    if (statusRes.ok) setStatus(statusRes.data);
    else setError(statusRes.error);
    if (agentsRes.ok) setAgents(agentsRes.data);
    if (statusRes.ok) await refreshKey(statusRes.data.activeAgentId);
  }, [refreshKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeAgent = agents.find((a) => a.id === status?.activeAgentId) ?? null;

  const setEnabled = async (enabled: boolean) => {
    const res = await window.api.ai.setEnabled(enabled);
    if (res.ok) applyStatus(res.data);
  };

  const chooseAgent = async (agentId: string) => {
    const res = await window.api.ai.setAgent(agentId);
    if (res.ok) {
      applyStatus(res.data);
      await refreshKey(agentId);
    }
  };

  const setOnline = async (online: boolean) => {
    const res = await window.api.ai.setOnline(online);
    if (res.ok) applyStatus(res.data);
  };

  const setAutoProject = async (config: AutoProjectConfig) => {
    const res = await window.api.ai.setAutoProject(config);
    if (res.ok) applyStatus(res.data);
  };

  if (!status) {
    return (
      <div className="max-w-2xl">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Loading AI status…</p>
        )}
      </div>
    );
  }

  // Privacy posture: killed > offline > online. Drives the banner copy + tone.
  const killed = !status.enabled;
  const online = status.online;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {/* Privacy status banner. */}
      <div
        role="status"
        className={`flex items-center gap-3 rounded-lg border p-4 ${
          killed
            ? 'border-border bg-secondary/40'
            : online
              ? 'border-pp-warn/40 bg-pp-warn/10'
              : 'border-primary/40 bg-primary/5'
        }`}
      >
        {killed ? (
          <FiShield className="h-5 w-5 text-muted-foreground" aria-hidden />
        ) : online ? (
          <FiWifi className="h-5 w-5 text-pp-warn" aria-hidden />
        ) : (
          <FiWifiOff className="h-5 w-5 text-primary" aria-hidden />
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">
            {killed
              ? 'AI detection is off'
              : online
                ? 'Online mode — audio may leave this device'
                : 'Offline mode — everything stays on this device'}
          </p>
          <p className="text-xs text-muted-foreground">
            {killed
              ? 'No transcription or detection runs while the kill-switch is on.'
              : online
                ? 'A cloud agent is permitted. Turn off online mode to stay fully local.'
                : 'Only on-device transcription agents are used.'}
          </p>
        </div>
      </div>

      {/* Hard kill-switch. */}
      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Disable all AI detection</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Master kill-switch. When on, no audio is captured and no detection runs.
            </p>
          </div>
          <Switch
            checked={killed}
            onCheckedChange={(v) => void setEnabled(!v)}
            aria-label="Disable all AI detection"
          />
        </div>
      </section>

      {/* Transcription-agent grid. */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold text-foreground">Transcription agent</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose the engine that turns spoken words into text.
        </p>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Transcription agent">
          {agents.map((agent) => {
            const active = agent.id === status.activeAgentId;
            return (
              <button
                key={agent.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={killed}
                onClick={() => void chooseAgent(agent.id)}
                className={`flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{agent.name}</span>
                  {active && <FiCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
                </span>
                <Badge variant={agent.online ? 'warn' : 'success'} className="self-start">
                  {agent.online ? 'ONLINE' : 'OFFLINE'}
                </Badge>
              </button>
            );
          })}
        </div>
      </section>

      {/* API key — only for the selected online agent that requires one. */}
      {activeAgent?.requiresKey && (
        <ApiKeySection
          agentId={activeAgent.id}
          agentName={activeAgent.name}
          keyStatus={keyStatus}
          onChanged={(ks) => setKeyStatus(ks)}
        />
      )}

      {/* Online opt-in. */}
      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="online-optin">Allow online agents</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Opt in to cloud transcription. Off keeps everything on this device.
            </p>
          </div>
          <Switch
            id="online-optin"
            checked={online}
            disabled={killed}
            onCheckedChange={(v) => void setOnline(v)}
            aria-label="Allow online agents"
          />
        </div>
      </section>

      {/* Auto-project guard (off by default — R8). */}
      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="auto-project">Auto-project high-confidence detections</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Off by default. When on, only detections at or above the threshold project
              automatically.
            </p>
          </div>
          <Switch
            id="auto-project"
            checked={status.autoProject.enabled}
            disabled={killed}
            onCheckedChange={(v) =>
              void setAutoProject({
                enabled: v,
                minConfidence: status.autoProject.minConfidence || DEFAULT_AUTO_PROJECT_MIN,
              })
            }
            aria-label="Auto-project high-confidence detections"
          />
        </div>
        {status.autoProject.enabled && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="auto-project-threshold">Confidence threshold</Label>
              <span className="text-sm tabular-nums text-muted-foreground">
                {Math.round(status.autoProject.minConfidence * 100)}%
              </span>
            </div>
            <input
              id="auto-project-threshold"
              type="range"
              min={50}
              max={100}
              step={1}
              value={Math.round(status.autoProject.minConfidence * 100)}
              onChange={(e) =>
                void setAutoProject({
                  enabled: true,
                  minConfidence: Number(e.target.value) / 100,
                })
              }
              aria-valuetext={`${Math.round(status.autoProject.minConfidence * 100)} percent`}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
            />
          </div>
        )}
      </section>
    </div>
  );
}

// The API-key sub-section. SECURITY (§1.7): `draft` holds the typed key in local
// component state ONLY; it is sent to main and immediately cleared. We render the
// input as a password field, never echo the value elsewhere, never log it, and
// rely solely on `hasKey`/`hint` from main to show whether a key is stored.
function ApiKeySection({
  agentId,
  agentName,
  keyStatus,
  onChanged,
}: {
  agentId: string;
  agentName: string;
  keyStatus: AiKeyStatus | null;
  onChanged: (status: AiKeyStatus) => void;
}) {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasKey = keyStatus?.hasKey ?? false;
  const hint = keyStatus?.hint;

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setError(null);
    const res = await window.api.ai.setApiKey(agentId, draft);
    // Clear the secret from memory the instant it leaves the component, on every
    // path. We never read it back — only the boolean/hint that `setApiKey` returns.
    setDraft('');
    setBusy(false);
    if (res.ok) onChanged(res.data);
    else setError(res.error);
  };

  const clear = async () => {
    setBusy(true);
    setError(null);
    const res = await window.api.ai.clearApiKey(agentId);
    setBusy(false);
    if (res.ok) onChanged(res.data);
    else setError(res.error);
  };

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">API key</h2>
        {hasKey ? (
          <Badge variant="success">Key saved{hint ? ` · ${hint}` : ''}</Badge>
        ) : (
          <Badge variant="secondary">No key</Badge>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Stored in your OS secure storage for {agentName}. The key is never shown again.
      </p>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="api-key" className="sr-only">
            API key for {agentName}
          </Label>
          <Input
            id="api-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder={hasKey ? 'Enter a new key to replace the saved one' : 'Paste API key'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={`API key for ${agentName}`}
          />
        </div>
        <Button type="button" onClick={() => void save()} disabled={!draft || busy}>
          {hasKey ? 'Update' : 'Save'}
        </Button>
        {hasKey && (
          <Button type="button" variant="outline" onClick={() => void clear()} disabled={busy}>
            Clear
          </Button>
        )}
      </div>
    </section>
  );
}
