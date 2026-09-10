import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function handleProxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get('fireslab_admin_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Admin session missing.' }, { status: 401 });
    }

    const targetPath = path.join('/');
    const search = request.nextUrl.search;
    const targetUrl = `${BACKEND_URL}/${targetPath}${search}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    const contentType = request.headers.get('content-type');
    let body: BodyInit | null = null;

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (contentType && contentType.includes('multipart/form-data')) {
        // Forward raw arrayBuffer and exact boundary header
        body = await request.arrayBuffer();
        headers['Content-Type'] = contentType;
      } else if (contentType && contentType.includes('application/json')) {
        body = await request.text();
        headers['Content-Type'] = 'application/json';
      } else {
        body = await request.text();
        if (contentType) headers['Content-Type'] = contentType;
      }
    }

    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    const resContentType = backendRes.headers.get('content-type') || '';
    if (resContentType.includes('application/json')) {
      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status });
    }

    const text = await backendRes.text();
    return new NextResponse(text, {
      status: backendRes.status,
      headers: { 'Content-Type': resContentType },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy communication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
