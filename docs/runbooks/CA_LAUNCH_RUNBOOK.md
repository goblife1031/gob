# Runbook: Minting $GOBB's CA on pump.fun

This covers the actual token creation ("minting the CA") on pump.fun, plus the security and disclosure steps around it. Facts below are current as of September 2026 per pump.fun's own docs and third-party reviews — **pump.fun changes fee rates and thresholds without much notice, so re-verify the numbers marked "confirm at launch time" on the site itself right before you launch.**

## 0. On running two CAs (Jupiter + pump.fun)

You mentioned the Jupiter-side CA has had zero transactions and was never shared publicly. Given that, minting a second, separate token on pump.fun is **not** the risky "abandon the community" scenario flagged earlier — there's no existing community or liquidity attached to the Jupiter mint to strand.

That said, two live SPL tokens with the same name/ticker existing at once is exactly the setup that makes it easy for someone to scam your future community by promoting the *other* one (either the dormant Jupiter mint, or a copycat pump.fun clone someone else creates). So the operating rule going forward:

- **Only ever publicize one CA** — the pump.fun one, once minted. Never post both, never let a CM casually drop the Jupiter address anywhere public.
- Decide now what happens to the dormant Jupiter mint: leave it untouched and undocumented (fine, since nobody has it), or explicitly note in your FAQ that it's an old, abandoned test mint with no value or purpose (also fine, and slightly more transparent). Either is defensible; just be consistent about it if anyone asks. A draft FAQ answer for this is already in `docs/community/FAQ.md`.
- Do not present the Jupiter mint as a "backup" or "official secondary" token. In this space, one project having two actively-promoted CAs reads as either a scam pattern or a sign of a disorganized team — neither is the impression you want.

## 1. Prerequisites

- **A dedicated launch wallet.** Don't use a wallet that holds significant other funds or NFTs. Create a fresh Phantom, Solflare, or Backpack wallet just for this, fund it with only what you need (a few SOL covers network fees and any first buy — see step 4). If that wallet is ever compromised, the blast radius is contained.
- **SOL in that wallet.** Creating the coin itself is free on pump.fun (no platform fee to mint), but you still pay Solana network fees, plus the ~1–1.25% trading fee on any buy you make (including your own first buy, if you do one).
- **Finalized branding.** Name, ticker, and image are **immutable once minted** — pump.fun bakes them into the SPL token metadata and does not allow changes after the fact. Triple-check spelling, casing, and the image file before you submit. ("Gob" / "$GOBB" — confirm this is exactly, character-for-character, what you want on-chain forever.)
- **Image asset**: square, ideally 512×512, PNG or JPG.
- **A short description** for the coin page (2–3 sentences is normal).
- **Social links** ready to paste in: X, Telegram/Discord, website (if the site is live before the mint — see the website section of this project).

## 2. Security precautions before you touch anything

- **Bookmark the real URL** (pump.fun) and only ever navigate to it from that bookmark. Phishing clones of popular Solana sites are common, especially ones promoted through paid ads or DMs claiming to help you "launch faster."
- **Never approve a transaction you don't understand.** Your wallet will show you what you're signing — read it. If a site asks for a blanket/unlimited token approval when all you're doing is creating a coin, stop and reconsider.
- **Be skeptical of third-party "bundler bots"** that offer to create your coin and coordinate multiple wallets buying it in the same block. These are unaudited third-party tools that require sending them SOL up front, and handing funds to an unvetted bot is a real rug vector on its own — independent of whether the bundling itself would raise the wash-trading/manipulation concern below. If you want a coordinated launch buy, do it yourself, transparently, from wallets you control and disclose (see Tokenomics doc).
- **Think about wash-trading exposure before coordinating multiple wallets to buy your own launch.** Regulators in several jurisdictions treat coordinated self-trading meant to simulate organic demand as market manipulation, independent of whether a token is deemed a security. This isn't legal advice — if your team is planning any coordinated buy strategy beyond a single, disclosed founder buy, that's worth a real conversation with counsel familiar with digital assets, not a judgment call made in a Discord channel the night before launch.

## 3. Step-by-step: creating the coin

1. Go to pump.fun and connect your dedicated launch wallet (or use email sign-in via Privy, which generates an embedded wallet — a self-custodied wallet you control directly is generally preferable for something you intend to manage long-term).
2. Click **Create coin** (naming may vary slightly in the UI).
3. Fill in:
   - **Name**: Gob
   - **Symbol**: GOBB
   - **Description**: pull from `docs/community/WHITEPAPER.md` §2 once that's written
   - **Image**: your finalized 512×512 asset
   - **Socials**: X / Telegram / website links, if ready
4. Review everything once more — this is your last chance to fix a typo.
5. Sign the creation transaction in your wallet. This step is free on pump.fun's side; you only pay the network fee.
6. **Optional — first buy:** pump.fun lets you buy your own token as your very first transaction, same as any other participant on the curve. If the team wants visible initial ownership, do this openly with a specific, disclosed amount, and record it in `docs/community/TOKENOMICS.md` (wallet address + amount) rather than leaving the community to discover it later.
7. The coin is now live and trading on the bonding curve immediately — there's no separate "go live" step.

## 4. Immediately after minting

- **Copy the CA (contract address)** from the token's pump.fun page or your wallet's token list.
- **Publish the CA everywhere at once** — website, pinned X post, Discord/Telegram announcement — as close to simultaneously as you can manage. The gap between "token exists" and "CA is public everywhere" is exactly the window an impersonator uses to post a fake CA first and catch confused buyers.
- **Verify mint and freeze authority are revoked.** Look the token up on a Solana explorer (e.g., Solscan) and confirm both show as revoked/disabled — this is pump.fun's default behavior, but verify it yourself rather than asserting it to your community on faith, and link the explorer page from your FAQ/tokenomics doc so anyone can check it themselves.
- **Update `docs/community/WHITEPAPER.md` and `TOKENOMICS.md`** with the real CA, supply, and any founder-buy disclosure.
- **Update the website** (see the published $GOBB page) with the live CA and pump.fun link.

## 5. Ongoing

- **Graduation**: pump.fun tokens migrate to a PumpSwap pool once the bonding curve raises roughly 40 SOL (commonly cited as ~$69K market cap, which moves with SOL's price — confirm pump.fun's current stated threshold, it has changed before). This happens automatically; there's nothing to trigger manually.
- **Fees**: expect roughly 1–1.25% per trade during the bonding-curve phase, split between the protocol and the creator wallet, with a lower tiered rate after graduation on PumpSwap. Check pump.fun's current fee page — these rates aren't fixed forever.
- **Monitor for impersonators** periodically (search X/Telegram for your ticker) and be ready to publicly and repeatedly point back to the one official CA if a copycat shows up — this will happen if the token gets any real traction.
