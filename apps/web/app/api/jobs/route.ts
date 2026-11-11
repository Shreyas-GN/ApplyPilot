import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { listMatchedJobs } from '@/lib/server/jobs';

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? undefined;
    const workMode = searchParams.get('workMode') ?? undefined;

    const results = await listMatchedJobs(user.id, { q, workMode });
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to list matched jobs:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

