import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const needAuth = !!(process.env.BASIC_AUTH_USER && process.env.BASIC_AUTH_PASS);
  if (!needAuth) return NextResponse.next();

  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Basic ')) {
    const [, b64] = auth.split(' ');
    const [user, pass] = Buffer.from(b64, 'base64').toString().split(':');
    if (user === process.env.BASIC_AUTH_USER && pass === process.env.BASIC_AUTH_PASS) {
      return NextResponse.next();
    }
  }
  return new NextResponse('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="admin"' },
  });
}

export const config = {
  matcher: ['/', '/api/:path*'], // protège l’admin et les API
};
