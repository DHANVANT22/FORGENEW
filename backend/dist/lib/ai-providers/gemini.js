"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatIdea = chatIdea;
const generative_ai_1 = require("@google/generative-ai");
async function chatIdea(messages, systemPrompt) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured');
    }
    const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        systemInstruction: systemPrompt
    });
    // Convert messages to Gemini format
    const history = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));
    // Gemini's generateContent requires the last message separated from history usually, 
    // or we can pass the whole array to generateContent if it's alternating properly.
    // Actually, startChat is best for history:
    const lastMessage = history.pop(); // The final message is the current prompt
    try {
        const chat = model.startChat({ history });
        const result = await chat.sendMessage([{ text: lastMessage.parts[0].text }]);
        return result.response.text();
    }
    catch (error) {
        const errorMessage = error?.message || 'Gemini API failed';
        throw new Error(errorMessage);
    }
}
//# sourceMappingURL=gemini.js.map