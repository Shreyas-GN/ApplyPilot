import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { getParsedData, updateParsedData } from '@/lib/server/resumes';
import { resumeParsedDataSchema } from '@applypilot/validators';

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
    const parsed = await getParsedData(user.id, id);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Parsed data not found.';
    return NextResponse.json({ detail: message }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const result = resumeParsedDataSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { detail: result.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const updated = await updateParsedData(user.id, id, result.data);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to update parsed data.';
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
