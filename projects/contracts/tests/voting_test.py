"""
Comprehensive test suite for VeriVote Smart Contract.

Tests cover:
- Election creation with valid/invalid parameters
- Voting within/outside time window
- Double vote rejection
- Invalid candidate ID rejection
- Election closure with hash storage
- Results retrieval
"""

import pytest
from algokit_utils import ApplicationClient, get_algod_client
from algokit_utils.config import config
from algopy_testing import AlgopyTestContext, algopy_testing_context
from algopy import UInt64

from smart_contracts.voting.contract import VotingContract


@pytest.fixture
def context() -> AlgopyTestContext:
    """Create a fresh AlgoPy testing context for each test."""
    return algopy_testing_context()


@pytest.fixture
def voting_contract(context: AlgopyTestContext) -> VotingContract:
    """Create a fresh VotingContract instance for each test."""
    return VotingContract()


class TestElectionCreation:
    """Tests for create_election method."""

    def test_create_election_valid(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test creating an election with valid parameters."""
        current_time = 1000
        context.set_latest_timestamp(current_time)

        start_time = current_time + 100
        end_time = current_time + 1000

        # Set creator as sender
        context.set_sender(context.default_creator)

        # Create election
        result = voting_contract.create_election(
            start_time=UInt64(start_time),
            end_time=UInt64(end_time),
        )

        # Verify state was set correctly
        assert voting_contract.election_start == start_time
        assert voting_contract.election_end == end_time
        assert voting_contract.candidate_a_votes == 0
        assert voting_contract.candidate_b_votes == 0
        assert voting_contract.total_voters == 0
        assert voting_contract.election_closed == 0

    def test_create_election_invalid_time_order(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test that election creation fails if start_time >= end_time."""
        current_time = 1000
        context.set_latest_timestamp(current_time)

        start_time = current_time + 1000
        end_time = current_time + 100  # End before start!

        context.set_sender(context.default_creator)

        with pytest.raises(AssertionError, match="Start time must be before end time"):
            voting_contract.create_election(
                start_time=UInt64(start_time),
                end_time=UInt64(end_time),
            )

    def test_create_election_past_end_time(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test that election creation fails if end_time is in the past."""
        current_time = 1000
        context.set_latest_timestamp(current_time)

        start_time = current_time - 500
        end_time = current_time - 100  # End in the past!

        context.set_sender(context.default_creator)

        with pytest.raises(AssertionError, match="End time must be in the future"):
            voting_contract.create_election(
                start_time=UInt64(start_time),
                end_time=UInt64(end_time),
            )

    def test_create_election_non_creator(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test that only creator can create election."""
        current_time = 1000
        context.set_latest_timestamp(current_time)

        start_time = current_time + 100
        end_time = current_time + 1000

        # Set non-creator as sender
        non_creator = context.any_account()
        context.set_sender(non_creator)

        with pytest.raises(AssertionError, match="Only creator can create election"):
            voting_contract.create_election(
                start_time=UInt64(start_time),
                end_time=UInt64(end_time),
            )


class TestVoting:
    """Tests for cast_vote method."""

    def setup_active_election(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Helper to set up an active election."""
        current_time = 1000
        context.set_latest_timestamp(current_time)

        start_time = current_time - 10  # Already started
        end_time = current_time + 1000  # Still active

        context.set_sender(context.default_creator)
        voting_contract.create_election(
            start_time=UInt64(start_time),
            end_time=UInt64(end_time),
        )

    def test_cast_vote_candidate_a(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test casting a vote for Candidate A."""
        self.setup_active_election(context, voting_contract)

        voter = context.any_account()
        context.set_sender(voter)

        # Opt in voter
        voting_contract.opt_in_voter()

        # Cast vote
        result = voting_contract.cast_vote(candidate_id=UInt64(1))

        # Verify vote was recorded
        assert voting_contract.candidate_a_votes == 1
        assert voting_contract.candidate_b_votes == 0
        assert voting_contract.total_voters == 1
        assert voting_contract.has_voted == 1

    def test_cast_vote_candidate_b(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test casting a vote for Candidate B."""
        self.setup_active_election(context, voting_contract)

        voter = context.any_account()
        context.set_sender(voter)

        # Opt in voter
        voting_contract.opt_in_voter()

        # Cast vote
        result = voting_contract.cast_vote(candidate_id=UInt64(2))

        # Verify vote was recorded
        assert voting_contract.candidate_a_votes == 0
        assert voting_contract.candidate_b_votes == 1
        assert voting_contract.total_voters == 1
        assert voting_contract.has_voted == 1

    def test_double_vote_rejection(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test that a voter cannot vote twice."""
        self.setup_active_election(context, voting_contract)

        voter = context.any_account()
        context.set_sender(voter)

        # Opt in voter
        voting_contract.opt_in_voter()

        # First vote should succeed
        voting_contract.cast_vote(candidate_id=UInt64(1))

        # Second vote should fail
        with pytest.raises(AssertionError, match="You have already voted"):
            voting_contract.cast_vote(candidate_id=UInt64(2))

    def test_vote_before_start(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test that voting before election starts is rejected."""
        current_time = 1000
        context.set_latest_timestamp(current_time)

        start_time = current_time + 100  # Hasn't started yet
        end_time = current_time + 1000

        context.set_sender(context.default_creator)
        voting_contract.create_election(
            start_time=UInt64(start_time),
            end_time=UInt64(end_time),
        )

        voter = context.any_account()
        context.set_sender(voter)
        voting_contract.opt_in_voter()

        with pytest.raises(AssertionError, match="Election has not started yet"):
            voting_contract.cast_vote(candidate_id=UInt64(1))

    def test_vote_after_end(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test that voting after election ends is rejected."""
        current_time = 1000
        context.set_latest_timestamp(current_time)

        start_time = current_time - 1000
        end_time = current_time - 100  # Already ended

        context.set_sender(context.default_creator)
        voting_contract.create_election(
            start_time=UInt64(start_time),
            end_time=UInt64(end_time),
        )

        voter = context.any_account()
        context.set_sender(voter)
        voting_contract.opt_in_voter()

        with pytest.raises(AssertionError, match="Election has ended"):
            voting_contract.cast_vote(candidate_id=UInt64(1))

    def test_invalid_candidate_id(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test that invalid candidate IDs are rejected."""
        self.setup_active_election(context, voting_contract)

        voter = context.any_account()
        context.set_sender(voter)
        voting_contract.opt_in_voter()

        with pytest.raises(
            AssertionError, match="Invalid candidate ID \\(must be 1 or 2\\)"
        ):
            voting_contract.cast_vote(candidate_id=UInt64(3))


class TestElectionClosure:
    """Tests for close_election method."""

    def setup_ended_election(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Helper to set up an ended election."""
        current_time = 1000
        context.set_latest_timestamp(current_time)

        start_time = current_time - 1000
        end_time = current_time - 100  # Election has ended

        context.set_sender(context.default_creator)
        voting_contract.create_election(
            start_time=UInt64(start_time),
            end_time=UInt64(end_time),
        )

    def test_close_election_valid(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test closing election with valid hash."""
        self.setup_ended_election(context, voting_contract)

        # Create a 32-byte hash (SHA256)
        ai_hash = b"a" * 32

        context.set_sender(context.default_creator)
        result = voting_contract.close_election(ai_hash=ai_hash)

        # Verify election was closed
        assert voting_contract.election_closed == 1
        assert len(voting_contract.ai_report_hash.native) == 32

    def test_close_election_invalid_hash_length(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test that closing with invalid hash length fails."""
        self.setup_ended_election(context, voting_contract)

        # Hash too short
        ai_hash = b"short"

        context.set_sender(context.default_creator)

        with pytest.raises(
            AssertionError, match="AI hash must be exactly 32 bytes \\(SHA256\\)"
        ):
            voting_contract.close_election(ai_hash=ai_hash)

    def test_close_election_before_end(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test that election cannot be closed before it ends."""
        current_time = 1000
        context.set_latest_timestamp(current_time)

        start_time = current_time - 100
        end_time = current_time + 1000  # Still active

        context.set_sender(context.default_creator)
        voting_contract.create_election(
            start_time=UInt64(start_time),
            end_time=UInt64(end_time),
        )

        ai_hash = b"a" * 32

        with pytest.raises(AssertionError, match="Election has not ended yet"):
            voting_contract.close_election(ai_hash=ai_hash)

    def test_close_election_non_creator(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test that only creator can close election."""
        self.setup_ended_election(context, voting_contract)

        ai_hash = b"a" * 32

        # Set non-creator as sender
        non_creator = context.any_account()
        context.set_sender(non_creator)

        with pytest.raises(AssertionError, match="Only creator can close election"):
            voting_contract.close_election(ai_hash=ai_hash)


class TestResultsRetrieval:
    """Tests for get_results method."""

    def test_get_results_empty_election(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test getting results from an election with no votes."""
        current_time = 1000
        context.set_latest_timestamp(current_time)

        start_time = current_time + 100
        end_time = current_time + 1000

        context.set_sender(context.default_creator)
        voting_contract.create_election(
            start_time=UInt64(start_time),
            end_time=UInt64(end_time),
        )

        results = voting_contract.get_results()

        assert results[0] == 0  # candidate_a_votes
        assert results[1] == 0  # candidate_b_votes
        assert results[2] == 0  # total_voters
        assert results[3] == start_time  # election_start
        assert results[4] == end_time  # election_end
        assert results[5] == 0  # election_closed

    def test_get_results_with_votes(
        self, context: AlgopyTestContext, voting_contract: VotingContract
    ) -> None:
        """Test getting results from an election with votes."""
        current_time = 1000
        context.set_latest_timestamp(current_time)

        start_time = current_time - 10
        end_time = current_time + 1000

        context.set_sender(context.default_creator)
        voting_contract.create_election(
            start_time=UInt64(start_time),
            end_time=UInt64(end_time),
        )

        # Cast some votes
        for i in range(3):
            voter = context.any_account()
            context.set_sender(voter)
            voting_contract.opt_in_voter()
            candidate = 1 if i < 2 else 2
            voting_contract.cast_vote(candidate_id=UInt64(candidate))

        # Get results as any user
        results = voting_contract.get_results()

        assert results[0] == 2  # candidate_a_votes
        assert results[1] == 1  # candidate_b_votes
        assert results[2] == 3  # total_voters
