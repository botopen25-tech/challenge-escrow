# ChallengeEscrow Hybrid V2 Plan

## Why Hybrid

The fully on-chain MVP works, but it forces too many transactions for low-dollar social wagers:

1. approve token
2. create wager
3. approve token
4. accept wager
5. settle / refund / dispute

That makes $2-$5 wagers feel silly and adds wallet fatigue.

Hybrid V2 keeps the money movement on-chain where trust matters, but moves coordination off-chain.

## Product Direction

Position ChallengeEscrow as:
- social challenge escrow
- accountability wagers
- friend-to-friend stakes

Best initial target:
- $10 to $100 wagers
- $5 as an absolute floor only if UX is very smooth

## Hybrid Architecture

### Off-chain responsibilities
- challenge draft creation
- invite links
- challenge metadata
- participant role/status tracking
- proof notes / attachments later
- activity feed / notifications later
- pre-settlement agreement flow

### On-chain responsibilities
- deposit lock
- accept / match deposit
- final settlement
- refund / timeout fallback
- dispute state when needed

## V2 User Flow

### Create
1. creator opens app
2. creator drafts challenge off-chain
3. app creates a challenge record with `draft` or `pending_funding`
4. creator funds escrow on-chain
5. backend updates record with tx hash and escrow id

### Accept
1. opponent opens invite link
2. opponent sees challenge details off-chain instantly
3. opponent funds / accepts on-chain
4. backend marks challenge active

### Settle
1. both sides review challenge in app
2. users agree on result off-chain in UI
3. final confirmation writes on-chain only when needed

## MVP V2 Goals

### Must-have
- off-chain challenge records
- simple API routes
- clear challenge lifecycle state machine
- separate `challenge` record from `on-chain wager`
- room for invite links and mobile-first UX

### Nice-to-have
- WalletConnect/mobile browser fallback
- transaction history / explorer links
- notifications
- proof attachments

## Recommended Data Model

### Challenge record
- id
- slug
- title
- details
- stakeAmount
- tokenSymbol
- chainId
- creatorAddress
- opponentAddress
- status
- responseWindowHours
- createdAt
- updatedAt
- escrowContractAddress
- onchainWagerId
- createTxHash
- acceptTxHash
- settleTxHash

### Suggested status enum
- draft
- pending_creator_funding
- pending_opponent
- active
- awaiting_settlement
- resolved
- refunded
- disputed
- expired

## Implementation Notes

Short-term storage can be file-based or in-memory for prototyping.
Real version should move to a database quickly.

## Current Recommendation

Keep the current smart contract as the settlement engine.
Build the product around off-chain coordination so the app feels fast and understandable.
