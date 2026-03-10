# ChallengeEscrow

Mobile-first friend wagers with wallet-based escrow.

This MVP uses:
- **Next.js + TypeScript + Tailwind** for the web app
- **wagmi + viem + RainbowKit** for wallet connection and contract writes
- **Hardhat + Solidity + OpenZeppelin** for contracts and tests

## MVP Features

### Smart contract flow
- Create a 1v1 wager with a fixed ERC-20 stake
- Opponent accepts by depositing the matching amount
- Mutual winner confirmation pays out the full pot
- Mutual tie confirmation refunds both sides
- Conflicting votes move the wager into dispute
- Timeout refund path for unaccepted or stalled wagers
- Explicit dispute escalation after settlement timeout

### Frontend flow
- Mobile-first landing page and dashboard shell
- Wallet connect via RainbowKit
- Create wager form wired to `createWager`
- Action panel for accept / confirm winner / tie / timeout refund / dispute
- Sample dashboard cards to demonstrate wager states

## Project Structure

```text
app/                  Next.js app router pages
components/           UI + wallet-connected action components
contracts/            Solidity contracts
lib/                  wagmi config, ABI, sample data helpers
test/contracts/       Hardhat contract tests
test/frontend/        Vitest smoke tests
```

## Contracts

### `ChallengeEscrow.sol`
Main escrow contract for 1v1 friend challenges.

Key functions:
- `createWager(opponent, token, stake, responseWindow, title, details)`
- `acceptWager(wagerId)`
- `confirmWinner(wagerId, winner)`
- `confirmTie(wagerId)`
- `claimTimeoutRefund(wagerId)`
- `escalateDispute(wagerId)`

### `MockUSDC.sol`
Simple 6-decimal ERC-20 test token used by the contract test suite.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file:

```bash
cp .env.example .env.local
```

Set these values:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_CHALLENGE_ESCROW_ADDRESS=0xYourEscrowAddress
NEXT_PUBLIC_USDC_ADDRESS=0xYourUsdcAddress
BASE_SEPOLIA_RPC_URL=
PRIVATE_KEY=
```

Notes:
- The frontend builds without real deployed addresses, but transaction buttons need real values to work.
- If you leave the WalletConnect project ID as the demo placeholder, the app will still build, but WalletConnect/Reown will log 403 warnings during production build.

## Run the App

```bash
npm run dev
```

Open <http://localhost:3000>

## Contract Commands

Compile:

```bash
npm run compile:contracts
```

Run contract tests:

```bash
npm run test:contracts
```

## Frontend Tests

Run Vitest smoke tests:

```bash
npm test
```

## Verified Results

### Contract tests
- 8 passing
- Covers:
  - wager creation
  - acceptance
  - mutual winner settlement
  - tie refunds
  - conflicting-vote disputes
  - pre-accept timeout refunds
  - post-accept timeout refunds
  - unauthorized actor rejection

### Frontend tests
- 2 passing smoke tests
- Covers:
  - landing page render
  - wager card render

### Production build
- `npm run build` passes
- Build currently emits non-blocking warnings from wallet dependencies and a 403 warning if the WalletConnect project ID is left as the demo placeholder

## Development Notes

- The current frontend is an MVP shell with real contract write hooks and mock dashboard data.
- For a fuller v2, the next obvious steps would be:
  - read live wager state from chain
  - generate/share invite links per wager
  - add approval flow for USDC before `createWager` / `acceptWager`
  - add dedicated detail pages per wager
  - add deploy scripts for Base Sepolia / Base mainnet
