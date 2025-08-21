import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const summarizeConversation = async (conv) => {
  const prompt = `Summarize the following conversation concisely: \n${conv}`;
  const result = await model.generateContent(prompt);
  return result.response.text();
};

export { summarizeConversation };