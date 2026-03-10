export type WagerView = {
  id: number;
  title: string;
  details: string;
  stake: string;
  creator: string;
  opponent: string;
  creatorAddress?: `0x${string}`;
  opponentAddress?: `0x${string}`;
  creatorVote?: string;
  opponentVote?: string;
  myVote?: string;
  settlementState?: string;
  status: 'Created' | 'Accepted' | 'Resolved' | 'Refunded' | 'Disputed';
  deadline: string;
  outcomeHint: string;
};

export const sampleWagers: WagerView[] = [
  {
    id: 12,
    title: '10k weekend run',
    details: 'Who posts the faster Strava time by Sunday night.',
    stake: '$25 USDC',
    creator: '0x7A1...Fa2',
    opponent: '0x9B4...119',
    status: 'Accepted',
    deadline: '12h left to settle',
    outcomeHint: 'Both players need to confirm winner or tie.',
  },
  {
    id: 9,
    title: 'March Madness bracket',
    details: 'Best bracket score after the final game.',
    stake: '$50 USDC',
    creator: '0x7A1...Fa2',
    opponent: '0x3cc...8d0',
    status: 'Created',
    deadline: 'Waiting for friend to accept',
    outcomeHint: 'Share the link and wait for the matching deposit.',
  },
  {
    id: 4,
    title: 'Push-up challenge',
    details: 'Most clean reps in 2 minutes.',
    stake: '$15 USDC',
    creator: '0x7A1...Fa2',
    opponent: '0xAb9...2ed',
    status: 'Disputed',
    deadline: 'Timeout window is open',
    outcomeHint: 'Use dispute or timeout refund if nobody agrees.',
  },
];

export function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function statusLabel(status: number): WagerView['status'] {
  switch (status) {
    case 1:
      return 'Created';
    case 2:
      return 'Accepted';
    case 3:
      return 'Resolved';
    case 4:
      return 'Refunded';
    case 5:
      return 'Disputed';
    default:
      return 'Created';
  }
}

export function outcomeHintForStatus(status: WagerView['status']) {
  switch (status) {
    case 'Created':
      return 'Waiting for the opponent to approve tokens and accept.';
    case 'Accepted':
      return 'Submit your result once. The card should make it clear what happens next.';
    case 'Resolved':
      return 'Both players agreed on the winner and the escrow paid out.';
    case 'Refunded':
      return 'Funds were returned because the wager timed out or both sides marked a tie.';
    case 'Disputed':
      return 'Votes conflicted or a timeout dispute was escalated.';
  }
}
