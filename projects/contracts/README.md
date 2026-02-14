# VeriVote Smart Contracts

Algorand smart contracts for the VeriVote blockchain voting platform.

## 📦 What's Included

- **VotingContract**: Main ARC4 contract handling elections, voting, and results
- Deployment scripts for TestNet/MainNet
- Election management utilities

## 🔧 Prerequisites

- Python 3.12+
- AlgoKit CLI installed
- Algorand node access (via AlgoKit LocalNet, TestNet, or MainNet)

## 🚀 Deployment

### 1. Install Dependencies
```bash
algokit project bootstrap all
```

### 2. Build Contracts
```bash
algokit project run build
```

### 3. Deploy to TestNet
```bash
cd scripts
python deploy_voting.py
```

**Important**: Save the App ID from deployment output - you'll need it for the frontend.

### 4. Start Election
```bash
python start_election.py
```

This sets the election start/end times on-chain.

## 📋 Contract Methods

### `opt_in_voter()`
- Registers a voter (required before voting)
- Initializes local state: `has_voted`, `vote_timestamp`

### `cast_vote(candidate_id: uint64)`
- Records a vote for candidate 1 or 2
- Validates time window and double-voting
- Increments vote counts

### `get_results()`
- Returns current vote tallies
- Available during and after election

### `close_election()`
- Admin only - closes election early

## 🔐 Global State

| Key | Type | Description |
|-----|------|-------------|
| `candidate_a_votes` | uint64 | Votes for candidate 1 |
| `candidate_b_votes` | uint64 | Votes for candidate 2 |
| `total_voters` | uint64 | Total number of voters |
| `election_start` | uint64 | Unix timestamp |
| `election_end` | uint64 | Unix timestamp |
| `election_closed` | uint64 | 0=open, 1=closed |

## 🧪 Testing

```bash
algokit project run test
```

## 📁 Project Structure

```
contracts/
├── smart_contracts/
│   └── voting/
│       └── contract.py      # Main voting contract
├── scripts/
│   ├── deploy_voting.py     # Deployment script
│   └── start_election.py    # Election setup
└── tests/                   # Contract tests
```

## 🌐 Networks

- **LocalNet**: For development (`algokit localnet start`)
- **TestNet**: For staging/demos
- **MainNet**: For production deployments

## ⚠️ Security Notes

- All time validation uses `Global.latest_timestamp` (on-chain time)
- Double-voting prevented via local state checks
- Admin-only methods protected by creator address validation
- No off-chain dependencies for vote validation

## 📝 Environment Variables

Create `.env` in the scripts directory:
```env
DEPLOYER_MNEMONIC=<your 25-word mnemonic>
ALGOD_TOKEN=<your algod token>
ALGOD_SERVER=<algod server url>
```

## 🔗 Resources

- [AlgoKit Documentation](https://developer.algorand.org/docs/get-started/algokit/)
- [Algorand Python SDK](https://py-algorand-sdk.readthedocs.io/)
- [ARC4 Standard](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0004.md)
