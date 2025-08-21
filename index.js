import express from 'express';

const app = express();
app.use(express.json());

// In-memory caches
global.users = new Map(); // phone => { fullname, email, bvn, state }
global.messages = new Map(); // chat_id => array of { phone, text, type, timestamp, fromBot }

// Add a simple GET handler for the root
app.get('/', (req, res) => {
  res.status(200).send('TradePalzzz is running. Use /webhook for messages and /send for broadcasts.');
});

import webhook from './webhook/webhook.js';
import sendApi from './api/send.js';

webhook(app);
sendApi(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;