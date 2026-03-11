import './globals.css';
import type { Metadata } from 'next';
import { AppProviders } from '@/components/app-providers';
import { ConnectWalletButton } from '@/components/connect-wallet-button';
import { TopTabs } from '@/components/top-tabs';

export const metadata: Metadata = {
  title: 'ChallengeEscrow',
  description: 'Mobile-first friend wagers with wallet-based escrow.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TopTabs />
              <ConnectWalletButton />
            </div>
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
