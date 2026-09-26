# Runbook: Launching gobbuild.io (website-first public reveal)

**Status:** New plan as of 2026-09-25, supersedes the earlier "share the repo quietly with early adopters, publish the CA later" sequencing. The website going live at `gobbuild.io` is now **the** public go-live moment — CA revealed, GitHub repo surfaced, "not minted yet" cover dropped. Don't execute the later steps here until you're actually ready for that, since several of them are hard to fully undo (a public repo can go private again, but anyone who cloned it in the meantime still has it).

## 0. Sequence at a glance

1. ~~Buy the domain.~~ Done — `gobbuild.io` plus five defensive TLDs.
2. Get the site itself ready to be served from a real host (not just the Claude artifact URL).
3. Audit the GitHub repo before making it public — this is the step most likely to bite you if skipped.
4. Flip the repo public, turn on GitHub Pages, connect the domain.
5. Flip the website's own copy from "not minted yet" to live, with the real CA and the GitHub link.
6. Announce.

## 1. Buy the domain — done

Purchased on GoDaddy 2026-09-25, $167.31 total:

| Domain | Role |
|---|---|
| **`gobbuild.io`** | **Primary** — this is what gets built out on GitHub Pages and announced everywhere. |
| `gobbuild.com` | Defensive — redirect to `gobbuild.io` once live. |
| `gobbuild.net` | Defensive — redirect. |
| `gobbuild.info` | Defensive — redirect. |
| `gobbuild.store` | Defensive — redirect. |
| `gobbuild.online` | Defensive — redirect. |

