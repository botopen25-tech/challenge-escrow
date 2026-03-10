'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { challengeEscrowAbi, contractAddresses, supportedChainId, toUsdcAmount, usdcAbi } from '@/lib/contract';

const row = 'button-secondary w-full';
const featuredStake = toUsdcAmount('25');

export function WagerActions({ wagerId, creator, opponent }: { wagerId: number; creator: `0x${string}`; opponent: `0x${string}` }) {
  const { chainId, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [message, setMessage] = useState('');

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
      setMessage('Public client unavailable. Refresh and try again.');
      return false;
    }
    return true;
  }

  async function call(functionName: 'confirmTie' | 'claimTimeoutRefund' | 'escalateDispute') {
    if (!validateBaseReadiness() || !contractAddresses.escrow || !publicClient) {
      return;
    }
    try {
      const hash = await writeContractAsync({
        address: contractAddresses.escrow,
        abi: challengeEscrowAbi,
        functionName,
        args: [BigInt(wagerId)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setMessage(`${functionName} confirmed on-chain: ${hash}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  async function acceptWager() {
    if (!validateBaseReadiness() || !contractAddresses.escrow || !contractAddresses.usdc || !publicClient) {
      if (!contractAddresses.usdc) {
        setMessage('Missing NEXT_PUBLIC_USDC_ADDRESS');
      }
      return;
    }

    try {
      setMessage('Step 1/2: approving USDC...');
      const approvalHash = await writeContractAsync({
        address: contractAddresses.usdc,
        abi: usdcAbi,
        functionName: 'approve',
        args: [contractAddresses.escrow, featuredStake],
      });
      await publicClient.waitForTransactionReceipt({ hash: approvalHash });
      setMessage('Approval confirmed. Step 2/2: accept the wager in your wallet.');

      const hash = await writeContractAsync({
        address: contractAddresses.escrow,
        abi: challengeEscrowAbi,
        functionName: 'acceptWager',
        args: [BigInt(wagerId)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setMessage(`acceptWager confirmed on-chain: ${hash}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  async function confirmWinner(winner: `0x${string}`) {
    if (!validateBaseReadiness() || !contractAddresses.escrow || !publicClient) {
      return;
    }
    try {
      const hash = await writeContractAsync({
        address: contractAddresses.escrow,
        abi: challengeEscrowAbi,
        functionName: 'confirmWinner',
        args: [BigInt(wagerId), winner],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setMessage(`confirmWinner confirmed on-chain: ${hash}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  return (
    <div className="card space-y-3" id={`wager-${wagerId}`}>
      <div>
        <p className="badge">Actions</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Settle, refund, or dispute</h3>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
        Live on-chain actions. Approvals now wait for confirmation before the escrow transaction runs.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button className={row} disabled={isPending} onClick={acceptWager} type="button">Approve + accept</button>
        <button className={row} disabled={isPending} onClick={() => confirmWinner(creator)} type="button">Creator won</button>
        <button className={row} disabled={isPending} onClick={() => confirmWinner(opponent)} type="button">Opponent won</button>
        <button className={row} disabled={isPending} onClick={() => call('confirmTie')} type="button">Mark tie</button>
        <button className={row} disabled={isPending} onClick={() => call('claimTimeoutRefund')} type="button">Claim timeout refund</button>
        <button className={row} disabled={isPending} onClick={() => call('escalateDispute')} type="button">Escalate dispute</button>
      </div>
      {message ? <p className="text-sm text-slate-300 break-all">{message}</p> : null}
    </div>
  );
}
