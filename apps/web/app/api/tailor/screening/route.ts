import { NextRequest, NextResponse } from 'next/server';
import { screeningQuestionSchema } from '@applyfocus/validators';
import { getUser } from '@/lib/supabase/auth';
import { answerScreeningQuestion } from '@/lib/server/tailoring';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = screeningQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const result = await answerScreeningQuestion(user.id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to answer screening question:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

