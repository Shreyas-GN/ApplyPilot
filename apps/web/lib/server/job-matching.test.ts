import { describe, expect, it } from 'vitest';
import {
  computeJobMatch,
  extractJobSkills,
  inferWorkMode,
  stripHtml,
} from './job-matching';
import type { ProfileDto } from '@/lib/types';

function makeProfile(overrides: Partial<ProfileDto> = {}): ProfileDto {
  return {
    fullName: 'Test Candidate',
    phone: null,
    location: 'Bengaluru',
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
    headline: 'Senior Frontend Engineer',
    summary: 'Experienced in React and TypeScript.',
    yearsOfExperience: 5,
    employmentStatus: 'actively_looking',
    preferredTitles: ['Frontend Engineer', 'Full Stack Engineer'],
    preferredLocations: ['Bengaluru', 'Remote'],
    workMode: 'remote',
    employmentTypes: ['full_time'],
    expectedSalaryMin: null,
    expectedSalaryMax: null,
    preferredIndustries: [],
    excludedCompanies: [],
    completionPercent: 80,
    experience: [],
    education: [],
    skills: [
      { id: '1', name: 'TypeScript', category: null, source: 'user', confidence: null },
      { id: '2', name: 'React', category: null, source: 'user', confidence: null },
      { id: '3', name: 'Next.js', category: null, source: 'user', confidence: null },
    ],
    projects: [],
    certifications: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('job-matching utilities', () => {
  it('strips HTML tags cleanly', () => {
    expect(stripHtml('<p>Hello &amp; <strong>World</strong></p>')).toBe(
      'Hello & World'
    );
  });

  it('extracts known technical skills from job text', () => {
    const skills = extractJobSkills(
      'Senior React Engineer',
      'Looking for experience with TypeScript, PostgreSQL, and Next.js.'
    );
    expect(skills).toEqual(
      expect.arrayContaining(['React', 'TypeScript', 'PostgreSQL', 'Next.js'])
    );
  });

  it('infers work mode from title and location', () => {
    expect(inferWorkMode('Frontend Engineer (Remote)', 'US', '')).toBe('remote');
    expect(inferWorkMode('Backend Engineer', 'New York - Hybrid', '')).toBe(
      'hybrid'
    );
    expect(inferWorkMode('Systems Engineer', 'San Francisco, CA', '')).toBe(
      'onsite'
    );
  });

  it('computes a high score when skills, title, workMode, and seniority align', () => {
    const profile = makeProfile();
    const match = computeJobMatch(profile, {
      title: 'Senior Frontend Engineer',
      location: 'Remote',
      workMode: 'remote',
      description: 'Build apps with TypeScript, React, Next.js, and Supabase.',
      skills: ['TypeScript', 'React', 'Next.js', 'Supabase'],
    });

    expect(match.score).toBeGreaterThanOrEqual(85);
    expect(match.matchedSkills).toEqual(['TypeScript', 'React', 'Next.js']);
    expect(match.missingSkills).toEqual(['Supabase']);
    expect(match.reasons.length).toBeGreaterThan(0);
  });

  it('returns lower score and explains mismatch when skills & mode do not align', () => {
    const profile = makeProfile({ workMode: 'remote' });
    const match = computeJobMatch(profile, {
      title: 'Junior Embedded Firmware Engineer',
      location: 'Austin, TX',
      workMode: 'onsite',
      description: 'C++ and Linux kernel development.',
      skills: ['C++', 'Linux'],
    });

    expect(match.score).toBeLessThan(30);
    expect(match.matchedSkills).toEqual([]);
    expect(match.missingSkills).toEqual(['C++', 'Linux']);
  });
});

