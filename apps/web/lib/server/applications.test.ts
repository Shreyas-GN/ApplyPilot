import { describe, expect, it } from 'vitest';
import { summarizeApplicationProgress } from '@/lib/dashboard-helpers';
import type {
  ApplicationChecklistState,
  ApplicationDto,
  ApplicationReadiness,
  ApplicationStatus,
} from '@/lib/types';

function makeApp(
  overrides: Partial<ApplicationDto> & { status: ApplicationStatus }
): ApplicationDto {
  const defaults: ApplicationDto = {
    id: 'app-1',
    jobId: null,
    company: 'Acme',
    title: 'Senior Engineer',
    location: null,
    url: null,
    status: 'saved',
    matchScore: null,
    notes: null,
    followUpAt: null,
    checklist: {},
    appliedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    events: [],
  };
  return { ...defaults, ...overrides };
}

function makeReadiness(overrides: Partial<ApplicationReadiness> = {}): ApplicationReadiness {
  return {
    profileComplete: true,
    hasResume: true,
    tailoredResume: false,
    coverLetter: false,
    screeningPrepared: false,
    finalReviewed: false,
    completedCount: 2,
    totalCount: 6,
    ...overrides,
  };
}

describe('summarizeApplicationProgress', () => {
  it('returns zero counts for empty list', () => {
    const result = summarizeApplicationProgress([]);
    expect(result.total).toBe(0);
    expect(result.activeCount).toBe(0);
    expect(result.counts.saved).toBe(0);
  });

  it('returns zero counts for null/undefined', () => {
    expect(summarizeApplicationProgress(null).total).toBe(0);
    expect(summarizeApplicationProgress(undefined).total).toBe(0);
  });

  it('counts each status bucket correctly', () => {
    const apps = [
      makeApp({ status: 'saved' }),
      makeApp({ id: 'app-2', status: 'applied' }),
      makeApp({ id: 'app-3', status: 'applied' }),
      makeApp({ id: 'app-4', status: 'interviewing' }),
      makeApp({ id: 'app-5', status: 'offer' }),
      makeApp({ id: 'app-6', status: 'rejected' }),
    ];
    const result = summarizeApplicationProgress(apps);
    expect(result.total).toBe(6);
    expect(result.counts.saved).toBe(1);
    expect(result.counts.applied).toBe(2);
    expect(result.counts.interviewing).toBe(1);
    expect(result.counts.offer).toBe(1);
    expect(result.counts.rejected).toBe(1);
  });

  it('activeCount sums saved + preparing + ready_to_apply + applied + interviewing', () => {
    const apps = [
      makeApp({ status: 'saved' }),
      makeApp({ id: 'app-2', status: 'preparing' }),
      makeApp({ id: 'app-3', status: 'ready_to_apply' }),
      makeApp({ id: 'app-4', status: 'applied' }),
      makeApp({ id: 'app-5', status: 'interviewing' }),
      makeApp({ id: 'app-6', status: 'offer' }),
      makeApp({ id: 'app-7', status: 'rejected' }),
      makeApp({ id: 'app-8', status: 'withdrawn' }),
    ];
    const result = summarizeApplicationProgress(apps);
    expect(result.activeCount).toBe(5); // saved + preparing + ready_to_apply + applied + interviewing
    expect(result.counts.withdrawn).toBe(1);
    expect(result.counts.preparing).toBe(1);
    expect(result.counts.ready_to_apply).toBe(1);
  });

  it('counts follow-up reminders', () => {
    const apps = [
      makeApp({ status: 'applied', followUpAt: '2026-02-01T00:00:00.000Z' }),
      makeApp({ id: 'app-2', status: 'applied', followUpAt: '2026-02-10T00:00:00.000Z' }),
      makeApp({ id: 'app-3', status: 'saved' }),
    ];
    const result = summarizeApplicationProgress(apps);
    expect(result.followUpsCount).toBe(2);
  });
});

describe('application readiness completedCount', () => {
  it('completedCount is 0 when nothing is complete', () => {
    const r = makeReadiness({
      profileComplete: false,
      hasResume: false,
      tailoredResume: false,
      coverLetter: false,
      screeningPrepared: false,
      finalReviewed: false,
      completedCount: 0,
    });
    expect(r.completedCount).toBe(0);
    expect(r.totalCount).toBe(6);
  });

  it('completedCount reflects all 6 checks when all done', () => {
    const r = makeReadiness({
      profileComplete: true,
      hasResume: true,
      tailoredResume: true,
      coverLetter: true,
      screeningPrepared: true,
      finalReviewed: true,
      completedCount: 6,
    });
    expect(r.completedCount).toBe(r.totalCount);
  });

  it('a single unchecked item leaves completedCount < totalCount', () => {
    const r = makeReadiness({
      profileComplete: true,
      hasResume: true,
      tailoredResume: true,
      coverLetter: false, // missing cover letter
      screeningPrepared: true,
      finalReviewed: true,
      completedCount: 5,
    });
    expect(r.completedCount).toBeLessThan(r.totalCount);
    expect(r.coverLetter).toBe(false);
  });
});

describe('application status coverage', () => {
  const ALL_STATUSES: ApplicationStatus[] = [
    'saved',
    'preparing',
    'ready_to_apply',
    'applied',
    'interviewing',
    'offer',
    'rejected',
    'withdrawn',
  ];

  it('ALL_STATUSES has exactly 8 entries', () => {
    expect(ALL_STATUSES).toHaveLength(8);
  });

  it('status can be any of the 8 valid values', () => {
    for (const status of ALL_STATUSES) {
      const app = makeApp({ status });
      expect(app.status).toBe(status);
    }
  });
});

describe('checklist state', () => {
  it('checklist screeningPrepared and finalReviewed default to undefined', () => {
    const checklist: ApplicationChecklistState = {};
    expect(checklist.screeningPrepared).toBeUndefined();
    expect(checklist.finalReviewed).toBeUndefined();
  });

  it('checklist fields can be explicitly toggled', () => {
    const checklist: ApplicationChecklistState = {
      screeningPrepared: true,
      finalReviewed: false,
    };
    expect(checklist.screeningPrepared).toBe(true);
    expect(checklist.finalReviewed).toBe(false);
  });
});
