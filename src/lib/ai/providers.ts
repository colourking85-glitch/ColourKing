export type AIProviderId = 'anthropic' | 'google' | 'openai';

export interface AIProvider {
  id: AIProviderId;
  name: string;
  envKey: string;
  models: { vision: string; text: string };
  isConfigured: () => boolean;
  evaluatePhoto: (base64: string, mediaType: string, language: string) => Promise<PhotoScore>;
  assessDamage: (base64: string, mediaType: string, language: string) => Promise<DamageAssessment>;
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

export interface DamageAssessment {
  damageType: 'scratch' | 'dent' | 'paint' | 'bumper' | 'hail' | 'crack' | 'other';
  severity: 'light' | 'moderate' | 'severe';
  repairMethod: string;
  estimatedHours: { min: number; max: number };
  affectedPanels: string[];
  summary: string;
  confidence: number;
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

const DAMAGE_PROMPT = (language: string) =>
  `You are an expert auto body damage assessor for a professional body shop. Analyze this vehicle photo and assess the visible damage.

Determine:
- damageType: one of "scratch", "dent", "paint", "bumper", "hail", "crack", "other"
- severity: "light" (cosmetic, quick fix), "moderate" (noticeable, standard repair), "severe" (structural or extensive)
- repairMethod: brief description of the recommended repair approach in ${language}
- estimatedHours: min and max labor hours as numbers (be realistic for a professional body shop)
- affectedPanels: array of panel names in English (e.g. "front bumper", "hood", "left fender")
- summary: 1-2 sentence description of the damage in ${language}
- confidence: 0-100 how confident you are in this assessment

If no vehicle damage is visible, set damageType to "other", severity to "light", confidence to a low value, and explain in summary.

Respond ONLY with valid JSON:
{"damageType":"scratch","severity":"light","repairMethod":"...","estimatedHours":{"min":1,"max":2},"affectedPanels":["front bumper"],"summary":"...","confidence":75}`;

function parseDamageFromText(text: string): DamageAssessment {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in AI response');
  return JSON.parse(match[0]);
}

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
  async assessDamage(base64, mediaType, language) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.models.vision,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: DAMAGE_PROMPT(language) },
          ],
        }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = await res.json();
    return parseDamageFromText(data.content?.[0]?.text ?? '');
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
  async assessDamage(base64, mediaType, language) {
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
              { text: DAMAGE_PROMPT(language) },
            ],
          }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.1 },
        }),
      }
    );
    if (!res.ok) throw new Error(`Google AI API error: ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return parseDamageFromText(text);
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
  async assessDamage(base64, mediaType, language) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.models.vision,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } },
            { type: 'text', text: DAMAGE_PROMPT(language) },
          ],
        }],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    return parseDamageFromText(text);
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
