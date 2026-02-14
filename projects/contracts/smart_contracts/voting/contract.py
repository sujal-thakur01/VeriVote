"""
VeriVote: Blockchain Voting Smart Contract
A production-ready voting system with time-lock enforcement and AI transparency.
"""

from algopy import (
    ARC4Contract,
    Global,
    Txn,
    UInt64,
    LocalState,
    arc4,
    OnCompleteAction,
)


class VotingContract(ARC4Contract):
    """
    VeriVote Smart Contract - Secure Campus Election System

    Global State:
    - candidate_a_votes
    - candidate_b_votes
    - election_start
    - election_end
    - total_voters
    - ai_report_hash
    - election_closed

    Local State (per voter):
    - has_voted
    - vote_timestamp
    """

    def __init__(self) -> None:
        # Global state
        self.candidate_a_votes = UInt64(0)
        self.candidate_b_votes = UInt64(0)
        self.election_start = UInt64(0)
        self.election_end = UInt64(0)
        self.total_voters = UInt64(0)
        self.ai_report_hash = arc4.DynamicBytes(b"")
        self.election_closed = UInt64(0)

        # Local state - stored per account
        self.has_voted = LocalState(UInt64)
        self.vote_timestamp = LocalState(UInt64)

    # ============================================================
    # CREATE ELECTION
    # ============================================================

    @arc4.abimethod(allow_actions=[OnCompleteAction.NoOp])
    def create_election(
        self,
        start_time: arc4.UInt64,
        end_time: arc4.UInt64,
    ) -> arc4.String:

        assert Txn.sender == Global.creator_address, "Only creator can create election"

        start = start_time.native
        end = end_time.native
        current_time = Global.latest_timestamp

        assert start < end, "Start time must be before end time"
        assert end > current_time, "End time must be in the future"

        self.candidate_a_votes = UInt64(0)
        self.candidate_b_votes = UInt64(0)
        self.total_voters = UInt64(0)
        self.election_closed = UInt64(0)

        self.election_start = start
        self.election_end = end
        self.ai_report_hash = arc4.DynamicBytes(b"")

        return arc4.String("Election created successfully")

    # ============================================================
    # CAST VOTE
    # ============================================================

    @arc4.abimethod(allow_actions=[OnCompleteAction.NoOp])
    def cast_vote(self, candidate_id: arc4.UInt64) -> arc4.String:

        current_time = Global.latest_timestamp
        candidate = candidate_id.native

        assert current_time >= self.election_start, "Election has not started yet"
        assert current_time <= self.election_end, "Election has ended"
        assert self.election_closed == 0, "Election is closed"
        assert self.has_voted[Txn.sender] == 0, "You have already voted"
        assert candidate == 1 or candidate == 2, "Invalid candidate ID (must be 1 or 2)"

        if candidate == 1:
            self.candidate_a_votes += 1
        else:
            self.candidate_b_votes += 1

        self.total_voters += 1
        self.has_voted[Txn.sender] = UInt64(1)
        self.vote_timestamp[Txn.sender] = current_time

        return arc4.String("Vote recorded successfully")

    # ============================================================
    # CLOSE ELECTION
    # ============================================================

    @arc4.abimethod(allow_actions=[OnCompleteAction.NoOp])
    def close_election(self, ai_hash: arc4.DynamicBytes) -> arc4.String:

        assert Txn.sender == Global.creator_address, "Only creator can close election"

        current_time = Global.latest_timestamp
        assert current_time > self.election_end, "Election has not ended yet"

        self.ai_report_hash = ai_hash.copy()
        self.election_closed = UInt64(1)

        return arc4.String("Election closed successfully with AI report hash stored")

    # ============================================================
    # READ RESULTS (READ-ONLY)
    # ============================================================

    @arc4.abimethod(readonly=True)
    def get_results(
        self,
    ) -> arc4.Tuple[
        arc4.UInt64,
        arc4.UInt64,
        arc4.UInt64,
        arc4.UInt64,
        arc4.UInt64,
        arc4.UInt64,
        arc4.DynamicBytes,
    ]:

        return arc4.Tuple(
            (
                arc4.UInt64(self.candidate_a_votes),
                arc4.UInt64(self.candidate_b_votes),
                arc4.UInt64(self.total_voters),
                arc4.UInt64(self.election_start),
                arc4.UInt64(self.election_end),
                arc4.UInt64(self.election_closed),
                self.ai_report_hash.copy(),
            )
        )

    # ============================================================
    # GET VOTER STATUS (READ-ONLY)
    # ============================================================

    @arc4.abimethod(readonly=True)
    def get_voter_status(
        self,
    ) -> arc4.Tuple[
        arc4.UInt64,
        arc4.UInt64,
    ]:

        return arc4.Tuple(
            (
                arc4.UInt64(self.has_voted[Txn.sender]),
                arc4.UInt64(self.vote_timestamp[Txn.sender]),
            )
        )

    # ============================================================
    # OPT IN VOTER
    # ============================================================

    @arc4.abimethod(allow_actions=[OnCompleteAction.OptIn])
    def opt_in_voter(self) -> arc4.String:

        self.has_voted[Txn.sender] = UInt64(0)
        self.vote_timestamp[Txn.sender] = UInt64(0)

        return arc4.String("Voter opted in successfully")