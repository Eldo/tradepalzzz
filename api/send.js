import { sendText, sendImage, sendAudio, sendVideo } from '../utils/send.js';

export default (app) => {
  app.post('/send', async (req, res) => {
    if (req.headers.authorization !== `Bearer ${process.env.API_KEY}`) {
      return res.status(401).send('Unauthorized');
    }

    const { type, content } = req.body;
    const userPhones = Array.from(global.users.keys());

    for (const phone of userPhones) {
      const to = `${phone}@s.whatsapp.net`;
      try {
        if (type === 'text') {
          await sendText(to, content);
        } else if (type === 'image') {
          await sendImage(to, content); // content as base64 data:url
        } else if (type === 'audio') {
          await sendAudio(to, content);
        } else if (type === 'video') {
          await sendVideo(to, content);
        }
      } catch (err) {
        console.error(`Failed to send to ${to}:`, err);
      }
    }

    res.status(200).send('Broadcast sent');
  });
};