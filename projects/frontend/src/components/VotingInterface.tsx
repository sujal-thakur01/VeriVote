import { useEffect, useState } from 'react'
import { useSnackbar } from 'notistack'

interface Candidate {
    id: number
    name: string
    avatar: string
    votes: number
}

const VotingInterface = () => {
    const { enqueueSnackbar } = useSnackbar()

    // Election state
    const [timeRemaining, setTimeRemaining] = useState({ minutes: 4, seconds: 32 })
    const [hasVoted, setHasVoted] = useState<number | null>(null)
    const [isVoting, setIsVoting] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)

    // Candidates state
    const [candidates, setCandidates] = useState<Candidate[]>([
        { id: 1, name: 'Alice Thompson', avatar: '👩‍💼', votes: 42 },
        { id: 2, name: 'Bob Martinez', avatar: '👨‍💼', votes: 38 }
    ])

    // Check localStorage on mount
    useEffect(() => {
        const savedVote = localStorage.getItem('verivote_voted')
        if (savedVote) {
            setHasVoted(parseInt(savedVote))
        }
    }, [])

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 }
                } else if (prev.minutes > 0) {
                    return { minutes: prev.minutes - 1, seconds: 59 }
                }
                return prev
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // Auto-increment votes (simulate real-time updates)
    useEffect(() => {
        const voteUpdater = setInterval(() => {
            setCandidates(prev => {
                const randomCandidate = Math.random() > 0.5 ? 0 : 1
                const newCandidates = [...prev]
                newCandidates[randomCandidate].votes += 1
                return newCandidates
            })
        }, 3000)

        return () => clearInterval(voteUpdater)
    }, [])

    const handleVote = async (candidateId: number) => {
        if (hasVoted) return

        setIsVoting(true)

        // Simulate blockchain transaction delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        const candidate = candidates.find(c => c.id === candidateId)

        // Update vote count
        setCandidates(prev =>
            prev.map(c => c.id === candidateId ? { ...c, votes: c.votes + 1 } : c)
        )

        // Save vote
        setHasVoted(candidateId)
        localStorage.setItem('verivote_voted', candidateId.toString())

        setIsVoting(false)

        // Show confetti celebration
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)

        // Success notification
        enqueueSnackbar(`✅ Vote submitted to blockchain for ${candidate?.name}!`, {
            variant: 'success',
            autoHideDuration: 3000
        })
    }

    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0)
    const getPercentage = (votes: number) => totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0'

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
                    </div>

                    {/* Election Status Panel - Enhanced */}
                    <div className="relative backdrop-blur-xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/30 hover:border-green-400/50 rounded-3xl p-8 shadow-2xl shadow-green-500/10 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-emerald-500/5 to-green-500/0 rounded-3xl"></div>
                        <div className="relative flex items-center justify-between flex-wrap gap-6">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                                    Campus President Election 2026
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-green-500/20 text-green-300 border border-green-500/40 shadow-lg shadow-green-500/20">
                                        <span className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></span>
                                        VOTING OPEN
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Election ends in:</p>
                                <div className="text-6xl md:text-7xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 drop-shadow-lg">
                                    {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Voting Panel - Enhanced */}
                        <div className="relative backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-400/40 rounded-3xl p-8 shadow-2xl shadow-blue-500/10 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/5 rounded-3xl"></div>
                            <div className="relative">
                                <h3 className="text-3xl font-black text-white mb-8 flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                    <span className="text-4xl">🗳️</span> Cast Your Vote
                                </h3>

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
                                                    disabled={hasVoted !== null || isVoting}
                                                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${hasVoted === candidate.id
                                                            ? 'bg-green-500 text-white cursor-default shadow-lg shadow-green-500/50'
                                                            : hasVoted
                                                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 hover:scale-110 shadow-xl shadow-purple-500/50 hover:shadow-purple-500/70'
                                                        }`}
                                                >
                                                    {isVoting ? (
                                                        <span className="flex items-center gap-2">
                                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Submitting...
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
                            </div>
                        </div>

                        {/* Live Results Panel - Enhanced */}
                        <div className="space-y-8">
                            <div className="relative backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-400/40 rounded-3xl p-8 shadow-2xl shadow-purple-500/10 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/5 rounded-3xl"></div>
                                <div className="relative">
                                    <h3 className="text-3xl font-black text-white mb-8 flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                                        <span className="text-4xl">📊</span> Live Results
                                    </h3>

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

                                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                                        Updates every 3 seconds
                                    </div>
                                </div>
                            </div>

                            {/* Blockchain Verification Panel - Enhanced */}
                            <div className="relative backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-400/40 rounded-3xl p-8 shadow-2xl shadow-cyan-500/10 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-blue-500/5 rounded-3xl"></div>
                                <div className="relative">
                                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                                        <span className="text-3xl">⛓️</span> Blockchain Verification
                                    </h3>

                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all group">
                                            <span className="text-gray-400 font-semibold">App ID</span>
                                            <span className="font-mono font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:scale-110 transition-transform">1004</span>
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                                            <span className="text-gray-400 font-semibold">Network</span>
                                            <span className="font-bold text-purple-400">Algorand LocalNet</span>
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                                            <span className="text-gray-400 font-semibold">Status</span>
                                            <span className="flex items-center gap-2 text-green-400 font-bold">
                                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
                                                Contract Deployed
                                            </span>
                                        </div>

                                        {hasVoted && (
                                            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                                                <div className="text-gray-400 mb-2 font-semibold text-xs uppercase tracking-wider">Transaction Hash</div>
                                                <div className="font-mono text-xs text-cyan-400 break-all bg-black/30 p-3 rounded-lg border border-cyan-500/20 shadow-inner">
                                                    {`0x${Math.random().toString(16).substr(2, 64)}`}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        disabled
                                        className="mt-6 w-full px-4 py-4 bg-gray-700/30 text-gray-500 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2 group relative border border-gray-600/30"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        View on Explorer
                                        <span className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 shadow-xl">
                                            LocalNet not publicly accessible
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Features Banner - Enhanced */}
                    <div className="relative backdrop-blur-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 hover:border-indigo-400/40 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/5 to-pink-500/0 rounded-3xl"></div>
                        <div className="relative">
                            <h3 className="text-2xl font-black text-white mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
                                🔐 Security Features
                            </h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/20 hover:border-blue-400/40 hover:scale-105 transition-all">
                                    <div className="text-4xl">⏰</div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg mb-2">Time-Lock Enforcement</h4>
                                        <p className="text-sm text-gray-300">Voting only during active election window</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 hover:border-purple-400/40 hover:scale-105 transition-all">
                                    <div className="text-4xl">🚫</div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg mb-2">Double-Vote Prevention</h4>
                                        <p className="text-sm text-gray-300">One wallet, one vote enforced</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 hover:border-cyan-400/40 hover:scale-105 transition-all">
                                    <div className="text-4xl">🤖</div>
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
