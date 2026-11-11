import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/supabase/auth';
import { getJobDetail } from '@/lib/server/jobs';

const uuidSchema = z.string().uuid();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ detail: 'Invalid job ID' }, { status: 400 });
  }

  try {
    const detail = await getJobDetail(user.id, id);
    if (!detail) {
      return NextResponse.json({ detail: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    console.error('Failed to load job detail:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

