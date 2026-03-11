import { LiveWagers } from '@/components/live-wagers';

export default function WagersPage() {
  return (
    <main className="flex min-h-full flex-col gap-6">
      <div>
        <p className="badge">Wagers</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Active and settled wagers</h1>
      </div>

      <LiveWagers />
    </main>
  );
}
