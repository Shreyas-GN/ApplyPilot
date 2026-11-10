import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { replaceExperience } from '@/lib/server/profile';
import { replaceWorkExperienceSchema } from '@applypilot/validators';

export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = replaceWorkExperienceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { detail: result.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const updated = await replaceExperience(user.id, result.data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to replace experience:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
