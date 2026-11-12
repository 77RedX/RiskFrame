import axios from 'axios';
import { z } from 'zod';

export const copilotError = (message, status = 503) => Object.assign(new Error(message), { status, code: 'COPILOT' });

const AssistantMessage = z.object({
  role: z.literal('assistant'),
  content: z.string().max(16000).nullable().optional(),
  tool_calls: z.array(z.object({
    id: z.string().min(1).max(128),
    type: z.literal('function'),
    function: z.object({ name: z.string().max(80), arguments: z.string().max(16000) }),
  })).max(4).optional(),
});

export async function requestGroq(messages, tools, { signal } = {}) {
  const key = process.env.GROQ_API_KEY?.trim();
  const model = process.env.GROQ_MODEL?.trim();
  if (!key || !model) throw copilotError('AI copilot is not configured. Set GROQ_API_KEY and GROQ_MODEL on the backend.');
  let response;
  try {
    response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model, messages, stream: false, max_completion_tokens: 2048,
      ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
      ...(tools.length ? { tools, tool_choice: 'auto', parallel_tool_calls: false } : {}),
    }, { headers: { Authorization: `Bearer ${key}` }, timeout: 20000, signal });
  } catch (error) {
    const limited = error.response?.status === 429;
    throw copilotError(limited ? 'AI copilot rate limit reached. Please retry later.' : 'AI copilot is unavailable. Please retry.', limited ? 429 : 503);
  }
  const choice = response.data?.choices?.[0];
  if (!['stop', 'tool_calls'].includes(choice?.finish_reason)) throw copilotError('AI copilot returned an incomplete response. Please retry.');
  const parsed = AssistantMessage.safeParse(choice.message);
  if (!parsed.success) throw copilotError('AI copilot returned an invalid response. Please retry.');
  return parsed.data;
}
