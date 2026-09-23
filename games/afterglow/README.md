# Rare Friends: Search Party

Search Party is a low-attention virtual-pet expedition game built with FriendSDK v0.1.2. Your Rare Friend searches the crypto internet while you are away, then returns with artifacts, Rugged Relics and clues to a shared community mystery.

## Core loop

- Connect a wallet on Robinhood mainnet and select an owned Generations NFT (generation 1 or higher).
- Pick The Mempool, Bridge City or the NFT Graveyard and choose a short, medium or long expedition.
- Spend one simulated Search Permit and optionally add a simulated one-trip RF boost.
- The preview uses 25, 50 and 75 second timers in place of the intended 30-minute, four-hour and ten-hour waits.
- Return to reveal an artifact, a humorous Rugged Relic or an empty bag.
- Keep discoveries in that individual Friend's field bag. Preview progress is saved to that browser and device for the selected Friend.
- Contribute Signal to the staged Season Zero community mystery. Duplicate artifacts produce 70% less Signal, and completed collections earn a simulated Decoder Key.

The selected Friend remains the star: its canonical on-chain artwork travels during an expedition, its generation affects discovery odds, and its sprite family gives it a destination specialty. A specialty grants 15% more Signal at one destination; it does not increase RF rewards.

## Discovery rules

| Friend generation | Short/medium artifact chance | Long artifact chance |
| --- | ---: | ---: |
| Genesis (future support) | 65% | 80% |
| Gen 1 | 55% | 70% |
| Gen 2 | 45% | 60% |
| Gen 3 | 36% | 51% |
| Gen 4 | 28% | 43% |
| Gen 5 | 21% | 36% |
| Gen 6+ | 15% | 30% |

The Lucky Charm preparation adds five percentage points, capped at 80%. Longer routes improve artifact quality and Signal, while later-generation Friends progress more slowly without being excluded.

Preparations create small, readable choices:

- **Lucky Charm:** +5 percentage points to artifact odds.
- **Block Snack:** +1 Signal on every return.
- **Signal Antenna:** +2 Signal when an artifact is found.

## Simulated RF economy

All costs, rewards and balances in the MVP are simulated. No transaction is sent.

- Search Permit: 1 RF
- One-expedition boost: 0.25 RF
- Any completed return: 0.40 RF
- Artifact rewards: 0.10, 0.10, 0.25, 0.25, 0.75, 1.50 or 4 RF by rarity
- Collection milestones: 1 RF, 3 RF, then 8 RF plus a Decoder Key
- Twenty percent of permit spending is displayed as a staged community jackpot contribution

A 700,000-expedition economy simulation produced approximately 78% RF return for Genesis and 48% for Gen 6 before collection milestones. A separate 100,000-player farming simulation showed only about a 3% Signal advantage for controlling 100 Friends rather than one; future leaderboard rewards remain capped and are not part of the MVP.

## Season Zero preview

The mystery, leaderboard, jackpot and Decoder Keys are staged prototype systems. The selected Friend, journal, field bag and simulated balance use device-local preview storage scoped to that Friend. Cross-device persistence, production rewards, live contracts and verifiable randomness require future integration and Rare Friends review.

## Playable preview

https://rare-friends-search-party.chruschtj.chatgpt.site

Open the preview in a browser with an EIP-1193 wallet holding a hardwired Generations NFT, generation 1 or higher, on Robinhood mainnet.

## Run

This repository contains the Search Party game module for FriendSDK v0.1.2. Clone both repositories, then copy the game directory into the SDK checkout.

```sh
git clone https://github.com/spokesz/friendsdk.git
git clone https://github.com/tjc345/rare-friends-search-party.git
cp -R rare-friends-search-party/games/afterglow friendsdk/games/afterglow
cd friendsdk
npm ci
npm run dev:game -- games/afterglow
```

## Checks

```sh
npm test
npm run typecheck
npm run check:games
node scripts/dev-game.mjs check games/afterglow
```

FriendSDK browser harness checks additionally require Playwright Chromium:

```sh
npm run check:browser
```
