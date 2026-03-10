'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { challengeEscrowAbi, contractAddresses, supportedChainId, toUsdcAmount, usdcAbi } from '@/lib/contract';
import type { WagerView } from '@/lib/sample-data';

export function WagerActions({ wager }: { wager: WagerView }) {
  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [message, setMessage] = useState('');

  const creator = wager.creatorAddress;
  const opponent = wager.opponentAddress;
  const stakeAmount = toUsdcAmount(wager.stake.replace(' USDC', '').replace('$', ''));
  const role = !address
    ? 'viewer'
    : creator?.toLowerCase() === address.toLowerCase()
      ? 'creator'
      : opponent?.toLowerCase() === address.toLowerCase()
        ? 'opponent'
        : 'viewer';

  function validateBaseReadiness() {
    if (!isConnected) {
      setMessage('Connect your wallet first.');
      return false;
    }
    if (chainId !== supportedChainId) {
      setMessage('Switch to Base Sepolia first.');
      return false;
    }
    if (!contractAddresses.escrow || !publicClient) {
      setMessage('Refresh and try again.');
      return false;
    }
    return true;
  }

  async function runWrite(fn: () => Promise<`0x${string}`>, success: string) {
    if (!validateBaseReadiness() || !publicClient) return;
    try {
      const hash = await fn();
      await publicClient.waitForTransactionReceipt({ hash });
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  if (!creator || !opponent) return null;
  if (role === 'viewer') return <p className="text-xs text-slate-500">View only</p>;

  let primaryAction: { label: string; onClick: () => void } | null = null;
  let secondaryAction: { label: string; onClick: () => void } | null = null;

  if (wager.status === 'Created' && role === 'opponent') {
    primaryAction = {
      label: 'Accept wager',
      onClick: () => runWrite(async () => {
        if (!contractAddresses.usdc || !contractAddresses.escrow) throw new Error('Missing token config');
        const approvalHash = await writeContractAsync({
          address: contractAddresses.usdc,
          abi: usdcAbi,
          functionName: 'approve',
          args: [contractAddresses.escrow, stakeAmount],
        });
        await publicClient!.waitForTransactionReceipt({ hash: approvalHash });
        return writeContractAsync({
          address: contractAddresses.escrow,
          abi: challengeEscrowAbi,
          functionName: 'acceptWager',
          args: [BigInt(wager.id)],
        });
      }, 'Wager accepted.'),
    };
  }

  if (wager.status === 'Accepted') {
    primaryAction = {
      label: 'I won',
      onClick: () => runWrite(
        () => writeContractAsync({
          address: contractAddresses.escrow!,
          abi: challengeEscrowAbi,
          functionName: 'confirmWinner',
          args: [BigInt(wager.id), role === 'creator' ? creator : opponent],
        }),
        'Winner confirmed on-chain.'
      ),
    };

    secondaryAction = {
      label: 'I lost',
      onClick: () => runWrite(
        () => writeContractAsync({
          address: contractAddresses.escrow!,
          abi: challengeEscrowAbi,
          functionName: 'confirmWinner',
          args: [BigInt(wager.id), role === 'creator' ? opponent : creator],
        }),
        'Loss recorded on-chain.'
      ),
    };
  }

  if (wager.status === 'Disputed') {
    primaryAction = {
      label: 'Claim refund',
      onClick: () => runWrite(
        () => writeContractAsync({
          address: contractAddresses.escrow!,
          abi: challengeEscrowAbi,
          functionName: 'claimTimeoutRefund',
          args: [BigInt(wager.id)],
        }),
        'Refund confirmed on-chain.'
      ),
    };
  }

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      {primaryAction ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button className="button-secondary w-full" disabled={isPending} onClick={primaryAction.onClick} type="button">
            {isPending ? 'Waiting for wallet...' : primaryAction.label}
          </button>
          {secondaryAction ? (
            <button className="button-secondary w-full" disabled={isPending} onClick={secondaryAction.onClick} type="button">
              {isPending ? 'Waiting for wallet...' : secondaryAction.label}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-slate-500">No action needed right now.</p>
      )}
      {message ? <p className="text-xs text-slate-400 break-all">{message}</p> : null}
    </div>
  );
}
