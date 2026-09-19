SITARAM ALARM BACKEND
======================

Purpose
-------
This is a small separate backend for Web Push / PWA background notifications.
It does NOT contain trading logic and does NOT replace the Bharati Unique market-data backend.

Why a separate service?
-----------------------
Your screenshot shows:
1) Bharati Unique Backend V4 itself is ONLINE and its Dhan/Depth feeds are CONNECTED.
2) The PWA says BACKEND OFFLINE. That means the PWA is not successfully talking to that backend (wrong URL/path/protocol/CORS/schema), not that Render is necessarily down.
3) VAPID invalid is a separate Web Push configuration problem.

This alarm backend fixes #3. The market-data connection still needs the PWA's data backend URL to be configured correctly.

What it provides
----------------
GET  /api/health
GET  /api/vapid-public-key
POST /api/subscribe
DELETE /api/subscribe
POST /api/test-push
POST /api/push
GET  /api/data-backend-health (optional proxy health check)

VAPID
-----
If VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are missing, the server generates a fresh key pair at startup and prints it in Render logs.
For production, put the generated keys into Render Environment Variables so they remain stable across restarts.

Required environment variables:
PORT=10000
VAPID_PUBLIC_KEY=<generated public key>
VAPID_PRIVATE_KEY=<generated private key>
VAPID_SUBJECT=mailto:your-email@example.com
FRONTEND_ORIGIN=https://YOUR-PWA.netlify.app

Optional:
DATA_BACKEND_URL=https://YOUR-BHARATI-BACKEND.onrender.com

IMPORTANT
---------
Do NOT put VAPID_PRIVATE_KEY into the PWA/browser.
Only the public key belongs in the PWA.

DEPLOY ON RENDER
----------------
1. Create a new GitHub repository.
2. Upload package.json, server.js and .env.example.
3. Render -> New Web Service -> select the repository.
4. Build Command: npm install
5. Start Command: npm start
6. Add the environment variables above.
7. Deploy.
8. Open /api/health. It must return {"ok":true,...}.
9. Open /api/vapid-public-key. Copy ONLY publicKey into the PWA's push/VAPID public-key setting.

VERY IMPORTANT
--------------
This backend cannot make a browser behave exactly like a native 5:00 AM alarm after Android has killed the browser. Web Push can wake the service worker when the OS/browser permits it, but delivery timing is OS-controlled.

For the trading system:
- Bharati Unique V4 = market data provider.
- SITARAM Alarm Backend = push notification provider.
- PWA = all RSI/SMA/DEMA setup logic + local alarm + logs + flow confirmation.

The two backends are intentionally separate.
