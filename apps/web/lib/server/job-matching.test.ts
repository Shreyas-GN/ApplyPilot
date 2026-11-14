import { describe, expect, it } from 'vitest';
import {
  analyzeJobIntelligence,
  computeJobMatch,
  extractJobSkills,
  extractSalary,
  inferExperienceLevel,
  inferWorkMode,
  normalizeIndianLocation,
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
    expect(match.skillsScore).toBeGreaterThanOrEqual(70);
    expect(match.experienceScore).toBeGreaterThanOrEqual(80);
    expect(match.matchedSkills).toEqual(['TypeScript', 'React', 'Next.js']);
    expect(match.missingSkills).toEqual(['Supabase']);
    expect(match.reasons.length).toBeGreaterThan(0);
    expect(match.isAdjacentRole).toBe(false);
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
    expect(match.gaps.length).toBeGreaterThan(0);
  });

  it('identifies transferable skills and flags adjacent roles outside conventional target titles', () => {
    const profile = makeProfile({
      skills: [
        { id: '1', name: 'TypeScript', category: null, source: 'user', confidence: null },
        { id: '2', name: 'React', category: null, source: 'user', confidence: null },
        { id: '3', name: 'Vitest', category: null, source: 'user', confidence: null },
      ],
    });
    const match = computeJobMatch(profile, {
      title: 'Developer Advocate',
      location: 'Remote',
      workMode: 'remote',
      description:
        'Build sample apps with TypeScript, React, Playwright, and JavaScript tutorials for developers.',
      skills: ['TypeScript', 'React', 'Playwright', 'JavaScript'],
    });

    expect(match.isAdjacentRole).toBe(true);
    expect(match.adjacencyReason).toContain('TypeScript');
    expect(match.transferableSkills.some((t) => t.targetSkill === 'Playwright')).toBe(true);
  });

  it('analyzes job intelligence into responsibilities, required vs preferred skills, and seniority', () => {
    const intelligence = analyzeJobIntelligence({
      title: 'Senior Full Stack Engineer',
      company: 'Acme Corp',
      location: 'Remote',
      workMode: 'remote',
      employmentType: 'full_time',
      source: 'greenhouse',
      skills: ['TypeScript', 'React', 'PostgreSQL', 'Kubernetes'],
      description:
        'We are looking for a Senior Full Stack Engineer with 5+ years of experience. You will design resilient web applications and lead end-to-end feature delivery with TypeScript, React, and PostgreSQL. Nice to have: Kubernetes and cloud deployment experience.',
    });

    expect(intelligence.seniorityLevel).toBe('Senior');
    expect(intelligence.expectedExperienceYears).toBe('5+ years');
    expect(intelligence.requiredSkills).toEqual(
      expect.arrayContaining(['TypeScript', 'React', 'PostgreSQL'])
    );
    expect(intelligence.preferredSkills).toContain('Kubernetes');
    expect(intelligence.responsibilities.length).toBeGreaterThan(0);
  });

  it('never treats unverified AI-extracted skills as confirmed qualifications in scoring', () => {
    const profile = makeProfile({
      skills: [
        { id: '1', name: 'TypeScript', category: null, source: 'ai', confidence: 0.7 },
        { id: '2', name: 'React', category: null, source: 'ai', confidence: 0.6 },
      ],
    });
    const match = computeJobMatch(profile, {
      title: 'Senior Frontend Engineer',
      location: 'Remote',
      workMode: 'remote',
      description: 'TypeScript and React role.',
      skills: ['TypeScript', 'React'],
    });

    expect(match.matchedSkills).toEqual([]);
    expect(match.missingSkills).toEqual(['TypeScript', 'React']);
  });
});

