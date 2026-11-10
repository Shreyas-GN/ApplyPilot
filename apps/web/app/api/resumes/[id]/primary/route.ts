import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { setPrimaryResume } from '@/lib/server/resumes';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const updated = await setPrimaryResume(user.id, id);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to set primary resume.';
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
