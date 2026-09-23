# Submission: Rare Friends — Search Party

## Project name

Rare Friends: Search Party

## Builder / contact

T.J. Chrusch · [@tjc345](https://x.com/tjc345)

## Categories

- Character Spotlight
- Economy Potential

## What did you build?

Search Party is a low-attention virtual-pet expedition game. An owned Rare Friend searches a playful version of the crypto internet while its owner is away, then returns with artifacts, humorous Rugged Relics and clues that advance a staged community mystery.

## How does it use Rare Friends?

The selected hardwired Generations NFT is the field agent. Its canonical on-chain character artwork appears in the game, its generation determines artifact odds, its sprite family provides a destination specialty, and its journal and seven-artifact collection belong to that individual Friend.

## Source code

https://github.com/tjc345/rare-friends-search-party · FriendSDK v0.1.2

## Playable demo

https://rare-friends-search-party.chruschtj.chatgpt.site

Open the demo in a browser with an EIP-1193 wallet on Robinhood mainnet holding a hardwired Generations NFT, generation 1 or higher. Purchases, balances and rewards are simulated; no transaction signature is requested.

## How do you play?

1. Connect a wallet and choose an owned Rare Friend.
2. Choose The Mempool, Bridge City or the NFT Graveyard.
3. Pick a route and pack a Block Snack, Signal Antenna or Lucky Charm.
4. Spend one simulated Search Permit and optionally use a simulated one-expedition RF boost.
5. Return when the timer ends, open the field bag and add the result to that Friend's journal.
6. Complete the Friend's artifact collection and contribute Signal to Season Zero's shared mystery.

The hosted preview compresses intended 30-minute, four-hour and ten-hour expeditions into 25, 50 and 75 seconds for testing.

## Costs, probabilities and rewards

Everything in the MVP economy is simulated and labeled as such.

- One Search Permit costs 1 simulated RF.
- A one-expedition Signal Boost costs 0.25 simulated RF.
- Every completed return recovers 0.40 simulated RF.
- Artifact rewards range from 0.10 to 4 simulated RF.
- Collection milestones award 1, 3 and 8 simulated RF; a completed collection also earns a simulated Decoder Key.
- Twenty percent of permit and boost spending is displayed as a staged community-jackpot contribution.
- Artifact odds range from 55%/70% for Gen 1 short-or-medium/long expeditions to 15%/30% for Gen 6+. A Lucky Charm adds five percentage points, capped at 80%.

Each Friend owns its own collection. Duplicate artifacts earn 70% less Signal, repeated Mempool searches diminish, and a Friend's sprite family earns 15% more Signal at one destination without increasing RF rewards.

## What have you tested?

- FriendSDK build and typecheck
- 115 automated tests passing, with two local-contract integration tests skipped when Foundry/Anvil is unavailable
- Game validation and economy bounds
- 100,000-player farming simulation
- 700,000-expedition generation economy simulation
- Manual desktop and mobile wallet playthroughs
- Canonical artwork loading across multiple owned Friends

## Known limitations

- Progress is saved locally in the current browser and does not yet synchronize across devices.
- The community mystery, leaderboard, jackpot and Decoder Keys are staged Season Zero systems.
- Genesis odds are modeled, but the current FriendSDK ownership gate selects hardwired Generations NFTs, generation 1 or higher.
- Live RF spending, production contracts and verifiable randomness require future Rare Friends integration and review.

## Credits

Built with FriendSDK v0.1.2. Game code, interface artwork, artifact art and written content were created for this Vibeathon entry. The selected Friend uses its original canonical on-chain artwork.
