import type {
  JobIntelligenceBreakdown,
  JobMatchBreakdown,
  ProfileDto,
  TransferableSkillMatch,
} from '@/lib/types';

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

const TRANSFERABLE_SKILL_RULES: Array<{
  from: string[];
  to: string[];
  reason: string;
}> = [
  {
    from: ['React', 'Next.js'],
    to: ['TypeScript', 'JavaScript', 'CSS', 'HTML', 'Tailwind', 'Figma'],
    reason: 'Modern component architecture and frontend UI fundamentals transfer directly.',
  },
  {
    from: ['TypeScript'],
    to: ['JavaScript', 'Node.js', 'NestJS', 'Express'],
    reason: 'Strong TypeScript fluency maps directly to JavaScript and typed backend services.',
  },
  {
    from: ['JavaScript'],
    to: ['TypeScript', 'React', 'Node.js', 'Next.js'],
    reason: 'Core JavaScript runtime mastery accelerates ramp-up across TypeScript & JS frameworks.',
  },
  {
    from: ['PostgreSQL', 'Postgres', 'Supabase', 'SQL'],
    to: ['SQL', 'PostgreSQL', 'Prisma', 'Drizzle', 'Redis', 'MongoDB'],
    reason: 'Relational modeling and query optimization experience transfers across data stores.',
  },
  {
    from: ['Node.js', 'Express', 'NestJS'],
    to: ['FastAPI', 'Django', 'Rails', 'Go', 'GraphQL'],
    reason: 'API design, async concurrency, and service architecture patterns carry over cleanly.',
  },
  {
    from: ['Python', 'Django', 'FastAPI'],
    to: ['Node.js', 'Machine Learning', 'AI', 'LLM', 'PyTorch', 'TensorFlow', 'SQL'],
    reason: 'Python engineering experience bridges backend services, data pipelines, and AI workflows.',
  },
  {
    from: ['AWS', 'GCP', 'Azure'],
    to: ['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux'],
    reason: 'Cloud platform fundamentals transfer across providers and infrastructure automation.',
  },
  {
    from: ['Docker', 'Kubernetes'],
    to: ['Terraform', 'CI/CD', 'Linux', 'AWS', 'GCP'],
    reason: 'Container orchestration and deployment pipeline skills map directly to DevOps workflows.',
  },
  {
    from: ['Vitest', 'Jest', 'Playwright'],
    to: ['Playwright', 'Vitest', 'Jest', 'CI/CD', 'TypeScript'],
    reason: 'Automated testing methodology and assertion frameworks transfer across test runners.',
  },
  {
    from: ['PyTorch', 'TensorFlow', 'Machine Learning', 'LLM'],
    to: ['AI', 'LLM', 'PyTorch', 'TensorFlow', 'Python'],
    reason: 'Applied ML model training and evaluation skills transfer directly across AI stacks.',
  },
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

export function inferSeniorityLevel(title: string, description = ''): string {
  const titleText = title.toLowerCase();
  if (/\b(staff|principal|distinguished|architect)\b/.test(titleText)) {
    return 'Staff / Principal';
  }
  if (/\b(lead|manager|head of|director|vp)\b/.test(titleText)) {
    return 'Lead / Manager';
  }
  if (/\b(senior|sr\.?)\b/.test(titleText)) {
    return 'Senior';
  }
  if (/\b(junior|jr\.?|entry|intern|new grad|associate)\b/.test(titleText)) {
    return 'Entry / Junior';
  }
  const desc = description.slice(0, 2000).toLowerCase();
  if (/\b(7\+|8\+|10\+)\s*years/.test(desc)) return 'Senior / Staff';
  if (/\b(3\+|4\+|5\+)\s*years/.test(desc)) return 'Mid to Senior';
  if (/\b(0-2|1-2|1\+)\s*years/.test(desc)) return 'Entry / Junior';
  return 'Mid-level / Unspecified';
}

export function extractExpectedExperienceYears(description: string): string | null {
  const match = description.match(
    /\b(\d{1,2}\s*(?:-|–|to)\s*\d{1,2}|\d{1,2}\+)\s*years?\s*(?:of)?\s*(?:relevant|professional|industry|software|engineering|work)?\s*(?:experience)?/i
  );
  if (!match?.[1]) return null;
  return `${match[1].replace(/\s+/g, ' ')} years`;
}

export function findTransferableSkills(
  userSkills: string[],
  missingSkills: string[]
): TransferableSkillMatch[] {
  if (userSkills.length === 0 || missingSkills.length === 0) return [];
  const results: TransferableSkillMatch[] = [];
  const seenTarget = new Set<string>();
  const userSkillMap = new Map<string, string>();
  for (const skill of userSkills) {
    userSkillMap.set(skill.toLowerCase(), skill);
  }

  for (const target of missingSkills) {
    const targetLower = target.toLowerCase();
    if (seenTarget.has(targetLower)) continue;

    for (const rule of TRANSFERABLE_SKILL_RULES) {
      if (!rule.to.some((t) => t.toLowerCase() === targetLower)) continue;
      const matchedCandidate = rule.from.find((f) => userSkillMap.has(f.toLowerCase()));
      if (matchedCandidate) {
        seenTarget.add(targetLower);
        results.push({
          candidateSkill: userSkillMap.get(matchedCandidate.toLowerCase()) ?? matchedCandidate,
          targetSkill: target,
          reason: rule.reason,
        });
        break;
      }
    }
  }

  return results.slice(0, 6);
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
      skillsScore: 0,
      experienceScore: 50,
      matchedSkills: [],
      missingSkills: job.skills.slice(0, 5),
      transferableSkills: [],
      strengths: [],
      gaps: job.skills.slice(0, 4).map((s) => `Requires ${s}`),
      reasons: ['Sign in and complete your profile for personalized match scoring.'],
      isAdjacentRole: false,
      adjacencyReason: null,
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
      skillsScore: 0,
      experienceScore: 50,
      matchedSkills: [],
      missingSkills: job.skills.slice(0, 5),
      transferableSkills: [],
      strengths: [],
      gaps: job.skills.slice(0, 4).map((s) => `Listed requirement: ${s}`),
      reasons: ['Add skills and preferences to your profile to unlock accurate match scores.'],
      isAdjacentRole: false,
      adjacencyReason: null,
    };
  }

  const reasons: string[] = [];
  const strengths: string[] = [];
  const gaps: string[] = [];
  let score = 0;

  // 1. Skills match (45 points) + Skills compatibility percentage
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
  const transferableSkills = findTransferableSkills(userSkills, missingSkills);

  let skillsScore = 50;
  if (userSkills.length > 0) {
    const denominator = Math.max(Math.min(job.skills.length || 5, userSkills.length), 1);
    const directRatio = matchedSkills.length / denominator;
    const transferableBoost = Math.min(0.25, transferableSkills.length * 0.08);
    skillsScore = Math.min(100, Math.round((directRatio + transferableBoost) * 100));
    const skillPoints = Math.min(45, Math.round(directRatio * 45));
    score += skillPoints;

    if (matchedSkills.length > 0) {
      const topSkills = matchedSkills.slice(0, 4).join(', ');
      reasons.push(`Matches ${matchedSkills.length} of your skills (${topSkills})`);
      strengths.push(`Direct stack overlap in ${topSkills}`);
    } else if (job.skills.length > 0) {
      reasons.push('Low skill overlap with listed requirements');
      gaps.push(`Missing listed stack: ${missingSkills.slice(0, 4).join(', ')}`);
    }

    if (transferableSkills.length > 0) {
      strengths.push(
        `Transferable skills: ${transferableSkills
          .slice(0, 2)
          .map((t) => `${t.candidateSkill} → ${t.targetSkill}`)
          .join(', ')}`
      );
    }
    if (missingSkills.length > 0 && matchedSkills.length > 0) {
      gaps.push(`Unlisted in your profile: ${missingSkills.slice(0, 4).join(', ')}`);
    }
  } else {
    score += 15;
  }

  // 2. Title & Headline match (25 points)
  const jobTitleLower = job.title.toLowerCase();
  const experienceTitles = profile.experience.map((e) => e.title);
  const titleTargets = [
    ...profile.preferredTitles,
    ...(profile.headline ? [profile.headline] : []),
    ...experienceTitles,
  ]
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  let bestTitleRatio = 0;
  if (titleTargets.length > 0) {
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
      strengths.push('Title aligns closely with your target roles and experience');
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
    strengths.push(`Supports your preferred ${profile.workMode} work mode`);
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
    strengths.push(`Matches preferred location (${job.location})`);
  } else if (!profile.workMode && profile.preferredLocations.length === 0) {
    score += 12;
  } else if (job.workMode === 'remote') {
    score += 12;
  }

  if (!locationMatched && profile.workMode && job.workMode && job.workMode !== profile.workMode) {
    reasons.push(`Work mode is ${job.workMode} (you prefer ${profile.workMode})`);
    gaps.push(`Work mode mismatch (${job.workMode} vs preferred ${profile.workMode})`);
  }

  // 4. Seniority & Experience alignment (10 points) + Experience compatibility %
  const years = profile.yearsOfExperience;
  let experienceScore = 70;
  if (years !== null && years !== undefined) {
    const isSenior = /\b(senior|sr\.?|staff|principal|lead)\b/i.test(job.title);
    const isJunior = /\b(junior|jr\.?|entry|intern|associate)\b/i.test(job.title);
    if ((isSenior && years >= 4) || (isJunior && years <= 2) || (!isSenior && !isJunior)) {
      score += 10;
      experienceScore = Math.min(100, 82 + (bestTitleRatio >= 0.5 ? 15 : 0));
      strengths.push(`Seniority aligns well (${years} yrs experience)`);
    } else {
      score += 3;
      experienceScore = isSenior && years < 4 ? 42 : 55;
      gaps.push(
        isSenior
          ? `Senior-level title vs ${years} years recorded experience`
          : `Entry-level scope vs ${years} years experience`
      );
    }
  } else {
    score += 7;
    experienceScore = Math.round(55 + bestTitleRatio * 35);
  }

  // 5. Adjacent-role detection (roles outside exact preferred titles with strong skill/transferable fit)
  const hasExplicitTitles =
    profile.preferredTitles.length > 0 || Boolean(profile.headline) || experienceTitles.length > 0;
  const isAdjacentRole =
    hasExplicitTitles &&
    bestTitleRatio < 0.5 &&
    (matchedSkills.length >= 2 || transferableSkills.length >= 1 || skillsScore >= 50);

  let adjacencyReason: string | null = null;
  if (isAdjacentRole) {
    const overlapSummary =
      matchedSkills.length > 0
        ? matchedSkills.slice(0, 3).join(', ')
        : transferableSkills
            .slice(0, 2)
            .map((t) => t.targetSkill)
            .join(', ');
    adjacencyReason = `Different title track from your usual search, but your background in ${overlapSummary} transfers strongly.`;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    skillsScore,
    experienceScore,
    matchedSkills,
    missingSkills: missingSkills.slice(0, 6),
    transferableSkills,
    strengths: strengths.slice(0, 5),
    gaps: gaps.slice(0, 5),
    reasons,
    isAdjacentRole,
    adjacencyReason,
  };
}

