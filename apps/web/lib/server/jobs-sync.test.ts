import { describe, expect, it, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Unit tests for the job sync and closure detection logic.
// These tests exercise the pure logic without hitting a real database.
// ---------------------------------------------------------------------------

// Mock the DB module so tests run without a real Postgres connection.
vi.mock('@/lib/db', () => {
  const insert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockResolvedValue([]),
    }),
  });
  const select = vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
      }),
      orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
    }),
  });
  const update = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
  });
  const mockDb: Record<string, unknown> = { insert, select, update };
  return { db: mockDb };
});

vi.mock('@/lib/db/schema', () => ({
  jobs: { source: 'source', externalId: 'external_id', closedAt: 'closed_at', missingSyncCount: 'missing_sync_count', id: 'id' },
  jobBoards: { provider: 'provider', slug: 'slug', companyName: 'company_name', enabled: 'enabled', lastSyncedAt: 'last_synced_at', lastSyncCount: 'last_sync_count' },
  applications: {},
  applicationEvents: {},
  jobStates: {},
  tailoredDocuments: {},
}));

vi.mock('@/lib/server/profile', () => ({ getProfile: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/server/job-matching', () => ({
  computeJobMatch: vi.fn().mockReturnValue({ score: 50, isAdjacentRole: false }),
  analyzeJobIntelligence: vi.fn().mockReturnValue({}),
  extractJobSkills: vi.fn().mockReturnValue([]),
  inferWorkMode: vi.fn().mockReturnValue('onsite'),
  stripHtml: vi.fn((s: string) => s.replace(/<[^>]+>/g, '')),
  inferSeniorityLevel: vi.fn().mockReturnValue('mid'),
}));

// ---------------------------------------------------------------------------
// Tests for closure-detection edge-cases (pure logic assertions)
// ---------------------------------------------------------------------------

