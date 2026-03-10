import { parseUnits } from 'viem';

export const challengeEscrowAbi = [
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

export const usdcDecimals = 6;
export const defaultStake = '25';

export function toUsdcAmount(value: string) {
  return parseUnits(value || '0', usdcDecimals);
}

export const contractAddresses = {
  escrow: process.env.NEXT_PUBLIC_CHALLENGE_ESCROW_ADDRESS as `0x${string}` | undefined,
  usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined,
};
