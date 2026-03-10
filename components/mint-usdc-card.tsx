'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { contractAddresses, supportedChainId, toUsdcAmount, usdcAbi } from '@/lib/contract';

export function MintUsdcCard() {
  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [message, setMessage] = useState('');

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
      <div>
        <p className="badge">Test token faucet</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Mint MockUSDC for this wallet</h2>
      </div>
      <p className="text-sm text-slate-300">The deployed MockUSDC contract is open mint on Base Sepolia. Use this first so create/accept has actual token balance to transfer.</p>
      <button className="button-secondary w-full" disabled={isPending} onClick={mint} type="button">
        {isPending ? 'Waiting for wallet...' : 'Mint 100 test USDC'}
      </button>
      {message ? <p className="text-sm text-slate-300 break-all">{message}</p> : null}
    </section>
  );
}
