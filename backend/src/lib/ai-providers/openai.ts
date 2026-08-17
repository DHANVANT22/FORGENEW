import OpenAI from 'openai';

export async function chatIdea(messages: any[], systemPrompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content
    }))
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: formattedMessages as any,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    const errorMessage = error?.error?.message || error?.message || 'OpenAI API failed';
    throw new Error(errorMessage);
  }
}
