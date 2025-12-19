type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

export async function callGoogleGemini(params: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxOutputTokens?: number;
  timeoutMs?: number;
}) {
  const { apiKey, model, system, user, maxOutputTokens, timeoutMs = 120_000 } = params;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.2,
          ...(typeof maxOutputTokens === 'number' ? { maxOutputTokens } : {}),
        },
      }),
      signal: controller.signal,
    });

    const json = (await resp.json()) as GeminiGenerateContentResponse;
    if (!resp.ok) {
      throw new Error(json.error?.message || `Request failed (${resp.status})`);
    }

    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    if (!text.trim()) throw new Error('No text returned from model');
    return text;
  } finally {
    clearTimeout(timer);
  }
}
