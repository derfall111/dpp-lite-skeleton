import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { saveBufferToStorage } from '@/lib/storage';
import { createHash } from 'crypto';
import { anchorEvidenceById } from '@/lib/anchor-evidence';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'file is required' }, { status: 400 });
    }

    const productId = (form.get('productId') as string | null) || null;
    const issuer = (form.get('issuer') as string | null) || null;

    // 1) Hash + stockage
    const buf = Buffer.from(await file.arrayBuffer());
    const sha256Hex = createHash('sha256').update(buf).digest('hex');
    const storageUrl = await saveBufferToStorage(file.name, buf);

    // 2) Création de la preuve (tolérance aux doublons si @unique sur sha256Hex)
    let evidence;
    try {
      evidence = await prisma.evidence.create({
        data: {
          productId: productId || undefined,
          issuer: issuer || undefined,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          byteSize: buf.byteLength,
          sha256Hex,
          storageUrl,
        },
      });
    } catch (e: any) {
      // Si tu as mis @unique sur sha256Hex, Prisma renverra P2002 en cas de doublon
      if (e?.code === 'P2002') {
        evidence = await prisma.evidence.findFirst({ where: { sha256Hex } });
        if (!evidence) throw e;
        // Optionnel : si on a fourni un productId et que la preuve existante est orpheline, on la rattache
        if (productId && !evidence.productId) {
          evidence = await prisma.evidence.update({
            where: { id: evidence.id },
            data: { productId },
          });
        }
      } else {
        throw e;
      }
    }

    // 3) Auto-ancrage (non bloquant pour l’upload)
    let anchoring: null | { txHash: string; blockNumber: number | null } = null;
    try {
      const { txHash, blockNumber } = await anchorEvidenceById(evidence.id);
      anchoring = { txHash, blockNumber: blockNumber ?? null };
    } catch (err) {
      console.error('Auto-anchor failed:', err);
      // On n’échoue pas l’upload si l’ancrage rate : "anchoring" restera null
    }

    // 4) Réponse
    return NextResponse.json(
      {
        ok: true,
        evidence: {
          id: evidence.id,
          filename: evidence.filename,
          mimeType: evidence.mimeType,
          byteSize: evidence.byteSize,
          sha256Hex,
          storageUrl,
          productId: evidence.productId,
        },
        anchoring, // null si l’ancrage a échoué
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[evidences:upload]', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'unknown error' }, { status: 500 });
  }
}
