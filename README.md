# Etherlink EVM Pre-flight

A small decision-support prototype for Solidity developers evaluating whether an existing EVM application can move to Etherlink without unexpected blockers or redesign.

The tool lets a developer select the capabilities their app depends on and returns a deterministic, source-backed assessment for each selected requirement.

## Decision model

Each requirement is classified as one of:

- **Documented as supported** — a primary source states support and no relevant limitation was found.
- **Caveat** — support exists, but there is a documented limitation or behavioral difference.
- **Unsupported** — a primary source explicitly says the capability is unsupported, ignored, or unavailable.
- **Insufficient evidence** — the primary sources are silent, conflicting, or not conclusive enough to make a safe call.
- **Not evaluated** — outside the current prototype scope. This must never be interpreted as unsupported.

The overall result uses the most decision-relevant selected status, while still showing counts and coverage across all selected requirements.

## Why this exists

Etherlink aims to provide a familiar EVM development experience, but compatibility questions can still be spread across endpoint support, fees, tooling, upgrades, oracle, and other documentation.

This prototype tests whether reorganizing that information around a developer's actual requirements can help them make a faster pre-implementation decision.

It is intentionally not a replacement for testing on-chain.

## Scope

V1 is limited to the Etherlink EVM interface and a small set of manually verified requirements.

It does **not** include:

- live RPC or chain checks
- wallet connectivity
- project or repository parsing
- Michelson / NAC / L1 bridging
- automatic freshness monitoring
- runtime LLM-generated verdicts
- an exhaustive Etherlink capability database

## Trust model

For every evaluated requirement, the UI separates:

1. **Documented fact** — what the primary source says.
2. **Likely implementation implication** — the product interpretation of that fact.

Each evaluated item includes its source and documentation check date.

The prototype also makes clear that a "supported" result is a documentation snapshot, not a production guarantee.

## Run locally

From the repository root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

No build step or package installation is required.

## Tests

Run:

```bash
node --test engine.test.js
```

The current test suite covers the status model, precedence rules, not-evaluated handling, deterministic output, catalog validation, and empty-selection behavior.

## Structure

```text
.
├── index.html
├── app.js
├── engine.js
├── engine.test.js
├── styles.css
└── data/
    ├── requirements.js
    └── rules.js
```

- `data/requirements.js` — source-backed capability catalog
- `data/rules.js` — status definitions and overall-result rules
- `engine.js` — deterministic evaluation logic
- `app.js` — UI rendering only
- `engine.test.js` — evaluation tests

## Validation still needed

The largest unvalidated assumption is whether developers encounter this research problem often enough, and early enough, for a pre-flight workflow to save meaningful time versus reading the docs or running a quick spike themselves.

A cheap next step would be to test the prototype with a small group of EVM developers who have considered or attempted an Etherlink deployment and compare how quickly and confidently they reach a decision with and without the tool.
