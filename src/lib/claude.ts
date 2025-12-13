interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeAPIResponse {
  content: Array<{ type: string; text: string }>;
  id: string;
  model: string;
  role: string;
  stop_reason: string;
  stop_sequence: string | null;
  type: string;
  usage: { input_tokens: number; output_tokens: number };
}

interface ClaudeAPIError {
  error: { type: string; message: string };
}

export async function sendToClaudeAPI(
  messages: ClaudeMessage[],
  systemPrompt: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY is not set. Please add it to your .env file.');
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ClaudeAPIError;
      throw new Error(`Claude API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = (await response.json()) as ClaudeAPIResponse;

    if (!data.content || data.content.length === 0) {
      throw new Error('No response content from Claude API');
    }

    return data.content[0].text;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to Claude API.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred while communicating with Claude API');
  }
}
