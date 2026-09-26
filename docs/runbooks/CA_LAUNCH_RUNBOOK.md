# Runbook: Minting $GOBB's CA on Jupiter Studio

This covers how $GOBB's token was actually created ("minting the CA") on **Jupiter Studio**, plus the security and disclosure steps around it. Jupiter Studio launches use a Meteora dynamic bonding curve (DBC) under the hood. Facts below are current as of September 2026 per Jupiter's own docs and third-party reviews — **launch platforms change fee rates and thresholds without much notice, so re-verify the numbers marked "confirm at launch time" on the site itself before you launch anything new.**

> This runbook originally described a pump.fun launch flow. It's been rewritten to match what actually happened — the real launch was on Jupiter Studio, not pump.fun — so the platform-specific steps below are accurate to the real mint. The security/disclosure practices carry over unchanged from the earlier draft; they're sound for any bonding-curve launch regardless of platform.

## 0. On running two CAs (Jupiter + anything else)

If you ever consider minting a second, separate token elsewhere (another Jupiter Studio mint, pump.fun, or otherwise) while $GOBB is live, treat it the same way this project treated the earlier, since-resolved question about a second Jupiter listing (see `docs/community/FAQ.md`): two live SPL tokens with the same name/ticker existing at once is exactly the setup that makes it easy for someone to scam your community by promoting the *other* one.

So the operating rule going forward:

- **Only ever publicize one CA** — `Cd8VXseSs7SYZhdQ57EkP7gugDzrGnZhKdfwXeYRjupx`. Never post a second address anywhere public, and never let a CM casually drop an alternate address.
- Do not present any other mint as a "backup" or "official secondary" token. In this space, one project having two actively-promoted CAs reads as either a scam pattern or a sign of a disorganized team — neither is the impression you want.

## 1. Prerequisites

- **A dedicated launch wallet.** Don't use a wallet that holds significant other funds or NFTs. Create a fresh Phantom, Solflare, or Backpack wallet just for this, fund it with only what you need (a few SOL covers network fees and any first buy — see step 4). If that wallet is ever compromised, the blast radius is contained.
- **SOL in that wallet.** Creating the coin itself is free on Jupiter Studio (no platform fee to mint), but you still pay Solana network fees, plus the trading fee on any buy you make (including your own first buy, if you do one) — see `docs/community/TOKENOMICS.md` for the actual rate used.
- **Finalized branding.** Name, ticker, and image are **immutable once minted** — Jupiter Studio bakes them into the SPL token metadata and does not allow changes after the fact. Triple-check spelling, casing, and the image file before you submit. ("Gob" / "$GOBB" — confirmed, character-for-character, on-chain.)
- **Image asset**: square, ideally 512×512, PNG or JPG.
- **A short description** for the coin page (2–3 sentences is normal).
- **Social links** ready to paste in: X, Telegram/Discord, website (if the site is live before the mint — see the website section of this project).

## 2. Security precautions before you touch anything

- **Bookmark the real URL** (jup.ag / Jupiter Studio) and only ever navigate to it from that bookmark. Phishing clones of popular Solana sites are common, especially ones promoted through paid ads or DMs claiming to help you "launch faster."
- **Never approve a transaction you don't understand.** Your wallet will show you what you're signing — read it. If a site asks for a blanket/unlimited token approval when all you're doing is creating a coin, stop and reconsider.
- **Be skeptical of third-party "bundler bots"** that offer to create your coin and coordinate multiple wallets buying it in the same block. These are unaudited third-party tools that require sending them SOL up front, and handing funds to an unvetted bot is a real rug vector on its own — independent of whether the bundling itself would raise the wash-trading/manipulation concern below. If you want a coordinated launch buy, do it yourself, transparently, from wallets you control and disclose (see Tokenomics doc).
- **Think about wash-trading exposure before coordinating multiple wallets to buy your own launch.** Regulators in several jurisdictions treat coordinated self-trading meant to simulate organic demand as market manipulation, independent of whether a token is deemed a security. This isn't legal advice — if your team is planning any coordinated buy strategy beyond a single, disclosed founder buy, that's worth a real conversation with counsel familiar with digital assets, not a judgment call made in a Discord channel the night before launch.

## 3. Step-by-step: creating the coin

1. Go to Jupiter Studio (via jup.ag) and connect your dedicated launch wallet.
2. Use Jupiter Studio's coin-creation flow (naming may vary slightly in the UI).
3. Fill in:
   - **Name**: Gob
   - **Symbol**: GOBB
   - **Description**: pull from `docs/community/WHITEPAPER.md` §2
   - **Image**: your finalized 512×512 asset
   - **Socials**: X / Telegram / website links, if ready
4. Review everything once more — this is your last chance to fix a typo.
5. Sign the creation transaction in your wallet. This step is free on Jupiter Studio's side; you only pay the network fee. This kicks off a Meteora dynamic bonding curve for the token.
6. **Optional — first buy:** Jupiter Studio lets you buy your own token as your very first transaction, same as any other participant on the curve. If the team wants visible initial ownership, do this openly with a specific, disclosed amount, and record it in `docs/community/TOKENOMICS.md` (wallet address + amount) rather than leaving the community to discover it later. (For $GOBB, this is the disclosed ~2.1% personal buy — see Tokenomics.)
7. The coin is now live and trading on the bonding curve immediately — there's no separate "go live" step.

## 4. Immediately after minting

- **Copy the CA (contract address)** from the token's Jupiter Studio page or your wallet's token list.
- **Publish the CA everywhere at once** — website, pinned X post, Discord/Telegram announcement — as close to simultaneously as you can manage. The gap between "token exists" and "CA is public everywhere" is exactly the window an impersonator uses to post a fake CA first and catch confused buyers. (For $GOBB specifically, the team has chosen a staged rollout instead — see `docs/community/ROADMAP.md` Phase 1 — but the "publish everywhere at once" principle still applies to whatever moment the team picks to go public.)
- **Verify mint and freeze authority are revoked.** Look the token up on a Solana explorer (e.g., Solscan) and confirm both show as revoked/disabled — this is Jupiter Studio's default behavior, but verify it yourself rather than asserting it to your community on faith, and link the explorer page from your FAQ/tokenomics doc so anyone can check it themselves.
- **Update `docs/community/WHITEPAPER.md` and `TOKENOMICS.md`** with the real CA, supply, and any founder-buy disclosure. (Already done for $GOBB.)
- **Update the website** with the live CA and Jupiter Studio link, once the team is ready to make that public.

## 5. Ongoing

- **Graduation**: Jupiter Studio tokens on a Meteora dynamic bonding curve migrate to a Meteora DAMM v2 liquidity pool once the curve hits its market-cap target (for $GOBB, $85,000 MC — see `docs/community/TOKENOMICS.md`; this figure is platform/curve-config dependent and can change between launches). This happens automatically; there's nothing to trigger manually.
- **Fees**: expect a per-trade fee split between the protocol and the creator wallet during the bonding-curve phase (1% for $GOBB — see Tokenomics), with fee structure potentially differing after graduation on the Meteora DAMM v2 pool. Check current platform docs before any future launch — these rates aren't fixed forever.
- **Monitor for impersonators** periodically (search X/Telegram for your ticker) and be ready to publicly and repeatedly point back to the one official CA if a copycat shows up — this will happen if the token gets any real traction.
