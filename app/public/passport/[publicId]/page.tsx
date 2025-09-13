import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Raccourci lisible d'un hash */
function shortHash(h: string, start = 10, end = 6) {
  return h.length > start + end ? `${h.slice(0, start)}…${h.slice(-end)}` : h;
}

/** Construit l'URL d'explorateur adaptée à la chaîne/réseau */
function getExplorerTxUrl(chain: string | null | undefined, network: string | null | undefined, txHash: string) {
  const c = (chain || '').toLowerCase();
  const n = (network || '').toLowerCase();

  // Base
  if (c === 'base' && (n === 'sepolia' || n === 'testnet' || n === 'base-sepolia')) {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  }
  if (c === 'base' && (n === 'mainnet' || n === 'main' || n === 'l2')) {
    return `https://basescan.org/tx/${txHash}`;
  }

  // Ethereum (au cas où)
  if ((c === 'ethereum' || c === 'eth') && (n === 'sepolia' || n === 'testnet')) {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }
  if ((c === 'ethereum' || c === 'eth') && (n === 'mainnet' || n === 'main')) {
    return `https://etherscan.io/tx/${txHash}`;
  }

  // Fallback par défaut : Base Sepolia
  return `https://sepolia.basescan.org/tx/${txHash}`;
}

export default async function PassportPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;

  const product = await prisma.product.findFirst({
    where: { publicId },
    select: {
      id: true,
      name: true,
      sku: true,
      gtin: true,
      evidences: {
        select: {
          id: true,
          filename: true,
          mimeType: true,
          byteSize: true,
          sha256Hex: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!product) return notFound();

  // 🔁 Recharge anchoring + URL d’explorateur pour chaque preuve
  const evidences = await Promise.all(
    product.evidences.map(async (ev) => {
      const anchoring = await prisma.anchoring.findUnique({ where: { evidenceId: ev.id } });
      const explorerUrl = anchoring
        ? getExplorerTxUrl(anchoring.chain, anchoring.network, anchoring.txHash)
        : null;
      return { ...ev, anchoring, explorerUrl };
    })
  );

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Passeport produit</h1>
      <p><strong>Nom :</strong> {product.name}</p>
      <p><strong>SKU :</strong> {product.sku}{product.gtin ? ` • GTIN: ${product.gtin}` : ''}</p>

      <section style={{ marginTop: 24 }}>
        <h2>Preuves</h2>
        {evidences.length === 0 && <p>Aucune preuve déposée pour le moment.</p>}
        <ul>
          {evidences.map((ev) => (
            <li key={ev.id} style={{ marginBottom: 12 }}>
              <div><strong>{ev.filename}</strong> — {ev.mimeType} — {ev.byteSize} octets</div>

              <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, wordBreak: 'break-all' }}>
                SHA-256: {ev.sha256Hex}
              </div>

              {ev.anchoring ? (
                <div style={{ fontSize: 14 }}>
                  Ancré sur {ev.anchoring.chain}/{ev.anchoring.network} — Tx:{' '}
                  <a
                    href={ev.explorerUrl!}
                    target="_blank"
                    rel="noreferrer"
                    title={ev.anchoring.txHash}
                  >
                    {shortHash(ev.anchoring.txHash)}
                  </a>{' '}
                  — Bloc: {ev.anchoring.blockNumber ?? 'N/A'} —{' '}
                  {new Date(ev.anchoring.anchoredAt).toLocaleString()}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: '#6b7280' }}>Non ancré on-chain</div>
              )}

              <div style={{ fontSize: 14 }}>
                Vérifier le hash : <a href={`/api/verify?hash=${ev.sha256Hex}`}>/api/verify?hash={ev.sha256Hex}</a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p style={{ marginTop: 24, color: '#6b7280' }}>
        Ce passeport expose des empreintes cryptographiques et des liens d’ancrage. Les documents originaux restent stockés hors-chaîne.
      </p>
    </main>
  );
}

