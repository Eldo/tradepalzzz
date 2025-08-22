import { sendText } from '../utils/send.js';
import { doOCR } from '../utils/ocr.js';
import { summarizeConversation, generateReply } from '../utils/gemini.js';

const messageHandler = async (msg) => {
  console.log('Received message:', msg); // Debug log for payload
  const isGroup = msg.chat_id?.endsWith('@g.us');
  const phone = msg.from; // Sender's phone
  let text = '';

  // Handle nested text.body from Whapi.Cloud payload
  if (msg.type === 'text' && msg.text?.body) {
    text = msg.text.body;
  }
  const type = msg.type;

  // Log message
  let chatMessages = global.messages.get(msg.chat_id) || [];
  chatMessages.push({
    phone,
    text,
    type,
    timestamp: new Date(msg.timestamp * 1000),
    fromBot: false
  });
  global.messages.set(msg.chat_id, chatMessages);

  // Detect group join (simulated by first message in group)
  if (isGroup && !global.messages.get(msg.chat_id)?.some(m => m.fromBot)) {
    await sendText(
      msg.chat_id,
      'WaffBot has been added to this group! Use commands like /start, /track, /receipt, /help, /about, /tax, or /account records. Send images or PDFs for text extraction.'
    );
    chatMessages = global.messages.get(msg.chat_id) || [];
    chatMessages.push({
      phone: process.env.BOT_PHONE,
      text: 'WaffBot has been added to this group!...',
      type: 'text',
      timestamp: new Date(),
      fromBot: true
    });
    global.messages.set(msg.chat_id, chatMessages);
  }

  // OCR for images/PDFs in 1:1 or groups
  if (type === 'image' || (type === 'document' && msg[type]?.mime_type === 'application/pdf')) {
    const mediaObject = msg[type];
    const url = mediaObject?.link;
    if (!url) {
      await sendText(msg.chat_id, 'No media link available. Please try again.');
      return;
    }
    try {
      const ocrText = await doOCR(url, mediaObject.mime_type);
      await sendText(msg.chat_id, `Extracted text: ${ocrText}`);
      chatMessages = global.messages.get(msg.chat_id) || [];
      chatMessages.push({
        phone: process.env.BOT_PHONE,
        text: `Extracted text: ${ocrText}`,
        type: 'text',
        timestamp: new Date(),
        fromBot: true
      });
      global.messages.set(msg.chat_id, chatMessages);
    } catch (err) {
      console.error('OCR Handler Error:', err.message);
      await sendText(msg.chat_id, 'Failed to process media. Please try again.');
    }
    return;
  }

  if (!text) return; // Exit if no text to process

  text = text.trim().toLowerCase();

  let user = global.users.get(phone);

  if (user?.state) {
    // Handle onboarding steps
    switch (user.state) {
      case 'fullname':
        user.fullname = msg.text.body;
        user.state = 'email';
        global.users.set(phone, user);
        await sendText(msg.chat_id, 'Please enter your email:');
        return;
      case 'email':
        user.email = msg.text.body;
        user.state = 'bvn';
        global.users.set(phone, user);
        await sendText(msg.chat_id, 'Please enter your BVN:');
        return;
      case 'bvn':
        user.bvn = msg.text.body;
        user.state = null;
        global.users.set(phone, user);
        await sendText(msg.chat_id, 'Onboarding complete!');
        return;
    }
  }

  if (isGroup && text.startsWith('/')) {
    if (!user) {
      await sendText(
        msg.chat_id,
        `You don't have an account with WaffBot, use the link below to get started: https://wa.me/${process.env.BOT_PHONE}?text=Start`
      );
      return;
    }
  }

  // Commands and keyword triggers
  let handled = false;
  if (text === '/start' || text === '/get started') {
    handled = true;
    if (user) {
      await sendText(msg.chat_id, 'You already have an account.');
    } else {
      user = { state: 'fullname' };
      global.users.set(phone, user);
      await sendText(msg.chat_id, 'Welcome! Please enter your full name:');
    }
  } else if (text === '/help') {
    handled = true;
    await sendText(msg.chat_id, 'Commands: /start, /receipt, /track, /help, /about, /tax, /account records');
  } else if (text === '/about') {
    handled = true;
    await sendText(msg.chat_id, 'WaffBot is a versatile WhatsApp bot for logging, summarizing, and more.');
  } else if (text === '/receipt') {
    handled = true;
    await sendText(msg.chat_id, 'Receipt for last transaction: [Placeholder - No transactions yet]');
  } else if (text === '/track') {
    handled = true;
    const history = global.messages.get(msg.chat_id) || [];
    const conv = history.map(m => `${m.fromBot ? 'Bot' : m.phone}: ${m.text}`).join('\n');
    try {
      const summary = await summarizeConversation(conv);
      await sendText(msg.chat_id, `Conversation summary: ${summary}`);
    } catch (err) {
      console.error('Summarization error:', err);
      await sendText(msg.chat_id, 'Failed to summarize conversation. Please try again.');
    }
  } else if (text === '/tax') {
    handled = true;
    await sendText(msg.chat_id, 'Tax calculation: [Placeholder - Enter amount for real calc]');
  } else if (text === '/account records') {
    handled = true;
    if (!user) {
      await sendText(msg.chat_id, 'No account found.');
    } else {
      await sendText(msg.chat_id, `Fullname: ${user.fullname}\nEmail: ${user.email}\nBVN: ${user.bvn}`);
    }
  } else if (text.includes('hello') || text.includes('hi')) {
    handled = true;
    await sendText(msg.chat_id, 'Hi there! How can I help?');
  }

  // AI-powered smart reply only for user messages
  if (!handled && text && !msg.from_me) { // Check if message is not from the bot
    const history = global.messages.get(msg.chat_id) || [];
    const conv = history.map(m => `${m.fromBot ? 'Bot' : m.phone}: ${m.text}`).join('\n');
    try {
      const aiReply = await generateReply(conv, text);
      await sendText(msg.chat_id, aiReply);
      chatMessages = global.messages.get(msg.chat_id) || [];
      chatMessages.push({
        phone: process.env.BOT_PHONE,
        text: aiReply,
        type: 'text',
        timestamp: new Date(),
        fromBot: true
      });
      global.messages.set(msg.chat_id, chatMessages);
    } catch (err) {
      console.error('AI Reply Error:', err.message);
      await sendText(msg.chat_id, 'Sorry, I encountered an error. Please try again.');
    }
  }
};
//open
export default messageHandler;