export function analyzeJobIntelligence(job: {
  title: string;
  company: string;
  location: string | null;
  workMode: string | null;
  employmentType: string | null;
  description: string;
  skills: string[];
  source: string;
}): JobIntelligenceBreakdown {
  const text = job.description.trim();
  const sentences = text
    .split(/(?<=[.!?])\s+|\s*[•·▪]\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 280);

  const responsibilityRegex =
    /\b(build|design|architect|develop|own|lead|collaborate|maintain|scale|optimize|ship|deliver|implement|drive|partner|mentor|ensure|create|improve|debug|test|deploy)\b/i;
  const techReqRegex =
    /\b(experience with|proficiency in|knowledge of|familiarity with|strong background|architecture|distributed|api|apis|database|databases|cloud|security|performance|testing|ci\/cd|scalability|typescript|python|react|postgres|kubernetes)\b/i;
  const preferredRegex =
    /\b(preferred|nice to have|bonus|plus|ideal|desirable|advantage|optional)\b/i;

  const responsibilities: string[] = [];
  const technicalRequirements: string[] = [];

  for (const s of sentences) {
    if (responsibilities.length < 6 && responsibilityRegex.test(s) && !/^we are an equal/i.test(s)) {
      responsibilities.push(s);
    }
    if (
      technicalRequirements.length < 6 &&
      techReqRegex.test(s) &&
      !responsibilities.includes(s)
    ) {
      technicalRequirements.push(s);
    }
  }

  // Classify skills into required vs preferred per sentence/clause so adjacent sections don't bleed
  const allClauses = text
    .split(/(?<=[.!?])\s+|\s*[•·▪]\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const preferredSkills: string[] = [];
  const requiredSkills: string[] = [];

  for (const skill of job.skills) {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const skillRegex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    if (skillRegex.test(job.title)) {
      requiredSkills.push(skill);
      continue;
    }
    const matchingClauses = allClauses.filter((c) => skillRegex.test(c));
    if (
      matchingClauses.length > 0 &&
      matchingClauses.every((c) => preferredRegex.test(c))
    ) {
      preferredSkills.push(skill);
    } else {
      requiredSkills.push(skill);
    }
  }

  const seniorityLevel = inferSeniorityLevel(job.title, text);
  const expectedExperienceYears = extractExpectedExperienceYears(text);

  const highlights: string[] = [];
  if (job.workMode) highlights.push(`Work mode: ${job.workMode}`);
  if (job.location) highlights.push(`Location: ${job.location}`);
  if (job.employmentType) {
    highlights.push(`Commitment: ${job.employmentType.replace(/_/g, ' ')}`);
  }
  highlights.push(`Source: ${job.source} ATS board`);

  const summarySentences = sentences.slice(0, 2);
  const summary =
    summarySentences.length > 0
      ? summarySentences.join(' ')
      : `${job.company} is hiring a ${job.title}${job.location ? ` in ${job.location}` : ''}.`;

  return {
    summary,
    responsibilities:
      responsibilities.length > 0
        ? responsibilities
        : [
            `Collaborate with engineering and product teams at ${job.company} to deliver ${job.title} initiatives.`,
          ],
    requiredSkills,
    preferredSkills,
    technicalRequirements,
    seniorityLevel,
    expectedExperienceYears,
    companyAndRoleHighlights: highlights,
  };
}
