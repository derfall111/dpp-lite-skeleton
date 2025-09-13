'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type Product = {
  id: string;
  publicId: string;
  sku: string;
  name: string;
  gtin?: string;
  category?: string;
  description?: string;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [qr, setQr] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.items ?? []);
  }

  useEffect(() => { load(); }, []);

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, name }),
    });
    if (res.ok) {
      setSku(''); setName('');
      await load();
    } else {
      alert('Error creating product');
    }
  }

  async function makeQR(publicId: string) {
    const url = `${window.location.origin}/public/passport/${publicId}`;
    const dataUrl = await QRCode.toDataURL(url);
    setQr(dataUrl);
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>DPP‑lite Admin (MVP)</h1>
      <form onSubmit={createProduct} style={{ display: 'grid', gap: 12, marginTop: 12, marginBottom: 24 }}>
        <input placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} required />
        <input placeholder="Nom du produit" value={name} onChange={e => setName(e.target.value)} required />
        <button type="submit">Créer le produit</button>
      </form>

      <h2>Produits</h2>
      <ul>
        {products.map(p => (
          <li key={p.id} style={{ marginBottom: 8 }}>
            <strong>{p.sku}</strong> — {p.name} — <code>{p.publicId}</code>
            {' '}<button onClick={() => makeQR(p.publicId)}>QR</button>
          </li>
        ))}
      </ul>

      {qr && (
        <div style={{ marginTop: 16 }}>
          <h3>QR (passeport public)</h3>
          <img src={qr} alt="qr" width={200} height={200} />
        </div>
      )}

      <hr style={{ margin: '24px 0' }} />

      <h2>Uploader une preuve (fichier)</h2>
      <EvidenceUpload products={products} />
    </main>
  );
}

function EvidenceUpload({ products }: { products: Product[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [productId, setProductId] = useState<string>('');
  const [issuer, setIssuer] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { alert('Choisis un fichier'); return; }
    const fd = new FormData();
    fd.append('file', file);
    if (productId) fd.append('productId', productId);
    if (issuer) fd.append('issuer', issuer);
    const res = await fetch('/api/evidences', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) { alert('Erreur: ' + (data?.error ?? '')); return; }
    alert('Preuve enregistrée. SHA-256: ' + data.sha256Hex);
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
      <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <select value={productId} onChange={e => setProductId(e.target.value)}>
        <option value="">(Optionnel) Associer à un produit</option>
        {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
      </select>
      <input placeholder="Émetteur (ex: Labo XYZ)" value={issuer} onChange={e => setIssuer(e.target.value)} />
      <button type="submit">Uploader & hacher</button>
    </form>
  );
}
