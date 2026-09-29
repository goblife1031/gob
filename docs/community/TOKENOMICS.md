# $GOBB — Tokenomics

**Status:** Real numbers, verified on-chain (Solscan) as of 2026-09-29. This replaces the earlier generic pump.fun-based template — the actual launch happened on **Jupiter Studio**, not pump.fun.

## Token facts

| Field | Value |
|---|---|
| Name / Ticker | GOB / $GOBB |
| Chain | Solana (SPL token) |
| Contract address (CA) | `Cd8VXseSs7SYZhdQ57EkP7gugDzrGnZhKdfwXeYRjupx` |
| Launch venue | Jupiter Studio (Meteora dynamic bonding curve) |
| Total supply | 1,000,000,000 $GOBB |
| Decimals | 6 |
| Mint authority | Revoked ✓ (verified on Solscan — set to the System Program, i.e. no one can mint more) |
| Metadata | Immutable ✓ (name/symbol/image can't be changed after the fact) |
| First mint | ~2026-09-16 |

Anyone can verify all of the above directly at `solscan.io/token/Cd8VXseSs7SYZhdQ57EkP7gugDzrGnZhKdfwXeYRjupx` — don't take our word for it, check it yourself.

## How it launched

$GOBB launched through Jupiter Studio's bonding curve mechanism (a Meteora Dynamic Bonding Curve, or "DBC"). That means:

- **Initial market cap:** $5,000.
- **Graduation target:** $85,000 MC. At graduation, the curve migrates into a Meteora DAMM v2 liquidity pool and trading moves out of the bonding-curve phase.
- There was no separate presale distinct from the curve itself — anyone (including the creator) buys in on the same curve, at the same price, as everyone else, at whatever point they buy.

## Creator allocation & disclosure

Full transparency here, because undisclosed team buys — or undisclosed team sales — are one of the fastest ways to torch community trust:

| | |
|---|---|
| Creator vesting allocation | 5% of supply (50,000,000 $GOBB), **12-month linear vest** via Jupiter Studio's built-in creator vesting mechanism. This streams out of the bonding curve pool starting after graduation — it is **not** currently sitting in the creator wallet |
| Dev-held liquid balance | ~5.38% of supply (53,796,322 $GOBB) as of 2026-09-29, held directly in the disclosed wallet today — grown from an initial ~2.1% open-curve buy at launch, expanded to fund marketer payments and future project costs |
| Combined eventual dev exposure | ~10.38% of supply once the vesting allocation fully unlocks post-graduation — these are two separate pools, not one number, and are not additive today |
| Creator wallet | `5qkfAMVjZczU3Y1vNwuh7wTCPRqWthyFGcRShp7ZcYQ6` — publicly disclosed so anyone can track both the liquid balance and, once graduation happens, the vesting stream directly on-chain |

**Update, 2026-09-29:** the dev-held liquid balance above (separate from the 5% vesting allocation, which is untouched and hasn't started streaming yet) was expanded this week to fund marketer payments and future project costs — some of it was sold, moved through another token, and bought back into the same disclosed wallet, growing the liquid balance from its original ~2.1% to the current ~5.38%. That activity is visible on-chain in the wallet's own transaction history — we're stating it here rather than leaving it for someone else to find first.

The honest read on the trust risk here: the creator *could*, in theory, eventually sell the liquid balance plus the vested allocation (once it starts unlocking post-graduation) back into the market and hurt price/liquidity — and as this update shows, part of the liquid balance already has moved once, for a disclosed reason. There's no code that prevents further sales — a vesting schedule limits *when* the 5% allocation becomes liquid, not what happens once it does. What limits the incentive to do that is economic, not technical: the fee structure below rewards sustained trading activity over a one-time price spike, so dumping either pool would work against the thing that actually pays out over time.

## Fees

| Fee | Rate | Notes |
|---|---|---|
| Transaction fee | 1% per trade | This is the number that matters most here — creator economics are tied to **transaction volume**, not market cap. That's a deliberate choice: it means the team is incentivized to build sustained usage and trading activity rather than chase a market-cap number and disappear. |

## Liquidity

- **100% of LP is permanently locked.** The creator cannot pull liquidity after graduation, full stop — this is enforced by the mechanism itself, not a promise.
- Combined with the revoked mint authority, the two classic "rug" mechanisms (mint more supply, or pull the liquidity) are both technically closed off, not just pinky-promised.

## Philosophy — why the numbers look like this

Straight from the team's own words, worth stating plainly rather than paraphrasing into something blander: *"I want money. You want money. Devs want success in their product. We make money when Gob gets real volume — not from a chart pump. Trust, community, no DeFi/TA bullshit."*

Practically, that means:
- Market cap is treated as a milestone, not the goal — recurring transaction volume is what actually funds anything that gets built later.
- There is deliberately no "giant roadmap" locked in yet. The team would rather figure out what Gob becomes together with the community than pre-announce a utility no one asked for. See `ROADMAP.md` for how that's framed.

## Disclaimer

None of the above is a promise about price, returns, or liquidity depth. Vesting schedules and locked LP are real, verifiable, on-chain constraints — they close off specific rug mechanisms, but they don't guarantee the token succeeds, trades actively, or is worth anything at any given time. Only ever risk what you can afford to lose completely.
