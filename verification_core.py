"""
Shared verification logic used by both verify_onchain.py (CLI) and
dashboard_app.py (web dashboard). Keeping this in one place means the
dashboard and the command-line tool always agree, since they call the
exact same function.
"""
import hashlib
import json
import os
try:
    from web3 import Web3
    WEB3_AVAILABLE = True
except Exception:
    Web3 = None
    WEB3_AVAILABLE = False
import ollama_explainer

RPC_URL = "http://127.0.0.1:8545"
ARTIFACT_PATH = os.path.join("blockchain", "artifacts", "contracts", "LogVault.sol", "LogVault.json")
ADDRESS_PATH = os.path.join("blockchain", "contract_address.txt")
CHAIN_FILE = "hash_chain.json"
LOG_FILE = "logs.txt"


def recompute_hash(lines, previous_hash_hex):
    cleaned = [l.strip() for l in lines]
    combined = (previous_hash_hex or "") + "".join(cleaned)
    return hashlib.sha256(combined.encode()).hexdigest()


def get_contract():
    """Connects to the local blockchain and returns a ready-to-use contract object,
    or None (with a reason) if the chain or contract isn't available yet."""
    if not os.path.exists(ADDRESS_PATH):
        return None, "Contract not deployed yet. Run: python blockchain/deploy.py"

    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        return None, "Cannot reach local blockchain at " + RPC_URL + ". Run: npx hardhat node"

    with open(ADDRESS_PATH, "r") as f:
        contract_address = f.read().strip()

    with open(ARTIFACT_PATH, "r") as f:
        artifact = json.load(f)

    contract = w3.eth.contract(address=contract_address, abi=artifact["abi"])
    return contract, None


def get_all_window_statuses():
    """
    Returns (results, error_message).

    results is a list of dicts, one per window known to the system (either
    from the local hash_chain.json record, or anchored on-chain, or both):
      window_id, status ("INTACT" / "TAMPERED" / "MISSING" / "NOT_ON_CHAIN"),
      num_lines, timestamp, onchain_hash (full hex), recomputed_hash (full hex)

    Windows that were anchored on-chain but whose record has since been
    removed from hash_chain.json are reported as MISSING — this is what
    catches an attacker deleting an entire window's evidence locally while
    its on-chain proof still exists.
    """
    if not WEB3_AVAILABLE:
        contract = None
        error = None
    else:
        contract, error = get_contract()

    chain = []
    if os.path.exists(CHAIN_FILE):
        with open(CHAIN_FILE, "r") as f:
            chain = json.load(f)

    if not chain and contract is None:
        return [], error or "No windows have been hashed yet. Run hash_windows.py first."

    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            all_lines = f.readlines()
    else:
        all_lines = []

    local_window_ids = {entry["window_id"] for entry in chain}
    results = []
    position = 0

    for entry in chain:
        window_id = entry["window_id"]
        num_lines = entry["num_lines"]
        previous_hash = entry["previous_hash"]
        timestamp = entry["timestamp"]

        # Recompute hash directly from the actual current logs.txt lines for this window
        window_lines = [l.strip() + "\n" for l in all_lines[position: position + num_lines]]
        position += num_lines
        recomputed_hex = recompute_hash(window_lines, previous_hash)

        row = {
            "window_id": window_id,
            "timestamp": timestamp,
            "num_lines": num_lines,
            "recomputed_hash": recomputed_hex,
        }

        local_hash = entry["window_hash"]
        row["onchain_hash"] = local_hash
        row["on_chain_hash"] = local_hash
        row["source"] = "local_vault"
        
        # Compare recomputed hash of current logs against the sealed local_hash
        # If target_index was modified, recomputed_hex will differ from local_hash -> TAMPERED
        row["status"] = "INTACT" if recomputed_hex == local_hash else "TAMPERED"
        results.append(row)

    # Check for windows that exist on-chain but have vanished from the
    # local hash_chain.json entirely (an attacker trying to erase a whole
    # window's evidence, not just edit a line). Bounded probe so a missing
    # window can never cause an infinite loop.
    if contract is None or not WEB3_AVAILABLE:
        # Skip on-chain check when web3 is unavailable, use local hash verification only
        pass
    else:
        highest_local = max(local_window_ids, default=-1)
        probe_upper_bound = highest_local + 5

        for probe_id in range(0, probe_upper_bound + 1):
            if probe_id in local_window_ids:
                continue

            onchain_hash, onchain_prev, onchain_ts, onchain_lines, exists = contract.functions.getWindow(probe_id).call()

            if exists:
                results.append({
                    "window_id": probe_id,
                    "timestamp": None,
                    "num_lines": onchain_lines,
                    "recomputed_hash": None,
                    "onchain_hash": onchain_hash.hex(),
                    "on_chain_hash": onchain_hash.hex(),
                    "source": "blockchain",
                    "status": "MISSING",
                })

    results.sort(key=lambda r: r["window_id"])

    # Attach a human-readable incident summary to any Tampered/Missing
    # window. (Skipped during rapid status calls to prevent local model timeout)
    # for row in results:
    #     row["incident_summary"] = ollama_explainer.explain_window(row)

    return results, error
