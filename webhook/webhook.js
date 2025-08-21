import messageHandler from '../handlers/messageHandler.js';

export default (app) => {
  app.post('/webhook', async (req, res) => {
    try {
      const payload = req.body;
      const msgs = payload.messages || [];
      for (const msg of msgs) {
        await messageHandler(msg);
      }
      res.status(200).end();
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).end();
    }
  });
};