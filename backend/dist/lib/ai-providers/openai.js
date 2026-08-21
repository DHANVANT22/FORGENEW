"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatIdea = chatIdea;
const openai_1 = __importDefault(require("openai"));
async function chatIdea(messages, systemPrompt) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured');
    }
    const openai = new openai_1.default({
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
            messages: formattedMessages,
            max_tokens: 2000,
        });
        return response.choices[0]?.message?.content || '';
    }
    catch (error) {
        const errorMessage = error?.error?.message || error?.message || 'OpenAI API failed';
        throw new Error(errorMessage);
    }
}
//# sourceMappingURL=openai.js.map