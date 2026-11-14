import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { listMatchedJobs, type DiscoverJobsTab } from '@/lib/server/jobs';

const VALID_TABS = new Set<DiscoverJobsTab>(['for_you', 'search', 'adjacent', 'saved']);
const VALID_FRESHNESS = new Set(['all', '24h', '7d', '30d']);

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawTab = searchParams.get('tab');
    const tab =
      rawTab && VALID_TABS.has(rawTab as DiscoverJobsTab)
        ? (rawTab as DiscoverJobsTab)
        : undefined;
    const q = searchParams.get('q') ?? undefined;
    const workMode = searchParams.get('workMode') ?? undefined;
    const seniority = searchParams.get('seniority') ?? undefined;
    const rawMinScore = searchParams.get('minScore');
    const minScore = rawMinScore ? Number.parseInt(rawMinScore, 10) || 0 : 0;
    const rawFreshness = searchParams.get('freshness');
    const freshness =
      rawFreshness && VALID_FRESHNESS.has(rawFreshness)
        ? (rawFreshness as 'all' | '24h' | '7d' | '30d')
        : 'all';
    const includeDismissed = searchParams.get('includeDismissed') === 'true';
    const experienceLevel = searchParams.get('experienceLevel') ?? undefined;
    const locationCountry = searchParams.get('locationCountry') ?? undefined;
    const source = searchParams.get('source') ?? undefined;
    const rawSkills = searchParams.get('skills');
    const skillsFilter = rawSkills ? rawSkills.split(',').filter(Boolean) : undefined;

    const results = await listMatchedJobs(user.id, {
      tab,
      q,
      workMode,
      minScore,
      freshness,
      seniority,
      experienceLevel,
      locationCountry,
      source,
      skillsFilter,
      includeDismissed,
    });
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to list matched jobs:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
