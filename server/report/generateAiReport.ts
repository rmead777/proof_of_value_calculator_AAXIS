import { getSupportedModel } from './models.js';
import { AI_REPORT_SYSTEM_PROMPT } from './systemPrompt.js';
import { callAnthropic } from './clients/anthropic.js';
import { callGoogleGemini } from './clients/googleGemini.js';
import { callOpenAICompatibleChat } from './clients/openaiCompatible.js';

export async function generateAiReportMarkdown(params: { model: string; data: unknown }) {
  const { model, data } = params;
  const supported = getSupportedModel(model);

  const userPrompt = `INPUT JSON (do not restate the full JSON verbatim; use it to compute the report):\n\n\`\`\`json\n${JSON.stringify(
    data,
    null,
    2,
  )}\n\`\`\``;

  switch (supported.provider) {
    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
      const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      return callOpenAICompatibleChat({
        baseUrl,
        apiKey,
        model: supported.id,
        system: AI_REPORT_SYSTEM_PROMPT,
        user: userPrompt,
        maxOutputTokens: supported.maxOutputTokens,
        tokenParam: 'max_completion_tokens',
      });
    }
    case 'xai': {
      const apiKey = process.env.XAI_API_KEY;
      if (!apiKey) throw new Error('Missing XAI_API_KEY');
      const baseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
      return callOpenAICompatibleChat({
        baseUrl,
        apiKey,
        model: supported.id,
        system: AI_REPORT_SYSTEM_PROMPT,
        user: userPrompt,
        maxOutputTokens: supported.maxOutputTokens,
        tokenParam: 'max_tokens',
      });
    }
    case 'anthropic': {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');
      return callAnthropic({ apiKey, model: supported.id, system: AI_REPORT_SYSTEM_PROMPT, user: userPrompt });
    }
    case 'google': {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) throw new Error('Missing GOOGLE_API_KEY');
      return callGoogleGemini({
        apiKey,
        model: supported.id,
        system: AI_REPORT_SYSTEM_PROMPT,
        user: userPrompt,
        maxOutputTokens: supported.maxOutputTokens,
      });
    }
  }
}
