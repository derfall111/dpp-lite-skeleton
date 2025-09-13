import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';

function nanoid() { return randomBytes(10).toString('hex'); }

export async function GET() {
  const items = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sku, name, gtin, category, description } = body ?? {};
  if (!sku || !name) {
    return NextResponse.json({ error: 'sku and name are required' }, { status: 400 });
  }
  const created = await prisma.product.create({
    data: { sku, name, gtin, category, description, publicId: nanoid() }
  });
  return NextResponse.json(created, { status: 201 });
}
