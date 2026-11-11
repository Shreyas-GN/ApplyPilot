import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { getDownloadUrl } from '@/lib/server/resumes';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const download = await getDownloadUrl(user.id, id);
    return NextResponse.json(download);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate download URL.';
    return NextResponse.json({ detail: message }, { status: 404 });
  }
}

