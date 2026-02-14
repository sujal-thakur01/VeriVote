# VeriVote - Blockchain Voting dApp

**A secure, transparent voting platform built on Algorand blockchain**

[![Algorand](https://img.shields.io/badge/Blockchain-Algorand-00D1B2?style=flat-square)](https://www.algorand.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

## 🎯 Overview

VeriVote is a decentralized voting application that leverages Algorand's blockchain technology to ensure transparent, immutable, and verifiable elections. Built for hackathons and production use cases requiring trustless voting mechanisms.

## 🏗️ Architecture

```
VeriVote/
├── projects/
│   ├── contracts/     # Algorand smart contracts (ARC4/Python)
│   └── frontend/      # React + TypeScript dApp
└── docs/             # Documentation and guides
```

### Tech Stack

**Smart Contracts**
- AlgoKit (Algorand development framework)
- Python with ARC4 standard
- Algorand TestNet/MainNet deployment

**Frontend**
- React 18 + Vite
- TypeScript
- @txnlab/use-wallet-react (Pera Wallet integration)
- Algorand SDK (algosdk)

## 📐 Repository Philosophy

This repository has been intentionally curated to include only production-critical files. All template artifacts, unused frameworks, and debug files have been removed to ensure clarity, maintainability, and professional structure.

**Design Principles:**
- One package manager (npm)
- Minimal configuration files
- Essential build tools only
- Clean, reviewable codebase

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.12+
- AlgoKit CLI
- Pera Wallet (mobile or browser extension)

### 1. Clone Repository
```bash
git clone <repository-url>
cd VeriVote
```

### 2. Deploy Smart Contract
```bash
cd projects/contracts
# See contracts/README.md for deployment instructions
```

### 3. Run Frontend
```bash
cd projects/frontend
npm install
cp .env.example .env
# Update .env with your deployed contract App ID
npm run dev
```

## ✨ Features

- **Blockchain-Verified Voting**: All votes recorded immutably on Algorand
- **Wallet Integration**: Seamless Pera Wallet connection
- **Opt-In Flow**: Secure voter registration via smart contract
- **Live Results**: Real-time vote tallies from on-chain state
- **Countdown Timer**: Election time window enforcement
- **Responsive UI**: Modern, accessible design
- **Transaction Verification**: AlgoExplorer links for transparency

## 📖 Documentation

- [Contract Deployment Guide](projects/contracts/README.md)
- [Frontend Setup Guide](projects/frontend/README.md)
- [Demo Guide](docs/DEMO_GUIDE.md)

## 🔐 Security

- All voting logic enforced on-chain
- Double-voting prevention via local state
- Time-bound elections (start/end timestamps)
- Wallet authentication required
- Input validation and error handling

## 🛠️ Development

### Contract Development
```bash
cd projects/contracts
algokit project run build
```

### Frontend Development
```bash
cd projects/frontend
npm run dev
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ using Algorand blockchain technology
