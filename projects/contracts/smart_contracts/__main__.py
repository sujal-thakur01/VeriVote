from pathlib import Path

from algokit_utils import AlgorandClient
from algosdk.v2client.algod import AlgodClient
from algosdk.v2client.indexer import IndexerClient

from smart_contracts.voting.contract import VotingContract


def main(
    algorand: AlgorandClient,
    algod_client: AlgodClient,
    indexer_client: IndexerClient,
    artifacts_dir: Path,
) -> None:
    """Main function for building contracts."""
    VotingContract(version=1).compile(
        algod_client=algod_client,
        project_root=artifacts_dir.parent.parent,
        with_sourcemaps=True,
        compilation_output_arc32_json=True,
        compilation_output_arc56_json=True,
    )