Grabbing all six was the right instinct — a look-alike domain on one of the TLDs you *didn't* buy is a classic impersonation vector once you're actually public (same logic as the FAQ's "how do I know I have the real $GOBB," just applied to the website instead of the CA). Set up the redirects in GoDaddy's domain forwarding once `gobbuild.io` is actually live on GitHub Pages — no rush before then, but don't forget them, since an unclaimed-looking "Set Up" state on five lookalike domains is itself a little odd if someone goes looking.

## 2. Get the site ready for GitHub Pages

You picked GitHub Pages for hosting, which is a good fit since the site and the docs repo become the same project. GitHub Pages serves static files straight out of a repo (or a `docs/` folder, or a `gh-pages` branch — your call).

- Take the current site (the Claude-hosted artifact) and add it to the repo as a real file — e.g. `site/index.html` or `docs/index.html`, whichever path you configure Pages to serve from. I have the current HTML on hand and can drop it into the repo for you once you tell me the path you want.
- In the repo's GitHub Settings → Pages, set the source to the branch/folder you used.
- Once Pages is enabled, GitHub gives you a default URL like `https://<username>.github.io/gob/` — get that working *before* touching DNS, so you know the site itself is fine independent of the domain.

## 3. Audit the repo before flipping it public — do this before step 4, not after

This is the step that's easy to skip in the excitement of finally going live, and the one most likely to cause a problem you can't fully take back. Two specific things to check, both because a public GitHub repo exposes its **full commit history**, not just the current state of the files:

### a. Git commit identity — the anonymity question you haven't actually answered yet

`docs/community/WHITEPAPER.md` §5 is still an open placeholder: *"If the team wants to identify itself... say so here. If the team is anonymous, say that plainly too."* You haven't decided that yet. But every commit in a git repo carries an author name and email — almost always your real git config (`user.name` / `user.email`), which most people never think about because it's invisible in normal use. Making the repo public makes that metadata public too, on every single commit, permanently (even if you later delete a file, old commits showing the author are still there in the history unless you rewrite it).

**Before pushing anything further or flipping visibility, run this on your machine** (in `C:\Users\bveil\Gobcode` — or wherever the actual repo lives):

```
git log --format='%an <%ae>'  |  sort -u
```

That shows every distinct author name/email that's ever committed to the repo. If that's your real name or personal email and you want Gob to stay pseudonymous, you have two options:
- **Rewrite history** to use a pseudonymous identity throughout (tools: `git filter-repo`, or the older `git filter-branch` / BFG Repo-Cleaner) — more work, but preserves commit history.
- **Start a fresh repo** with a single clean initial commit authored under whatever identity you want going forward, and treat the old local history as private/internal only. Simpler, loses granular history, but a single "here's the project as of launch" commit is arguably a *better* look for a public repo anyway than a messy draft history.

Neither of these is something I can do for you from here — I don't have access to your local machine's git config or its actual commit history. This is a "you personally decide and run it" step.

### b. Scan the full history for anything else that shouldn't be public

Not just current files — old commits too, including ones that were later "fixed":
- Any personal access token, API key, `.env` file, or credential that was ever committed, even briefly. (Search your history for things like `ghp_`, `.env`, or your PAT string specifically.)
- Any earlier draft content you wouldn't want a screenshot of circulating — e.g. this repo's history plausibly includes drafts that still said pump.fun, or the `[TEAM TO RESOLVE]` FAQ placeholder before it got answered. That's probably fine (arguably a good "we built this for real, here's the paper trail" story, consistent with the project's whole transparency angle) — but it's your call, and it's the kind of thing to look at deliberately rather than discover after the fact.

## 4. Make it public

Once 3(a) and 3(b) are actually resolved (not just acknowledged):

1. GitHub repo Settings → General → Danger Zone → Change visibility → Public.
2. Confirm `git push -u origin main` actually succeeded at some point — this was still unconfirmed as of the last status update. If it never completed, none of this works yet.
3. Confirm your local copy (`C:\Users\bveil\Gobcode`) has this session's Jupiter Studio rewrite (README, WHITEPAPER, FAQ, ROADMAP, the new CA_LAUNCH_RUNBOOK, and this file) — it doesn't yet as of now, so pull/copy these changes over and push before going further.

## 5. Connect the domain

GitHub Pages custom domain setup (verify these exact values against GitHub's own docs at launch time — DNS specifics occasionally change):

- In the repo's Settings → Pages → Custom domain, enter `gobbuild.io`. This auto-creates a `CNAME` file in the repo.
- At GoDaddy, in `gobbuild.io`'s DNS settings, add:
  - Four **A records** for the apex domain (`@`) pointing at GitHub Pages' IPs: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
  - A **CNAME record** for `www` pointing at `<username>.github.io`.
- DNS propagation can take anywhere from minutes to ~24 hours. GitHub will show a checkmark on the Pages settings page once it verifies the domain; enable "Enforce HTTPS" there once it's available (it won't be immediately — GitHub needs to provision a cert first).

## 6. Flip the site itself from "stealth" to live

The current site copy is still deliberately holding back:
- The eyebrow/CTA language ("Launching on Jupiter Studio", "Buy on Jupiter Studio — live at launch") is future-tense.
- The CA field says "Not minted yet."

Once you're actually ready to go (domain live, repo public, everything above checked off):
- Flip the CA field to show the real address, with the Solscan verify link.
- Update the eyebrow/CTA to present tense ("Live on Jupiter Studio", "Buy $GOBB").
- Add the GitHub repo link into the site's link/socials section (it currently has a placeholder-style pump.fun-turned-Jupiter-Studio card and `[add link]` for Telegram/Discord — add GitHub alongside those).
- Update `docs/community/WHITEPAPER.md` §4 "Where to find official links" table with the real website URL and GitHub URL (both still say `[ADD URL]`).

I can make all of these site/doc edits once you say go — deliberately holding off until you confirm, since this step is the actual public announcement.

## 7. Announce

Same principle as the original CA_LAUNCH_RUNBOOK: **publish everywhere at once** — the domain, the pinned X post, Telegram/Discord if live, and the GitHub link — as close to simultaneously as you can. The gap between "the real thing is discoverable" and "it's been announced everywhere official" is exactly the window an impersonator uses.

## 8. After launch

- Monitor for copycat domains/repos (someone forking or mirroring the repo under a similar name is now possible once it's public — worth an occasional check, same as the CA-impersonator monitoring already planned).
- Decide what happens to the old `claude.ai/artifact/...` site — redirect messaging, or just let it go stale once `gobbuild.io` is the real front door.
