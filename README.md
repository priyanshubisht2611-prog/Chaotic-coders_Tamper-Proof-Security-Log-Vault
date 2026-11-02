<!-- Header -->
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=Sentinel%20Vault&fontSize=55&fontAlignY=38&fontAlign=50&desc=Tamper-Proof%20Security%20Log%20Vault%20%E2%80%A2%20Blockchain%20%E2%80%A2%20AI%20Forensics&descAlignY=58&descAlign=50&animation=fadeIn" width="100%" alt="Sentinel Vault Banner" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white" />
  <img src="https://img.shields.io/badge/Tests-72%2F72%20Passing-brightgreen?style=for-the-badge&logo=vitest&logoColor=white" />
</p>

<p align="center">
  <b>An enterprise-grade, cryptographically verifiable security log vault designed to detect, highlight, and audit tamper events in real-time — backed by SHA-256 hash chains, Ethereum smart contracts, dual-custody authorization, and AI-driven forensic analysis.</b>
</p>

---

## ✨ Core Capabilities

<table>
  <tr>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/nolan/64/lock.png" width="48" /><br />
      <b>Cryptographic Hash Chain</b><br />
      <sub>Each 1-hour log window is SHA-256 chained to the previous — silent tampering is mathematically detectable</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/nolan/64/blockchain-technology.png" width="48" /><br />
      <b>Blockchain Anchoring</b><br />
      <sub>Periodic Merkle roots anchored on-chain via <code>LogVault.sol</code> for independently verifiable, permanent proof</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/nolan/64/two-factor-authentication.png" width="48" /><br />
      <b>Dual-Custody Auth</b><br />
      <sub>Two independent principals must approve before any sensitive vault operation executes</sub>
    </td>
    <td align="center" width="25%">
      <img src="https://img.icons8.com/nolan/64/artificial-intelligence.png" width="48" /><br />
      <b>AI Threat Scoring</b><br />
      <sub>Real-time behavioral anomaly scoring + local Ollama/Qwen LLM forensic incident explanations</sub>
    </td>
  </tr>
</table>

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SENTINEL VAULT SYSTEM                           │
├────────────────┬──────────────────────────┬────────────────────────────┤
│  LOG SOURCES   │    CRYPTOGRAPHIC CORE    │       BLOCKCHAIN           │
│                │                          │                            │
│ ┌────────────┐ │ ┌──────────────────────┐ │ ┌────────────────────────┐ │
│ │log_gen.py  │ │ │   hash_windows.py    │ │ │    LogVault.sol        │ │
│ │(Security   │►│ │  SHA-256 time-window │►│ │  (Hardhat/EVM)         │ │
│ │ Events)    │ │ │  chained hashing     │ │ │  anchorWindow()        │ │
│ └────────────┘ │ └──────────────────────┘ │ └────────────────────────┘ │
│                │           │              │            │               │
│                │           ▼              │            ▼               │
│                │ ┌──────────────────────┐ │ ┌────────────────────────┐ │
│                │ │ verification_core.py │ │ │  anchor_to_chain.py    │ │
│                │ │  verify() / tamper   │ │ │  verify_onchain.py     │ │
│                │ │  detection engine    │ │ └────────────────────────┘ │
│                │ └──────────────────────┘ │                            │
├────────────────┴──────────────────────────┴────────────────────────────┤
│                         BACKEND REST API (Flask)                        │
│   dashboard_app.py  •  api_auth.py  •  cloud_db_sync.py               │
│   dual_custody.py   •  behavior_scoring.py  •  ollama_explainer.py     │
├─────────────────────────────────────────────────────────────────────────┤
│              CYBERPUNK REACT 18 + TYPESCRIPT DASHBOARD                  │
│   Live hash-chain timeline  •  Attack simulator  •  Push notifications  │
│   Forensic inspection drawer  •  Cryptographic proof JSON export        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
Chaotic-coders_Tamper-Proof-Security-Log-Vault/
├── backend/                   # 🐍 Python Security & Cryptographic Verification API
│   ├── templates/             #    Dashboard UI HTML templates
│   ├── tests/                 #    Pytest automated validation test suites
│   ├── api_auth.py            #    API key authentication & role-based access control
│   ├── audit_trail.py         #    Append-only cryptographic audit logging
│   ├── behavior_scoring.py    #    Anomaly detection & threat behavior scoring engine
│   ├── cloud_db_sync.py       #    Cloud SQLite / Firestore synchronization
│   ├── dashboard_app.py       #    Flask REST API backend & SSE/WebSocket streamer
│   ├── dual_custody.py        #    Multi-signature two-man authorization engine
│   ├── hash_windows.py        #    1-hour time window hashing & integrity checks
│   ├── live_demo.py           #    Interactive end-to-end attack simulation script
│   ├── log_generator.py       #    Mock security audit log stream generator
│   ├── ollama_explainer.py    #    Local AI forensic incident explainer (Ollama/Qwen)
│   ├── requirements.txt       #    Backend Python dependencies
│   ├── start_tunnel.py        #    Cloudflare tunnel auto-configuration helper
│   ├── verification_core.py   #    Core SHA-256 cryptographic verification engine
│   └── verify.py              #    CLI cryptographic log verification tool
│
├── blockchain/                # ⛓️  Web3 Smart Contracts & On-Chain Anchoring
│   ├── contracts/             #    LogVault.sol — immutable root anchor contract
│   ├── anchor_to_chain.py     #    Anchors Merkle root hashes to blockchain
│   ├── deploy.py              #    On-chain contract deployment script
│   ├── hardhat.config.ts      #    Hardhat network configuration
│   ├── package.json           #    Web3 / Hardhat dependencies
│   └── verify_onchain.py      #    On-chain proof verification against contract
│
├── docs/                      # 📖 System Specifications & Audit Reports
│   ├── ARCHITECTURE.md        #    Comprehensive system architectural specs
│   └── TEST_REPORT.md         #    Cryptographic verification & forensic test report
│
├── frontend/                  # ⚛️  Cyberpunk React 18 + TypeScript Dashboard
│   ├── public/                #    Static assets, video backgrounds & FCM service worker
│   └── src/
│       ├── features/          #    attack/ • hero/ • notifications/ • timeline/ • verification/
│       ├── services/          #    apiClient • apiLogRepository • firebase • alarm
│       ├── store/             #    useVaultStore.ts (Zustand global state)
│       └── types/             #    log.ts TypeScript definitions
│
├── .gitignore                 # 🔒 Security-hardened ignore rules
├── LICENSE                    # MIT License
└── README.md
```

---

## ⚡ Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) [Ollama](https://ollama.ai) with `qwen2.5:7b-instruct` for AI explanations
- (Optional) Hardhat CLI for blockchain deployment

### 1. Backend API

```bash
# Clone the repository
git clone https://github.com/priyanshubisht2611-prog/Chaotic-coders_Tamper-Proof-Security-Log-Vault.git
cd Chaotic-coders_Tamper-Proof-Security-Log-Vault

