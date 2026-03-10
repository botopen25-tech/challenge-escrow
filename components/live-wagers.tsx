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

  const hours = Math.max(1, Math.ceil(diffMs / 3600000));
  return `${hours}h remaining`;
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
    contracts: ids.map(id => ({
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

  const walletWagers = address
    ? allWagers.filter((wager) =>
        wager.creatorAddress?.toLowerCase() === address.toLowerCase() ||
        wager.opponentAddress?.toLowerCase() === address.toLowerCase()
      )
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
        <div>
          <p className="font-medium text-white">Live wagers</p>
          <p className="text-slate-400">{walletWagers.length} for this wallet · {wagerCount ? wagerCount.toString() : '0'} total on-chain</p>
        </div>
      </div>

      {walletWagers.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {walletWagers.map((wager) => <WagerCard key={wager.id} wager={wager} />)}
        </div>
      ) : allWagers.length ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">No wagers for this wallet yet. Here are the latest on-chain wagers for debugging.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {allWagers.map((wager) => <WagerCard key={wager.id} wager={wager} />)}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400">No wagers exist on-chain yet. Mint MockUSDC first, then create one.</p>
      )}
    </div>
  );
}
