'use client';

import { useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount, usePublicClient, useReadContract, useWriteContract } from 'wagmi';
import { contractAddresses, supportedChainId, toUsdcAmount, usdcAbi, usdcDecimals } from '@/lib/contract';

export function MintUsdcCard() {
  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const { data: balance } = useReadContract({
    address: contractAddresses.usdc,
    abi: usdcAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && contractAddresses.usdc && chainId === supportedChainId),
      refetchInterval: 10000,
    },
  });
  const [message, setMessage] = useState('');

  const formattedBalance = balance ? formatUnits(balance, usdcDecimals) : '0';
  const needsFunds = Number(formattedBalance) < 25;

  async function mint() {
    if (!isConnected || !address) {
      setMessage('Connect your wallet first.');
      return;
    }
    if (chainId !== supportedChainId) {
      setMessage('Switch to Base Sepolia first.');
      return;
    }
    if (!contractAddresses.usdc) {
      setMessage('Missing NEXT_PUBLIC_USDC_ADDRESS');
      return;
    }
    if (!publicClient) {
      setMessage('Public client unavailable. Refresh and try again.');
      return;
    }

    try {
      setMessage('Minting 100 test USDC...');
      const hash = await writeContractAsync({
        address: contractAddresses.usdc,
        abi: usdcAbi,
        functionName: 'mint',
        args: [address, toUsdcAmount('100')],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setMessage(`Minted 100 MockUSDC: ${hash}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Mint failed');
    }
  }

  return (
    <section className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="badge">Balance</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{formattedBalance} MockUSDC</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
          {needsFunds ? 'Needs more funds' : 'Ready to wager'}
        </div>
      </div>
      <p className="text-sm text-slate-300">Keep a little MockUSDC in the wallet so create and accept flows don’t fail.</p>
      {needsFunds ? (
        <button className="button-secondary w-full" disabled={isPending} onClick={mint} type="button">
          {isPending ? 'Waiting for wallet...' : 'Load 100 more test USDC'}
        </button>
      ) : (
        <button className="button-secondary w-full" disabled={isPending} onClick={mint} type="button">
          {isPending ? 'Waiting for wallet...' : 'Load more test USDC'}
        </button>
      )}
      {message ? <p className="text-sm text-slate-300 break-all">{message}</p> : null}
    </section>
  );
}
