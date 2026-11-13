import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { getProfile, updateBasicInfo } from '@/lib/server/profile';
import { updateProfileSchema } from '@applyfocus/validators';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await getProfile(user.id, user.email ?? null);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to get profile:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { detail: result.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const updated = await updateBasicInfo(user.id, result.data, user.email ?? null);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update basic info:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

