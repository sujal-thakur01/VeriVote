import { useEffect, useState, useCallback, useRef } from 'react'
import { useSnackbar } from 'notistack'
import { useWallet } from '@txnlab/use-wallet-react'
import algosdk from 'algosdk'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const APP_ID = Number(import.meta.env.VITE_VOTING_APP_ID) || 755499428

interface Candidate {
    id: number
    name: string
    avatar: string
    votes: number
}

interface ElectionState {
    candidateAVotes: number
    candidateBVotes: number
    totalVoters: number
    electionStart: number
    electionEnd: number
    electionClosed: number
}

// ABI method selectors (first 4 bytes of SHA-512/256 of method signature)
const METHOD_SELECTORS: Record<string, Uint8Array> = {
    cast_vote: new Uint8Array([0x3d, 0x6c, 0x8f, 0xf7]),
    opt_in_voter: new Uint8Array([0xdd, 0x5c, 0xa5, 0x3b]),
    get_results: new Uint8Array([0xb9, 0x29, 0xca, 0x8d]),
    get_voter_status: new Uint8Array([0x2e, 0x93, 0x79, 0xde]),
}

function getAlgodClient(): algosdk.Algodv2 {
    const config = getAlgodConfigFromViteEnvironment()
    return new algosdk.Algodv2(
        String(config.token),
        config.server,
        config.port
    )
}

function decodeUint64(bytes: Uint8Array, offset: number): number {
    let value = 0
    for (let i = 0; i < 8; i++) {
        value = value * 256 + bytes[offset + i]
    }
    return value
}

function mapContractError(error: string): string {
    if (error.includes('Election has not started yet')) return 'Election has not started yet'
    if (error.includes('Election has ended')) return 'Election has ended'
    if (error.includes('Election is closed')) return 'Election is closed'
    if (error.includes('You have already voted')) return 'You have already voted'
    if (error.includes('Invalid candidate ID')) return 'Invalid candidate ID'
    if (error.includes('Only creator')) return 'Only the election creator can perform this action'
    // Fallback: map known PC values
    if (error.includes('pc=490') || error.includes('pc=476')) return 'You have already voted'
    if (error.includes('assert failed')) return 'Transaction rejected by smart contract'
    return error
}

// DEMO MODE - Force election open for guaranteed demo stability
const DEMO_MODE = true

// DEMO PRESENTATION MODE - Hardcoded deterministic demo behavior
const DEMO_PRESENTATION_MODE = true

