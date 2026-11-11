import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/supabase/auth';
import {
  createPairingToken,
  listExtensionSessions,
} from '@/lib/server/extension';

const createSessionSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
});

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessions = await listExtensionSessions(user.id);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to list extension sessions:', error);
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
    const body = await request.json().catch(() => ({}));
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: 'Invalid extension session label.' },
        { status: 400 }
      );
    }

    const result = await createPairingToken(user.id, parsed.data.label);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create pairing token:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

