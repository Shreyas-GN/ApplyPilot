import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { replaceSkills } from '@/lib/server/profile';
import { replaceSkillsSchema } from '@applyfocus/validators';

export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = replaceSkillsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { detail: result.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const updated = await replaceSkills(user.id, result.data, user.email ?? null);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to replace skills:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

