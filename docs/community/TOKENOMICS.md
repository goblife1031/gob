# $GOBB — Tokenomics

**Status:** Draft — this is a template. Fill in real numbers before publishing anywhere, and make sure the numbers here match what's actually on-chain once the token is minted. A tokenomics page that doesn't match the chain is the fastest way to lose community trust.

## Supply

| Field | Value |
|---|---|
| Total supply | [ADD — pump.fun's standard is 1,000,000,000 (1B) tokens; confirm if you're using the default] |
| Circulating at launch | 100% via the bonding curve (this is how pump.fun works — there is no separate presale or team allocation carved out unless you build one outside the standard "meme" mode) |
| Mint authority | Revoked at creation (standard for pump.fun tokens) |
| Freeze authority | Revoked at creation (standard for pump.fun tokens) |

## How initial distribution actually works on pump.fun

Be accurate with your community about this — it's a common source of confusion:

- In pump.fun's default ("meme") mode, there is **no team allocation, no presale, and no vesting**. 100% of supply enters the bonding curve at creation, and anyone (including the creator) buys in on the same curve as everyone else.
- If the team wants an allocation, that has to be done deliberately — either via pump.fun's "Custom" launch mode (which supports optional vesting) or by the creator doing a normal buy on the curve right after launch like any other participant, and disclosing that publicly (e.g., "the team bought X% at launch, wallet: [address]").
- Undisclosed team buys that are later discovered are one of the fastest ways to torch community trust in this space. Whatever the team does here, write it down and publish it.

[FILL IN: which mode you're using, whether the team is taking any allocation, and if so, how much, from which wallet, and any vesting/lockup commitment.]

## Fees

| Fee | Rate | Goes to |
|---|---|---|
| Trading fee (bonding curve phase) | ~1–1.25% per trade (protocol + creator split — confirm current rate on pump.fun at launch time, this changes) | Split between pump.fun protocol and the token creator |
| Creator fee | A portion of the above | Creator wallet — [ADD WALLET ADDRESS if you want this public] |
| Post-graduation (PumpSwap) | Tiered, roughly 0.30–1.25% depending on pool | Split between protocol and liquidity providers |

## Liquidity

- Liquidity lives in the bonding curve until the token "graduates" (reaches roughly $69K market cap on pump.fun as of 2026 — confirm the current graduation threshold on pump.fun before publishing, it has changed before and may change again).
- On graduation, liquidity migrates automatically into a PumpSwap pool.
- Fewer than 2% of tokens launched on pump.fun ever reach graduation — this isn't a guarantee of anything, just useful context to set expectations honestly with the community rather than implying graduation is a formality.

## What happens to the utility roadmap allocation?

[If any future utility product (see `docs/technical/`) will need its own token allocation, treasury, or funding mechanism, describe that here — even a placeholder like "TBD, to be proposed and voted on by the community before any allocation is made" is better than silence.]

## Disclaimer

Tokenomics can change only in the ways that are actually possible on-chain (e.g., mint authority is revoked, so total supply cannot be inflated after launch). Anything the team commits to that ISN'T enforced on-chain (vesting promises, "we won't sell," treasury commitments) is a social commitment, not a technical guarantee — say that plainly rather than implying otherwise.
