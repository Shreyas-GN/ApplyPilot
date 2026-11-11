import { describe, expect, it, vi } from 'vitest';
import type { ProfileDto } from '@/lib/types';
import {
  buildCandidateContext,
  buildGroundedScreeningAnswer,
  cleanJsonFence,
  draftCoverLetterWithClaude,
  generateScreeningAnswer,
  tailorResumeWithClaude,
  type ClaudeMessagesClient,
} from './tailoring';

const SAMPLE_PROFILE: ProfileDto = {
  fullName: 'Ada Lovelace',
  phone: null,
  location: 'London, UK',
  linkedinUrl: null,
  githubUrl: null,
  portfolioUrl: null,
  headline: 'Senior Full-Stack Engineer',
  summary: 'Built TypeScript and Postgres systems for developer platforms.',
  yearsOfExperience: 6,
  employmentStatus: 'actively_looking',
  preferredTitles: ['Senior Software Engineer'],
  preferredLocations: ['Remote'],
  workMode: 'remote',
  employmentTypes: ['full_time'],
  expectedSalaryMin: null,
  expectedSalaryMax: null,
  preferredIndustries: [],
  excludedCompanies: [],
  completionPercent: 90,
  updatedAt: '2026-11-11T00:00:00.000Z',
  experience: [
    {
      id: 'exp-1',
      company: 'Analytical Engines',
      title: 'Staff Engineer',
      location: 'Remote',
      startDate: '2021-01',
      endDate: null,
      isCurrent: true,
      description: 'Led Next.js and PostgreSQL API architecture.',
      confidence: 1,
      source: 'user',
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'University of London',
      degree: 'BSc',
      fieldOfStudy: 'Mathematics',
      startDate: null,
      endDate: null,
      description: null,
      confidence: 1,
      source: 'user',
    },
  ],
  skills: [
    {
      id: 'sk-1',
      name: 'TypeScript',
      category: 'Languages',
      confidence: 1,
      source: 'user',
    },
    {
      id: 'sk-2',
      name: 'PostgreSQL',
      category: 'Databases',
      confidence: 1,
      source: 'user',
    },
  ],
  projects: [],
  certifications: [],
};

describe('tailoring utilities', () => {
  it('strips markdown JSON code fences cleanly', () => {
    expect(cleanJsonFence('```json\n{"ok":true}\n```')).toBe('{"ok":true}');
    expect(cleanJsonFence('  {"ok":true}  ')).toBe('{"ok":true}');
  });

  it('builds verified candidate context from profile DTO', () => {
    const ctx = buildCandidateContext(SAMPLE_PROFILE);
    expect(ctx.fullName).toBe('Ada Lovelace');
    expect(ctx.skills).toEqual(['TypeScript', 'PostgreSQL']);
    expect(ctx.experience[0]?.endDate).toBe('Present');
  });

  it('parses and validates tailored resume JSON from Claude', async () => {
    const mockClient: ClaudeMessagesClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                headline: 'Senior Full-Stack Engineer (TypeScript & PostgreSQL)',
                summary:
                  'Full-stack engineer experienced in Next.js and PostgreSQL API architecture.',
                highlightedSkills: ['TypeScript', 'PostgreSQL'],
                experience: [
                  {
                    company: 'Analytical Engines',
                    title: 'Staff Engineer',
                    startDate: '2021-01',
                    endDate: 'Present',
                    originalDescription:
                      'Led Next.js and PostgreSQL API architecture.',
                    tailoredDescription:
                      'Architected production Next.js applications backed by PostgreSQL APIs.',
                  },
                ],
                keywordsUsed: ['TypeScript', 'PostgreSQL'],
                missingKeywords: ['Kubernetes'],
                rationale:
                  'Emphasized existing TypeScript and PostgreSQL platform leadership while flagging Kubernetes as absent.',
              }),
            },
          ],
        }),
      },
    };

    const result = await tailorResumeWithClaude(
      SAMPLE_PROFILE,
      {
        company: 'Vercel',
        title: 'Senior Product Engineer',
        description: 'Requires TypeScript, PostgreSQL, and Kubernetes.',
      },
      mockClient
    );

    expect(result.missingKeywords).toEqual(['Kubernetes']);
    expect(result.experience).toHaveLength(1);
    expect(result.experience[0]?.company).toBe('Analytical Engines');
  });

  it('validates cover letter output and forwards the requested tone', async () => {
    const createMock = vi.fn().mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            subjectLine: 'Application for Senior Product Engineer — Ada Lovelace',
            greeting: 'Hello Vercel Hiring Team,',
            bodyParagraphs: [
              'At Analytical Engines, I led Next.js and PostgreSQL API architecture.',
              'I would be glad to bring this TypeScript and database foundation to Vercel.',
            ],
            closing: 'Thank you for your consideration,',
            signature: 'Ada Lovelace',
            keyPointsHighlighted: ['Next.js & PostgreSQL architecture', 'TypeScript'],
          }),
        },
      ],
    });

    const result = await draftCoverLetterWithClaude(
      SAMPLE_PROFILE,
      {
        company: 'Vercel',
        title: 'Senior Product Engineer',
        description: 'Build fast TypeScript developer experiences.',
      },
      'concise',
      { messages: { create: createMock } }
    );

    expect(result.bodyParagraphs).toHaveLength(2);
    expect(createMock).toHaveBeenCalledTimes(1);
    const firstArg = createMock.mock.calls[0]?.[0] as
      | { messages: Array<{ content: string }> }
      | undefined;
    const payload = JSON.parse(firstArg?.messages[0]?.content ?? '{}');
    expect(payload.tone).toBe('concise');
  });

  it('throws a clean error when Claude returns invalid JSON', async () => {
    const mockClient: ClaudeMessagesClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Not valid JSON' }],
        }),
      },
    };

    await expect(
      tailorResumeWithClaude(
        SAMPLE_PROFILE,
        { company: 'Stripe', title: 'Engineer', description: 'API role' },
        mockClient
      )
    ).rejects.toThrow('AI tailoring returned an unexpected response format.');
  });

  it('builds a grounded screening answer without inventing skills when falling back deterministically', () => {
    const res = buildGroundedScreeningAnswer(
      SAMPLE_PROFILE,
      {
        company: 'Vercel',
        title: 'Senior Full-Stack Engineer',
        description: 'Build developer tools.',
      },
      'Why are you interested in working at Vercel?'
    );

    expect(res.source).toBe('grounded_fallback');
    expect(res.answer).toContain('Vercel');
    expect(res.answer).toContain('Analytical Engines');
    expect(res.groundedFacts.length).toBeGreaterThan(0);
  });

  it('generates structured screening answers via injected Claude client', async () => {
    const mockClient: ClaudeMessagesClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                answer:
                  'I bring 6 years of experience building TypeScript and PostgreSQL systems, most recently leading API architecture at Analytical Engines.',
                groundedFacts: ['6 years experience', 'Analytical Engines'],
              }),
            },
          ],
        }),
      },
    };

    const res = await generateScreeningAnswer(
      SAMPLE_PROFILE,
      { company: 'Stripe', title: 'Backend Engineer', description: 'APIs' },
      'Describe your backend experience.',
      mockClient
    );

    expect(res.source).toBe('claude');
    expect(res.answer).toContain('TypeScript');
    expect(res.groundedFacts).toContain('Analytical Engines');
  });
});
