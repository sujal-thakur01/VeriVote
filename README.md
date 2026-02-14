# VeriVote

**Blockchain-verified campus voting on Algorand — one wallet, one vote, full transparency.**

> Built for **Hackspiration '26** | Track 2: AI & Automation in Blockchain

---

## Demo

| Landing Page | Voting Interface | Live Results |
|:---:|:---:|:---:|
| ![Landing](./docs/screenshots/landing.png) | ![Voting](./docs/screenshots/voting.png) | ![Results](./docs/screenshots/results.png) |

https://github.com/user-attachments/assets/demo.mp4

[Download Demo Video](./docs/videos/demo.mp4)

---

## Problem

- Campus elections rely on centralized systems vulnerable to tampering
- No verifiable audit trail — students can't trust results
- No enforcement against double voting or vote manipulation

## Solution

- **On-chain voting** — Every vote immutably recorded on Algorand TestNet
- **Double-vote prevention** — Smart contract enforces 1 wallet = 1 vote via local state
- **Time-lock enforcement** — Voting window cryptographically enforced on-chain
- **AI audit hash** — SHA256 report hash stored on-chain for verifiable transparency

---

## Architecture

```
Student → Pera Wallet → React Frontend → Algorand Smart Contract → On-Chain State
                                                  ↓
                                         AI Report Hash (SHA256)
```

![Architecture](./docs/screenshots/architecture.png)

---

## Smart Contract

| | |
|---|---|
| **Standard** | ARC4 (Algopy → TEAL via Puyapy) |
| **Network** | Algorand TestNet |
| **App ID** | `755499428` |

**Global State:** `candidate_a_votes`, `candidate_b_votes`, `election_start`, `election_end`, `total_voters`, `ai_report_hash`, `election_closed`

**Local State:** `has_voted`, `vote_timestamp`

**Methods:** `create_election` · `cast_vote` · `close_election` · `get_results` · `get_voter_status` · `opt_in_voter`

**On-chain security:**
- Time-window validation — no voting outside election period
- Double-vote check via local state flag
- Creator-only election lifecycle control
- Immutable, auditable vote records

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contract | Python (Algopy) → TEAL |
| Blockchain | Algorand TestNet |
| Frontend | React + TypeScript + Vite |
| Styling | TailwindCSS (Glassmorphism) |
| Wallet | Pera Wallet (via use-wallet) |
| Deployment | AlgoKit + Poetry |

---

## How to Run

```bash
# Deploy contract to TestNet
cd projects/contracts
poetry install
poetry run python scripts/deploy_voting.py --network testnet

# Run frontend
cd projects/frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Verified On-Chain

- Vote transaction confirmed on TestNet Explorer
- `candidate_a_votes = 1`, `total_voters = 1`
- Election window active, `election_closed = 0`
- Contract correctly rejects double votes

---

## Roadmap

- Multi-candidate elections
- Anonymous voting (commit-reveal scheme)
- AI transparency service backend
- MainNet deployment

---

**Built for Hackspiration '26 — Algorand Track** | MIT License
