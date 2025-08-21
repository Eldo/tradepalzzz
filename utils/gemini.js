import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const summarizeConversation = async (conv) => {
  const prompt = `Summarize the following conversation concisely: \n${conv}`;
  const result = await model.generateContent(prompt);
  return result.response.text();
};

const generateReply = async (conv, latestText) => {
  const prompt = `You are WaffBot, a helpful and smart WhatsApp assistant. Based on the conversation history below, provide a relevant and concise response to the latest message. History: \n${conv}\nLatest message: ${latestText}`;
  const result = await model.generateContent(prompt);
  return result.response.text();
};

export { summarizeConversation, generateReply };