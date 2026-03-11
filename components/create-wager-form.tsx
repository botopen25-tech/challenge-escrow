'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { challengeEscrowAbi, contractAddresses, defaultStake, supportedChainId, toUsdcAmount, usdcAbi } from '@/lib/contract';
import { baseSepoliaTxUrl } from '@/lib/explorer';
import { ActionFeedback } from './action-feedback';

const initialState = {
  opponent: '',
  stake: defaultStake,
  title: '',
  details: '',
  responseWindowHours: '24',
};

export function CreateWagerForm() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState<string>('');
  const [tone, setTone] = useState<'info' | 'success' | 'error'>('info');
  const [txHash, setTxHash] = useState<string>('');

  const hasContracts = Boolean(contractAddresses.escrow && contractAddresses.usdc);
  const onSupportedChain = chainId === supportedChainId;
  const ready = hasContracts && isConnected && onSupportedChain;
  const summary = useMemo(() => `${form.stake || '0'} USDC · ${form.responseWindowHours || '0'}h response window`, [form]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTxHash('');

    if (!hasContracts || !contractAddresses.escrow || !contractAddresses.usdc) {
      setTone('error');
      setMessage('Missing contract config. Set NEXT_PUBLIC_CHALLENGE_ESCROW_ADDRESS and NEXT_PUBLIC_USDC_ADDRESS.');
      return;
    }

    if (!isConnected) {
      setTone('error');
      setMessage('Connect your wallet first.');
      return;
    }

    if (!onSupportedChain) {
      setTone('error');
      setMessage('Switch your wallet to Base Sepolia first.');
      return;
    }

    if (!publicClient) {
      setTone('error');
      setMessage('Public client unavailable. Refresh and try again.');
      return;
    }

    try {
      const stakeAmount = toUsdcAmount(form.stake);

      setTone('info');
      setMessage('Approving USDC in your wallet...');
      const approvalHash = await writeContractAsync({
        address: contractAddresses.usdc,
        abi: usdcAbi,
        functionName: 'approve',
        args: [contractAddresses.escrow, stakeAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash: approvalHash });

      setTone('info');
      setMessage('Approval confirmed. Create the wager in your wallet.');

      const hash = await writeContractAsync({
        address: contractAddresses.escrow,
        abi: challengeEscrowAbi,
        functionName: 'createWager',
        args: [
          form.opponent as `0x${string}`,
          contractAddresses.usdc,
          stakeAmount,
          BigInt(Number(form.responseWindowHours) * 60 * 60),
          form.title,
          form.details,
        ],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setTxHash(hash);
      setTone('success');
      setMessage('Wager confirmed on-chain.');
      setForm(initialState);
    } catch (error) {
      setTone('error');
      setMessage(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  return (
    <form className="card space-y-4" onSubmit={onSubmit}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="badge">Create a wager</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Challenge a friend in under a minute</h2>
        </div>
      </div>
      <p className="text-sm text-slate-300">Deposit your side now, send the link, and wait for your opponent to match the stake.</p>
      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Opponent wallet</span>
        <input className="field" placeholder="0x..." value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-2 text-sm">
          <span className="text-slate-300">Stake (USDC)</span>
          <input className="field" inputMode="decimal" value={form.stake} onChange={(e) => setForm({ ...form, stake: e.target.value })} />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-slate-300">Response window</span>
          <input className="field" inputMode="numeric" value={form.responseWindowHours} onChange={(e) => setForm({ ...form, responseWindowHours: e.target.value })} />
        </label>
      </div>
      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Challenge title</span>
        <input className="field" placeholder="Sunday 10k" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Rules / proof notes</span>
        <textarea className="field min-h-28" placeholder="How the result will be verified..." value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
      </label>
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
        <p className="font-medium text-white">Summary</p>
        <p className="mt-1">{summary}</p>
        <p className="mt-1 text-xs text-slate-400">Connected wallet: {address ?? 'not connected'}</p>
        <p className="mt-1 text-xs text-slate-400">Network: {chainId === supportedChainId ? 'Base Sepolia' : 'wrong network or not connected'}</p>
      </div>
      <button className="button-primary w-full" disabled={!ready || isPending} type="submit">
        {isPending ? 'Waiting for wallet...' : 'Approve USDC and create challenge'}
      </button>
      {message ? <ActionFeedback tone={tone} message={message} txHash={txHash} txHref={baseSepoliaTxUrl(txHash)} /> : null}
    </form>
  );
}
