# ChallengeEscrow Project Plan

## Product Direction
Build a **mobile-first web app** for friendly 1v1 wagers using **USDC on Base**.

This is positioned as **social escrow for friend challenges**, not a public sportsbook.

## Core MVP
- Connect wallet
- Create challenge wager
- Invite friend via shareable link
- Opponent accepts and deposits matching stake
- Both participants confirm the result
- If both agree, escrow releases funds to winner
- If both mark tie/cancel, refund both sides
- If participants disagree or one disappears, enter dispute/timeout flow

## MVP Constraints
- 1v1 wagers only
- Fixed token: USDC on Base
- No public odds / no stranger matching
- No automated oracle in v1
- Mobile-first UX

## Technical Stack
### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- wagmi + viem
- RainbowKit (wallet connection)

### Smart Contracts
- Solidity
- Hardhat
- OpenZeppelin

### Testing
- Contract unit tests
- Frontend component/smoke tests
- End-to-end happy-path testing where feasible

## Contract Design
### Wager lifecycle
1. `Created`
2. `Accepted`
3. `AwaitingSettlement`
4. `Resolved`
5. `Refunded`
6. `Disputed`

### Main actions
- createWager()
- acceptWager()
- confirmWinner()
- confirmTie()
- claimTimeoutRefund() / escalateDispute()

### Rules
- Creator posts stake on creation
- Opponent must post equal stake on acceptance
- Settlement only if both sides agree
- Timeout enables safe unwind path

## Frontend Pages
- Landing page
- Create wager flow
- Wager detail page
- Accept wager page
- My wagers dashboard

## Deliverables
1. Project scaffold
2. Contract implementation
3. Contract tests
4. Frontend implementation
5. Frontend tests
6. README + local run guide

## Immediate Implementation Plan
### Phase 1
- Scaffold app + contracts workspace
- Implement contract data model and core functions
- Write/execute contract tests

### Phase 2
- Build mobile-first frontend flows
- Integrate wallet connection and contract calls
- Add validation and status UI

### Phase 3
- End-to-end verification
- Polish docs
- Prepare Git repo state

## Definition of Done
- App runs locally
- Wager happy path works in tests
- Dispute/timeout/refund logic tested
- Mobile-first UI usable on small screens
- README documents setup and workflow
