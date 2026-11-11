import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { replaceEducation } from '@/lib/server/profile';
import { replaceEducationSchema } from '@applypilot/validators';

export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = replaceEducationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { detail: result.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const updated = await replaceEducation(user.id, result.data, user.email ?? null);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to replace education:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

