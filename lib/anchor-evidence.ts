// lib/anchor-evidence.ts
import { prisma } from '@/lib/db';
import { anchorHash } from '@/lib/ethers';

export async function anchorEvidenceById(evidenceId: string) {
  const evidence = await prisma.evidence.findUnique({ where: { id: evidenceId } });
  if (!evidence) throw new Error('Evidence not found');

  const hex = (`0x${evidence.sha256Hex}`) as `0x${string}`;
  const { txHash, blockNumber } = await anchorHash(hex);

  const anchoring = await prisma.anchoring.upsert({
    where: { evidenceId },
    update: {
      chain: 'base',
      network: 'sepolia',
      txHash,
      blockNumber: blockNumber ?? null,
      anchoredAt: new Date(),
      method: 'event',
    },
    create: {
      evidenceId,
      chain: 'base',
      network: 'sepolia',
      txHash,
      blockNumber: blockNumber ?? null,
      anchoredAt: new Date(),
      method: 'event',
    },
  });

  return { txHash, blockNumber, anchoring };
}
