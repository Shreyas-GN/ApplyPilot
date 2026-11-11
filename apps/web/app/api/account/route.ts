import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/supabase/auth';
import { deleteUserAccount } from '@/lib/server/account';

const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE'),
});

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: 'Type DELETE to confirm account deletion.' },
        { status: 400 }
      );
    }

    await deleteUserAccount(user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete account.';
    console.error('Account deletion error:', error);
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

