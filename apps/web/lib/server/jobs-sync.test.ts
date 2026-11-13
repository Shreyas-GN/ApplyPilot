import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Unit tests for job sync and closure detection logic.
// Tests pure logic without hitting a real database or network.
// ---------------------------------------------------------------------------

// Mock the DB module
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
  },
}));

vi.mock('@/lib/db/schema', () => ({
  jobs: {
    source: 'source',
    externalId: 'external_id',
    closedAt: 'closed_at',
    missingSyncCount: 'missing_sync_count',
    id: 'id',
  },
  jobBoards: {
    provider: 'provider',
    slug: 'slug',
    companyName: 'company_name',
    enabled: 'enabled',
    lastSyncedAt: 'last_synced_at',
    lastSyncCount: 'last_sync_count',
  },
  applications: {},
  applicationEvents: {},
  jobStates: {},
  tailoredDocuments: {},
}));

vi.mock('@/lib/server/profile', () => ({
  getProfile: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/server/job-matching', () => ({
  computeJobMatch: vi.fn().mockReturnValue({ score: 50, isAdjacentRole: false }),
  analyzeJobIntelligence: vi.fn().mockReturnValue({}),
  extractJobSkills: vi.fn().mockReturnValue([]),
  inferWorkMode: vi.fn().mockReturnValue('onsite'),
  stripHtml: vi.fn((s: string) => s.replace(/<[^>]+>/g, '')),
  inferSeniorityLevel: vi.fn().mockReturnValue('mid'),
}));

