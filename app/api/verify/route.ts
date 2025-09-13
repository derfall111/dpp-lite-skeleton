import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const hash = (url.searchParams.get('hash') || '').toLowerCase();
  if (!/^([0-9a-f]{64})$/.test(hash)) {
    return NextResponse.json({ ok: false, error: 'Invalid SHA-256 hex' }, { status: 400 });
  }
  const evidence = await prisma.evidence.findFirst({
    where: { sha256Hex: hash },
    include: { anchoring: true, product: true }
  });
  if (!evidence) return NextResponse.json({ ok: true, match: false });
  return NextResponse.json({
    ok: true,
    match: true,
    evidence: {
      id: evidence.id,
      filename: evidence.filename,
      issuer: evidence.issuer,
      product: evidence.product ? { id: evidence.product.id, sku: evidence.product.sku, name: evidence.product.name } : null
    },
    anchoring: evidence.anchoring ? {
      chain: evidence.anchoring.chain,
      network: evidence.anchoring.network,
      txHash: evidence.anchoring.txHash,
      blockNumber: evidence.anchoring.blockNumber,
      anchoredAt: evidence.anchoring.anchoredAt,
      method: evidence.anchoring.method
    } : null
  });
}
