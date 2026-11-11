import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extCorsHeaders, extOptionsResponse } from '@/lib/server/ext-cors';
import {
  captureApplicationFromExtension,
  verifyExtensionBearer,
} from '@/lib/server/extension';

export async function OPTIONS(request: NextRequest) {
  return extOptionsResponse(request.headers.get('origin'));
}

const captureSchema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(200),
  title: z.string().trim().min(1, 'Title is required').max(200),
  location: z.string().trim().max(200).nullable().optional(),
  url: z.string().trim().url('Valid job URL is required'),
  ats: z.string().trim().max(60).optional(),
  status: z
    .enum(['saved', 'applied', 'interviewing', 'offer', 'rejected'])
    .optional(),
  filledFields: z.array(z.string().trim().max(100)).max(30).optional(),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = extCorsHeaders(origin);

  const auth = await verifyExtensionBearer(request.headers.get('authorization'));
  if (!auth) {
    return NextResponse.json(
      { detail: 'Invalid or revoked extension token' },
      { status: 401, headers }
    );
  }

  try {
    const body = await request.json();
    const parsed = captureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400, headers }
      );
    }

    const app = await captureApplicationFromExtension(auth.userId, parsed.data);
    return NextResponse.json(app, { status: 201, headers });
  } catch (error) {
    console.error('Failed to capture extension application:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500, headers }
    );
  }
}

