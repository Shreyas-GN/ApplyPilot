import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { exportUserData } from '@/lib/server/account';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bundle = await exportUserData(user.id);
    const filename = `applypilot-export-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export user data:', error);
    return NextResponse.json(
      { detail: 'Failed to export user data' },
      { status: 500 }
    );
  }
}

