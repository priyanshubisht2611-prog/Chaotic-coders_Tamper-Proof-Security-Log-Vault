# Sentinel Vault - Frontend Application

> **Production-Grade Tamper-Proof Security Log Auditing & Forensic Ledger Interface**

The **Sentinel Vault** frontend provides a cyberpunk-themed, real-time security operations interface for auditing immutable log streams. It allows security analysts and auditors to trace cryptographic hash checkpoints, execute laser scan integrity verifications, simulate adversary tampering attacks, inspect low-level record payloads, and export digitally signed audit manifests.

---

## 🚀 Key Features

- **Chronological 1-Hour Interval Timeline**: 12 discrete audit windows representing hourly checkpoints with status indicators (`INTACT`, `TAMPERED`, `MISSING`, `VERIFYING`).
- **Cryptographic Traceability**: Instant diff between anchored checkpoint root hashes and recomputed stream hashes to highlight exact payload alterations.
- **Cyber Laser Scan Beam**: Real-time canvas laser scan animation traversing audit intervals sequentially during integrity audits.
- **Adversary Attack Simulation**: Interactive cyberattack sequence with villain glitch video overlay, audio-visual feedback, and automatic anomaly flags.
- **Deep Forensic Drawer**: 3-column arrow-key navigable drawer detailing interval metadata, record timestamps, payload payloads, and discrepancy root causes.
- **Audit Proof Manifest Export**: Generates and downloads structured cryptographic ledger JSON proofs for compliance and offline verification.
- **Production Resilience**: Wrapped in a custom `ErrorBoundary` with fallback recovery mechanisms and smooth responsive layout.

---

## 🏗️ Architecture & Directory Layout

The application adheres to a modular, feature-driven architecture:

```
frontend/
├── public/
│   └── videos/                     # Cyberpunk visual assets & poster frames
│       ├── hero.mp4
│       ├── hero-poster.jpg
│       ├── villain.mp4
│       └── villain-poster.jpg
├── src/
│   ├── app/                        # Application bootstrap & error boundary
│   │   ├── App.tsx
│   │   └── ErrorBoundary.tsx
│   ├── data/                       # Initial ledger data & mock audit intervals
│   │   └── mockLogs.ts
│   ├── features/                   # Self-contained business domains
│   │   ├── attack/                 # Attack state machine & glitch overlay
│   │   │   ├── attackMachine.ts
│   │   │   ├── attackMachine.test.ts
│   │   │   ├── attackFlow.test.ts
│   │   │   ├── AttackOverlay.tsx
│   │   │   └── AttackToast.tsx
│   │   ├── hero/                   # Terminal header & live status indicators
│   │   │   └── Hero.tsx
│   │   ├── timeline/               # 12-hour timeline, window grid & forensic drawer
│   │   │   ├── SummaryCounters.tsx
│   │   │   ├── TimeAxis.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── TimelineSkeleton.tsx
│   │   │   ├── WindowCard.tsx
│   │   │   ├── WindowDetailsPanel.tsx
│   │   │   ├── WindowGrid.tsx
│   │   │   ├── timeline.test.ts
│   │   │   └── windowDetailsPanel.test.ts
│   │   └── verification/           # Control bar, laser scanner, and audit feed
│   │       ├── ControlBar.tsx
│   │       ├── EventFeed.tsx
│   │       ├── ScanBeam.tsx
│   │       ├── SimulationConfirmModal.tsx
│   │       ├── SpiderWebCrack.tsx
│   │       ├── enhancedFeatures.test.ts
│   │       └── verificationFlow.test.ts
│   ├── services/                   # Clean repository interface & mock client
│   │   ├── logRepository.ts
│   │   └── mockLogRepository.ts
│   ├── shared/                     # Shared UI atoms, themes & configurations
│   │   ├── config/videoConfig.ts
│   │   └── ui/
│   │       ├── BackgroundVideo.tsx
│   │       ├── Button.tsx
│   │       ├── CursorFollower.tsx
│   │       └── Toast.tsx
│   ├── store/                      # Zustand global state management
│   │   ├── useVaultStore.ts
│   │   └── useVaultStore.test.ts
│   ├── types/                      # Domain interfaces & TypeScript types
│   │   └── log.ts
│   ├── index.css                   # Tailwind CSS styling & animations
│   └── main.tsx                    # React DOM entrypoint
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠️ Technology Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite 5](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) + Custom Keyframes & Glassmorphism
- **Animations**: [Framer Motion 11](https://www.framer.com/motion/)
- **State Management**: [Zustand 4](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest 2](https://vitest.dev/)

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Test Suite
```bash
npm test
```
Executes all 72 unit and integration tests across 7 test suites.

### 4. Build for Production
```bash
npm run build
```
Type checks via `tsc -b` and produces an optimized production bundle inside `dist/`.

### 5. Lint & Typecheck
```bash
npm run lint
```
