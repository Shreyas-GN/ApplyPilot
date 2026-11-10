import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { getResume } from '@/lib/server/resumes';

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
    const resume = await getResume(user.id, id);
    return NextResponse.json({
      processingStatus: resume.processingStatus,
      parsingJobStatus: resume.parsingJobStatus,
      error: resume.processingError,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Resume not found.';
    return NextResponse.json({ detail: message }, { status: 404 });
  }
}
