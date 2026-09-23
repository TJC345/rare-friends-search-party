# Hosted progress adapter

The public Search Party preview can pair the FriendSDK static build with the included Cloudflare Worker and D1 schema.

- `worker.js` serves the generated FriendSDK assets and exposes `GET/PUT /api/progress`.
- `0000_wallet_progress.sql` creates wallet-, Friend- and game-scoped records.
- The Worker verifies current ownership through `ownerOf` on the canonical Robinhood mainnet Generations contract before loading or saving progress.
- The FriendSDK host retains device-local storage as an offline fallback.

The preview economy remains simulated. Shared progress does not authorize or execute token transfers.
