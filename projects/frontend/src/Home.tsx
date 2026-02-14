// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import { useSnackbar } from 'notistack'
import ConnectWallet from './components/ConnectWallet'
import VotingInterface from './components/VotingInterface'
import { copyToClipboard } from './utils/clipboard'

interface HomeProps { }

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [showVotingInterface, setShowVotingInterface] = useState<boolean>(false)
  const { activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const appId = Number(import.meta.env.VITE_VOTING_APP_ID) || 0
  const network = import.meta.env.VITE_ALGOD_NETWORK || 'localnet'

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  // If voting interface is active, show it
  if (showVotingInterface) {
    return (
      <>
        <VotingInterface />
        <div className="fixed top-4 right-4 z-50">
          <button
            className="px-4 py-2 bg-gray-900/80 backdrop-blur-md text-white rounded-lg hover:bg-gray-800/80 transition-all duration-300 border border-white/10 shadow-lg"
            onClick={() => setShowVotingInterface(false)}
          >
            ← Back to Home
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated gradient background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>

      {/* Top-right wallet connect button */}
      <div className="absolute top-6 right-6 z-10">
        <button
          data-test-id="connect-wallet"
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 border border-white/10 backdrop-blur-sm"
          onClick={toggleWalletModal}
        >
          {activeAddress ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
              <span className="font-mono text-sm">{activeAddress.substring(0, 6)}...{activeAddress.substring(activeAddress.length - 4)}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Connect Wallet
            </span>
          )}
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative flex items-center justify-center min-h-screen px-4 py-20">
        <div className="max-w-6xl w-full">
          {/* Main Hero */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <h1 className="text-8xl md:text-9xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-pulse drop-shadow-2xl">
                VeriVote
              </h1>
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-md border border-cyan-500/30 rounded-full mb-6">
                <p className="text-xl text-cyan-300 font-medium">Blockchain-Powered Campus Elections</p>
              </div>
            </div>

            <p className="text-gray-300 text-xl max-w-3xl mx-auto mb-12 leading-relaxed">
              A secure, transparent voting system built on <span className="text-blue-400 font-semibold">Algorand</span> blockchain with
              <span className="text-purple-400 font-semibold"> time-lock enforcement</span>,
              <span className="text-cyan-400 font-semibold"> double-vote prevention</span>, and
              <span className="text-pink-400 font-semibold"> AI-powered transparency</span> reports.
            </p>

            {/* CTA Button - Always visible, no conditional */}
            <div className="flex gap-6 justify-center items-center">
              <button
                onClick={() => setShowVotingInterface(true)}
                className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-xl rounded-2xl shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/80 hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-3">
                  <span className="text-3xl">🗳️</span>
                  <span>Enter Voting Portal</span>
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>

            {!activeAddress && (
              <p className="text-yellow-400/80 text-sm mt-6 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Demo mode: Wallet connection optional
              </p>
            )}
          </div>

          {/* Feature Cards with Glassmorphism */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="group relative backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-400/50 rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-2xl transition-all duration-300"></div>
              <div className="relative">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">⏰</div>
                <h3 className="text-2xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">Time-Lock Enforcement</h3>
                <p className="text-gray-300 leading-relaxed">
                  Smart contract ensures voting only happens during the designated election window. No early or late votes accepted.
                </p>
              </div>
            </div>

            <div className="group relative backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-400/50 rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-purple-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 rounded-2xl transition-all duration-300"></div>
              <div className="relative">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🚫</div>
                <h3 className="text-2xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Double-Vote Prevention</h3>
                <p className="text-gray-300 leading-relaxed">
                  One wallet, one vote. Local state tracking prevents any attempt to vote multiple times on the blockchain.
                </p>
              </div>
            </div>

            <div className="group relative backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-400/50 rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300"></div>
              <div className="relative">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🤖</div>
                <h3 className="text-2xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">AI Transparency Report</h3>
                <p className="text-gray-300 leading-relaxed">
                  Automated analysis generates transparency reports with SHA256 hash stored on-chain for immutable audit trail.
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack with enhanced styling */}
          <div className="mt-24 text-center">
            <p className="text-gray-500 text-sm mb-6 uppercase tracking-widest">Powered By</p>
            <div className="flex justify-center gap-6 flex-wrap">
              <div className="px-6 py-3 bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-md rounded-xl border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/20">
                <span className="text-blue-400 font-bold text-lg">Algorand</span>
              </div>
              <div className="px-6 py-3 bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-md rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/20">
                <span className="text-purple-400 font-bold text-lg">AlgoPy</span>
              </div>
              <div className="px-6 py-3 bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 backdrop-blur-md rounded-xl border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-cyan-500/20">
                <span className="text-cyan-400 font-bold text-lg">React</span>
              </div>
              <div className="px-6 py-3 bg-gradient-to-br from-pink-500/10 to-pink-600/10 backdrop-blur-md rounded-xl border border-pink-500/30 hover:border-pink-400/50 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-pink-500/20">
                <span className="text-pink-400 font-bold text-lg">Pera Wallet</span>
              </div>
            </div>
          </div>

          {/* Blockchain Verification Section */}
          <div className="mt-24 relative backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-400/40 rounded-3xl p-10 shadow-2xl shadow-cyan-500/10 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/5 rounded-3xl"></div>
            <div className="relative">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-3 flex items-center justify-center gap-3">
                  <span className="text-5xl">🔐</span>
                  Verify Everything On-Chain
                </h2>
                <p className="text-gray-300 text-lg">All votes and results are publicly verifiable on Algorand TestNet</p>
              </div>

              {/* Stats Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all p-6">
                  <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Smart Contract App ID</div>
                  <div className="flex items-center gap-3">
                    <div className="font-mono font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 flex-1">
                      {appId || 'Not Set'}
                    </div>
                    {appId && (
                      <button
                        onClick={async () => {
                          const success = await copyToClipboard(appId.toString())
                          if (success) {
                            enqueueSnackbar('App ID copied to clipboard ✓', { variant: 'success' })
                          }
                        }}
                        className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg transition-all text-sm font-medium"
                      >
                        📋 Copy
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all p-6">
                  <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Network</div>
                  <div className="font-bold text-2xl text-purple-400">
                    Algorand {network === 'testnet' ? 'TestNet' : 'LocalNet'}
                  </div>
                </div>
              </div>

              {/* AlgoExplorer Button */}
              {appId && network === 'testnet' && (
                <a
                  href={`https://testnet.algoexplorer.io/application/${appId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Contract on AlgoExplorer
                  <span className="text-sm opacity-75">↗</span>
                </a>
              )}
            </div>
          </div>

          {/* Stats with glow effects */}
          <div className="mt-16 grid grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2 group-hover:scale-110 transition-transform">100%</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">Transparent</div>
            </div>
            <div className="text-center group">
              <div className="text-5xl mb-2 group-hover:scale-110 transition-transform">⛓️</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">Blockchain Secured</div>
            </div>
            <div className="text-center group">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2 group-hover:scale-110 transition-transform">{appId || '1004'}</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">App ID</div>
            </div>
          </div>
        </div>
      </div>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  )
}

export default Home

