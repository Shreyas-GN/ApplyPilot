import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { getResume, deleteResume } from '@/lib/server/resumes';

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
    return NextResponse.json(resume);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Resume not found.';
    return NextResponse.json({ detail: message }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteResume(user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete resume.';
    return NextResponse.json({ detail: message }, { status: 404 });
  }
}
