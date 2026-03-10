import { NextResponse } from 'next/server';
import { getChallenge } from '@/lib/hybrid-store';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const challenge = getChallenge(params.id);

  if (!challenge) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ challenge });
}
