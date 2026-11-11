import type { JobMatchBreakdown, ProfileDto } from '@/lib/types';

const KNOWN_SKILLS = [
  'TypeScript',
  'JavaScript',
  'React',
  'Next.js',
  'Node.js',
  'Python',
  'Go',
  'Rust',
  'Java',
  'C++',
  'SQL',
  'PostgreSQL',
  'Postgres',
  'Supabase',
  'MongoDB',
  'Redis',
  'GraphQL',
  'AWS',
  'GCP',
  'Azure',
  'Docker',
  'Kubernetes',
  'Terraform',
  'Tailwind',
  'CSS',
  'HTML',
  'Git',
  'CI/CD',
  'Machine Learning',
  'LLM',
  'AI',
  'PyTorch',
  'TensorFlow',
  'Figma',
  'Product Management',
  'Ruby',
  'Rails',
  'Django',
  'FastAPI',
  'NestJS',
  'Express',
  'Prisma',
  'Drizzle',
  'Playwright',
  'Vitest',
  'Jest',
  'Linux',
  'Swift',
  'Kotlin',
];

export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractJobSkills(title: string, description: string): string[] {
  const haystack = ` ${title} ${description} `.toLowerCase();
  const found: string[] = [];

  for (const skill of KNOWN_SKILLS) {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    if (regex.test(haystack)) {
      found.push(skill);
    }
  }

  return Array.from(new Set(found));
}

export function inferWorkMode(
  title: string,
  location: string | null,
  description: string
): 'remote' | 'hybrid' | 'onsite' {
  const text = `${title} ${location ?? ''} ${description.slice(0, 600)}`.toLowerCase();
  if (/\bremote\b/.test(text)) return 'remote';
  if (/\bhybrid\b/.test(text)) return 'hybrid';
  return 'onsite';
}

export function computeJobMatch(
  profile: ProfileDto | null,
  job: {
    title: string;
    location: string | null;
    workMode: string | null;
    description: string;
    skills: string[];
  }
): JobMatchBreakdown {
  if (!profile) {
    return {
      score: 50,
      matchedSkills: [],
      missingSkills: job.skills.slice(0, 5),
      reasons: ['Sign in and complete your profile for personalized match scoring.'],
    };
  }

  const userSkills = profile.skills.map((s) => s.name.trim()).filter(Boolean);
  const hasPreferences =
    profile.preferredTitles.length > 0 ||
    profile.preferredLocations.length > 0 ||
    Boolean(profile.workMode) ||
    Boolean(profile.headline);

  if (userSkills.length === 0 && !hasPreferences) {
    return {
      score: 50,
      matchedSkills: [],
      missingSkills: job.skills.slice(0, 5),
      reasons: ['Add skills and preferences to your profile to unlock accurate match scores.'],
    };
  }

  const reasons: string[] = [];
  let score = 0;

  // 1. Skills match (45 points)
  const jobHaystack = `${job.title} ${job.description}`.toLowerCase();
  const matchedSkills: string[] = [];

  for (const skill of userSkills) {
    const lower = skill.toLowerCase();
    const inTags = job.skills.some((js) => js.toLowerCase() === lower);
    if (inTags || jobHaystack.includes(lower)) {
      matchedSkills.push(skill);
    }
  }

  const userSkillSet = new Set(userSkills.map((s) => s.toLowerCase()));
  const missingSkills = job.skills.filter(
    (js) => !userSkillSet.has(js.toLowerCase())
  );

  if (userSkills.length > 0) {
    const denominator = Math.max(Math.min(job.skills.length || 5, userSkills.length), 1);
    const skillPoints = Math.min(45, Math.round((matchedSkills.length / denominator) * 45));
    score += skillPoints;
    if (matchedSkills.length > 0) {
      reasons.push(
        `Matches ${matchedSkills.length} of your skills (${matchedSkills.slice(0, 4).join(', ')})`
      );
    } else if (job.skills.length > 0) {
      reasons.push('Low skill overlap with listed requirements');
    }
  } else {
    score += 15;
  }

  // 2. Title & Headline match (25 points)
  const jobTitleLower = job.title.toLowerCase();
  const titleTargets = [
    ...profile.preferredTitles,
    ...(profile.headline ? [profile.headline] : []),
  ]
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (titleTargets.length > 0) {
    let bestTitleRatio = 0;
    for (const target of titleTargets) {
      const words = target.split(/\s+/).filter((w) => w.length > 2);
      if (words.length === 0) continue;
      const hits = words.filter((w) => jobTitleLower.includes(w)).length;
      bestTitleRatio = Math.max(bestTitleRatio, hits / words.length);
    }
    const titlePoints = Math.round(bestTitleRatio * 25);
    score += titlePoints;
    if (titlePoints >= 15) {
      reasons.push('Strong alignment with your target role');
    }
  } else {
    score += 12;
  }

  // 3. Location / Work Mode match (20 points)
  let locationMatched = false;
  if (profile.workMode && job.workMode === profile.workMode) {
    score += 20;
    locationMatched = true;
    reasons.push(`Matches your ${profile.workMode} work preference`);
  } else if (
    profile.preferredLocations.length > 0 &&
    job.location &&
    profile.preferredLocations.some((loc) =>
      job.location!.toLowerCase().includes(loc.toLowerCase())
    )
  ) {
    score += 20;
    locationMatched = true;
    reasons.push(`Located in preferred region (${job.location})`);
  } else if (!profile.workMode && profile.preferredLocations.length === 0) {
    score += 12;
  } else if (job.workMode === 'remote') {
    score += 12;
  }

  if (!locationMatched && profile.workMode && job.workMode && job.workMode !== profile.workMode) {
    reasons.push(`Work mode is ${job.workMode} (you prefer ${profile.workMode})`);
  }

  // 4. Seniority alignment (10 points)
  const years = profile.yearsOfExperience;
  if (years !== null && years !== undefined) {
    const isSenior = /\b(senior|sr\.?|staff|principal|lead)\b/i.test(job.title);
    const isJunior = /\b(junior|jr\.?|entry|intern|associate)\b/i.test(job.title);
    if ((isSenior && years >= 4) || (isJunior && years <= 2) || (!isSenior && !isJunior)) {
      score += 10;
    } else {
      score += 3;
    }
  } else {
    score += 7;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    matchedSkills,
    missingSkills: missingSkills.slice(0, 6),
    reasons,
  };
}

