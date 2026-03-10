export type HybridChallengeStatus =
  | 'draft'
  | 'pending_creator_funding'
  | 'pending_opponent'
  | 'active'
  | 'awaiting_settlement'
  | 'resolved'
  | 'refunded'
  | 'disputed'
  | 'expired';

export type HybridChallenge = {
  id: string;
  slug: string;
  title: string;
  details: string;
  stakeAmount: string;
  tokenSymbol: 'USDC';
  chainId: number;
  creatorAddress: `0x${string}`;
  opponentAddress?: `0x${string}`;
  status: HybridChallengeStatus;
  responseWindowHours: number;
  createdAt: string;
  updatedAt: string;
  escrowContractAddress?: `0x${string}`;
  onchainWagerId?: number;
  createTxHash?: `0x${string}`;
  acceptTxHash?: `0x${string}`;
  settleTxHash?: `0x${string}`;
};

export type CreateHybridChallengeInput = {
  title: string;
  details: string;
  stakeAmount: string;
  creatorAddress: `0x${string}`;
  opponentAddress?: `0x${string}`;
  responseWindowHours: number;
};
