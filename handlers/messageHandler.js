import { sendText } from '../utils/send.js';
import { doOCR } from '../utils/ocr.js';
import { summarizeConversation } from '../utils/gemini.js';

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
        user.fullname = msg.text.body; // Use msg.text.body for consistency
        user.state = 'email';
        global.users.set(phone, user);
        await sendText(msg.chat_id, 'Please enter your email:');
        return;
      case 'email':
        user.email = msg.text.body; // Use msg.text.body for consistency
        user.state = 'bvn';
        global.users.set(phone, user);
        await sendText(msg.chat_id, 'Please enter your BVN:');
        return;
      case 'bvn':
        user.bvn = msg.text.body; // Use msg.text.body for consistency
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

  // Commands
  if (text === '/start' || text === '/get started') {
    if (user) {
      await sendText(msg.chat_id, 'You already have an account.');
      return;
    }
    user = { state: 'fullname' };
    global.users.set(phone, user);
    await sendText(msg.chat_id, 'Welcome! Please enter your full name:');
    return;
  } else if (text === '/help') {
    await sendText(msg.chat_id, 'Commands: /start, /receipt, /track, /help, /about, /tax, /account records');
    return;
  } else if (text === '/about') {
    await sendText(msg.chat_id, 'WaffBot is a versatile WhatsApp bot for logging, summarizing, and more.');
    return;
  } else if (text === '/receipt') {
    await sendText(msg.chat_id, 'Receipt for last transaction: [Placeholder - No transactions yet]');
    return;
  } else if (text === '/track') {
    const history = global.messages.get(msg.chat_id) || [];
    const conv = history.map(m => `${m.fromBot ? 'Bot' : m.phone}: ${m.text}`).join('\n');
    try {
      const summary = await summarizeConversation(conv);
      await sendText(msg.chat_id, `Conversation summary: ${summary}`);
    } catch (err) {
      console.error('Summarization error:', err);
      await sendText(msg.chat_id, 'Failed to summarize conversation. Please try again.');
    }
    return;
  } else if (text === '/tax') {
    await sendText(msg.chat_id, 'Tax calculation: [Placeholder - Enter amount for real calc]');
    return;
  } else if (text === '/account records') {
    if (!user) {
      await sendText(msg.chat_id, 'No account found.');
      return;
    }
    await sendText(msg.chat_id, `Fullname: ${user.fullname}\nEmail: ${user.email}\nBVN: ${user.bvn}`);
    return;
  }

  // Keyword trigger / auto respond
  if (text.includes('hello') || text.includes('hi')) {
    await sendText(msg.chat_id, 'Hi there! How can I help?');
  }
};

export default messageHandler;