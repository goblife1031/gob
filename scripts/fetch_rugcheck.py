#!/usr/bin/env python3
"""Fetch a RugCheck safety report for $GOBB and write it to data/rugcheck.json.

Ported from trade-guru's guru/api.py:rugcheck() (same free, keyless RugCheck
public report endpoint that bot already relies on for its own safety
filters). Only rewrites the file when the meaningful fields actually change,
so the hourly GitHub Actions run doesn't create a commit every single hour.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

MINT = "Cd8VXseSs7SYZhdQ57EkP7gugDzrGnZhKdfwXeYRjupx"
OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "rugcheck.json"

HEAD = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) gobbuild.io/1.0",
    "Accept": "application/json",
    "Origin": "https://jup.ag",
    "Referer": "https://jup.ag/",
}


def fetch_report(mint):
    r = requests.get(f"https://api.rugcheck.xyz/v1/tokens/{mint}/report", headers=HEAD, timeout=20)
    r.raise_for_status()
    return r.json()


def extract(j):
    risks = j.get("risks") or []
    lps = [
        ((m.get("lp") or {}).get("lpLockedPct"), (m.get("lp") or {}).get("lpLockedUSD"))
        for m in (j.get("markets") or [])
    ]
    lps = [x for x in lps if x[0] is not None]
    best = max(lps, key=lambda x: (x[1] or 0)) if lps else (None, None)

    tf = j.get("transferFee") or {}
    ext_fee = None
    try:
        cfg = (j.get("token_extensions") or {}).get("transferFeeConfig") or {}
        bps = (cfg.get("newerTransferFee") or {}).get("transferFeeBasisPoints")
        ext_fee = bps / 100 if bps is not None else None
    except Exception:
        pass
    transfer_fee_pct = max(
        [x for x in ((tf.get("pct") if isinstance(tf, dict) else None), ext_fee) if x is not None],
        default=None,
    )

    return {
        "score": j.get("score_normalised"),
        "lp_locked_pct": best[0],
        "lp_locked_usd": best[1],
        "risks": [r.get("name") for r in risks],
        "danger_count": sum(1 for r in risks if r.get("level") == "danger"),
        "warn_count": sum(1 for r in risks if r.get("level") == "warn"),
        "creator_rugged_before": any("rugged" in (r.get("name") or "").lower() for r in risks),
        "transfer_fee_pct": transfer_fee_pct,
        "insiders_detected": bool(j.get("graphInsidersDetected")),
        "rugged": bool(j.get("rugged")),
        "lockers_count": len(j.get("lockers") or {}),
    }


def main():
    try:
        report = fetch_report(MINT)
        data = extract(report)
    except Exception as e:
        print(f"RugCheck fetch failed: {e}", file=sys.stderr)
        # Leave any existing file untouched rather than wiping good data on
        # a transient failure (rate limit, RugCheck downtime, etc).
        return

    data["mint"] = MINT
    data["mint_authority_revoked"] = True  # verified on-chain 2026-09; fixed fact, not from RugCheck
    data["updated_utc"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    existing = {}
    if OUT_PATH.exists():
        try:
            existing = json.loads(OUT_PATH.read_text())
        except Exception:
            existing = {}

    compare_keys = [k for k in data if k != "updated_utc"]
    if existing and {k: existing.get(k) for k in compare_keys} == {k: data.get(k) for k in compare_keys}:
        print("No change in RugCheck data; leaving file untouched.")
        return

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(data, indent=2) + "\n")
    print("Wrote updated RugCheck data.")


if __name__ == "__main__":
    main()
