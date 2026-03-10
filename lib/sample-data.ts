export type WagerView = {
  id: number;
  title: string;
  details: string;
  stake: string;
  creator: string;
  opponent: string;
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
