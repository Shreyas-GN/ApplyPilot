import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/supabase/auth';
import {
  createApplication,
  listApplications,
} from '@/lib/server/applications';

const createApplicationSchema = z.object({
  jobId: z.string().uuid().optional(),
  company: z.string().trim().min(1, 'Company is required').max(200),
  title: z.string().trim().min(1, 'Title is required').max(200),
  location: z.string().trim().max(200).nullable().optional(),
  url: z
    .string()
    .trim()
    .refine((v) => !v || /^https?:\/\/.+/i.test(v), 'Enter a valid URL')
    .nullable()
    .optional(),
  status: z
    .enum(['saved', 'preparing', 'ready_to_apply', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'])
    .optional(),
  matchScore: z.number().int().min(0).max(100).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const items = await listApplications(user.id);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to list applications:', error);
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
    const parsed = createApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const created = await createApplication(user.id, parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create application';
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}

