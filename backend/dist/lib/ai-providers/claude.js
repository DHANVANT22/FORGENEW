"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatIdea = chatIdea;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
async function chatIdea(messages, systemPrompt) {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('Anthropic API key is not configured');
    }
    const anthropic = new sdk_1.default({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });
    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            system: systemPrompt,
            messages: messages
        });
        return response.content[0].text;
    }
    catch (error) {
        const errorMessage = error?.error?.error?.message || error?.message || 'Claude API failed';
        throw new Error(errorMessage);
    }
}
//# sourceMappingURL=claude.js.map