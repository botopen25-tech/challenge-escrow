'use client';

import { formatUnits } from 'viem';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { challengeEscrowAbi, contractAddresses, supportedChainId, usdcDecimals } from '@/lib/contract';
import { outcomeHintForStatus, shortenAddress, statusLabel, type WagerView } from '@/lib/sample-data';
import { WagerCard } from './wager-card';

type LiveWagerResult = {
  creator: string;
  opponent: string;
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

  if (status === 'Resolved') return 'Resolved on-chain';
  if (status === 'Refunded') return 'Refunded on-chain';
  if (status === 'Disputed') return diffMs > 0 ? `${Math.ceil(diffMs / 3600000)}h until timeout` : 'Timeout window is open';
  if (diffMs <= 0) return 'Timeout window is open';

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

  if (!contractAddresses.escrow) {
    return <p className="text-sm text-slate-400">Missing escrow contract address in env config.</p>;
  }

  if (!isConnected) {
    return <p className="text-sm text-slate-400">Connect a wallet to load live on-chain wagers.</p>;
  }

  if (chainId !== supportedChainId) {
    return <p className="text-sm text-slate-400">Switch to Base Sepolia to load live wagers.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-slate-400">Loading live wagers...</p>;
  }

  const wagers: WagerView[] = (data ?? [])
    .flatMap((item, index) => {
      if (item.status !== 'success' || !item.result) return [];
      const result = item.result as unknown as LiveWagerResult;
      const creator = result.creator;
      const opponent = result.opponent;
      if (address && creator.toLowerCase() !== address.toLowerCase() && opponent.toLowerCase() !== address.toLowerCase()) {
        return [];
      }

      const status = statusLabel(Number(result.status));
      return [{
        id: Number(ids[index]),
        title: result.title || `Wager #${ids[index].toString()}`,
        details: result.details || 'No extra notes were provided.',
        stake: `${formatUnits(result.stake, usdcDecimals)} USDC`,
        creator: shortenAddress(creator),
        opponent: shortenAddress(opponent),
        status,
        deadline: buildDeadline(result.createdAt, result.acceptedAt, result.responseWindow, status),
        outcomeHint: outcomeHintForStatus(status),
      }];
    });

  if (!wagers.length) {
    return <p className="text-sm text-slate-400">No live wagers found yet for this wallet. If you just created one, wait a few seconds and refresh.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {wagers.map(wager => <WagerCard key={wager.id} wager={wager} />)}
    </div>
  );
}
