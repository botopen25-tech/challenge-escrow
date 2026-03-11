import { cleanup, render, screen } from '@testing-library/react';

Object.defineProperty(window, 'confirm', {
  writable: true,
  value: () => true,
});
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <button>Connect Wallet</button>,
  getDefaultConfig: () => ({}),
  RainbowKitProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('wagmi', () => ({
  WagmiProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAccount: () => ({ address: undefined, isConnected: false, chainId: undefined }),
  useConnect: () => ({ connect: vi.fn(), isPending: false }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
  useSwitchChain: () => ({ switchChain: vi.fn(), isPending: false }),
  useWriteContract: () => ({ writeContractAsync: vi.fn(), isPending: false }),
  usePublicClient: () => ({ waitForTransactionReceipt: vi.fn() }),
  useReadContract: () => ({ data: 0n }),
  useReadContracts: () => ({ data: [], isLoading: false }),
}));

vi.mock('@wagmi/core', () => ({
  injected: () => ({ id: 'injected' }),
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClient: class {},
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('wagmi/chains', () => ({ base: {}, baseSepolia: {} }));

import HomePage from '@/app/page';
import { WagerCard } from '@/components/wager-card';
import { sampleWagers } from '@/lib/sample-data';

afterEach(() => cleanup());

describe('frontend smoke tests', () => {
  it('renders the landing page shell', () => {
    render(<HomePage />);
    expect(screen.getByText(/Set the line\. Lock the pool\. Settle on-chain\./i)).toBeInTheDocument();
    expect(screen.getByText(/Create a wager/i)).toBeInTheDocument();
    expect(screen.getByText(/View active wagers/i)).toBeInTheDocument();
  });

  it('renders wager card details', () => {
    render(<WagerCard wager={sampleWagers[0]} />);
    expect(screen.getByText(/10k weekend run/i)).toBeInTheDocument();
    expect(screen.getByText(/Accepted/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Both players need to confirm winner or tie/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Connect a wallet to see whether you are the creator or the opponent/i)).toBeInTheDocument();
  });
});
