# Runbook: Push this repo to GitHub

You said you'd rather push this yourself — here's the exact sequence. This assumes you have `git` installed and a GitHub account. Total time: ~5 minutes.

## 1. Create the GitHub repo

1. Go to https://github.com/new
2. Repo name: `gob` (or `gobb`, `gob-token` — your call; this doesn't have to match the ticker exactly)
3. Visibility: decide **public vs. private**.
   - Public is normal for a project like this — a visible repo (even mostly docs) is itself a small trust signal to a skeptical crypto community, since it shows something beyond a Telegram group and a Twitter account.
   - Keep it private for now if the docs still have real placeholders in them (wallet addresses, unannounced plans) that you don't want visible before launch. You can flip a repo from private to public later in Settings.
4. **Do not** initialize with a README, license, or .gitignore on GitHub's side — you already have those locally, and it'll cause a conflict on first push.
5. Click **Create repository**. Leave the resulting "…or push an existing repository" page open — you'll need the URL it shows you.

## 2. Push the local files

Open a terminal, `cd` into the folder containing this repo's files, then:

```bash
git init
git add .
git commit -m "Initial commit: Gob project docs"
git branch -M main
git remote add origin <PASTE THE URL FROM GITHUB HERE>
git push -u origin main
```

The URL from GitHub will look like `https://github.com/<your-username>/gob.git` (HTTPS) or `git@github.com:<your-username>/gob.git` (SSH, if you have SSH keys set up).

If `git push` asks for a password and rejects your actual GitHub password: GitHub no longer accepts account passwords over HTTPS git operations. Either use SSH, or create a Personal Access Token (Settings → Developer settings → Personal access tokens) and use that as the password when prompted.

## 3. Before you commit — a quick safety check

Run this from inside the repo folder before your first `git add .`, and again before every future commit if you ever add scripts that touch a wallet:

```bash
grep -R -iE "private.?key|seed phrase|secret" . --exclude-dir=.git
```

If that turns up anything real, remove it before committing. A `.gitignore` is already included that blocks common wallet/key file patterns (`*.key`, `wallet*.json`, `.env`), but a `.gitignore` only stops files you haven't already told git to track — it won't protect a secret pasted directly into a markdown file. Once a secret is pushed to GitHub, treat it as compromised (rotate/replace it) even if you delete it in a later commit — the history still has it unless you rewrite history, which is its own separate, riskier operation.

## 4. Keeping it updated going forward

Whenever you or the team edit a doc:

```bash
git add .
git commit -m "Update <whatever you changed>"
git push
```

If you want collaborators (community managers, a dev) to be able to push directly: GitHub repo → Settings → Collaborators → add them by username. If you'd rather they propose changes for review instead, keep the repo restricted to you and have them open pull requests from their own fork.

## 5. Optional: branch protection

If more than one person will push to this repo, consider Settings → Branches → add a rule for `main` requiring a pull request before merging. Overkill for a solo operator, worth it the moment a second person has push access.
