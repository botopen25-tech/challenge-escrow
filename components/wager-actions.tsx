'use client';

import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { challengeEscrowAbi, contractAddresses } from '@/lib/contract';

const row = 'button-secondary w-full';

export function WagerActions({ wagerId, creator, opponent }: { wagerId: number; creator: `0x${string}`; opponent: `0x${string}` }) {
  const { writeContractAsync, isPending } = useWriteContract();
  const [message, setMessage] = useState('');

  async function call(functionName: 'acceptWager' | 'confirmTie' | 'claimTimeoutRefund' | 'escalateDispute') {
    if (!contractAddresses.escrow) {
      setMessage('Missing NEXT_PUBLIC_CHALLENGE_ESCROW_ADDRESS');
      return;
    }
    try {
      const hash = await writeContractAsync({
        address: contractAddresses.escrow,
        abi: challengeEscrowAbi,
        functionName,
        args: [BigInt(wagerId)],
      });
      setMessage(`${functionName} submitted: ${hash}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  async function confirmWinner(winner: `0x${string}`) {
    if (!contractAddresses.escrow) {
      setMessage('Missing NEXT_PUBLIC_CHALLENGE_ESCROW_ADDRESS');
      return;
    }
    try {
      const hash = await writeContractAsync({
        address: contractAddresses.escrow,
        abi: challengeEscrowAbi,
        functionName: 'confirmWinner',
        args: [BigInt(wagerId), winner],
      });
      setMessage(`confirmWinner submitted: ${hash}`);
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
      <div className="grid grid-cols-2 gap-3">
        <button className={row} disabled={isPending} onClick={() => call('acceptWager')} type="button">Accept wager</button>
        <button className={row} disabled={isPending} onClick={() => confirmWinner(creator)} type="button">Creator won</button>
        <button className={row} disabled={isPending} onClick={() => confirmWinner(opponent)} type="button">Opponent won</button>
        <button className={row} disabled={isPending} onClick={() => call('confirmTie')} type="button">Mark tie</button>
        <button className={row} disabled={isPending} onClick={() => call('claimTimeoutRefund')} type="button">Claim timeout refund</button>
        <button className={row} disabled={isPending} onClick={() => call('escalateDispute')} type="button">Escalate dispute</button>
      </div>
      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}
