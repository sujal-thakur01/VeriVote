#!/usr/bin/env python3
"""
Quick deployment script for VeriVote Smart Contract.

This script deploys the VotingContract to Algorand Testnet and optionally
creates a demo election.

Usage:
    python deploy_voting.py [--demo]

Options:
    --demo    Create a demo election with quickstart times (5 min duration)
"""

import argparse
import json
import sys
import time
from pathlib import Path

from algokit_utils import (
    Account,
    ApplicationSpecification,
    get_account,
    get_algod_client,
    get_indexer_client,
)
from algokit_utils.applications import ApplicationClient
from algosdk import transaction
from algosdk.atomic_transaction_composer import (
    AccountTransactionSigner,
    AtomicTransactionComposer,
    TransactionWithSigner,
)
from algosdk.v2client.algod import AlgodClient


def load_app_spec() -> ApplicationSpecification:
    """Load the compiled application specification."""
    spec_path = (
        Path(__file__).parent.parent
        / "smart_contracts"
        / "voting"
        / "VotingContract.arc32.json"
    )

    if not spec_path.exists():
        print(f"❌ App spec not found at {spec_path}")
        print("Please run: poetry run puyapy smart_contracts/voting/contract.py")
        sys.exit(1)

    with open(spec_path) as f:
        spec_dict = json.load(f)

    return ApplicationSpecification.from_json(spec_dict)


def deploy_contract(
    algod_client: AlgodClient,
    creator_account: Account,
    app_spec: ApplicationSpecification,
) -> int:
    """
    Deploy the VotingContract to the network.

    Returns:
        Application ID of the deployed contract
    """
    print("\n🚀 Deploying VotingContract to Algorand Testnet...")
    print(f"   Creator: {creator_account.address}")

    # Create application client
    app_client = ApplicationClient(
        algod_client=algod_client,
        app_spec=app_spec,
        signer=AccountTransactionSigner(creator_account.private_key),
        sender=creator_account.address,
    )

    # Deploy the application
    print("   Creating application...")
    result = app_client.create()

    app_id = result.app_id
    app_address = result.app_address

    print(f"\n✅ Contract deployed successfully!")
    print(f"   App ID: {app_id}")
    print(f"   App Address: {app_address}")
    print(
        f"   AlgoExplorer: https://testnet.algoexplorer.io/application/{app_id}"
    )

    return app_id


def fund_contract(
    algod_client: AlgodClient,
    creator_account: Account,
    app_address: str,
    amount: int,
) -> None:
    """Fund the contract with minimum balance to hold global state."""
    print(f"\n💰 Funding contract with {amount / 1_000_000} ALGO...")

    params = algod_client.suggested_params()
    txn = transaction.PaymentTxn(
        sender=creator_account.address,
        sp=params,
        receiver=app_address,
        amt=amount,
    )

    signed_txn = txn.sign(creator_account.private_key)
    tx_id = algod_client.send_transaction(signed_txn)

    # Wait for confirmation
    transaction.wait_for_confirmation(algod_client, tx_id, 4)
    print(f"   ✅ Funded contract with {amount / 1_000_000} ALGO")


def create_demo_election(
    algod_client: AlgodClient,
    creator_account: Account,
    app_spec: ApplicationSpecification,
    app_id: int,
    is_quick_demo: bool = False,
) -> None:
    """Create a demo election in the deployed contract."""
    app_client = ApplicationClient(
        algod_client=algod_client,
        app_spec=app_spec,
        signer=AccountTransactionSigner(creator_account.private_key),
        sender=creator_account.address,
        app_id=app_id,
    )

    # Get current time
    params = algod_client.suggested_params()
    latest_block = algod_client.block_info(params.first)
    current_time = latest_block.get("block", {}).get("ts", int(time.time()))

    # Set election times
    if is_quick_demo:
        # Quick demo: starts in 10 seconds, ends in 5 minutes
        start_time = current_time + 10
        end_time = current_time + 300
        print(f"\n⚡ Creating Quick Demo Election...")
        print(f"   Starts in: 10 seconds")
        print(f"   Ends in: 5 minutes")
    else:
        # Standard: starts in 1 minute, ends in 1 hour
        start_time = current_time + 60
        end_time = current_time + 3600
        print(f"\n📅 Creating Standard Election...")
        print(f"   Starts in: 1 minute")
        print(f"   Ends in: 1 hour")

    print(f"   Start time (UNIX): {start_time}")
    print(f"   End time (UNIX): {end_time}")

    # Call create_election method
    result = app_client.call(
        "create_election",
        start_time=start_time,
        end_time=end_time,
    )

    print(f"\n✅ Election created successfully!")
    print(f"   Transaction ID: {result.tx_id}")


def main() -> None:
    """Main deployment function."""
    parser = argparse.ArgumentParser(
        description="Deploy VeriVote Smart Contract to Algorand Testnet"
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Create a quick demo election (5 min duration)",
    )
    parser.add_argument(
        "--standard",
        action="store_true",
        help="Create a standard election (1 hour duration)",
    )
    args = parser.parse_args()

    print("=" * 70)
    print("VeriVote Smart Contract Deployment")
    print("=" * 70)

    # Setup clients
    algod_client = get_algod_client()
    creator_account = get_account(algod_client, "DEPLOYER")

    # Load app spec
    app_spec = load_app_spec()

    # Deploy contract
    app_id = deploy_contract(algod_client, creator_account, app_spec)

    # Get app address from the client
    from algosdk.logic import get_application_address

    app_address = get_application_address(app_id)

    # Fund contract with minimum balance (0.1 ALGO for safety)
    fund_contract(algod_client, creator_account, app_address, 100_000)

    # Create election if requested
    if args.demo or args.standard:
        create_demo_election(
            algod_client,
            creator_account,
            app_spec,
            app_id,
            is_quick_demo=args.demo,
        )

    # Save app ID to env file template
    print(f"\n📝 Update your .env file with:")
    print(f"   VITE_VOTING_APP_ID={app_id}")

    print("\n" + "=" * 70)
    print("🎉 Deployment Complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
