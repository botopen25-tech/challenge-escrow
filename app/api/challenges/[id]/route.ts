import { NextResponse } from 'next/server';
import { getChallenge, submitChallengeResult } from '@/lib/hybrid-store';
import type { HybridResultChoice } from '@/lib/hybrid-types';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const challenge = getChallenge(params.id);

  if (!challenge) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ challenge });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const account = body?.account as `0x${string}` | undefined;
  const choice = body?.choice as HybridResultChoice | undefined;

  if (!account || !choice) {
    return NextResponse.json({ error: 'Missing account or choice' }, { status: 400 });
  }

  const result = submitChallengeResult(params.id, account, choice);
  if ('error' in result) {
    if (result.error === 'not_found') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json(result);
}
