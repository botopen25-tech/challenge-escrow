import { NextResponse } from 'next/server';
import { createChallenge, listChallenges } from '@/lib/hybrid-store';

export async function GET() {
  return NextResponse.json({ challenges: listChallenges() });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.title || !body?.stakeAmount || !body?.creatorAddress || !body?.responseWindowHours) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const challenge = createChallenge({
    title: String(body.title),
    details: String(body.details ?? ''),
    stakeAmount: String(body.stakeAmount),
    creatorAddress: body.creatorAddress,
    opponentAddress: body.opponentAddress,
    responseWindowHours: Number(body.responseWindowHours),
  });

  return NextResponse.json({ challenge }, { status: 201 });
}
