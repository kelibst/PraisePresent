import { CHANNELS } from '@/shared/constants/channels';
import { aiSubmitText } from '@/shared/schemas/ai';
import { aiScriptureDetector } from '../services/aiScriptureDetector';
import { handle } from './registry';

// AI detection IPC — zod-validated at the main boundary (§5.3). The text path
// runs fully offline (no network/secrets); online/offline ASR modes register
// their own channels when they land.
export function registerAiHandlers(): void {
  handle(CHANNELS.ai.submitText, aiSubmitText, ({ text }) => aiScriptureDetector.submitText(text));
}
