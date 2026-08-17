import Anthropic from '@anthropic-ai/sdk';

export async function chatIdea(messages: any[], systemPrompt: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key is not configured');
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages
    });

    return (response.content[0] as any).text;
  } catch (error: any) {
    const errorMessage = error?.error?.error?.message || error?.message || 'Claude API failed';
    throw new Error(errorMessage);
  }
}
