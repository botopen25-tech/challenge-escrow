import { cleanup, render, screen } from '@testing-library/react';
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
    expect(screen.getByText(/Friendly wagers/i)).toBeInTheDocument();
    expect(screen.getByText(/Approve USDC and create challenge/i)).toBeInTheDocument();
    expect(screen.getByText(/Your recent wagers/i)).toBeInTheDocument();
  });

  it('renders wager card details', () => {
    render(<WagerCard wager={sampleWagers[0]} />);
    expect(screen.getByText(/10k weekend run/i)).toBeInTheDocument();
    expect(screen.getByText(/Accepted/i)).toBeInTheDocument();
    expect(screen.getByText(/Both players need to confirm winner or tie/i)).toBeInTheDocument();
  });
});
