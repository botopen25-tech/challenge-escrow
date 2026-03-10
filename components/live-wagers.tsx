'use client';

import { formatUnits } from 'viem';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { challengeEscrowAbi, contractAddresses, supportedChainId, usdcDecimals } from '@/lib/contract';
import { outcomeHintForStatus, shortenAddress, statusLabel, type WagerView } from '@/lib/sample-data';
import { WagerCard } from './wager-card';

type LiveWagerResult = {
  creator: `0x${string}`;
  opponent: `0x${string}`;
  token: string;
  stake: bigint;
  createdAt: bigint;
  acceptedAt: bigint;
  responseWindow: bigint;
  status: number;
  title: string;
  details: string;
  creatorWinnerVote: string;
  opponentWinnerVote: string;
  creatorTieVote: boolean;
  opponentTieVote: boolean;
};

function buildDeadline(createdAt: bigint, acceptedAt: bigint, responseWindow: bigint, status: WagerView['status']) {
  const anchor = acceptedAt > 0n ? acceptedAt : createdAt;
  const end = Number(anchor + responseWindow) * 1000;
  const now = Date.now();
  const diffMs = end - now;

  if (status === 'Resolved') return 'Resolved';
  if (status === 'Refunded') return 'Refunded';
  if (status === 'Disputed') return diffMs > 0 ? `${Math.ceil(diffMs / 3600000)}h until timeout` : 'Timeout open';
  if (diffMs <= 0) return 'Timeout open';
  return `${Math.max(1, Math.ceil(diffMs / 3600000))}h remaining`;
}

export function LiveWagers() {
  const { address, chainId, isConnected } = useAccount();
  const { data: wagerCount } = useReadContract({
    address: contractAddresses.escrow,
    abi: challengeEscrowAbi,
    functionName: 'wagerCount',
    query: {
      enabled: Boolean(contractAddresses.escrow && chainId === supportedChainId),
      refetchInterval: 10000,
    },
  });

  const ids = wagerCount ? Array.from({ length: Number(wagerCount) }, (_, index) => BigInt(Number(wagerCount) - index)) : [];

  const { data, isLoading } = useReadContracts({
    contracts: ids.map((id) => ({
      address: contractAddresses.escrow!,
      abi: challengeEscrowAbi,
      functionName: 'getWager',
      args: [id],
    })),
    query: {
      enabled: Boolean(contractAddresses.escrow && ids.length && chainId === supportedChainId),
      refetchInterval: 10000,
    },
  });

  if (!contractAddresses.escrow) return <p className="text-sm text-slate-400">Missing escrow contract address in env config.</p>;
  if (!isConnected) return <p className="text-sm text-slate-400">Connect a wallet to load wagers.</p>;
  if (chainId !== supportedChainId) return <p className="text-sm text-slate-400">Switch to Base Sepolia to load wagers.</p>;
  if (isLoading) return <p className="text-sm text-slate-400">Loading wagers...</p>;

  const allWagers: WagerView[] = (data ?? []).flatMap((item, index) => {
    if (item.status !== 'success' || !item.result) return [];
    const result = item.result as unknown as LiveWagerResult;
    const status = statusLabel(Number(result.status));
    return [{
      id: Number(ids[index]),
      title: result.title || `Wager #${ids[index].toString()}`,
      details: result.details || 'No extra notes were provided.',
      stake: `${formatUnits(result.stake, usdcDecimals)} USDC`,
      creator: shortenAddress(result.creator),
      opponent: shortenAddress(result.opponent),
      creatorAddress: result.creator,
      opponentAddress: result.opponent,
      status,
      deadline: buildDeadline(result.createdAt, result.acceptedAt, result.responseWindow, status),
      outcomeHint: outcomeHintForStatus(status),
    }];
  });

  const mine = address
    ? allWagers.filter((wager) =>
        wager.creatorAddress?.toLowerCase() === address.toLowerCase() ||
        wager.opponentAddress?.toLowerCase() === address.toLowerCase()
      )
    : [];

  const active = mine.filter((wager) => wager.status === 'Created' || wager.status === 'Accepted' || wager.status === 'Disputed');
  const history = mine.filter((wager) => wager.status === 'Resolved' || wager.status === 'Refunded');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
        <div>
          <p className="font-medium text-white">My wagers</p>
          <p className="text-slate-400">{active.length} active · {history.length} in history</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p>{wagerCount ? wagerCount.toString() : '0'} total on-chain</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Active</h3>
          <span className="text-xs text-slate-500">Current flow only</span>
        </div>
        {active.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {active.map((wager) => <WagerCard key={`active-${wager.id}`} wager={wager} />)}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No active wagers for this wallet yet.</p>
        )}
      </div>

      <details className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-white">History</summary>
        <div className="mt-4">
          {history.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {history.map((wager) => <WagerCard key={`history-${wager.id}`} wager={wager} />)}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No settled wagers yet.</p>
          )}
        </div>
      </details>
    </div>
  );
}
