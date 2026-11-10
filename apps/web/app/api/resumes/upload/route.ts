import { NextRequest, NextResponse, after } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { uploadResume } from '@/lib/server/resumes';
import { processResumeBackground } from '@/lib/server/resume-parsing';

export const maxDuration = 60; // Allow sufficient serverless execution time for parsing

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const versionLabel = (formData.get('versionLabel') as string | null) ?? undefined;

    if (!file) {
      return NextResponse.json(
        { detail: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const resumeDto = await uploadResume(
      user.id,
      {
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        buffer,
      },
      versionLabel
    );

    // Run AI parsing in background after returning response
    after(async () => {
      await processResumeBackground(resumeDto.id, user.id);
    });

    return NextResponse.json(resumeDto, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Upload failed. Please try again.';
    console.error('Failed to upload resume:', error);
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
