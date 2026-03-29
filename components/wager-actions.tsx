'use client';

import { useMemo, useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { challengeEscrowAbi, contractAddresses, supportedChainId, toUsdcAmount, usdcAbi } from '@/lib/contract';
import { baseSepoliaTxUrl } from '@/lib/explorer';
import type { WagerView } from '@/lib/sample-data';
import { ActionFeedback } from './action-feedback';

type PendingResultChoice = 'creatorWon' | 'opponentWon' | 'tie' | null;

export function WagerActions({ wager }: { wager: WagerView }) {
  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'info' | 'success' | 'error'>('info');
  const [txHash, setTxHash] = useState<string>('');
  const [pendingResultChoice, setPendingResultChoice] = useState<PendingResultChoice>(null);

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
      setTone('error');
      setMessage('Connect the creator or opponent wallet for this wager first.');
      return false;
    }
    if (chainId !== supportedChainId) {
      setTone('error');
      setMessage('Wrong network. Switch your wallet to Base Sepolia before taking this action.');
      return false;
    }
    if (!contractAddresses.escrow || !publicClient) {
      setTone('error');
      setMessage('Refresh and try again.');
      return false;
    }
    return true;
  }

  async function runWrite(fn: () => Promise<`0x${string}`>, success: string) {
    if (!validateBaseReadiness() || !publicClient) return;
    try {
      setTone('info');
      setMessage('Waiting for on-chain confirmation...');
      setTxHash('');
      const hash = await fn();
      await publicClient.waitForTransactionReceipt({ hash });
      setTxHash(hash);
      setTone('success');
      setMessage(success);
      setPendingResultChoice(null);
    } catch (error) {
      setTone('error');
      setMessage(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  if (!creator || !opponent) return null;

  if (role === 'viewer') {
    return <p className="text-xs text-amber-300">This wallet does not match either participant on this wager. Switch to the creator wallet ({wager.creator}) or opponent wallet ({wager.opponent}) to take action.</p>;
  }

  const hasSubmittedResult = Boolean(wager.myVote && wager.myVote !== 'Waiting');
  const resultChoiceDetails = useMemo(() => {
    if (pendingResultChoice === 'tie') {
      return {
        title: 'Confirm tie result',
        explanation: 'This records a tie vote on-chain. If the other side also submits Tie, the wager moves to a refund path instead of paying a winner.',
        impact: 'This is a meaningful settlement vote and cannot be silently undone.',
        cta: 'Confirm tie on-chain',
      };
    }

    if (pendingResultChoice === 'creatorWon') {
      const creatorWonLabel = role === 'creator' ? 'you won' : 'the creator won';
      return {
        title: 'Confirm winner result',
        explanation: `This records that ${creatorWonLabel}. If the other side submits the same outcome, the wager can finalize payout from escrow.`,
        impact: 'If the other side disagrees, the wager will move into dispute handling instead of auto-settling.',
        cta: 'Confirm winner on-chain',
      };
    }

    if (pendingResultChoice === 'opponentWon') {
      const opponentWonLabel = role === 'opponent' ? 'you won' : 'the opponent won';
      return {
        title: 'Confirm winner result',
        explanation: `This records that ${opponentWonLabel}. If the other side submits the same outcome, the wager can finalize payout from escrow.`,
        impact: 'If the other side disagrees, the wager will move into dispute handling instead of auto-settling.',
        cta: 'Confirm winner on-chain',
      };
    }

    return null;
  }, [pendingResultChoice, role]);

  let primaryAction: { label: string; onClick: () => void } | null = null;
  let secondaryAction: { label: string; onClick: () => void } | null = null;
  let tertiaryAction: { label: string; onClick: () => void } | null = null;

  if (wager.status === 'Created' && role === 'opponent') {
    primaryAction = {
      label: 'Accept wager',
      onClick: () => runWrite(async () => {
        if (!contractAddresses.usdc || !contractAddresses.escrow) throw new Error('Missing token config');
        setTone('info');
        setMessage('Approving USDC in your wallet...');
        const approvalHash = await writeContractAsync({
          address: contractAddresses.usdc,
          abi: usdcAbi,
          functionName: 'approve',
          args: [contractAddresses.escrow, stakeAmount],
        });
        await publicClient!.waitForTransactionReceipt({ hash: approvalHash });
        setTone('info');
        setMessage('Approval confirmed. Accept the wager in your wallet.');
        return writeContractAsync({
          address: contractAddresses.escrow,
          abi: challengeEscrowAbi,
          functionName: 'acceptWager',
          args: [BigInt(wager.id)],
        });
      }, 'Wager accepted.'),
    };
  }

  if (wager.status === 'Accepted' && !hasSubmittedResult) {
    primaryAction = {
      label: 'I won',
      onClick: () => setPendingResultChoice(role === 'creator' ? 'creatorWon' : 'opponentWon'),
    };
    secondaryAction = {
      label: 'I lost',
      onClick: () => setPendingResultChoice(role === 'creator' ? 'opponentWon' : 'creatorWon'),
    };
    tertiaryAction = {
      label: 'Tie',
      onClick: () => setPendingResultChoice('tie'),
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

  const noActionText = role === 'creator' && wager.status === 'Created'
    ? 'You created this wager. Waiting for your opponent to accept.'
    : role === 'opponent' && wager.status === 'Created'
      ? 'You are the opponent on this wager. Accept when you are ready.'
      : hasSubmittedResult
        ? null
        : 'No action needed right now.';

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      {wager.status === 'Accepted' && !hasSubmittedResult ? (
        <p className="text-xs text-slate-400">Submitting a result records your vote on-chain. Double-check before confirming.</p>
      ) : null}
      {hasSubmittedResult && wager.status === 'Accepted' ? (
        <p className="text-xs text-slate-400">You already submitted: <span className="font-medium text-white">{wager.myVote}</span></p>
      ) : null}
      {primaryAction ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button className="button-secondary w-full" disabled={isPending} onClick={primaryAction.onClick} type="button">
            {isPending ? 'Waiting for wallet...' : primaryAction.label}
          </button>
          {secondaryAction ? (
            <button className="button-secondary w-full" disabled={isPending} onClick={secondaryAction.onClick} type="button">
              {isPending ? 'Waiting for wallet...' : secondaryAction.label}
            </button>
          ) : null}
          {tertiaryAction ? (
            <button className="button-secondary w-full" disabled={isPending} onClick={tertiaryAction.onClick} type="button">
              {isPending ? 'Waiting for wallet...' : tertiaryAction.label}
            </button>
          ) : null}
        </div>
      ) : noActionText ? (
        <p className="text-xs text-slate-500">{noActionText}</p>
      ) : null}

      {resultChoiceDetails ? (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/80">Confirm settlement vote</p>
          <p className="mt-2 font-medium text-white">{resultChoiceDetails.title}</p>
          <p className="mt-2 text-sm leading-6 text-amber-100">{resultChoiceDetails.explanation}</p>
          <p className="mt-2 text-xs text-amber-200/90">{resultChoiceDetails.impact}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              className="button-secondary w-full border-amber-300/30 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30"
              disabled={isPending}
              onClick={() => {
                if (pendingResultChoice === 'tie') {
                  return runWrite(
                    () => writeContractAsync({
                      address: contractAddresses.escrow!,
                      abi: challengeEscrowAbi,
                      functionName: 'confirmTie',
                      args: [BigInt(wager.id)],
                    }),
                    'Tie recorded on-chain.'
                  );
                }

                if (pendingResultChoice === 'creatorWon') {
                  return runWrite(
                    () => writeContractAsync({
                      address: contractAddresses.escrow!,
                      abi: challengeEscrowAbi,
                      functionName: 'confirmWinner',
                      args: [BigInt(wager.id), creator],
                    }),
                    role === 'creator' ? 'Winner confirmed on-chain.' : 'Loss recorded on-chain.'
                  );
                }

                if (pendingResultChoice === 'opponentWon') {
                  return runWrite(
                    () => writeContractAsync({
                      address: contractAddresses.escrow!,
                      abi: challengeEscrowAbi,
                      functionName: 'confirmWinner',
                      args: [BigInt(wager.id), opponent],
                    }),
                    role === 'opponent' ? 'Winner confirmed on-chain.' : 'Loss recorded on-chain.'
                  );
                }
              }}
              type="button"
            >
              {isPending ? 'Waiting for wallet...' : resultChoiceDetails.cta}
            </button>
            <button
              className="button-secondary w-full"
              disabled={isPending}
              onClick={() => setPendingResultChoice(null)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {message ? <ActionFeedback tone={tone} message={message} txHash={txHash} txHref={baseSepoliaTxUrl(txHash)} /> : null}
    </div>
  );
}
