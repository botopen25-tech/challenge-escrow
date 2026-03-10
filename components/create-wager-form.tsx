'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { challengeEscrowAbi, contractAddresses, defaultStake, toUsdcAmount } from '@/lib/contract';

const initialState = {
  opponent: '',
  stake: defaultStake,
  title: '',
  details: '',
  responseWindowHours: '24',
};

export function CreateWagerForm() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState<string>('');

  const ready = Boolean(contractAddresses.escrow && contractAddresses.usdc && isConnected);
  const summary = useMemo(() => `${form.stake || '0'} USDC · ${form.responseWindowHours || '0'}h response window`, [form]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || !contractAddresses.escrow || !contractAddresses.usdc) {
      setMessage('Connect a wallet and configure NEXT_PUBLIC_* contract addresses first.');
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: contractAddresses.escrow,
        abi: challengeEscrowAbi,
        functionName: 'createWager',
        args: [
          form.opponent as `0x${string}`,
          contractAddresses.usdc,
          toUsdcAmount(form.stake),
          BigInt(Number(form.responseWindowHours) * 60 * 60),
          form.title,
          form.details,
        ],
      });
      setMessage(`Wager submitted: ${hash}`);
      setForm(initialState);
    } catch (error) {
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
        <input className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3" placeholder="0x..." value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-2 text-sm">
          <span className="text-slate-300">Stake (USDC)</span>
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3" inputMode="decimal" value={form.stake} onChange={(e) => setForm({ ...form, stake: e.target.value })} />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-slate-300">Response window</span>
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3" inputMode="numeric" value={form.responseWindowHours} onChange={(e) => setForm({ ...form, responseWindowHours: e.target.value })} />
        </label>
      </div>
      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Challenge title</span>
        <input className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3" placeholder="Sunday 10k" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="text-slate-300">Rules / proof notes</span>
        <textarea className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3" placeholder="How the result will be verified..." value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
      </label>
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
        <p className="font-medium text-white">Summary</p>
        <p className="mt-1">{summary}</p>
        <p className="mt-1 text-xs text-slate-400">Connected wallet: {address ?? 'not connected'}</p>
      </div>
      <button className="button-primary w-full" disabled={!ready || isPending} type="submit">
        {isPending ? 'Submitting...' : 'Create escrow challenge'}
      </button>
      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
    </form>
  );
}
