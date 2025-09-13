import { NextRequest, NextResponse } from 'next/server';
import { anchorEvidenceById } from '../../../../../lib/anchor-evidence';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { txHash, blockNumber } = await anchorEvidenceById(id);
    return NextResponse.json({ ok: true, txHash, blockNumber });
  } catch (err: any) {
    console.error('[anchor:error]', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'unknown error' }, { status: 500 });
  }
}


