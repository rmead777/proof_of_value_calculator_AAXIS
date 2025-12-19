type AnthropicResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
};

export async function callAnthropic(params: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  timeoutMs?: number;
}) {
  const { apiKey, model, system, user, timeoutMs = 120_000 } = params;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': process.env.ANTHROPIC_VERSION || '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 10000,
        system,
        messages: [{ role: 'user', content: user }],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    const json = (await resp.json()) as AnthropicResponse;
    if (!resp.ok) {
      throw new Error(json.error?.message || `Request failed (${resp.status})`);
    }

    const text = json.content?.find((c) => c.type === 'text')?.text;
    if (!text) throw new Error('No text returned from model');
    return text;
  } finally {
    clearTimeout(timer);
  }
}
