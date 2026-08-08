import fetch from 'node-fetch';

const OPENAI_KEY = process.env.OPENAI_KEY;

export async function llmChat(messages) {
  if (!OPENAI_KEY) throw new Error('OPENAI_KEY not set');
  const body = {
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 400,
    temperature: 0.2
  };
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LLM error ${resp.status}: ${text}`);
  }
  const json = await resp.json();
  const content = json.choices?.[0]?.message?.content || '';
  return { json, content };
}
