import { NextResponse } from 'next/server';

export function extCorsHeaders(origin?: string | null): Record<string, string> {
  const allowOrigin =
    origin &&
    (origin.startsWith('chrome-extension://') ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('https://'))
      ? origin
      : '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export function extOptionsResponse(origin?: string | null): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: extCorsHeaders(origin),
  });
}

