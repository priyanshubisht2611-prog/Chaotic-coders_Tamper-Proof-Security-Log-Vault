# Chaotic-coders: Tamper-Proof Security Log Vault (Sentinel Vault)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg)](https://soliditylang.org/)
[![Vitest](https://img.shields.io/badge/Tests-72%2F72%20Passing-brightgreen.svg)](https://vitest.dev/)

An enterprise-grade, cryptographically verifiable security log vault designed to detect, highlight, and audit tamper events in real-time across immutable time-windowed logs with blockchain anchoring and AI-driven incident analysis.

---

## 🏛️ System Architecture

```
Chaotic-coders_Tamper-Proof-Security-Log-Vault/
├── backend/               # Python Security & Cryptographic Verification API
│   ├── templates/         # Dashboard UI HTML templates
│   ├── tests/             # Pytest automated validation test suites
│   ├── api_auth.py        # API key authentication & role-based access control
│   ├── audit_trail.py     # Append-only cryptographic audit logging
│   ├── behavior_scoring.py# Anomaly detection & threat behavior scoring
│   ├── cloud_db_sync.py   # Cloud SQLite / Firestore synchronization
│   ├── dashboard_app.py   # Flask REST API backend & WebSocket streamer
│   ├── dual_custody.py    # Multi-signature two-man authorization engine
│   ├── hash_windows.py    # 1-hour time window hashing & integrity checks
│   ├── live_demo.py       # Interactive end-to-end attack simulation script
│   ├── log_generator.py   # Mock security audit log stream generator
│   ├── ollama_explainer.py# Local AI forensic incident explainer (Ollama / Qwen)
│   ├── requirements.txt   # Backend Python dependencies
│   ├── start_tunnel.py    # Cloudflare tunnel auto-configuration helper
│   ├── verification_core.py# Core SHA-256 cryptographic verification engine
│   └── verify.py          # CLI cryptographic log verification tool
├── blockchain/            # Web3 Smart Contracts & On-Chain Anchoring
│   ├── contracts/         # LogVault.sol immutable root anchor contract
│   ├── anchor_to_chain.py # Anchors Merkle root hashes to blockchain
│   ├── deploy.py          # On-chain contract deployment script
│   ├── hardhat.config.ts  # Hardhat network configuration
│   ├── package.json       # Web3 dependencies
│   ├── tsconfig.json      # Hardhat TypeScript configuration
│   └── verify_onchain.py  # On-chain proof verification against contract
├── docs/                  # System Specifications & Audit Reports
│   ├── ARCHITECTURE.md    # Comprehensive system architectural specs
│   └── TEST_REPORT.md     # Cryptographic verification & forensic test report
├── frontend/              # Cyberpunk React 18 + TypeScript Dashboard
│   ├── public/            # Static media, video assets & service worker
│   ├── src/               # Application source code, stores, and components
│   ├── package.json       # Frontend scripts and dependencies
│   ├── tsconfig.json      # TypeScript compiler configuration
│   └── vite.config.ts     # Vite bundler configuration
├── .gitignore             # Comprehensive security and cache ignore rules
├── LICENSE                # MIT License
└── README.md              # Project showcase and system guide
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

## ⚡ Quickstart Guide

### 1. Backend REST API

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

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

### 3. Verification & Testing

```bash
# Run backend test suite
pytest backend/tests/test_backend.py -v

# Run frontend tests (72 unit and integration tests)
cd frontend
npm test

# Run CLI log verification
python backend/verify.py
```

---

## 📖 System Documentation

- [Architecture & Data Flow Specifications](docs/ARCHITECTURE.md)
- [Cryptographic Test & Verification Report](docs/TEST_REPORT.md)

---

## 👥 Authors & Team
- **Chaotic Coders**
