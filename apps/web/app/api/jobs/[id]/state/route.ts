import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { jobStateSchema } from '@applypilot/validators';
import { getUser } from '@/lib/supabase/auth';
import { clearJobState, setJobState } from '@/lib/server/jobs';

const uuidSchema = z.string().uuid();

export async function PUT(
  request: NextRequest,
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
    const body = await request.json();
    const parsed = jobStateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const result = await setJobState(user.id, id, parsed.data.state);
    if (!result) {
      return NextResponse.json({ detail: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update job state:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
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

  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ detail: 'Invalid job ID' }, { status: 400 });
  }

  try {
    const cleared = await clearJobState(user.id, id);
    return NextResponse.json({ cleared });
  } catch (error) {
    console.error('Failed to clear job state:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