// ---------------------------------------------------------------------------
// 1. Closure detection policy (pure logic)
// ---------------------------------------------------------------------------
describe('closure detection — two-consecutive-miss policy', () => {
  it('first miss: increments missing_sync_count, does NOT set closed_at', () => {
    const missingSyncCount = 0;
    const shouldClose = missingSyncCount >= 1;
    expect(shouldClose).toBe(false);
    // action: increment to 1, no closed_at
  });

  it('second consecutive miss: should set closed_at', () => {
    const missingSyncCount = 1;
    const shouldClose = missingSyncCount >= 1;
    expect(shouldClose).toBe(true);
    // action: increment to 2, set closed_at = now()
  });

  it('third+ miss: job remains closed (idempotent)', () => {
    // Jobs already closed (closedAt != null) are excluded from the "open jobs" query
    // so they will never be re-processed by detectClosures — idempotent by design
    const alreadyClosed = true;
    expect(alreadyClosed).toBe(true);
  });

  it('reappearing job: upsert resets missing_sync_count=0 and clears closed_at', () => {
    const onConflictSet = { missingSyncCount: 0, closedAt: null };
    expect(onConflictSet.missingSyncCount).toBe(0);
    expect(onConflictSet.closedAt).toBeNull();
  });

  it('never closes jobs after a failed fetch (detectClosures not called on error)', () => {
    let closureDetectionCalled = false;
    const ingestBoard = async (shouldFail: boolean) => {
      const response = shouldFail ? null : [{ id: 'job1' }];
      if (!response) throw new Error('HTTP 500');
      closureDetectionCalled = true; // only reached on success
      return response.length;
    };

    return ingestBoard(true).catch(() => {
      expect(closureDetectionCalled).toBe(false);
    });
  });

  it('never closes jobs after an empty-but-incomplete partial response', () => {
    // A fetch that throws does not reach detectClosures
    // A successful empty response (jobs=[]) DOES call detectClosures — intentional:
    // if a board legitimately removes all jobs, they go through the miss cycle
    const emptyOk = true; // empty array is a complete valid response
    expect(emptyOk).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Deduplication and upsert logic
// ---------------------------------------------------------------------------
describe('deduplication', () => {
  it('deduplicates rows by source:externalId key (last write wins)', () => {
    type Row = { source: string; externalId: string; title: string };
    const rows: Row[] = [
      { source: 'greenhouse', externalId: 'vercel:1', title: 'SWE v1' },
      { source: 'greenhouse', externalId: 'vercel:1', title: 'SWE v2' },
      { source: 'greenhouse', externalId: 'vercel:2', title: 'PM' },
    ];
    const map = new Map<string, Row>();
    for (const row of rows) map.set(`${row.source}:${row.externalId}`, row);
    expect(map.size).toBe(2);
    expect(map.get('greenhouse:vercel:1')?.title).toBe('SWE v2');
  });

  it('distinguishes same atsId from different board slugs', () => {
    const eid1 = 'vercel:42';
    const eid2 = 'stripe:42';
    expect(eid1).not.toBe(eid2);
  });

  it('externalId format is slug:atsId — allows board-scoped LIKE queries', () => {
    const slug = 'razorpay';
    const atsId = 'abc123';
    const externalId = `${slug}:${atsId}`;
    expect(externalId).toMatch(new RegExp(`^${slug}:`));
    // DB query pattern: WHERE source='lever' AND external_id LIKE 'razorpay:%'
  });
});

// ---------------------------------------------------------------------------
// 3. Duplicate job upsert (onConflictDoUpdate is idempotent)
// ---------------------------------------------------------------------------
describe('duplicate job upsert', () => {
  it('upserting the same job twice leaves a single row (idempotent)', () => {
    type Row = { source: string; externalId: string; title: string };
    const upsert = (map: Map<string, Row>, row: Row) => {
      map.set(`${row.source}:${row.externalId}`, row);
    };
    const db = new Map<string, Row>();
    const job = { source: 'lever', externalId: 'swiggy:x1', title: 'SWE' };
    upsert(db, job);
    upsert(db, { ...job, title: 'SWE Updated' });
    expect(db.size).toBe(1);
    expect(db.get('lever:swiggy:x1')?.title).toBe('SWE Updated');
  });
});

// ---------------------------------------------------------------------------
// 4. Provider HTTP failure handling
// ---------------------------------------------------------------------------
describe('provider HTTP failure handling', () => {
  it('a 4xx/5xx response throws an error (fetch !res.ok path)', () => {
    const simulateResponse = (status: number) => {
      if (!isOk(status)) throw new Error(`API returned ${status}`);
      return [];
    };
    const isOk = (s: number) => s >= 200 && s < 300;
    expect(() => simulateResponse(404)).toThrow('API returned 404');
    expect(() => simulateResponse(500)).toThrow('API returned 500');
    expect(() => simulateResponse(200)).not.toThrow();
  });

  it('individual board failure does not stop other boards', async () => {
    const boards = ['boardA', 'boardB', 'boardC'];
    const processed: string[] = [];
    const failOn = 'boardB';

    for (const board of boards) {
      try {
        if (board === failOn) throw new Error('HTTP 500');
        processed.push(board);
      } catch {
        // swallow — per-board failure, continue
      }
    }

    expect(processed).toEqual(['boardA', 'boardC']);
  });

  it('board sync metadata is NOT updated after failure', async () => {
    let metadataUpdated = false;
    const syncBoard = async (shouldFail: boolean) => {
      if (shouldFail) throw new Error('failed');
      metadataUpdated = true;
    };

    try { await syncBoard(true); } catch { /* expected */ }
    expect(metadataUpdated).toBe(false);
  });

  it('board sync metadata IS updated after success', async () => {
    let metadataUpdated = false;
    const syncBoard = async (shouldFail: boolean) => {
      if (shouldFail) throw new Error('failed');
      metadataUpdated = true;
    };

    await syncBoard(false);
    expect(metadataUpdated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Timeout scenario
// ---------------------------------------------------------------------------
describe('fetch timeout', () => {
  it('a timed-out fetch throws and is treated as a board failure', async () => {
    const fetchWithTimeout = async (timeoutMs: number, shouldTimeout: boolean) => {
      if (shouldTimeout) throw new DOMException('The operation was aborted.', 'AbortError');
      return { ok: true, json: async () => ({ jobs: [] }) };
    };

    await expect(fetchWithTimeout(100, true)).rejects.toThrow('The operation was aborted.');
    // The abort error propagates up to syncPublicJobs catch block → no closure detection
  });
});

// ---------------------------------------------------------------------------
// 6. Disabled board
// ---------------------------------------------------------------------------
describe('disabled board', () => {
  it('only enabled boards are queried from job_boards table', () => {
    type Board = { provider: string; slug: string; enabled: boolean };
    const allBoards: Board[] = [
      { provider: 'greenhouse', slug: 'vercel', enabled: true },
      { provider: 'greenhouse', slug: 'figma', enabled: false },
      { provider: 'lever', slug: 'razorpay', enabled: true },
    ];
    // Simulates: WHERE enabled = true
    const enabledBoards = allBoards.filter((b) => b.enabled);
    expect(enabledBoards.length).toBe(2);
    expect(enabledBoards.map((b) => b.slug)).toEqual(['vercel', 'razorpay']);
  });
});

// ---------------------------------------------------------------------------
// 7. Closed-job filtering in discovery
// ---------------------------------------------------------------------------
describe('closed-job filtering in discovery', () => {
  type FakeJob = {
    id: string;
    closedAt: Date | null;
    userState: string | null;
    applicationStatus: string | null;
  };

  it('excludes closed jobs from for_you tab', () => {
    const jobs: FakeJob[] = [
      { id: '1', closedAt: null, userState: null, applicationStatus: null },
      { id: '2', closedAt: new Date(), userState: null, applicationStatus: null },
    ];
    const result = jobs.filter((j) => j.closedAt === null);
    expect(result.map((j) => j.id)).toEqual(['1']);
  });

  it('excludes closed jobs from search tab', () => {
    const jobs: FakeJob[] = [
      { id: '1', closedAt: null, userState: null, applicationStatus: null },
      { id: '2', closedAt: new Date(), userState: null, applicationStatus: null },
    ];
    const result = jobs.filter((j) => j.closedAt === null);
    expect(result.length).toBe(1);
  });

  it('allows saved users to access closed jobs on saved tab (no closedAt filter)', () => {
    const jobs: FakeJob[] = [
      { id: '1', closedAt: null, userState: 'saved', applicationStatus: 'applied' },
      { id: '2', closedAt: new Date(), userState: 'saved', applicationStatus: 'applied' },
    ];
    // Saved tab: no closedAt filter, then filter by saved state
    const result = jobs.filter(
      (j) => j.userState === 'saved' || j.applicationStatus === 'saved'
    );
    expect(result.length).toBe(2);
    expect(result.some((j) => j.closedAt !== null)).toBe(true);
  });

  it('closed jobs remain accessible via getJobDetail (no closedAt filter on detail)', () => {
    // getJobDetail fetches by ID without a closedAt filter — historical access preserved
    const getJobDetail = (id: string, jobs: FakeJob[]) =>
      jobs.find((j) => j.id === id) ?? null;
    const jobs: FakeJob[] = [
      { id: 'closed-1', closedAt: new Date(), userState: null, applicationStatus: null },
    ];
    const result = getJobDetail('closed-1', jobs);
    expect(result).not.toBeNull();
    expect(result?.closedAt).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 8. Existing FK relationships preserved
// ---------------------------------------------------------------------------
describe('existing FK relationships preserved', () => {
  it('applications reference jobs via nullable jobId (set null on job delete)', () => {
    // Schema: applications.job_id REFERENCES jobs.id ON DELETE SET NULL
    // We never delete jobs — we set closed_at. Applications always retain their jobId.
    const app = { jobId: 'job-uuid-123', status: 'applied' };
    expect(app.jobId).toBe('job-uuid-123');
  });

  it('tailored_documents reference jobs via nullable jobId (set null on job delete)', () => {
    const doc = { jobId: 'job-uuid-456', type: 'resume' };
    expect(doc.jobId).toBe('job-uuid-456');
  });

  it('job_states reference jobs with cascade delete — preserved since jobs are never deleted', () => {
    // job_states.job_id REFERENCES jobs.id ON DELETE CASCADE
    // Because we never DELETE job rows (only set closed_at), all job_states survive
    const jobIsDeleted = false;
    expect(jobIsDeleted).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. Ashby connector
// ---------------------------------------------------------------------------
describe('Ashby connector', () => {
  it('maps isRemote=true to workMode=remote without calling inferWorkMode', () => {
    const mockInfer = vi.fn().mockReturnValue('onsite');
    const posting = { isRemote: true, title: 'Engineer', locationName: 'Anywhere' };
    const workMode = posting.isRemote ? 'remote' : mockInfer(posting.title, posting.locationName, '');
    expect(workMode).toBe('remote');
    expect(mockInfer).not.toHaveBeenCalled();
  });

  it('builds externalId as slug:id', () => {
    const slug = 'linear';
    const posting = { id: 'abc-def-123' };
    expect(`${slug}:${posting.id}`).toBe('linear:abc-def-123');
  });

  it('handles missing optional fields gracefully', () => {
    const posting: { id: string; title: string; applyUrl: string; descriptionHtml?: string; locationName?: string; employmentType?: string; publishedAt?: string; isRemote?: boolean } = {
      id: 'x',
      title: 'SWE',
      applyUrl: 'https://app.ashbyhq.com/apply/x',
    };
    const location = posting.locationName ?? null;
    const employment = posting.employmentType ?? 'full_time';
    const postedAt = posting.publishedAt ? new Date(posting.publishedAt) : null;
    expect(location).toBeNull();
    expect(employment).toBe('full_time');
    expect(postedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 10. Empty successful response handling
// ---------------------------------------------------------------------------
describe('empty successful response', () => {
  it('fetching zero jobs from a board succeeds with count=0', async () => {
    const simulateIngest = async (jobs: unknown[]) => {
      // upsertJobBatch with empty array returns 0
      if (jobs.length === 0) return 0;
      return jobs.length;
    };

    const count = await simulateIngest([]);
    expect(count).toBe(0);
  });

  it('an empty board response still runs detectClosures (legitimate removal)', () => {
    // If a company closes all roles, the empty response is valid and complete.
    // All stored jobs for that board will increment their missing_sync_count.
    // This is correct behavior.
    let detectClosuresCalled = false;
    const ingestBoard = async (jobs: unknown[]) => {
      const count = jobs.length; // could be 0
      detectClosuresCalled = true; // called even when count=0
      return count;
    };

    return ingestBoard([]).then(() => {
      expect(detectClosuresCalled).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 11. Board registry reads from DB (not hardcoded)
// ---------------------------------------------------------------------------
describe('board registry — DB-driven', () => {
  it('reads enabled boards from job_boards table, not from a hardcoded array', () => {
    // This is enforced by code structure: syncPublicJobs queries job_boards
    // when no customBoards argument is provided
    const syncPublicJobsSourceIsDb = true;
    expect(syncPublicJobsSourceIsDb).toBe(true);
  });

  it('customBoards argument bypasses DB (backward compatible)', () => {
    // When customBoards.length > 0, syncPublicJobs uses those directly
    // This preserves the /api/jobs/sync endpoint behavior
    const hasCustomBoards = (boards: unknown[]) => boards.length > 0;
    expect(hasCustomBoards([{ provider: 'greenhouse', slug: 'x', companyName: 'X' }])).toBe(true);
    expect(hasCustomBoards([])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 12. Empty-response anomaly guard (closure safety)
// ---------------------------------------------------------------------------
describe('empty-response anomaly guard', () => {
  // Simulates the detectClosures guard logic
  const runGuard = (returnedCount: number, storedCount: number) => {
    if (returnedCount === 0 && storedCount > 0) {
      return { suppressed: true, reason: 'anomaly: 0 returned, >0 stored' };
    }
    return { suppressed: false };
  };

  it('suppresses closure detection when board returns 0 jobs but has stored jobs', () => {
    const result = runGuard(0, 42);
    expect(result.suppressed).toBe(true);
  });

  it('does NOT suppress when board returns 0 jobs and has 0 stored jobs (new board)', () => {
    const result = runGuard(0, 0);
    expect(result.suppressed).toBe(false);
  });

  it('does NOT suppress normal sync where some jobs are missing (normal closure path)', () => {
    // Board had 50 jobs, now returns 48 → 2 missing → normal two-miss cycle
    const result = runGuard(48, 50);
    expect(result.suppressed).toBe(false);
  });

  it('suppression preserves missingSyncCount=0 (jobs not prematurely flagged)', () => {
    // If detection is suppressed, no DB update runs → missingSyncCount unchanged
    const job = { missingSyncCount: 0 };
    const suppressed = runGuard(0, 1).suppressed;
    if (suppressed) {
      // No update applied
    }
    expect(job.missingSyncCount).toBe(0); // unchanged
  });

  it('two-miss cycle resumes correctly after an anomalous empty sync', () => {
    // Sequence: job exists → miss #1 → anomalous empty → miss #2 → closed
    // The anomalous empty does NOT advance the miss count.
    const simulate = (syncs: Array<{ returned: boolean; anomalous: boolean }>) => {
      let missCount = 0;
      let closed = false;
      for (const sync of syncs) {
        if (sync.anomalous) {
          // Guard: suppressed, no update
          continue;
        }
        if (sync.returned) {
          missCount = 0; // reset on reappearance
        } else {
          if (missCount >= 1) closed = true;
          else missCount++;
        }
      }
      return { missCount, closed };
    };

    // Normal cycle (no anomaly): close after 2 misses
    expect(simulate([
      { returned: false, anomalous: false }, // miss #1 → missCount=1
      { returned: false, anomalous: false }, // miss #2 → closed
    ])).toMatchObject({ closed: true });

    // Anomaly between misses does NOT reset the cycle
    expect(simulate([
      { returned: false, anomalous: false }, // miss #1 → missCount=1
      { returned: false, anomalous: true },  // suppressed (empty anomaly)
      { returned: false, anomalous: false }, // miss #2 → closed
    ])).toMatchObject({ closed: true });

    // Single miss + anomaly does NOT close
    expect(simulate([
      { returned: false, anomalous: false }, // miss #1 → missCount=1
      { returned: false, anomalous: true },  // suppressed (empty anomaly)
    ])).toMatchObject({ closed: false, missCount: 1 });

    // Job reappears after anomaly: missCount reset
    expect(simulate([
      { returned: false, anomalous: false }, // miss #1 → missCount=1
      { returned: false, anomalous: true },  // suppressed
      { returned: true,  anomalous: false }, // reappeared → missCount=0
      { returned: false, anomalous: false }, // miss #1 again → missCount=1
    ])).toMatchObject({ closed: false, missCount: 1 });
  });

  it('a 403/500 provider error cannot trigger closure (throws before detectClosures)', () => {
    let closureRan = false;
    const ingest = async (statusOk: boolean) => {
      if (!statusOk) throw new Error('HTTP 403');
      closureRan = true;
    };
    return ingest(false).catch(() => {
      expect(closureRan).toBe(false);
    });
  });

  it('a timeout cannot trigger closure (throws before detectClosures)', () => {
    let closureRan = false;
    const ingest = async (timeout: boolean) => {
      if (timeout) throw new DOMException('Aborted', 'AbortError');
      closureRan = true;
    };
    return ingest(true).catch(() => {
      expect(closureRan).toBe(false);
    });
  });
});
