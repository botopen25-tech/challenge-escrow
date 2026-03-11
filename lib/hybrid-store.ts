import { randomUUID } from 'crypto';
import { CreateHybridChallengeInput, HybridChallenge, HybridResultChoice } from './hybrid-types';
import { supportedChainId, contractAddresses } from './contract';

const store = new Map<string, HybridChallenge>();

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'challenge';
}

export function listChallenges() {
  return Array.from(store.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getChallenge(id: string) {
  return store.get(id) ?? null;
}

export function createChallenge(input: CreateHybridChallengeInput) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const challenge: HybridChallenge = {
    id,
    slug: `${slugify(input.title)}-${id.slice(0, 8)}`,
    title: input.title,
    details: input.details,
    stakeAmount: input.stakeAmount,
    tokenSymbol: 'USDC',
    chainId: supportedChainId,
    creatorAddress: input.creatorAddress,
    opponentAddress: input.opponentAddress,
    status: 'pending_creator_funding',
    responseWindowHours: input.responseWindowHours,
    createdAt: now,
    updatedAt: now,
    escrowContractAddress: contractAddresses.escrow,
    resultAgreement: 'pending',
  };

  store.set(id, challenge);
  return challenge;
}

export function submitChallengeResult(id: string, account: `0x${string}`, choice: HybridResultChoice) {
  const challenge = store.get(id);
  if (!challenge) return { error: 'not_found' as const };

  if (account.toLowerCase() === challenge.creatorAddress.toLowerCase()) {
    challenge.creatorResultChoice = choice;
  } else if (challenge.opponentAddress && account.toLowerCase() === challenge.opponentAddress.toLowerCase()) {
    challenge.opponentResultChoice = choice;
  } else {
    return { error: 'unauthorized' as const };
  }

  if (challenge.creatorResultChoice && challenge.opponentResultChoice) {
    challenge.resultAgreement = challenge.creatorResultChoice === challenge.opponentResultChoice ? 'agreed' : 'conflict';
    challenge.status = challenge.resultAgreement === 'agreed' ? 'awaiting_settlement' : 'disputed';
  } else {
    challenge.resultAgreement = 'pending';
    challenge.status = 'active';
  }

  challenge.updatedAt = new Date().toISOString();
  store.set(id, challenge);
  return { challenge };
}