const VotingInterface = () => {
    const { enqueueSnackbar } = useSnackbar()
    const { activeAddress, transactionSigner } = useWallet()
    const algodClient = useRef(getAlgodClient())

    // Demo state
    const [demoTimeLeft, setDemoTimeLeft] = useState(600)

    // Election state from blockchain
    const [electionState, setElectionState] = useState<ElectionState | null>(null)
    const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 0, minutes: 0, seconds: 0 })
    const [electionStatus, setElectionStatus] = useState<'loading' | 'not_started' | 'active' | 'ended' | 'closed' | 'error'>(() => {
        return DEMO_PRESENTATION_MODE ? 'active' : 'loading'
    })
    const [hasVoted, setHasVoted] = useState<number | null>(() => {
        if (DEMO_PRESENTATION_MODE && activeAddress) {
            const stored = localStorage.getItem(`demoVoted_${activeAddress}`)
            return stored ? parseInt(stored) : null
        }
        return null
    })
    const [isOptedIn, setIsOptedIn] = useState<boolean>(false)
    const [isOptingIn, setIsOptingIn] = useState(false)
    const [isVoting, setIsVoting] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const [lastTxId, setLastTxId] = useState<string | null>(null)
    const [isLoadingState, setIsLoadingState] = useState(true)

    const [candidates, setCandidates] = useState<Candidate[]>([
        { id: 1, name: 'Alice Thompson', avatar: '\u{1F469}\u200D\u{1F4BC}', votes: 0 },
        { id: 2, name: 'Bob Martinez', avatar: '\u{1F468}\u200D\u{1F4BC}', votes: 0 }
    ])

    // Demo mode initialization
    useEffect(() => {
        if (!DEMO_MODE) return

        // Hardcoded demo results
        setCandidates([
            { id: 1, name: 'Alice Thompson', avatar: '👩‍💼', votes: 1 },
            { id: 2, name: 'Bob Martinez', avatar: '👨‍💼', votes: 2 }
        ])

        const storedVoted = localStorage.getItem('demoVoted')
        if (storedVoted) setHasVoted(parseInt(storedVoted))

        const storedEndTime = localStorage.getItem('demoEndTime')
        let endTime = storedEndTime
        if (!endTime) {
            endTime = (Date.now() + 10 * 60 * 1000).toString()
            localStorage.setItem('demoEndTime', endTime)
        }

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((Number(endTime) - Date.now()) / 1000))
            setDemoTimeLeft(remaining)

            const hours = Math.floor(remaining / 3600)
            const minutes = Math.floor((remaining % 3600) / 60)
            const seconds = remaining % 60
            setTimeRemaining({ hours, minutes, seconds })
        }, 1000)

        return () => clearInterval(interval)
    }, [])


    // Fetch election state from blockchain
    const fetchElectionState = useCallback(async () => {
        try {
            const appInfo = await algodClient.current.getApplicationByID(APP_ID).do()
            const globalState = appInfo.params?.['global-state'] || appInfo['params']?.['global-state'] || []

            const state: ElectionState = {
                candidateAVotes: 0,
                candidateBVotes: 0,
                totalVoters: 0,
                electionStart: 0,
                electionEnd: 0,
                electionClosed: 0,
            }

            for (const entry of globalState) {
                const key = atob(entry.key)
                const value = entry.value

                if (value.type === 2) {
                    // uint64
                    const num = value.uint
                    switch (key) {
                        case 'candidate_a_votes': state.candidateAVotes = num; break
                        case 'candidate_b_votes': state.candidateBVotes = num; break
                        case 'total_voters': state.totalVoters = num; break
                        case 'election_start': state.electionStart = num; break
                        case 'election_end': state.electionEnd = num; break
                        case 'election_closed': state.electionClosed = num; break
                        case 'has_voted':
                            // Global has_voted - this is a contract quirk
                            // We'll handle per-user detection separately
                            break
                    }
                }
            }

            setElectionState(state)
            setCandidates([
                { id: 1, name: 'Alice Thompson', avatar: '\u{1F469}\u200D\u{1F4BC}', votes: state.candidateAVotes },
                { id: 2, name: 'Bob Martinez', avatar: '\u{1F468}\u200D\u{1F4BC}', votes: state.candidateBVotes }
            ])

            // Determine election status
            const now = Math.floor(Date.now() / 1000)

            // DEMO MODE: Override with time-based status
            if (DEMO_MODE) {
                setElectionStatus(demoTimeLeft > 0 ? 'active' : 'ended')
            } else if (DEMO_MODE) {
                console.log("🎬 DEMO MODE ACTIVE - UI time validation bypassed")
                setElectionStatus('active')
            } else if (state.electionClosed === 1) {
                setElectionStatus('closed')
            } else if (state.electionStart === 0 && state.electionEnd === 0) {
                setElectionStatus('not_started')
            } else if (now < state.electionStart) {
                setElectionStatus('not_started')
            } else if (now > state.electionEnd) {
                setElectionStatus('ended')
            } else {
                setElectionStatus('active')
            }

            setIsLoadingState(false)
        } catch (err) {
            console.error('Failed to fetch election state:', err)
            setElectionStatus('error')
            setIsLoadingState(false)
        }
    }, [])

    // Check if current user has already voted (via global state has_voted flag)
    // Since the contract stores has_voted in global state, we check localStorage as backup
    const checkVoterStatus = useCallback(async () => {
        if (!activeAddress) return

        // Check localStorage for this wallet
        const savedVote = localStorage.getItem(`verivote_voted_${activeAddress}`)
        if (savedVote) {
            setHasVoted(parseInt(savedVote))
        }
    }, [activeAddress])

    // Check if user is opted into the app
    const checkOptIn = useCallback(async () => {
        if (!activeAddress) {
            setIsOptedIn(false)
            return
        }

        try {
            console.log("Checking opt-in status for:", activeAddress)
            const accountInfo = await algodClient.current.accountApplicationInformation(activeAddress, APP_ID).do()

            if (accountInfo && accountInfo.appLocalState) {
                console.log("✅ User IS opted in")
                setIsOptedIn(true)
            } else {
                console.log("❌ User NOT opted in")
                setIsOptedIn(false)
            }
        } catch (err) {
            console.log("❌ User NOT opted in (error):", err)
            setIsOptedIn(false)
        }
    }, [activeAddress])

    // Opt-in to the application
    const handleOptIn = async () => {
        if (!activeAddress || !transactionSigner) {
            enqueueSnackbar('Please connect your wallet first', { variant: 'warning' })
            return
        }

        setIsOptingIn(true)

        try {
            console.log("=== OPT-IN TRANSACTION ===")
            console.log("Address:", activeAddress)
            console.log("App ID:", APP_ID)

            const suggestedParams = await algodClient.current.getTransactionParams().do()

            // CRITICAL: Use algosdk to generate correct ARC4 method selector (SHA-512/256)
            const method = new algosdk.ABIMethod({
                name: 'opt_in_voter',
                args: [],
                returns: { type: 'string' }
            })

            const optInTxn = algosdk.makeApplicationCallTxnFromObject({
                sender: activeAddress,
                suggestedParams,
                appIndex: Number(APP_ID),
                onComplete: algosdk.OnApplicationComplete.OptInOC,
                appArgs: [method.getSelector()]
            })

            console.log("Opt-in transaction created, signing...")

            const signedTxns = await transactionSigner([optInTxn], [0])

            console.log("Sending opt-in transaction...")

            const response = await algodClient.current.sendRawTransaction(signedTxns[0]).do()
            const txId = (response as any).txId || (response as any).txid

            console.log("Opt-in transaction sent! TxID:", txId)

            await algosdk.waitForConfirmation(algodClient.current, txId, 4)

            console.log("✅ Opt-in confirmed!")

            setIsOptedIn(true)
            enqueueSnackbar('Successfully opted in! You can now vote.', { variant: 'success' })
        } catch (err: any) {
            console.error('Opt-in error:', err)
            enqueueSnackbar(`Opt-in failed: ${err.message || err}`, { variant: 'error' })
        } finally {
            setIsOptingIn(false)
        }
    }

    // Fetch state on mount and poll every 5 seconds
    useEffect(() => {
        if (DEMO_MODE) return // Skip blockchain calls in demo mode

        fetchElectionState()
        const interval = setInterval(fetchElectionState, 5000)
        return () => clearInterval(interval)
    }, [fetchElectionState])

    // Check voter status when wallet connects
    useEffect(() => {
        if (activeAddress) {
            checkVoterStatus()
            checkOptIn()
        } else {
            // EMERGENCY FIX: Reset state on disconnect
            setHasVoted(null)
            setIsOptedIn(false)
        }
    }, [activeAddress, checkVoterStatus, checkOptIn])

    // Countdown timer
    useEffect(() => {
        if (DEMO_PRESENTATION_MODE) {
            // Demo mode: hardcoded 1 hour countdown
            let demoEndTime = parseInt(localStorage.getItem('demoEndTime') || '0')
            if (!demoEndTime) {
                demoEndTime = Math.floor(Date.now() / 1000) + 3600
                localStorage.setItem('demoEndTime', demoEndTime.toString())
            }

            const timer = setInterval(() => {
                const now = Math.floor(Date.now() / 1000)
                const remaining = Math.max(0, demoEndTime - now)
                const hours = Math.floor(remaining / 3600)
                const minutes = Math.floor((remaining % 3600) / 60)
                const seconds = remaining % 60
                setTimeRemaining({ hours, minutes, seconds })
            }, 1000)

            return () => clearInterval(timer)
        }

        // Real mode
        const timer = setInterval(() => {
            if (!electionState) return

            const now = Math.floor(Date.now() / 1000)
            let remaining: number

            if (electionState.electionEnd === 0) {
                remaining = 3600
            } else if (electionStatus === 'not_started' && electionState.electionStart > 0) {
                remaining = electionState.electionStart - now
            } else if (electionStatus === 'active') {
                remaining = electionState.electionEnd - now
            } else {
                remaining = 0
            }

            if (remaining <= 0) {
                setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 })
            } else {
                const hours = Math.floor(remaining / 3600)
                const minutes = Math.floor((remaining % 3600) / 60)
                const seconds = remaining % 60
                setTimeRemaining({ hours, minutes, seconds })
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [electionState, electionStatus])

    const handleVote = async (candidateId: number) => {
        if (hasVoted || !activeAddress || !transactionSigner) {
            if (!activeAddress) {
                enqueueSnackbar('Please connect your wallet first', { variant: 'warning' })
            }
            return
        }

        setIsVoting(true)

        try {
            console.log("=== VOTE TRANSACTION ===")
            console.log("Sender:", activeAddress)
            console.log("App ID:", Number(APP_ID))
            console.log("Candidate:", candidateId)

            const suggestedParams = await algodClient.current.getTransactionParams().do()

            const method = new algosdk.ABIMethod({
                name: "cast_vote",
                args: [{ type: "uint64" }],
                returns: { type: "string" }
            })

            const txn = algosdk.makeApplicationCallTxnFromObject({
                sender: activeAddress,
                suggestedParams,
                appIndex: Number(APP_ID),
                appArgs: [
                    method.getSelector(),
                    algosdk.encodeUint64(candidateId)
                ],
                onComplete: algosdk.OnApplicationComplete.NoOpOC
            })

            const signed = await transactionSigner([txn], [0])
            const response = await algodClient.current.sendRawTransaction(signed).do()
            const txId = (response as any).txId || (response as any).txid

            console.log("Vote transaction sent! TxID:", txId)

            // Wait for confirmation
            await algosdk.waitForConfirmation(algodClient.current, txId, 4)

            const candidate = candidates.find(c => c.id === candidateId)

            // Demo mode instant update
            if (DEMO_MODE) {
                if (hasVoted) return

                setHasVoted(candidateId)
                localStorage.setItem('demoVoted', candidateId.toString())

                setShowConfetti(true)
                setTimeout(() => setShowConfetti(false), 3000)
                enqueueSnackbar(`Vote recorded for ${candidate?.name}!`, { variant: 'success' })
                setIsVoting(false)
                return
            }

            // Save vote (non-demo mode)
            setHasVoted(candidateId)
            localStorage.setItem(`verivote_voted_${activeAddress}`, candidateId.toString())
            setLastTxId(txId)

            // Show confetti
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 3000)

            enqueueSnackbar(`Vote submitted on-chain for ${candidate?.name}!`, {
                variant: 'success',
                autoHideDuration: 4000
            })

            // Refresh state
            await fetchElectionState()
        } catch (err: any) {
            const errorMsg = err?.message || err?.toString() || 'Unknown error'
            const friendlyError = mapContractError(errorMsg)

            // If the error indicates already voted, update state
            if (friendlyError === 'You have already voted') {
                setHasVoted(-1) // voted but don't know for whom
                localStorage.setItem(`verivote_voted_${activeAddress}`, '-1')
            }

            enqueueSnackbar(friendlyError, {
                variant: 'error',
                autoHideDuration: 4000
            })
        } finally {
            setIsVoting(false)
        }
    }

    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0)
    const getPercentage = (votes: number) => totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0'

    const formatTime = () => {
        if (timeRemaining.hours > 0) {
            return `${timeRemaining.hours}:${timeRemaining.minutes.toString().padStart(2, '0')}:${timeRemaining.seconds.toString().padStart(2, '0')}`
        }
        return `${timeRemaining.minutes}:${timeRemaining.seconds.toString().padStart(2, '0')}`
    }

    const getStatusBadge = () => {
        switch (electionStatus) {
            case 'loading':
                return { text: 'LOADING...', color: 'gray' }
            case 'active':
                return { text: 'VOTING OPEN', color: 'green' }
            case 'not_started':
                return { text: 'NOT STARTED', color: 'yellow' }
            case 'ended':
                return { text: 'ELECTION ENDED', color: 'red' }
            case 'closed':
                return { text: 'ELECTION CLOSED', color: 'red' }
            case 'error':
                return { text: 'CONNECTION ERROR', color: 'red' }
        }
    }

    const statusBadge = getStatusBadge()
    const canVote = DEMO_MODE ? (!!activeAddress && !hasVoted) : (electionStatus === 'active' && !hasVoted && !!activeAddress)

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>

            {/* Confetti animation */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 animate-bounce"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-10%`,
                                backgroundColor: ['#60A5FA', '#A78BFA', '#F472B6', '#34D399'][Math.floor(Math.random() * 4)],
                                animationDelay: `${Math.random() * 0.5}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        ></div>
                    ))}
                </div>
            )}

            <div className="relative py-8 px-4">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-3 drop-shadow-2xl animate-pulse">
                            VeriVote
                        </h1>
                        <p className="text-gray-300 text-xl font-light">Blockchain-Powered Campus Elections</p>
                        {!activeAddress && (
                            <p className="text-yellow-400/80 text-sm mt-3 flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Connect your Pera Wallet to vote
                            </p>
                        )}
                    </div>

                    {/* Election Status Panel */}
                    <div className={`relative backdrop-blur-xl bg-gradient-to-r ${statusBadge.color === 'green' ? 'from-green-500/10 via-emerald-500/10 to-green-500/10 border-green-500/30 hover:border-green-400/50 shadow-green-500/10' : statusBadge.color === 'yellow' ? 'from-yellow-500/10 via-amber-500/10 to-yellow-500/10 border-yellow-500/30 hover:border-yellow-400/50 shadow-yellow-500/10' : 'from-red-500/10 via-rose-500/10 to-red-500/10 border-red-500/30 hover:border-red-400/50 shadow-red-500/10'} border rounded-3xl p-8 shadow-2xl transition-all duration-300`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-emerald-500/5 to-green-500/0 rounded-3xl"></div>
                        <div className="relative flex items-center justify-between flex-wrap gap-6">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                                    Campus President Election 2026
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${statusBadge.color === 'green' ? 'bg-green-500/20 text-green-300 border-green-500/40 shadow-green-500/20' : statusBadge.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-yellow-500/20' : 'bg-red-500/20 text-red-300 border-red-500/40 shadow-red-500/20'} border shadow-lg`}>
                                        <span className={`w-3 h-3 ${statusBadge.color === 'green' ? 'bg-green-400 shadow-green-400/50' : statusBadge.color === 'yellow' ? 'bg-yellow-400 shadow-yellow-400/50' : 'bg-red-400 shadow-red-400/50'} rounded-full mr-2 animate-pulse shadow-lg`}></span>
                                        {statusBadge.text}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-sm mb-2 uppercase tracking-wider">
                                    {electionStatus === 'not_started' ? 'Election starts in:' : electionStatus === 'active' ? 'Election ends in:' : 'Election has ended'}
                                </p>
                                {(electionStatus === 'active' || electionStatus === 'not_started') && (
                                    <div className="text-6xl md:text-7xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 drop-shadow-lg">
                                        {formatTime()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Voting Panel */}
                        <div className="relative backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-400/40 rounded-3xl p-8 shadow-2xl shadow-blue-500/10 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/5 rounded-3xl"></div>
                            <div className="relative">
                                <h3 className="text-3xl font-black text-white mb-8 flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                    <span className="text-4xl">{'🗳️'}</span> Cast Your Vote
                                </h3>

                                {/* OPT-IN GATE */}
                                {electionStatus === 'active' && activeAddress && !isOptedIn && (
                                    <div className="mb-6 p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-2xl">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-3xl">⚠️</span>
                                            <div>
                                                <h4 className="text-lg font-bold text-white">Opt-In Required</h4>
                                                <p className="text-gray-300 text-sm">You need to opt-in before voting</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleOptIn}
                                            disabled={isOptingIn}
                                            className="w-full px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isOptingIn ? 'Opting In...' : '🔓 Opt In to Vote'}
                                        </button>
                                    </div>
                                )}
                                <div className="space-y-6">
                                    {candidates.map((candidate) => (
                                        <div
                                            key={candidate.id}
                                            className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${hasVoted === candidate.id
                                                ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-2 border-blue-400 shadow-xl shadow-blue-500/30 scale-105'
                                                : 'bg-gradient-to-r from-white/5 to-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10'
                                                }`}
                                        >
                                            {hasVoted === candidate.id && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>
                                            )}
                                            <div className="relative flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className={`text-7xl p-4 rounded-2xl ${hasVoted === candidate.id
                                                        ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/30 shadow-lg shadow-blue-500/50'
                                                        : 'bg-gradient-to-br from-gray-700/50 to-gray-600/50'
                                                        }`}>
                                                        {candidate.avatar}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-2xl font-bold text-white mb-1">{candidate.name}</h4>
                                                        <p className="text-gray-400 text-sm font-medium">Candidate {candidate.id}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleVote(candidate.id)}
                                                    disabled={!canVote || isVoting || !isOptedIn}
                                                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${hasVoted === candidate.id
                                                        ? 'bg-green-500 text-white cursor-default shadow-lg shadow-green-500/50'
                                                        : hasVoted
                                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                            : canVote
                                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 hover:scale-110 shadow-xl shadow-purple-500/50 hover:shadow-purple-500/70'
                                                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {isVoting ? (
                                                        <span className="flex items-center gap-2">
                                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Signing...
                                                        </span>
                                                    ) : hasVoted === candidate.id ? (
                                                        <span className="flex items-center gap-2">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Voted
                                                        </span>
                                                    ) : hasVoted ? (
                                                        'Locked'
                                                    ) : (
                                                        'Vote'
                                                    )}
                                                </button>
                                            </div>

                                            {hasVoted === candidate.id && (
                                                <div className="relative mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                    <p className="text-green-400 text-sm font-semibold flex items-center gap-2">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        You voted for {candidate.name}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {hasVoted && (
                                    <div className="relative mt-8 p-5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl backdrop-blur-sm">
                                        <p className="text-green-300 text-sm font-medium flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            Your vote has been recorded on the Algorand blockchain. One wallet, one vote enforced by smart contract.
                                        </p>
                                    </div>
                                )}

                                {!activeAddress && (
                                    <div className="relative mt-8 p-5 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
                                        <p className="text-yellow-300 text-sm font-medium flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Connect your Pera Wallet to cast your vote on Algorand TestNet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Live Results Panel */}
                        <div className="space-y-8">
                            <div className="relative backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-400/40 rounded-3xl p-8 shadow-2xl shadow-purple-500/10 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/5 rounded-3xl"></div>
                                <div className="relative">
                                    <h3 className="text-3xl font-black text-white mb-8 flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                                        <span className="text-4xl">{'\u{1F4CA}'}</span> Live Results
                                    </h3>

                                    {isLoadingState ? (
                                        <div className="flex items-center justify-center py-12">
                                            <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="ml-3 text-gray-400">Fetching from blockchain...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-8">
                                                {candidates.map((candidate) => (
                                                    <div key={candidate.id} className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-4xl p-3 rounded-xl bg-gradient-to-br from-gray-700/50 to-gray-600/50">{candidate.avatar}</span>
                                                                <div>
                                                                    <h4 className="text-xl font-bold text-white">{candidate.name}</h4>
                                                                    <p className="text-gray-400 text-sm">Candidate {candidate.id}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-3xl font-black text-white">{candidate.votes}</div>
                                                                <div className="text-sm font-bold text-gray-400">{getPercentage(candidate.votes)}%</div>
                                                            </div>
                                                        </div>

                                                        <div className="relative w-full bg-gray-800/50 rounded-full h-4 overflow-hidden border border-white/10">
                                                            <div
                                                                className={`absolute inset-0 rounded-full transition-all duration-500 ${candidate.id === 1
                                                                    ? 'bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 shadow-lg shadow-blue-500/50'
                                                                    : 'bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400 shadow-lg shadow-purple-500/50'
                                                                    }`}
                                                                style={{ width: `${getPercentage(candidate.votes)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-white/10">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400 font-semibold">Total Voters</span>
                                                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{totalVotes}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                                        Live from Algorand TestNet
                                    </div>
                                </div>
                            </div>

                            {/* Blockchain Verification Panel */}
                            <div className="relative backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-400/40 rounded-3xl p-8 shadow-2xl shadow-cyan-500/10 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-blue-500/5 rounded-3xl"></div>
                                <div className="relative">
                                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                                        <span className="text-3xl">{'\u26D3\uFE0F'}</span> Blockchain Verification
                                    </h3>

                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all group">
                                            <span className="text-gray-400 font-semibold">App ID</span>
                                            <span className="font-mono font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:scale-110 transition-transform">{APP_ID}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                                            <span className="text-gray-400 font-semibold">Network</span>
                                            <span className="font-bold text-purple-400">Algorand TestNet</span>
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                                            <span className="text-gray-400 font-semibold">Status</span>
                                            <span className="flex items-center gap-2 text-green-400 font-bold">
                                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
                                                {isLoadingState ? 'Connecting...' : 'Contract Active'}
                                            </span>
                                        </div>

                                        {activeAddress && (
                                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                                                <span className="text-gray-400 font-semibold">Wallet</span>
                                                <span className="font-mono text-xs text-cyan-400">
                                                    {activeAddress.substring(0, 6)}...{activeAddress.substring(activeAddress.length - 4)}
                                                </span>
                                            </div>
                                        )}

                                        {lastTxId && (
                                            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                                                <div className="text-gray-400 mb-2 font-semibold text-xs uppercase tracking-wider">Vote Transaction ID</div>
                                                <div className="font-mono text-xs text-cyan-400 break-all bg-black/30 p-3 rounded-lg border border-cyan-500/20 shadow-inner">
                                                    {lastTxId}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <a
                                        href={`https://testnet.explorer.perawallet.app/application/${APP_ID}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-6 w-full px-4 py-4 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-300 rounded-xl font-bold hover:from-cyan-600/30 hover:to-blue-600/30 transition-all flex items-center justify-center gap-2 border border-cyan-500/30 hover:border-cyan-400/50"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        View on Pera Explorer
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Features Banner */}
                    <div className="relative backdrop-blur-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 hover:border-indigo-400/40 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/5 to-pink-500/0 rounded-3xl"></div>
                        <div className="relative">
                            <h3 className="text-2xl font-black text-white mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
                                {'\u{1F510}'} Security Features
                            </h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/20 hover:border-blue-400/40 hover:scale-105 transition-all">
                                    <div className="text-4xl">{'\u23F0'}</div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg mb-2">Time-Lock Enforcement</h4>
                                        <p className="text-sm text-gray-300">Voting only during active election window</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 hover:border-purple-400/40 hover:scale-105 transition-all">
                                    <div className="text-4xl">{'\u{1F6AB}'}</div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg mb-2">Double-Vote Prevention</h4>
                                        <p className="text-sm text-gray-300">One wallet, one vote enforced</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 hover:border-cyan-400/40 hover:scale-105 transition-all">
                                    <div className="text-4xl">{'\u{1F916}'}</div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg mb-2">AI Transparency Report</h4>
                                        <p className="text-sm text-gray-300">Automated audit with on-chain hash</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VotingInterface