# Install Python dependencies
cd backend
pip install -r requirements.txt

# Start the Flask backend (port 5000)
python dashboard_app.py
```

### 2. Frontend Dashboard

```bash
# In a new terminal, from the repo root
cd frontend
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser. 🚀

### 3. Blockchain (Optional)

```bash
cd blockchain
npm install

# Start local Hardhat node
npx hardhat node

# Deploy LogVault contract
python deploy.py

# Anchor current log window hashes on-chain
python anchor_to_chain.py

# Verify on-chain integrity
python verify_onchain.py
```

---

## 🧪 Testing & Verification

```bash
# Backend: 40+ cryptographic & behavioral tests
pytest backend/tests/test_backend.py -v

# Frontend: 72 unit & integration tests (Vitest)
cd frontend
npm test

# CLI tamper detection
python backend/verify.py
```

---

## 🔐 Security Design Decisions

| Concern | Approach |
|---|---|
| **Log Integrity** | SHA-256 hash chain — each window includes the previous hash, making any silent mutation cascade-detectable |
| **On-Chain Permanence** | `LogVault.sol` rejects re-anchoring an existing `windowId`, guaranteeing a window's first-written hash is immutable |
| **Secrets Management** | All credentials (`firebase-service-account.json`, `api_keys.json`, `.env.local`) are `.gitignore`d and never committed |
| **API Security** | HMAC-based API key validation with role-based endpoint scoping (`read`, `write`, `admin`) |
| **Dual Custody** | Sensitive operations require two distinct principal approvals within a configurable time window |

---

## 🛠️ Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white" />
  <img src="https://img.shields.io/badge/Hardhat-FFF100?style=for-the-badge&logo=hardhat&logoColor=black" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Ollama_Qwen_2.5-333333?style=for-the-badge&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" />
  <img src="https://img.shields.io/badge/Pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white" />
  <img src="https://img.shields.io/badge/Zustand-000000?style=for-the-badge&logoColor=white" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" />
</p>

---

## 📖 Documentation

- [System Architecture & Data Flow](docs/ARCHITECTURE.md)
- [Cryptographic Test & Verification Report](docs/TEST_REPORT.md)

---

<!-- Footer -->
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=120&section=footer" width="100%" alt="Footer" />
</p>

<p align="center">
  <i>Built with ❤️ by <b><a href="https://github.com/priyanshubisht2611-prog">Chaotic Coders</a></b> — Hackathon Project 🏆</i>
</p>
