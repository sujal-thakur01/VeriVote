"""
Deployment configuration for VeriVote Smart Contract.

This module defines how the contract should be deployed and what parameters
should be used for demo/testing purposes.
"""

import logging
from collections.abc import Callable

from algokit_utils import (
    Account,
    TransactionParameters,
    get_account,
    get_algod_client,
    get_indexer_client,
)
from algokit_utils.config import config
from algopy import UInt64

from smart_contracts.voting.contract import VotingContract

# Configure logging
logger = logging.getLogger(__name__)


def deploy(
    algod_client: None = None,
    indexer_client: None = None,
    creator_account: Account | None = None,
    app_spec_path: str | None = None,
) -> None:
    """
    Deploy VeriVote smart contract to Algorand network.

    Args:
        algod_client: Algod client instance (optional, will create if None)
        indexer_client: Indexer client instance (optional, will create if None)
        creator_account: Account to deploy from (optional, will get from environment if None)
        app_spec_path: Path to app spec file (optional)
    """
    # Setup clients
    if algod_client is None:
        algod_client = get_algod_client()

    if indexer_client is None:
        indexer_client = get_indexer_client()

    if creator_account is None:
        creator_account = get_account(algod_client, "DEPLOYER")

    # Enable transaction tracing for better debugging
    config.configure(
        debug=True,
        trace_all=True,
    )

    # Create the voting contract instance
    from algokit_utils import ApplicationClient

    # Note: This is a placeholder deployment configuration
    # In production, you would use the generated client from algokit_client_generator

    logger.info("VeriVote deployment configuration loaded")
    logger.info("Contract will be deployed with creator: %s", creator_account.address)
    logger.info(
        "After deployment, call create_election with appropriate timestamps"
    )


# Quick Demo Mode parameters
def get_demo_election_times(current_timestamp: int) -> tuple[int, int]:
    """
    Get demo election times for quick testing.

    Creates an election that starts immediately and ends in 5 minutes.

    Args:
        current_timestamp: Current blockchain timestamp

    Returns:
        Tuple of (start_time, end_time)
    """
    start_time = current_timestamp + 10  # Start in 10 seconds
    end_time = current_timestamp + 300  # End in 5 minutes (300 seconds)
    return (start_time, end_time)


def get_standard_election_times(current_timestamp: int) -> tuple[int, int]:
    """
    Get standard election times for production.

    Creates an election that starts in 1 minute and ends in 1 hour.

    Args:
        current_timestamp: Current blockchain timestamp

    Returns:
        Tuple of (start_time, end_time)
    """
    start_time = current_timestamp + 60  # Start in 1 minute
    end_time = current_timestamp + 3600  # End in 1 hour
    return (start_time, end_time)
