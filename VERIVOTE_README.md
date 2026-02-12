# VeriVote - Blockchain Campus Voting System

![VeriVote Banner](https://img.shields.io/badge/Algorand-Testnet-00D1B2?style=for-the-badge&logo=algorand&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

> 🗳️ **A Production-Ready Blockchain Voting System with AI Transparency**

VeriVote is a Web3 campus election system built on Algorand Testnet, featuring wallet-based authentication, time-locked voting windows, double-vote prevention, and AI-powered transparency reports with on-chain hash verification.

---

## 🎯 Project Overview

**Track**: AI & Automation in Blockchain  
**Scope**: ONE feature done deeply – Verifiable Voting  
**Status**: Production-Ready Hackathon Project

### Key Features

✅ **Secure Voting** - Wallet-based authentication via Pera Wallet  
✅ **Time-Lock Enforcement** - Voting only during active election window  
✅ **Double-Vote Prevention** - Smart contract enforces one vote per wallet  
✅ **Real-Time Results** - Live dashboard with auto-refresh  
✅ **AI Transparency Report** - Automated analysis with SHA256 hash  
✅ **On-Chain Verification** - Immutable hash storage for audit trail  

---

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌───────────────┐
│  React Frontend │◄────►│ Algorand Testnet │◄────►│ AI Flask API  │
│  (Pera Wallet)  │      │  Smart Contract  │      │ (Transparency)│
└─────────────────┘      └──────────────────┘      └───────────────┘
```

### Tech Stack

- **Smart Contract**: AlgoPy (Algorand Python)
- **Frontend**: React + TailwindCSS + Vite
- **Wallet**: Pera Wallet integration
- **AI Service**: Python Flask + SHA256 hashing
- **Network**: Algorand Testnet

---

## 🚀 Quick Start

### Prerequisites

- **Docker** (running)
- **Node.js** 18+
- **Python** 3.12+
- **AlgoKit** CLI
- **Poetry** (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/VeriVote.git
   cd VeriVote
   ```

2. **Install AlgoKit**
   ```bash
   brew install algorandfoundation/tap/algokit
   ```

3 **Install Poetry**
   ```bash
   brew install poetry
   ```

4. **Set up environment variables**
   ```bash
   cp .env.template projects/frontend/.env
   # Edit .env with your configuration
   ```

5. **Bootstrap the project**
   ```bash
   cd projects/contracts
   poetry install
   
   cd ../frontend
   npm install
   ```

### Deploy Smart Contract

#### Option 1: Quick Demo Mode (5-minute election)
```bash
cd projects/contracts
poetry run python scripts/deploy_voting.py --demo
```

#### Option 2: Standard Mode (1-hour election)
```bash
poetry run python scripts/deploy_voting.py --standard
```

The deployment will output:
- ✅ App ID
- ✅ App Address
- ✅ AlgoExplorer link

**Important**: Copy the App ID and update your `.env` file:
```bash
VITE_VOTING_APP_ID=<your_app_id_here>
```

### Run Frontend

```bash
cd projects/frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Run AI Service

```bash
cd ai_service
python app.py
```

AI service runs on [http://localhost:5000](http://localhost:5000)

---

## 📝 Usage Guide

### For Voters

1. **Connect Wallet** - Click "Connect Wallet" and select Pera Wallet
2. **Check Status** - See if election is active
3. **Cast Vote** - Click on your candidate and confirm transaction
4. **View Results** - Real-time results update every 5 seconds

### For Election Admin

1. **Deploy Contract** - Use deployment script
2. **Create Election** - Called automatically with `--demo` or `--standard` flag
3. **Monitor Voting** - Watch results dashboard
4. **Close Election** - After election ends, generate AI report and close

---

## 🧪 Testing

### Fund Test Wallets

Get free testnet ALGO from the faucet:
```
https://lora.algokit.io/testnet/fund
```

Paste your wallet address and click "Fund".

### Run Contract Tests

```bash
cd projects/contracts
poetry run pytest tests/voting_test.py -v
```

### Test Scenarios

✅ **Double Vote Test**
   - Connect Wallet A → Vote → Success
   - Try voting again → Rejected ✓

✅ **Time Lock Test**
   - Vote before start → Rejected ✓
   - Vote after end → Rejected ✓

✅ **AI Verification Test**
   - Close election → Generate report → Get hash
   - Store hash on-chain → Verify ✓

---

## 🔐 Smart Contract Methods

### `create_election(start_time, end_time)`
Creates election with time window. Only creator can call.

### `cast_vote(candidate_id)`
Casts vote for candidate (1 or 2). Enforces all validation.

### `close_election(ai_hash)`
Closes election and stores AI report hash. Only creator, only after end.

### `get_results()`
Returns all election data (read-only, anyone can call).

### `get_voter_status()`
Returns voter's local state (has_voted, timestamp).

### `opt_in_voter()`
Opts voter into contract (required before voting).

---

## 🤖 AI Transparency Service

### Endpoint: `POST /generate-report`

**Request:**
```json
{
  "candidate_a_votes": 42,
  "candidate_b_votes": 38,
  "total_voters": 80
}
```

**Response:**
```json
{
  "report": {
    "candidate_a_votes": 42,
    "candidate_a_percentage": 52.5,
    "candidate_b_votes": 38,
    "candidate_b_percentage": 47.5,
    "total_voters": 80,
    "winner": "Candidate A",
    "margin": 5.0,
    "summary": "Election completed with 80 total votes..."
  },
  "hash": "a3b2c1d4e5f6..."
}
```

**Hash Verification:** Same input → Same output (deterministic)

---

## 📊 Project Structure

```
VeriVote/
├── projects/
│   ├── contracts/          # Smart contracts (AlgoPy)
│   │   ├── smart_contracts/
│   │   │   └── voting/
│   │   │       ├── contract.py           # Main voting contract
│   │   │       ├── deploy_config.py      # Deployment configuration
│   │   │       └── VotingContract.arc32.json  # Compiled spec
│   │   ├── tests/
│   │   │   └── voting_test.py            # Comprehensive tests
│   │   └── scripts/
│   │       └── deploy_voting.py          # Deployment script
│   │
│   └── frontend/           # React frontend
│       ├── src/
│       │   ├── components/
│       │   │   └── VotingContract.tsx    # Main voting UI
│       │   ├── contracts/
│       │   │   └── VotingClient.ts       # Generated client
│       │   └── utils/
│       │       └── network/
│       │           └── getAlgoClientConfigs.ts
│       └── .env
│
├── ai_service/             # AI transparency service
│   ├── app.py              # Flask API
│   └── requirements.txt
│
├── .env.template           # Environment template
└── VERIVOTE_README.md     # This file
```

---

## 🐛 Troubleshooting

### "Missing VITE_ALGOD_SERVER"
- Ensure `.env` exists in `projects/frontend/`
- Restart `npm run dev`

### "App ID not found"
- Deploy contract first: `poetry run python scripts/deploy_voting.py`
- Update `VITE_VOTING_APP_ID` in `.env`

### "Wallet not connecting"
- Install Pera Wallet mobile app
- Ensure you're on testnet
- Fund wallet with testnet ALGO

### "Transaction failed"
- Check election window is active
- Ensure voter has opted in
- Verify wallet has sufficient ALGO for fees

---

## 🎬 Demo Tips

### Quick Demo Mode
Use `--demo` flag for hackathon judging:
- Election starts in 10 seconds
- Ends in 5 minutes
- Perfect for live demonstrations

### Pre-Demo Checklist
- [ ] 3+ test wallets funded
- [ ] Contract deployed with demo mode
- [ ] Frontend running on localhost
- [ ] AI service running
- [ ] Practice voter flow once

---

## 🔗 Important Links

- **Algorand Faucet**: https://lora.algokit.io/testnet/fund
- **AlgoExplorer (Testnet)**: https://testnet.algoexplorer.io
- **AlgoKit Docs**: https://github.com/algorandfoundation/algokit-cli
- **Pera Wallet**: https://perawallet.app/

---

## 📜 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- Built on [Algorand Testnet](https://www.algorand.com/)
- Template: [Hackseries-2-QuickStart-template](https://github.com/marotipatre/Hackseries-2-QuickStart-template)
- Wallet: [Pera Wallet](https://perawallet.app/)

---

**Made with ❤️ for transparent campus elections**