describe('India-specific job intelligence', () => {
  describe('normalizeIndianLocation', () => {
    it('normalizes Bangalore to Bengaluru', () => {
      const result = normalizeIndianLocation('Bangalore, India');
      expect(result.normalizedLocation).toBe('Bengaluru');
      expect(result.locationCountry).toBe('IN');
      expect(result.isIndiaRemote).toBe(false);
    });

    it('normalizes Bengaluru variant spellings', () => {
      expect(normalizeIndianLocation('Bengaluru, KA')?.normalizedLocation).toBe('Bengaluru');
      expect(normalizeIndianLocation('BLR')?.normalizedLocation).toBe('Bengaluru');
    });

    it('normalizes Gurgaon to Gurugram', () => {
      const result = normalizeIndianLocation('Gurgaon, Haryana');
      expect(result.normalizedLocation).toBe('Gurugram');
      expect(result.locationCountry).toBe('IN');
    });

    it('normalizes Mumbai aliases', () => {
      expect(normalizeIndianLocation('Bombay')?.normalizedLocation).toBe('Mumbai');
      expect(normalizeIndianLocation('Mumbai, Maharashtra')?.normalizedLocation).toBe('Mumbai');
    });

    it('detects India-remote from description when location is null', () => {
      const result = normalizeIndianLocation(null, 'This is an India-remote position for candidates based in India.');
      expect(result.isIndiaRemote).toBe(true);
      expect(result.locationCountry).toBe('IN');
    });

    it('returns null for a US location', () => {
      const result = normalizeIndianLocation('San Francisco, CA');
      expect(result.normalizedLocation).toBeNull();
      expect(result.locationCountry).toBe('US');
      expect(result.isIndiaRemote).toBe(false);
    });

    it('returns nulls for unrecognized location', () => {
      const result = normalizeIndianLocation('Some Random City, XY');
      expect(result.normalizedLocation).toBeNull();
      expect(result.locationCountry).toBeNull();
      expect(result.isIndiaRemote).toBe(false);
    });

    it('handles null location with no India hint in description', () => {
      const result = normalizeIndianLocation(null, 'A remote role for US candidates.');
      expect(result.isIndiaRemote).toBe(false);
      expect(result.locationCountry).toBeNull();
    });
  });

  describe('extractSalary', () => {
    it('extracts INR salary in LPA range format', () => {
      const result = extractSalary('CTC: 15-20 LPA for the right candidate.');
      expect(result.currency).toBe('INR');
      expect(result.min).toBe(1500000);
      expect(result.max).toBe(2000000);
      expect(result.period).toBe('annual');
      expect(result.text).toBeTruthy();
    });

    it('extracts INR salary with lakhs per annum wording', () => {
      const result = extractSalary('Salary: 12-18 lakhs per annum.');
      expect(result.currency).toBe('INR');
      expect(result.min).toBe(1200000);
      expect(result.max).toBe(1800000);
    });

    it('extracts USD salary range', () => {
      const result = extractSalary('Compensation: $120k - $150k per year.');
      expect(result.currency).toBe('USD');
      expect(result.min).toBe(120000);
      expect(result.max).toBe(150000);
      expect(result.period).toBe('annual');
    });

    it('returns empty when no salary information is present', () => {
      const result = extractSalary('We are building the next generation of AI tooling.');
      expect(result.min).toBeNull();
      expect(result.max).toBeNull();
      expect(result.currency).toBeNull();
      expect(result.text).toBeNull();
    });

    it('does not confuse funding rounds or revenue figures with salary', () => {
      const result = extractSalary('Our company raised $50M Series B and generates $10M ARR.');
      expect(result.currency).toBeNull();
    });

    it('never invents salary for a description with no salary text', () => {
      const result = extractSalary('5+ years of experience with React and TypeScript required.');
      expect(result.min).toBeNull();
      expect(result.max).toBeNull();
    });
  });

  describe('inferExperienceLevel', () => {
    it('detects internship from title', () => {
      const result = inferExperienceLevel('Software Engineering Intern', '');
      expect(result.level).toBe('internship');
    });

    it('detects fresher from title', () => {
      const result = inferExperienceLevel('Fresher Software Engineer', '');
      expect(result.level).toBe('fresher');
    });

    it('detects 0-2 years from description', () => {
      const result = inferExperienceLevel('Software Engineer', 'We require 0-2 years of experience.');
      expect(result.level).toBe('0_2');
    });

    it('detects 2-5 years from description', () => {
      const result = inferExperienceLevel('Software Engineer', 'Looking for 3-5 years of professional experience.');
      expect(result.level).toBe('2_5');
    });

    it('detects 5-8 years from description', () => {
      const result = inferExperienceLevel('Senior Engineer', 'Must have 5+ years of relevant experience.');
      expect(result.level).toBe('5_8');
    });

    it('detects 8+ years from description', () => {
      const result = inferExperienceLevel('Principal Engineer', 'Requires 10+ years of experience.');
      expect(result.level).toBe('8_plus');
    });

    it('returns null when experience cannot be determined', () => {
      const result = inferExperienceLevel('Software Engineer', 'Join our team and build great products.');
      expect(result.level).toBeNull();
    });

    it('detects senior level from title when no yoe info available', () => {
      const result = inferExperienceLevel('Senior Software Engineer', 'Join our backend team.');
      expect(result.level).toBe('5_8');
    });
  });

  describe('combined India intelligence', () => {
    it('correctly processes a Bengaluru job with INR salary and 2-5 yrs experience', () => {
      const location = normalizeIndianLocation('Bangalore, Karnataka');
      const salary = extractSalary('Salary: 12-20 LPA. Looking for 2-4 years of experience.');
      const exp = inferExperienceLevel('Backend Engineer', 'Salary: 12-20 LPA. Looking for 2-4 years of experience.');

      expect(location.normalizedLocation).toBe('Bengaluru');
      expect(location.locationCountry).toBe('IN');
      expect(salary.currency).toBe('INR');
      expect(salary.min).toBe(1200000);
      expect(exp.level).toBe('2_5');
    });
  });
});
