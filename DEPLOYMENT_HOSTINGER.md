1. Buy hosting with Node.js support or Hostinger VPS.
2. Point domain A record to Hostinger server IP.
3. Create subdomains:
   - vkptechnologies.in for frontend
   - api.vkptechnologies.in for backend
4. Enable SSL from Hostinger hPanel for both domains.
5. Copy `.env.example` to `.env` and enter live Razorpay, Firebase, and WhatsApp values.
6. Install dependencies:
   ```bash
   npm install
   ```
7. Build frontend:
   ```bash
   npm run build
   ```
8. Upload `dist` contents to Hostinger `public_html`.
9. Run backend:
   ```bash
   npm run api
   ```
10. In Hostinger Node app or VPS process manager, set start file:
   ```bash
   server/index.js
   ```
11. Configure reverse proxy for `api.vkptechnologies.in` to backend port `8080`.
12. Add Razorpay webhook URL:
   ```text
   https://api.vkptechnologies.in/api/payments/verify
   ```
13. Add WhatsApp Cloud webhook URL:
   ```text
   https://api.vkptechnologies.in/webhooks/whatsapp
   ```
14. Import `n8n/vkp-whatsapp-crm-followup.json` into n8n.
15. Set n8n environment values:
   ```text
   VKP_API_BASE=https://api.vkptechnologies.in
   WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
   ```
16. Seed product catalogue:
   ```bash
   node server/scripts/seed-products.js
   ```
17. Deploy `firebase.rules` in Firebase console Firestore rules.
