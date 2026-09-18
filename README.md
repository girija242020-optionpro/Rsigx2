# SITARAM Data Provider V6

Backend only. No trading/entry/signal/confluence logic is executed here.

Render:
- Root Directory: blank
- Build Command: npm install
- Start Command: node server.js

Required Dhan environment variables:
DHAN_CLIENT_ID, DHAN_PIN, DHAN_TOTP_SECRET (or DHAN_ACCESS_TOKEN)

Optional browser push transport:
VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

Endpoints:
/api/health
/api/state
/api/ticks
/api/history
/api/option-chain
/api/analytics
/api/depth?segment=NSE_FNO&securityId=...
/api/instruments
/api/config
/api/index
/api/expiry
/api/expiry/select
/api/push/subscribe
/ws

The PWA owns all setup, confluence, entry, SL, target and alert logic.
L20 parsing follows Dhan's 20-level binary packet format (response codes 41/51).
