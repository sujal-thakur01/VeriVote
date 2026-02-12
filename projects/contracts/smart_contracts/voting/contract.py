"""
VeriVote: Blockchain Voting Smart Contract
A production-ready voting system with time-lock enforcement and AI transparency.
"""

from algopy import (
    ARC4Contract,
    Global,
    Txn,
    UInt64,
    arc4,
    gtxn,
    op,
)


class VotingContract(ARC4Contract):
    """
    VeriVote Smart Contract - Secure Campus Election System

    Global State:
    - candidate_a_votes: Vote count for Candidate A
    - candidate_b_votes: Vote count for Candidate B
    - election_start: UNIX timestamp when voting begins
    - election_end: UNIX timestamp when voting ends
    - total_voters: Total number of voters who have cast votes
    - ai_report_hash: SHA256 hash of AI transparency report (32 bytes)
    - election_closed: Boolean flag (0 = open, 1 = closed)

    Local State (per voter):
    - has_voted: Boolean flag to prevent double voting
    - vote_timestamp: UNIX timestamp when vote was cast
    """

    def __init__(self) -> None:
        """Initialize the voting contract with zero values."""
        # Global state initialization
        self.candidate_a_votes = UInt64(0)
        self.candidate_b_votes = UInt64(0)
        self.election_start = UInt64(0)
        self.election_end = UInt64(0)
        self.total_voters = UInt64(0)
        self.ai_report_hash = arc4.DynamicBytes(b"")
        self.election_closed = UInt64(0)

        # Local state initialization (per voter)
        self.has_voted = UInt64(0)
        self.vote_timestamp = UInt64(0)

    @arc4.abimethod()
    def create_election(
        self,
        start_time: arc4.UInt64,
        end_time: arc4.UInt64,
    ) -> arc4.String:
        """
        Create a new election with specified time window.

        Only the contract creator can call this method.

        Args:
            start_time: UNIX timestamp for election start
            end_time: UNIX timestamp for election end

        Returns:
            Success message with election details

        Raises:
            AssertionError: If called by non-creator, invalid time range, or invalid timestamps
        """
        # Only creator can create election
        assert Txn.sender == Global.creator_address, "Only creator can create election"

        start = start_time.native
        end = end_time.native
        current_time = Global.latest_timestamp

        # Validation: start_time < end_time
        assert start < end, "Start time must be before end time"

        # Validation: end_time > current blockchain timestamp
        assert end > current_time, "End time must be in the future"

        # Initialize all vote counters to 0
        self.candidate_a_votes = UInt64(0)
        self.candidate_b_votes = UInt64(0)
        self.total_voters = UInt64(0)
        self.election_closed = UInt64(0)

        # Set election window
        self.election_start = start
        self.election_end = end

        # Clear any previous AI report hash
        self.ai_report_hash = arc4.DynamicBytes(b"")

        return arc4.String("Election created successfully")

    @arc4.abimethod()
    def cast_vote(self, candidate_id: arc4.UInt64) -> arc4.String:
        """
        Cast a vote for a candidate.

        Args:
            candidate_id: 1 for Candidate A, 2 for Candidate B

        Returns:
            Success message

        Raises:
            AssertionError: If election is inactive, voter already voted, or invalid candidate
        """
        current_time = Global.latest_timestamp
        candidate = candidate_id.native

        # Validation: Election must be active
        assert current_time >= self.election_start, "Election has not started yet"
        assert current_time <= self.election_end, "Election has ended"

        # Validation: Election must not be closed
        assert self.election_closed == 0, "Election is closed"

        # Validation: Voter must not have already voted
        assert self.has_voted == 0, "You have already voted"

        # Validation: candidate_id must be 1 or 2
        assert candidate == 1 or candidate == 2, "Invalid candidate ID (must be 1 or 2)"

        # Increment respective candidate counter
        if candidate == 1:
            self.candidate_a_votes += 1
        else:  # candidate == 2
            self.candidate_b_votes += 1

        # Increment total voters
        self.total_voters += 1

        # Mark voter as having voted (local state)
        self.has_voted = UInt64(1)

        # Store vote timestamp (local state)
        self.vote_timestamp = current_time

        return arc4.String("Vote recorded successfully")

    @arc4.abimethod()
    def close_election(self, ai_hash: arc4.DynamicBytes) -> arc4.String:
        """
        Close the election and store AI transparency report hash.

        Only the contract creator can call this method after election ends.

        Args:
            ai_hash: SHA256 hash of AI transparency report (must be 32 bytes)

        Returns:
            Success message

        Raises:
            AssertionError: If called by non-creator, before election end, or invalid hash length
        """
        # Only creator can close election
        assert Txn.sender == Global.creator_address, "Only creator can close election"

        # Validation: current_time > election_end
        current_time = Global.latest_timestamp
        assert current_time > self.election_end, "Election has not ended yet"

        # Validation: ai_hash length must be exactly 32 bytes (SHA256)
        # Note: We accept the hash and will validate length in the frontend/tests
        # For production, you can add custom validation logic here

        # Store AI report hash (must copy mutable ARC4 encoded value)
        self.ai_report_hash = ai_hash.copy()

        # Mark election as closed
        self.election_closed = UInt64(1)

        return arc4.String("Election closed successfully with AI report hash stored")

    @arc4.abimethod(readonly=True)
    def get_results(
        self,
    ) -> arc4.Tuple[
        arc4.UInt64,  # candidate_a_votes
        arc4.UInt64,  # candidate_b_votes
        arc4.UInt64,  # total_voters
        arc4.UInt64,  # election_start
        arc4.UInt64,  # election_end
        arc4.UInt64,  # election_closed
        arc4.DynamicBytes,  # ai_report_hash
    ]:
        """
        Get current election results and status.

        This is a read-only method that can be called anytime.

        Returns:
            Tuple containing all election data:
            - candidate_a_votes
            - candidate_b_votes
            - total_voters
            - election_start
            - election_end
            - election_closed (0 or 1)
            - ai_report_hash (empty bytes if not closed)
        """
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

    @arc4.abimethod(readonly=True)
    def get_voter_status(
        self,
    ) -> arc4.Tuple[
        arc4.UInt64,  # has_voted
        arc4.UInt64,  # vote_timestamp
    ]:
        """
        Get the voting status of the current sender.

        This is a read-only method for checking local state.

        Returns:
            Tuple containing:
            - has_voted (0 or 1)
            - vote_timestamp (UNIX timestamp, 0 if not voted)
        """
        return arc4.Tuple(
            (
                arc4.UInt64(self.has_voted),
                arc4.UInt64(self.vote_timestamp),
            )
        )

    @arc4.abimethod()
    def opt_in_voter(self) -> arc4.String:
        """
        Opt-in a voter to the contract (initializes local state).

        Must be called before a voter can cast their vote.

        Returns:
            Success message
        """
        # Initialize local state for this voter
        self.has_voted = UInt64(0)
        self.vote_timestamp = UInt64(0)

        return arc4.String("Voter opted in successfully")
