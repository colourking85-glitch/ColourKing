import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'No AI API key configured' },
      { status: 503 }
    );
  }

  try {
    const { messages, context } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content ?? '';

    const systemPrompt = [
      'You are a helpful AI assistant for Colourking, a bodyshop management system.',
      'You help staff with their daily tasks: summarizing records, drafting emails, and suggesting next actions.',
      context?.screen ? `Current screen: ${context.screen}` : '',
      context?.pathname ? `Current path: ${context.pathname}` : '',
      'Keep responses concise and actionable. Reply in the same language as the user.',
    ].filter(Boolean).join(' ');

    if (process.env.ANTHROPIC_API_KEY) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        return NextResponse.json({ error: 'AI API error' }, { status: 502 });
      }

      const data = await res.json();
      return NextResponse.json({
        reply: data.content?.[0]?.text ?? 'No response',
      });
    }

    if (process.env.OPENAI_API_KEY) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          max_tokens: 1024,
        }),
      });

      if (!res.ok) {
        return NextResponse.json({ error: 'AI API error' }, { status: 502 });
      }

      const data = await res.json();
      return NextResponse.json({
        reply: data.choices?.[0]?.message?.content ?? 'No response',
      });
    }

    return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
