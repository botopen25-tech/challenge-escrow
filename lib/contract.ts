import { erc20Abi, parseUnits } from 'viem';

export const challengeEscrowAbi = [
  {
    type: 'function',
    name: 'wagerCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getWager',
    stateMutability: 'view',
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'creator', type: 'address' },
          { name: 'opponent', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'stake', type: 'uint256' },
          { name: 'createdAt', type: 'uint64' },
          { name: 'acceptedAt', type: 'uint64' },
          { name: 'responseWindow', type: 'uint64' },
          { name: 'status', type: 'uint8' },
          { name: 'title', type: 'string' },
          { name: 'details', type: 'string' },
          { name: 'creatorWinnerVote', type: 'address' },
          { name: 'opponentWinnerVote', type: 'address' },
          { name: 'creatorTieVote', type: 'bool' },
          { name: 'opponentTieVote', type: 'bool' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'createWager',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'opponent', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'stake', type: 'uint256' },
      { name: 'responseWindow', type: 'uint64' },
      { name: 'title', type: 'string' },
      { name: 'details', type: 'string' },
    ],
    outputs: [{ name: 'wagerId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'acceptWager',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'confirmWinner',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'wagerId', type: 'uint256' },
      { name: 'winner', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'confirmTie',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claimTimeoutRefund',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'escalateDispute',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'wagerId', type: 'uint256' }],
    outputs: [],
  },
] as const;

export const usdcAbi = [
  ...erc20Abi,
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

export const usdcDecimals = 6;
export const defaultStake = '25';
export const supportedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 84532);

export function toUsdcAmount(value: string) {
  return parseUnits(value || '0', usdcDecimals);
}

export const contractAddresses = {
  escrow: process.env.NEXT_PUBLIC_CHALLENGE_ESCROW_ADDRESS as `0x${string}` | undefined,
  usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined,
};
