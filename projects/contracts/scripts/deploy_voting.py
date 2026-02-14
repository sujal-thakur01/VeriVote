#!/usr/bin/env python3
"""
Production Deployment Script for VeriVote Smart Contract
Fully compatible with ARC4 contracts.
"""

import argparse
import sys
import time
from pathlib import Path

from algokit_utils import (
    Account,
    ApplicationClient,
    ApplicationSpecification,
    get_account,
    get_algod_client,
)
from algosdk import transaction
from algosdk.logic import get_application_address
from algosdk.atomic_transaction_composer import AccountTransactionSigner
from algosdk.v2client.algod import AlgodClient


# ============================================================
# NETWORK CLIENT
# ============================================================

def get_testnet_client() -> AlgodClient:
    return AlgodClient(
        algod_token="",
        algod_address="https://testnet-api.algonode.cloud",
        headers={"User-Agent": "VeriVote"},
    )


# ============================================================
# LOAD SPEC
# ============================================================

def load_app_spec() -> ApplicationSpecification:
    spec_path = (
        Path(__file__).parent.parent
        / "smart_contracts"
        / "voting"
        / "VotingContract.arc32.json"
    )

    if not spec_path.exists():
        print(f"❌ App spec not found at {spec_path}")
        sys.exit(1)

    with open(spec_path) as f:
        spec_json = f.read()

    return ApplicationSpecification.from_json(spec_json)


# ============================================================
# DEPLOY
# ============================================================

def deploy_contract(algod_client, creator_account, app_spec):

    print("\n🚀 Deploying VotingContract to Algorand TestNet...")
    print(f"   Creator: {creator_account.address}")

    app_client = ApplicationClient(
        algod_client=algod_client,
        app_spec=app_spec,
        signer=AccountTransactionSigner(creator_account.private_key),
        sender=creator_account.address,
    )

    result = app_client.create()

    tx_id = result.tx_id
    confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)

    app_id = confirmed_txn["application-index"]
    app_address = get_application_address(app_id)

    print("\n✅ Contract deployed successfully!")
    print(f"   App ID: {app_id}")
    print(f"   App Address: {app_address}")
    print(f"   AlgoExplorer: https://testnet.algoexplorer.io/application/{app_id}")

    return app_id


# ============================================================
# FUND CONTRACT
# ============================================================

def fund_contract(algod_client, creator_account, app_address):

    print("\n💰 Funding contract with 0.1 ALGO...")

    params = algod_client.suggested_params()

    txn = transaction.PaymentTxn(
        sender=creator_account.address,
        sp=params,
        receiver=app_address,
        amt=100_000,
    )

    signed_txn = txn.sign(creator_account.private_key)
    tx_id = algod_client.send_transaction(signed_txn)

    transaction.wait_for_confirmation(algod_client, tx_id, 4)

    print("   ✅ Funded contract")


# ============================================================
# INITIALIZE ELECTION (6-HOUR WINDOW FOR DEMO)
# ============================================================

def initialize_election(algod_client, creator_account, app_spec, app_id):

    print("\n🗳️ Initializing election...")

    from algosdk.atomic_transaction_composer import AtomicTransactionComposer
    from algosdk.abi import Method
    from algosdk.transaction import OnComplete

    current_time = int(time.time())
    start_time = current_time - 60  # Started 60 seconds ago
    end_time = current_time + (6 * 3600)  # 6 hours from now

    print(f"   Start time: {start_time}")
    print(f"   End time: {end_time}")
    print(f"   Duration: 6 hours ({6 * 3600} seconds)")

    signer = AccountTransactionSigner(creator_account.private_key)

    atc = AtomicTransactionComposer()

    # Define ABI method manually
    method = Method.from_signature(
        "create_election(uint64,uint64)string"
    )

    params = algod_client.suggested_params()

    atc.add_method_call(
        app_id=app_id,
        method=method,
        sender=creator_account.address,
        sp=params,
        signer=signer,
        method_args=[start_time, end_time],
        on_complete=OnComplete.NoOpOC,
    )

    result = atc.execute(algod_client, 4)

    print("   ✅ Election initialized successfully")
    print(f"   Tx ID: {result.tx_ids[0]}")




# ============================================================
# MAIN
# ============================================================

def main():

    parser = argparse.ArgumentParser()
    parser.add_argument("--network", choices=["localnet", "testnet"], default="testnet")
    args = parser.parse_args()

    print("=" * 70)
    print("VeriVote Smart Contract Deployment")
    print(f"Network: {args.network.upper()}")
    print("=" * 70)

    if args.network == "testnet":
        algod_client = get_testnet_client()
        creator_account = get_account(algod_client, "DEPLOYER")
    else:
        algod_client = get_algod_client()
        creator_account = get_account(algod_client, "DEPLOYER")

    app_spec = load_app_spec()

    app_id = deploy_contract(algod_client, creator_account, app_spec)

    app_address = get_application_address(app_id)

    fund_contract(algod_client, creator_account, app_address)

    initialize_election(algod_client, creator_account, app_spec, app_id)

    print(f"\n📝 Update frontend .env:")
    print(f"VITE_VOTING_APP_ID={app_id}")

    print("\n🎉 Deployment Complete!")
    print("   Election is LIVE and runs for 6 hours.")
    print("   No time window issues during demo!")


if __name__ == "__main__":
    main()
