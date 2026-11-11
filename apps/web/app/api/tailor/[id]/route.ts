import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getUser } from '@/lib/supabase/auth';
import {
  deleteTailoredDocument,
  updateTailoredDocument,
} from '@/lib/server/tailoring';

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
    const updated = await updateTailoredDocument(user.id, id, body.content);
    if (!updated) {
      return NextResponse.json(
        { detail: 'Tailored document not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { detail: error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }
    console.error('Failed to update tailored document:', error);
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

  try {
    const { id } = await params;
    const deleted = await deleteTailoredDocument(user.id, id);
    if (!deleted) {
      return NextResponse.json(
        { detail: 'Tailored document not found' },
        { status: 404 }
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete tailored document:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

