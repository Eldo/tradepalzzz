# TradePal
WhatsApp bot using Node.js and Whapi.Cloud.

## Setup
1. npm install
2. Fill .env
3. Deploy to Vercel: git push, set env vars in dashboard.
4. In Whapi.Cloud, set webhook to https://your-app.vercel.app/webhook
5. For OCR PDFs, ensure server has cairo/pango deps (Vercel should handle).

Test locally: npm start