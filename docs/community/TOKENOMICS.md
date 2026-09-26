# $GOBB — Tokenomics

**Status:** Real numbers, verified on-chain (Solscan) as of 2026-09-22. This replaces the earlier generic pump.fun-based template — the actual launch happened on **Jupiter Studio**, not pump.fun.

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

Full transparency here, because undisclosed team buys are one of the fastest ways to torch community trust:

| | |
|---|---|
| Creator allocation | 5% of supply, on a **12-month linear vest** |
| Creator's personal buy | ~2.1% of supply, bought on the open curve like any other participant (separate from the 5% allocation) |
| Combined eventual creator exposure | ~7.1% — but not all liquid at once. The 2.1% personal buy is liquid now; the 5% allocation unlocks gradually over 12 months |
| Creator wallet | `5qkfAMVjZczU3Y1vNwuh7wTCPRqWthyFGcRShp7ZcYQ6` — publicly disclosed so anyone can track vesting and holdings directly on-chain |

The honest read on the trust risk here: the creator *could*, in theory, eventually sell the personal buy plus the vested allocation back into the market and hurt price/liquidity. There's no code that prevents that — a vesting schedule limits *when* tokens become liquid, not what happens once they are. What limits the incentive to do that is economic, not technical: the fee structure below rewards sustained trading activity over a one-time price spike, so dumping the position would work against the thing that actually pays out over time.

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
