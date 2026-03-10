import './globals.css';
import type { Metadata } from 'next';
import { AppProviders } from '@/components/app-providers';

export const metadata: Metadata = {
  title: 'ChallengeEscrow',
  description: 'Mobile-first friend wagers with wallet-based escrow.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
