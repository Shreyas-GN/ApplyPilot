import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/supabase/auth';
import { syncPublicJobs } from '@/lib/server/jobs';

const syncSchema = z
  .object({
    provider: z.enum(['greenhouse', 'lever', 'ashby']),
    slug: z.string().trim().min(1).max(100),
    companyName: z.string().trim().min(1).max(100),
  })
  .optional();

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    let customBoards;
    const text = await request.text();
    if (text) {
      const parsed = syncSchema.safeParse(JSON.parse(text));
      if (!parsed.success) {
        return NextResponse.json(
          { detail: parsed.error.issues.map((i) => i.message).join(', ') },
          { status: 400 }
        );
      }
      if (parsed.data) {
        customBoards = [parsed.data];
      }
    }

    const result = await syncPublicJobs(customBoards);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to sync jobs:', error);
    return NextResponse.json(
      { detail: 'Failed to sync public job boards' },
      { status: 500 }
    );
  }
}

