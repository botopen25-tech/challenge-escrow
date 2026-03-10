'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { challengeEscrowAbi, contractAddresses, supportedChainId, toUsdcAmount, usdcAbi } from '@/lib/contract';
import type { WagerView } from '@/lib/sample-data';

const row = 'button-secondary w-full text-sm';

export function WagerActions({ wager }: { wager: WagerView }) {
  const { chainId, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [message, setMessage] = useState('');

  const creator = wager.creatorAddress;
  const opponent = wager.opponentAddress;
  const stakeAmount = toUsdcAmount(wager.stake.replace(' USDC', '').replace('$', ''));

  function validateBaseReadiness() {
    if (!isConnected) {
      setMessage('Connect your wallet first.');
      return false;
    }
    if (chainId !== supportedChainId) {
      setMessage('Switch your wallet to Base Sepolia first.');
      return false;
    }
    if (!contractAddresses.escrow) {
      setMessage('Missing NEXT_PUBLIC_CHALLENGE_ESCROW_ADDRESS');
      return false;
    }
    if (!publicClient) {
      setMessage('Refresh and try again.');
      return false;
    }
    return true;
  }

  async function call(functionName: 'confirmTie' | 'claimTimeoutRefund' | 'escalateDispute') {
    if (!validateBaseReadiness() || !contractAddresses.escrow || !publicClient) return;
    try {
      const hash = await writeContractAsync({
        address: contractAddresses.escrow,
        abi: challengeEscrowAbi,
        functionName,
        args: [BigInt(wager.id)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setMessage('Confirmed on-chain.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  async function acceptWager() {
    if (!validateBaseReadiness() || !contractAddresses.escrow || !contractAddresses.usdc || !publicClient) {
      if (!contractAddresses.usdc) setMessage('Missing NEXT_PUBLIC_USDC_ADDRESS');
      return;
    }

    try {
      setMessage('Approving USDC...');
      const approvalHash = await writeContractAsync({
        address: contractAddresses.usdc,
        abi: usdcAbi,
        functionName: 'approve',
        args: [contractAddresses.escrow, stakeAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash: approvalHash });

      setMessage('Approval confirmed. Accepting wager...');
      const hash = await writeContractAsync({
        address: contractAddresses.escrow,
        abi: challengeEscrowAbi,
        functionName: 'acceptWager',
        args: [BigInt(wager.id)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setMessage('Wager accepted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  async function confirmWinner(winner: `0x${string}`) {
    if (!validateBaseReadiness() || !contractAddresses.escrow || !publicClient) return;
    try {
      const hash = await writeContractAsync({
        address: contractAddresses.escrow,
        abi: challengeEscrowAbi,
        functionName: 'confirmWinner',
        args: [BigInt(wager.id), winner],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setMessage('Winner confirmed on-chain.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  if (!creator || !opponent) return null;

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div className="grid grid-cols-2 gap-2">
        {wager.status === 'Created' ? (
          <button className={row} disabled={isPending} onClick={acceptWager} type="button">Accept</button>
        ) : null}
        {wager.status === 'Accepted' ? (
          <>
            <button className={row} disabled={isPending} onClick={() => confirmWinner(creator)} type="button">Creator won</button>
            <button className={row} disabled={isPending} onClick={() => confirmWinner(opponent)} type="button">Opponent won</button>
            <button className={row} disabled={isPending} onClick={() => call('confirmTie')} type="button">Mark tie</button>
            <button className={row} disabled={isPending} onClick={() => call('claimTimeoutRefund')} type="button">Refund</button>
          </>
        ) : null}
        {wager.status === 'Disputed' ? (
          <>
            <button className={row} disabled={isPending} onClick={() => call('claimTimeoutRefund')} type="button">Refund</button>
            <button className={row} disabled={isPending} onClick={() => call('escalateDispute')} type="button">Escalate</button>
          </>
        ) : null}
      </div>
      {message ? <p className="text-xs text-slate-400 break-all">{message}</p> : null}
    </div>
  );
}
