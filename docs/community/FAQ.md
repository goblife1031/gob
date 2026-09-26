# $GOBB — FAQ

## What is $GOBB?
[ADD one or two sentences, consistent with `docs/community/WHITEPAPER.md` §2.]

## What chain is it on?
Solana. $GOBB is an SPL token.

## Where do I buy it?
Through Jupiter Studio's bonding curve, and later through the Meteora DAMM v2 pool if/when the token graduates. Always verify the contract address (CA) below against the official links before buying — see "How do I know I have the real $GOBB?" below.

**Official CA:** `Cd8VXseSs7SYZhdQ57EkP7gugDzrGnZhKdfwXeYRjupx`

## How do I know I have the real $GOBB and not a copycat?
Anyone can create a token with the name "Gob" and ticker "$GOBB" — this is trivially easy on Solana (via Jupiter Studio, pump.fun, or otherwise) and happens constantly to popular-sounding names. The name and ticker mean nothing on their own. The **contract address** above is the only thing that identifies the real token. Always cross-check the CA shown in your wallet or on a DEX against the CA posted on the official website and official X account — not against a link someone DMs you or posts in a comment.

## Is there a presale or team allocation?
Yes, fully disclosed: a 5% creator allocation on a 12-month linear vest, plus a separate ~2.1% personal buy by the creator on the open curve (same price as everyone else). Both are held in a publicly disclosed wallet — see `docs/community/TOKENOMICS.md` for the full breakdown and the wallet address so you can verify it yourself on-chain.

## Is $GOBB an investment?
No. $GOBB is a speculative digital token launched for a community, with an intended future utility described in the roadmap. It is not a security, and the team is not promising returns, price performance, or that any planned utility will ship on any particular timeline. Only ever spend what you can afford to lose completely.

## Is the mint/freeze authority revoked?
Yes, verified directly on-chain — mint authority is revoked and the token's metadata is immutable. Check it yourself at `solscan.io/token/Cd8VXseSs7SYZhdQ57EkP7gugDzrGnZhKdfwXeYRjupx` rather than taking our word for it.

## Is there another $GOBB mint I should know about?
No — there is only one $GOBB mint: `Cd8VXseSs7SYZhdQ57EkP7gugDzrGnZhKdfwXeYRjupx`. Earlier internal notes referenced what looked like a second, dormant Jupiter listing showing zero transactions; that turned out to just be a stale/outdated description of this same token, not a separate mint. What actually happened on-chain: the Meteora pool-authority transfers visible on Solscan were the creator moving the disclosed 5% allocation and ~2.1% personal buy into the creator wallet (see `docs/community/TOKENOMICS.md`), and the one outside transaction was a single small buy routed through `OKX: Router`. If you ever come across a different address claiming to be $GOBB, it is not affiliated with this project — always check the CA above.

## What happens if the token doesn't graduate?
It keeps trading on the bonding curve. Graduation (migration into a Meteora DAMM v2 pool at $85,000 market cap) isn't guaranteed and depends on real organic buy volume. Be wary of anyone suggesting wash trading or bot volume to force graduation — beyond being dishonest to the community, it can cross into market-manipulation territory depending on jurisdiction.

## Who's behind this project?
[ADD — see `docs/community/WHITEPAPER.md` §5 for the team's stated position on identity/anonymity, and keep this answer consistent with it.]

## Where can I get help / report a scam impersonating $GOBB?
[ADD official support channel — e.g., a specific Telegram/Discord mod team or an X account to DM.]
