type OpenAICompatibleMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type OpenAICompatibleChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export async function callOpenAICompatibleChat(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxOutputTokens?: number;
  tokenParam?: 'max_tokens' | 'max_completion_tokens';
  timeoutMs?: number;
}) {
  const {
    baseUrl,
    apiKey,
    model,
    system,
    user,
    maxOutputTokens,
    tokenParam = 'max_tokens',
    timeoutMs = 120_000,
  } = params;

  const messages: OpenAICompatibleMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        ...(typeof maxOutputTokens === 'number' ? { [tokenParam]: maxOutputTokens } : {}),
      }),
      signal: controller.signal,
    });

    const json = (await resp.json()) as OpenAICompatibleChatResponse;
    if (!resp.ok) {
      throw new Error(json.error?.message || `Request failed (${resp.status})`);
    }

    const text = json.choices?.[0]?.message?.content;
    if (!text) throw new Error('No text returned from model');
    return text;
  } finally {
    clearTimeout(timer);
  }
}
