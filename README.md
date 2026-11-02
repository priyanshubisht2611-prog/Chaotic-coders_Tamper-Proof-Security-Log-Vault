# Chaotic-coders: Tamper-Proof Security Log Vault (Sentinel Vault)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg)](https://soliditylang.org/)
[![Vitest](https://img.shields.io/badge/Tests-72%2F72%20Passing-brightgreen.svg)](https://vitest.dev/)

An enterprise-grade, cryptographically verifiable security log vault designed to detect, highlight, and audit tamper events in real-time across immutable time-windowed logs with blockchain anchoring and AI-driven incident analysis.

---

## 🏛️ System Architecture & Repository Structure

```
Chaotic-coders_Tamper-Proof-Security-Log-Vault/
├── blockchain/            # Solidity smart contracts & Hardhat deployment
│   ├── contracts/         # LogVault.sol immutable root anchor contract
│   ├── hardhat.config.ts  # Hardhat network configuration
│   └── deploy.py          # On-chain contract deployment script
├── frontend/              # Interactive React + TypeScript Security Dashboard
│   ├── public/            # Static media, video assets & service worker
│   ├── src/               # Application source code, stores, and components
│   ├── package.json       # Frontend scripts and dependencies
│   ├── tsconfig.json      # TypeScript compiler configuration
│   └── vite.config.ts     # Vite bundler configuration
├── templates/             # Standalone dashboard HTML templates
├── tests/                 # Backend automated test suites
├── anchor_to_chain.py     # Web3 script anchoring Merkle root hashes to blockchain
├── api_auth.py            # API key authentication & role-based access control
├── audit_trail.py         # Append-only cryptographic audit logging
├── behavior_scoring.py    # Anomaly detection & threat behavior scoring
├── cloud_db_sync.py       # Cloud SQLite / Firestore synchronization
├── dashboard_app.py       # Flask REST API backend & WebSocket / SSE streamer
├── dual_custody.py        # Multi-signature two-man authorization engine
├── hash_windows.py        # 1-hour time window hashing & integrity checks
├── live_demo.py           # Interactive end-to-end attack simulation script
├── log_generator.py       # Mock security audit log stream generator
├── ollama_explainer.py    # Local AI forensic incident explainer (Ollama / Qwen)
├── start_tunnel.py        # Cloudflare tunnel auto-configuration helper
├── verification_core.py   # Core SHA-256 cryptographic verification engine
├── verify.py              # CLI cryptographic log verification tool
├── verify_onchain.py      # On-chain proof verification against smart contracts
├── ARCHITECTURE.md        # Comprehensive system architectural specifications
├── TEST_REPORT.md         # Cryptographic verification & forensic test report
└── README.md              # Project overview and system guide
```

---

## 🛡️ Core Capabilities

1. **Tamper-Evident Chronological Auditing**:
   - Organizes security logs into strict 1-hour time windows anchored by cryptographic checkpoints.
   - Computes deterministic SHA-256 Merkle root hashes over normalized log entries.
   - Instantly pinpoints modified, injected, or deleted records.

2. **Blockchain Immutability (On-Chain Anchoring)**:
   - Anchors periodic log window roots onto public/private EVM blockchains via `LogVault.sol`.
   - Independent verification via `verify_onchain.py` confirms that local records match on-chain immutable proofs.

3. **Dual Custody & Multi-Signature Approvals**:
   - Requires two distinct authorized security principals before sensitive operations (e.g. log archival or key rotation) can execute.

4. **AI-Driven Threat Scoring & Forensic Explanations**:
   - Analyzes anomalous log spikes and privilege escalations with `behavior_scoring.py`.
   - Generates natural language incident explanations via local LLMs (`ollama_explainer.py`).

5. **Automated & Interactive Forensic Scans (Frontend)**:
   - Cyber laser beam verification scanning sequential intervals with live status streaming.
   - Deep inspection drawer revealing raw records, payload details, and diffs for tampered or deleted intervals.
   - Full adversary simulation trigger with real-time push notifications (Firebase Cloud Messaging).

---

## ⚡ Getting Started

### 1. Backend REST API

```bash
# Install dependencies
pip install -r requirements_cloud.txt

# Run the Flask backend server (port 5000)
python dashboard_app.py
```

### 2. Frontend Security Dashboard

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server (port 3000)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Running Verification & Tests

```bash
# Run backend test suite
pytest tests/test_backend.py -v

# Run frontend tests (72 unit and integration tests)
cd frontend
npm test

# Run CLI log verification
python verify.py
```

---

## 📖 Detailed Specifications

- [System Architecture Guide](file:///./ARCHITECTURE.md)
- [Forensic Test & Verification Report](file:///./TEST_REPORT.md)

---

## 👥 Authors & Team
- **Chaotic Coders**
