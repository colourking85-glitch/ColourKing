export type AIProviderId = 'anthropic' | 'google' | 'openai';

export interface AIProvider {
  id: AIProviderId;
  name: string;
  envKey: string;
  models: { vision: string; text: string };
  isConfigured: () => boolean;
  evaluatePhoto: (base64: string, mediaType: string, language: string) => Promise<PhotoScore>;
}

export interface PhotoScore {
  lighting: 'good' | 'warning' | 'bad';
  angle: 'good' | 'warning' | 'bad';
  focus: 'good' | 'warning' | 'bad';
  distance: 'good' | 'warning' | 'bad';
  damageVisible: 'good' | 'warning' | 'bad';
  overallScore: number;
  tips: string[];
}

const PHOTO_PROMPT = (language: string) =>
  `You are a vehicle damage photo quality inspector for an auto body shop. Evaluate this photo for use in a damage repair quote request.

Score each criterion as "good", "warning", or "bad":
- lighting: Is the photo well-lit? Can details be seen clearly?
- angle: Is the damaged area photographed from a useful angle?
- focus: Is the image sharp and in focus?
- distance: Is the zoom/distance appropriate to see the damage?
- damageVisible: Can vehicle damage actually be seen in this photo?

Give an overall score from 0-100.
Provide 1-3 short actionable tips in ${language} if improvements are needed. If the photo is good, return an empty tips array.

Respond ONLY with valid JSON in this exact format:
{"lighting":"good","angle":"good","focus":"good","distance":"good","damageVisible":"good","overallScore":85,"tips":[]}`;

function parseScoreFromText(text: string): PhotoScore {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in AI response');
  return JSON.parse(match[0]);
}

const anthropicProvider: AIProvider = {
  id: 'anthropic',
  name: 'Claude (Anthropic)',
  envKey: 'ANTHROPIC_API_KEY',
  models: { vision: 'claude-haiku-4-5-20251001', text: 'claude-haiku-4-5-20251001' },
  isConfigured: () => !!process.env.ANTHROPIC_API_KEY,
  async evaluatePhoto(base64, mediaType, language) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.models.vision,
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: PHOTO_PROMPT(language) },
          ],
        }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = await res.json();
    return parseScoreFromText(data.content?.[0]?.text ?? '');
  },
};

const googleProvider: AIProvider = {
  id: 'google',
  name: 'Gemini (Google)',
  envKey: 'GOOGLE_AI_API_KEY',
  models: { vision: 'gemini-2.0-flash', text: 'gemini-2.0-flash' },
  isConfigured: () => !!process.env.GOOGLE_AI_API_KEY,
  async evaluatePhoto(base64, mediaType, language) {
    const apiKey = process.env.GOOGLE_AI_API_KEY!;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.models.vision}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mediaType, data: base64 } },
              { text: PHOTO_PROMPT(language) },
            ],
          }],
          generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
        }),
      }
    );
    if (!res.ok) throw new Error(`Google AI API error: ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return parseScoreFromText(text);
  },
};

const openaiProvider: AIProvider = {
  id: 'openai',
  name: 'GPT (OpenAI)',
  envKey: 'OPENAI_API_KEY',
  models: { vision: 'gpt-4o-mini', text: 'gpt-4o-mini' },
  isConfigured: () => !!process.env.OPENAI_API_KEY,
  async evaluatePhoto(base64, mediaType, language) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.models.vision,
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } },
            { type: 'text', text: PHOTO_PROMPT(language) },
          ],
        }],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    return parseScoreFromText(text);
  },
};

export const AI_PROVIDERS: Record<AIProviderId, AIProvider> = {
  anthropic: anthropicProvider,
  google: googleProvider,
  openai: openaiProvider,
};

export function getActiveProviders(): AIProvider[] {
  return Object.values(AI_PROVIDERS).filter(p => p.isConfigured());
}

export function getProvider(id: AIProviderId): AIProvider | null {
  const provider = AI_PROVIDERS[id];
  if (!provider || !provider.isConfigured()) return null;
  return provider;
}

export function getDefaultProvider(preferredId?: AIProviderId | null): AIProvider | null {
  if (preferredId) {
    const preferred = getProvider(preferredId);
    if (preferred) return preferred;
  }
  const active = getActiveProviders();
  return active[0] ?? null;
}
