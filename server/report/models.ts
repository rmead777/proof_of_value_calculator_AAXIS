export type ProviderId = 'openai' | 'xai' | 'anthropic' | 'google';

export type SupportedModelId =
  | 'gpt-5.2-2025-12-11'
  | 'grok-4-1-fast'
  | 'claude-opus-4-5-20251101'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-haiku-4-5'
  | 'gemini-3-flash-preview';

export const SUPPORTED_MODELS: Array<{
  id: SupportedModelId;
  label: string;
  provider: ProviderId;
  maxOutputTokens?: number;
}> = [
  { id: 'gpt-5.2-2025-12-11', label: 'GPT-5.2 (OpenAI)', provider: 'openai', maxOutputTokens: 4000 },
  { id: 'grok-4-1-fast', label: 'Grok 4.1 Fast (xAI)', provider: 'xai', maxOutputTokens: 4000 },
  { id: 'claude-opus-4-5-20251101', label: 'Claude Opus 4.5 (Anthropic)', provider: 'anthropic' },
  { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5 (Anthropic)', provider: 'anthropic' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (Anthropic)', provider: 'anthropic' },
  { id: 'gemini-3-flash-preview', label: 'gemini-3-flash (Google)', provider: 'google', maxOutputTokens: 4000 },
];

export function getSupportedModel(model: string) {
  const found = SUPPORTED_MODELS.find((m) => m.id === model);
  if (!found) {
    throw new Error(
      `Unsupported model: ${model}. Allowed: ${SUPPORTED_MODELS.map((m) => m.id).join(', ')}`,
    );
  }
  return found;
}
