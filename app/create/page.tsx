import { CreateWagerForm } from '@/components/create-wager-form';
import { MintUsdcCard } from '@/components/mint-usdc-card';

export default function CreatePage() {
  return (
    <main className="flex min-h-full flex-col gap-6">
      <div>
        <p className="badge">Create wager</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Build the line and fund your side</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr,1.2fr]">
        <MintUsdcCard />
        <CreateWagerForm />
      </div>
    </main>
  );
}