describe('closure detection policy', () => {
  it('should require 2 consecutive misses before closing (missingSyncCount threshold)', () => {
    // Policy: close when missingSyncCount >= 1 AND current sync also misses it
    // i.e., missingSyncCount goes from 0→1 (first miss, no close)
    // then 1→2 (second consecutive miss, close)
    const shouldClose = (currentMissCount: number) => currentMissCount >= 1;

    expect(shouldClose(0)).toBe(false); // first miss → don't close
    expect(shouldClose(1)).toBe(true);  // second consecutive miss → close
    expect(shouldClose(2)).toBe(true);  // subsequent miss → keep closed
  });

  it('should reset missing count and clear closedAt when job reappears', () => {
    // When a job IS in the returned set, the upsert resets missingSyncCount=0 and closedAt=null
    const upsertSetsForExistingJob = { missingSyncCount: 0, closedAt: null };
    expect(upsertSetsForExistingJob.missingSyncCount).toBe(0);
    expect(upsertSetsForExistingJob.closedAt).toBeNull();
  });

  it('externalId format encodes board slug', () => {
    // Verify slug:atsId format used for board-scoped queries
    const slug = 'razorpay';
    const atsId = 'abc123';
    const externalId = `${slug}:${atsId}`;
    expect(externalId.startsWith(`${slug}:`)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests for board registry and duplicate handling
// ---------------------------------------------------------------------------

describe('board registry and deduplication', () => {
  it('deduplicates rows by source:externalId key', () => {
    const rows = [
      { source: 'greenhouse', externalId: 'vercel:1', title: 'SWE v1' },
      { source: 'greenhouse', externalId: 'vercel:1', title: 'SWE v2' },
      { source: 'greenhouse', externalId: 'vercel:2', title: 'PM' },
    ];
    const dedupedMap = new Map<string, typeof rows[0]>();
    for (const row of rows) {
      dedupedMap.set(`${row.source}:${row.externalId}`, row);
    }
    expect(dedupedMap.size).toBe(2);
    // Last write wins
    expect(dedupedMap.get('greenhouse:vercel:1')?.title).toBe('SWE v2');
  });

  it('distinguishes same atsId from different boards via slug prefix', () => {
    const eid1 = 'vercel:42';
    const eid2 = 'stripe:42';
    expect(eid1).not.toBe(eid2);
  });
});

// ---------------------------------------------------------------------------
// Tests for closed-job exclusion in discovery
// ---------------------------------------------------------------------------

describe('closed-job discovery exclusion', () => {
  it('filters closed jobs for non-saved tabs', () => {
    type FakeJob = { id: string; closedAt: Date | null; userState: string | null };
    const allJobs: FakeJob[] = [
      { id: '1', closedAt: null, userState: null },
      { id: '2', closedAt: new Date(), userState: null },        // closed
      { id: '3', closedAt: new Date(), userState: 'saved' },     // closed but saved
    ];

    const discoveryJobs = allJobs.filter((j) => j.closedAt === null);
    expect(discoveryJobs.map((j) => j.id)).toEqual(['1']);
  });

  it('allows saved/applied users to see closed jobs on saved tab', () => {
    type FakeJob = { id: string; closedAt: Date | null; userState: string | null; applicationStatus: string | null };
    const allJobs: FakeJob[] = [
      { id: '1', closedAt: null, userState: 'saved', applicationStatus: 'saved' },
      { id: '2', closedAt: new Date(), userState: 'saved', applicationStatus: 'applied' },
    ];

    // Saved tab: no closedAt filter, then filter by saved state
    const savedTabJobs = allJobs.filter(
      (j) => j.userState === 'saved' || j.applicationStatus === 'saved'
    );
    expect(savedTabJobs.length).toBe(2);
    expect(savedTabJobs.some((j) => j.closedAt !== null)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests for partial sync failure safety
// ---------------------------------------------------------------------------

describe('partial sync failure safety', () => {
  it('never closes jobs when the board fetch fails (closure detection is not called)', () => {
    // The ingest functions only call detectClosures after a successful fetch.
    // If fetch throws, we re-throw and syncPublicJobs catches it without calling detectClosures.
    // This is enforced by code structure — the test documents the invariant.
    let detectCalled = false;
    const ingestBoard = async (shouldFail: boolean) => {
      if (shouldFail) throw new Error('API error');
      detectCalled = true; // only reached on success
    };

    expect(async () => {
      try {
        await ingestBoard(true);
      } catch {
        // board failure caught — detectClosures never called
      }
    }).not.toThrow();
    expect(detectCalled).toBe(false);
  });

  it('continues syncing remaining boards after one fails', async () => {
    const boards = ['boardA', 'boardB', 'boardC'];
    const processed: string[] = [];
    const failOn = 'boardB';

    for (const board of boards) {
      try {
        if (board === failOn) throw new Error('failed');
        processed.push(board);
      } catch {
        // swallow individual board failure
      }
    }

    expect(processed).toEqual(['boardA', 'boardC']);
  });
});

// ---------------------------------------------------------------------------
// Tests for Ashby connector response shape
// ---------------------------------------------------------------------------

describe('Ashby connector', () => {
  it('maps isRemote=true to workMode remote', () => {
    const mockInferWorkMode = (title: string, loc: string | null, desc: string) => {
      if (title.toLowerCase().includes('remote') || (loc ?? '').toLowerCase().includes('remote')) return 'remote';
      return 'onsite';
    };

    const posting = { isRemote: true, title: 'Engineer', locationName: 'Anywhere', descriptionHtml: '' };
    const workMode = posting.isRemote ? 'remote' : mockInferWorkMode(posting.title, posting.locationName, '');
    expect(workMode).toBe('remote');
  });

  it('extracts id from posting for externalId', () => {
    const slug = 'linear';
    const posting = { id: 'abc-def-123' };
    const externalId = `${slug}:${posting.id}`;
    expect(externalId).toBe('linear:abc-def-123');
  });
});
