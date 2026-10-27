# Chaotic-coders: Tamper-Proof Security Log Vault

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Tests-72%2F72%20Passing-brightgreen.svg)](https://vitest.dev/)

An enterprise-grade, cryptographically verifiable security log vault designed to detect, highlight, and audit tamper events in real-time across immutable time-windowed logs.

---

## 🏛️ Repository Structure

```
Chaotic-coders_Tamper-Proof-Security-Log-Vault/
├── frontend/              # Interactive React + TypeScript Security Dashboard
│   ├── public/            # Static media and cyberpunk background assets
│   ├── src/               # Application source code, stores, and components
│   ├── package.json       # Frontend scripts and dependencies
│   ├── tsconfig.json      # TypeScript compiler configuration
│   ├── vite.config.ts     # Vite bundler configuration
│   └── README.md          # Detailed frontend documentation and architecture
├── .gitignore             # Root repository gitignore
└── README.md              # Project overview and system guide
```

---

## 🛡️ Core Capabilities

1. **Tamper-Evident Chronological Auditing**:
   - Organizes logs into strict 1-hour time windows anchored by cryptographic checkpoints.
   - Detects discrepancies between the anchored root hash and recalculated stream hash instantly.

2. **Automated & Interactive Forensic Scans**:
   - Cyber laser beam verification scanning sequential intervals with live status streaming.
   - Deep inspection drawer revealing raw records, payload details, and diffs for tampered or deleted intervals.

3. **Attack Simulation Engine**:
   - In-app adversary simulation triggering realistic state mutations (hash alterations & window deletions).
   - Cyber glitch overlays with audio-visual feedback and real-time incident event logging.

4. **Cryptographic Proof Export**:
   - One-click export of structured JSON audit manifests containing complete interval verification signatures.

---

## ⚡ Getting Started (Frontend)

To run the frontend security dashboard locally:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

### Running Tests & Quality Verification

```bash
cd frontend

# Run unit and integration tests (72 tests)
npm test

# Build for production
npm run build

# Lint code quality
npm run lint
```

---

## 👥 Authors & Team
- **Chaotic Coders**
