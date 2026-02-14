# VeriVote Frontend

React + TypeScript frontend for the VeriVote blockchain voting dApp.

## 🎨 Features

- **Pera Wallet Integration**: Connect with Algorand wallet
- **Real-time Results**: Live vote counts from blockchain
- **Responsive Design**: Modern, accessible UI
- **Countdown Timer**: Visual election time tracking
- **Transaction Verification**: AlgoExplorer integration
- **Secure Voting Flow**: Opt-in → Vote → Verification

## 🔧 Prerequisites

- Node.js 18+
- npm or yarn
- Pera Wallet (mobile app or browser extension)
- Deployed VeriVote smart contract on Algorand TestNet

## 🚀 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and set your contract App ID:
```env
VITE_VOTING_APP_ID=<your-deployed-contract-app-id>
VITE_ALGOD_TOKEN=
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_ALGOD_PORT=443
VITE_ALGOD_NETWORK=testnet
```

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173`

## 🏗️ Build for Production

```bash
npm run build
```

Outputs to `dist/` directory.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── VotingInterface.tsx    # Main voting UI
│   ├── utils/
│   │   └── algorand.ts            # Algorand client utils
│   ├── App.tsx
│   └── main.tsx
├── public/
└── package.json
```

## 🔑 Key Components

### VotingInterface.tsx
Main component handling:
- Wallet connection
- Opt-in transaction
- Vote submission
- Results display
- Countdown timer

### algorand.ts
Utility functions for:
- Algorand client initialization
- Transaction construction
- State fetching

## 🎮 Usage Flow

1. **Connect Wallet**: Click "Connect Wallet" and approve in Pera Wallet
2. **Opt-In**: Click "Opt-In to Vote" (one-time registration)
3. **Vote**: Select a candidate and submit vote
4. **Verify**: Check transaction on AlgoExplorer
5. **Results**: View live vote tallies

## 🌐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_VOTING_APP_ID` | Deployed contract App ID | `755506898` |
| `VITE_ALGOD_TOKEN` | Algod API token (optional for public nodes) | `` |
| `VITE_ALGOD_SERVER` | Algorand node URL | `https://testnet-api.algonode.cloud` |
| `VITE_ALGOD_PORT` | Algod port | `443` |
| `VITE_ALGOD_NETWORK` | Network name | `testnet` |

## 🎨 Customization

### Candidate Names
Edit in `VotingInterface.tsx`:
```typescript
const [candidates, setCandidates] = useState<Candidate[]>([
    { id: 1, name: 'Your Candidate 1', avatar: '👩‍💼', votes: 0 },
    { id: 2, name: 'Your Candidate 2', avatar: '👨‍💼', votes: 0 }
])
```

### Styling
- CSS located in `src/styles/`
- Uses Tailwind CSS utility classes
- Custom gradients and animations included

## 🐛 Troubleshooting

**Wallet Connection Issues**
- Ensure Pera Wallet is installed
- Check wallet is on TestNet
- Clear browser cache/localStorage

**Transaction Rejected**
- Verify contract App ID is correct
- Check wallet has sufficient ALGO for fees
- Ensure election is active (check timestamps)

**Opt-In Failed**
- Only need to opt-in once per wallet
- If already opted in, skip directly to voting

## 📦 Dependencies

- `react` - UI framework
- `vite` - Build tool
- `algosdk` - Algorand JavaScript SDK
- `@txnlab/use-wallet-react` - Wallet integration
- `@tanstack/react-query` - Data fetching
- `notistack` - Toast notifications

## 🔗 Resources

- [Algorand JS SDK Docs](https://algorand.github.io/js-algorand-sdk/)
- [Pera Wallet Docs](https://docs.perawallet.app/)
- [Vite Docs](https://vitejs.dev/)
- [AlgoExplorer TestNet](https://testnet.algoexplorer.io/)

## 📝 Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

Built with React + Vite + Algorand SDK
