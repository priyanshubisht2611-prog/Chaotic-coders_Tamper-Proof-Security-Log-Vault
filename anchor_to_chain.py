import json
import os
from web3 import Web3

RPC_URL = "http://127.0.0.1:8545"
ARTIFACT_PATH = os.path.join("blockchain", "artifacts", "contracts", "LogVault.sol", "LogVault.json")
ADDRESS_PATH = os.path.join("blockchain", "contract_address.txt")
CHAIN_FILE = "hash_chain.json"

def main():
    w3 = Web3(Web3.HTTPProvider(RPC_URL))

    if not w3.is_connected():
        print("ERROR: Could not connect to local blockchain at " + RPC_URL)
        print("Make sure 'npx hardhat node' is running in another terminal.")
        return

    if not os.path.exists(ADDRESS_PATH):
        print("ERROR: contract_address.txt not found. Run deploy.py first.")
        return

    with open(ADDRESS_PATH, "r") as f:
        contract_address = f.read().strip()

    with open(ARTIFACT_PATH, "r") as f:
        artifact = json.load(f)

    abi = artifact["abi"]
    contract = w3.eth.contract(address=contract_address, abi=abi)

    sender = w3.eth.accounts[0]

    with open(CHAIN_FILE, "r") as f:
        chain = json.load(f)

    newly_anchored = 0
    already_anchored = 0

    for entry in chain:
        window_id = entry["window_id"]

        # Ask the blockchain itself whether this window exists, instead of
        # trusting a local tracking file (which can go stale, e.g. if the
        # Hardhat node or contract was ever redeployed and the file wasn't
        # reset, or vice versa).
        existing = contract.functions.getWindow(window_id).call()
        exists_onchain = existing[4]

        if exists_onchain:
            already_anchored += 1
            continue

        window_hash_bytes = bytes.fromhex(entry["window_hash"])
        previous_hash_bytes = bytes.fromhex(entry["previous_hash"])
        num_lines = entry["num_lines"]

        try:
            tx_hash = contract.functions.anchorWindow(
                window_id,
                window_hash_bytes,
                previous_hash_bytes,
                num_lines,
            ).transact({"from": sender})

            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

            print(f"Window {window_id}: anchored on-chain (tx {receipt.transactionHash.hex()[:16]}...)")
            newly_anchored += 1
        except Exception as e:
            print(f"Window {window_id}: FAILED to anchor — {e}")

    print()
    print(f"Done. {newly_anchored} window(s) newly anchored, {already_anchored} were already on-chain.")

if __name__ == "__main__":
    main()
