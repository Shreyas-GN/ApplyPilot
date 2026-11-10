import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { listResumes } from '@/lib/server/resumes';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resumes = await listResumes(user.id);
    return NextResponse.json(resumes);
  } catch (error) {
    console.error('Failed to list resumes:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
