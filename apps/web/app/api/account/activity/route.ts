import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { listAccountActivity } from '@/lib/server/account';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const items = await listAccountActivity(user.id);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to load account activity:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

