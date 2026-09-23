# Submission checklist

## Required before opening the PR

- [ ] Publish the game source in a public repository.
- [x] Add the planned public repository URL to `SUBMISSION.md` and `PR_DESCRIPTION.md`.
- [x] Add a public X, Telegram or email contact to both submission files.
- [ ] Copy `SUBMISSION.md` to `submissions/rare-friends-search-party/README.md` in a fork of `spokesz/rarefriends-vibeathon`.
- [ ] Use `PR_DESCRIPTION.md` as the pull-request description.
- [ ] Record and link the short demo from `DEMO_SCRIPT.md` if ready; the playable preview remains the required demo.

## Final verification

- [ ] Test wallet connection and Friend selection on Robinhood mainnet.
- [ ] Confirm canonical artwork loads for at least one Gen 1 and one later-generation Friend.
- [ ] Complete a dispatch → wait → return → field bag → journal loop on desktop.
- [ ] Complete the same loop on a mobile wallet browser.
- [ ] Confirm the preview clearly labels RF costs and rewards as simulated.
- [ ] Confirm mute and reduced-motion controls work.
- [ ] Confirm the public preview opens in a private/incognito browser window.
- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run check:games`.
- [ ] Run `node scripts/dev-game.mjs check games/afterglow`.

## Submission strategy

- Primary story: the original Rare Friends crypto-companion/Tamagotchi idea expressed as a low-attention game.
- Categories: Character Spotlight and Economy Potential.
- Do not position the staged leaderboard or jackpot as production-ready.
- Submit early, then update the PR before the September 30, 2026 deadline if additional polish is ready.
