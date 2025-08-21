import express from 'express';

const app = express();
app.use(express.json());

// In-memory caches
global.users = new Map(); // phone => { fullname, email, bvn, state }
global.messages = new Map(); // chat_id => array of { phone, text, type, timestamp, fromBot }

// Health check endpoint
app.get('/', (req, res) => {
  const health = {
    status: 'healthy',
    message: 'TradePalzzz is running',
    registeredUsers: global.users.size,
    messagesLogged: Array.from(global.messages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };

  // Simulate a basic health check (e.g., ensure caches are writable)
  try {
    global.users.set('healthCheck', { state: 'test' });
    global.users.delete('healthCheck');
    res.status(200).json(health);
  } catch (err) {
    health.status = 'unhealthy';
    health.message = 'TradePalzzz encountered an error';
    health.error = err.message;
    res.status(500).json(health);
  }
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