import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/supabase/auth';
import {
  createTailoredDocument,
  listTailoredDocuments,
} from '@/lib/server/tailoring';

export const maxDuration = 60;

const createTailorSchema = z.object({
  type: z.enum(['resume', 'cover_letter']),
  tone: z.enum(['formal', 'conversational', 'concise']).optional(),
  jobId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  company: z.string().trim().max(200).optional(),
  jobTitle: z.string().trim().max(200).optional(),
  jobDescription: z.string().trim().max(25000).optional(),
});

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId') || undefined;
    const applicationId = searchParams.get('applicationId') || undefined;
    const docs = await listTailoredDocuments(user.id, { jobId, applicationId });
    return NextResponse.json(docs);
  } catch (error) {
    console.error('Failed to list tailored documents:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createTailorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const doc = await createTailoredDocument(user.id, parsed.data);
    return NextResponse.json(doc, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to tailor document.';
    const status =
      message.includes('not found')
        ? 404
        : message.includes('required') ||
            message.includes('profile') ||
            message.includes('ANTHROPIC_API_KEY')
          ? 400
          : 500;
    return NextResponse.json({ detail: message }, { status });
  }
}

