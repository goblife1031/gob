# Gob — Technical Overview (placeholder)

**Status:** Scaffold only. The project brief mentions "coding for later utility" without specifics yet — this file exists so the repo has a real place to grow into once that utility is scoped, instead of bolting on docs structure later.

## Current state

There is no shipped utility product yet. $GOBB today is a token plus a community. This document is a placeholder for when that changes.

## Questions to answer before writing real architecture docs

Fill these in as decisions get made — don't try to answer them speculatively just to fill the section:

1. **What does the utility actually do?** (e.g., a dApp, a bot, a game, a data tool, a governance mechanism)
2. **Does it need on-chain components** (a program/smart contract on Solana), or is it off-chain tooling that simply reads $GOBB balances/holdings?
3. **Does $GOBB gate access to it**, and if so, how (minimum holding, staking, NFT-style pass, something else)?
4. **Who builds it** — in-house, contracted, or community contributors? This affects whether this repo should be public-from-day-one or developed privately and open-sourced later.

## Suggested structure once real work starts

```
/programs        # on-chain programs, if any (e.g. Anchor/Solana programs)
/app             # frontend/dApp code, if any
/scripts         # deployment, minting, or ops scripts
/docs/technical  # this folder — architecture decisions, ADRs, API docs
```

## Contributing

[ADD once there's actual code: local setup instructions, how to run tests, branch/PR conventions, who reviews.]
