# Gob ($GOBB)

Community token and future-utility project on Solana.

> **This is the only official Gob repository.** If you're reading a copy of this content anywhere else — another repo, a cloned site, a different domain — verify it against `gobbuild.io` and [@gob1031](https://x.com/gob1031) before trusting anything in it, including any contract address. Anyone can fork or copy public files on GitHub; only this repository's commit history under this account is authentic.

> **Draft repo.** Several files in here contain `[ADD ...]` placeholders. Fill those in before treating anything in `docs/community/` as public-ready — they're meant to be accurate the day you publish them, not aspirational.

## Structure

```
docs/
  community/     Whitepaper, tokenomics, roadmap, FAQ — public-facing
  technical/     Placeholder scaffold for the future utility product
  runbooks/      Step-by-step operational guides for the team
    REPO_SETUP_RUNBOOK.md      How to push this repo to GitHub
    CA_LAUNCH_RUNBOOK.md       How $GOBB was minted on Jupiter Studio
    WEBSITE_LAUNCH_RUNBOOK.md  How gobbuild.io goes live (domain, hosting, public repo, reveal)
```

## Quick links

- [Whitepaper / project overview](docs/community/WHITEPAPER.md)
- [Tokenomics](docs/community/TOKENOMICS.md)
- [Roadmap](docs/community/ROADMAP.md)
- [FAQ](docs/community/FAQ.md)
- [Technical scaffold](docs/technical/ARCHITECTURE.md)
- [Repo setup runbook](docs/runbooks/REPO_SETUP_RUNBOOK.md)
- [CA launch runbook](docs/runbooks/CA_LAUNCH_RUNBOOK.md)
- [Website launch runbook](docs/runbooks/WEBSITE_LAUNCH_RUNBOOK.md)

## Status

- **$GOBB is live** on Jupiter Studio (CA `Cd8VXseSs7SYZhdQ57EkP7gugDzrGnZhKdfwXeYRjupx`) — minted, trading on a Meteora bonding curve, mint authority revoked, LP set to lock permanently at graduation. Verified on Solscan. There is only one $GOBB mint — an earlier note about a second, dormant Jupiter listing with "zero transactions" was a stale description of this same token, not a separate one (see `docs/community/FAQ.md`).
- **The website is live at `gobbuild.io`, and it stays intentionally stealth.** Domain purchased: `gobbuild.io` (primary) plus five defensive TLDs (`.com`/`.net`/`.info`/`.store`/`.online`), $167.31 total. GitHub Pages hosting, DNS, and HTTPS are all live and verified. The site's own CA field stays "Not minted yet" on purpose, indefinitely — **this repo is the actual public reveal**, linked directly from the site's homepage. See `docs/runbooks/WEBSITE_LAUNCH_RUNBOOK.md` for the sequence that got it live.
- The `CA_LAUNCH_RUNBOOK.md` in `docs/runbooks/` has been rewritten to match what actually happened — it now describes the real Jupiter Studio launch flow rather than the original pump.fun draft.
- Website: [gobbuild.io](https://gobbuild.io)
