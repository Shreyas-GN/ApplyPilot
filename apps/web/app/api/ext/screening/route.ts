import { NextRequest, NextResponse } from 'next/server';
import { screeningQuestionSchema } from '@applyfocus/validators';
import { extCorsHeaders, extOptionsResponse } from '@/lib/server/ext-cors';
import { verifyExtensionBearer } from '@/lib/server/extension';
import { answerScreeningQuestion } from '@/lib/server/tailoring';

export const maxDuration = 60;

export async function OPTIONS(request: NextRequest) {
  return extOptionsResponse(request.headers.get('origin'));
}

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
    const parsed = screeningQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400, headers }
      );
    }

    const result = await answerScreeningQuestion(auth.userId, parsed.data);
    return NextResponse.json(result, { headers });
  } catch (error) {
    console.error('Failed to answer extension screening question:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500, headers }
    );
  }
}

