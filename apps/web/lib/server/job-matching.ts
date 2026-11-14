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
  // Additional skills for India-focused engineering roles
  'Spring Boot',
  'Hibernate',
  'Maven',
  'Gradle',
  'Angular',
  'Vue.js',
  'Svelte',
  'Flutter',
  'Dart',
  'React Native',
  'Ionic',
  'MySQL',
  'Oracle',
  'Cassandra',
  'Elasticsearch',
  'DynamoDB',
  'Kafka',
  'RabbitMQ',
  'Celery',
  'Ansible',
  'Helm',
  'ArgoCD',
  'Jenkins',
  'GitHub Actions',
  'Spark',
  'Hadoop',
  'Airflow',
  'dbt',
  'Pandas',
  'NumPy',
  'Scikit-learn',
  'Langchain',
  'RAG',
  'OpenAI',
  'Hugging Face',
  'Cypress',
  'Selenium',
  'JUnit',
  'Pytest',
  'PHP',
  'Laravel',
  'Scala',
  'Clojure',
  'Elixir',
  'C#',
  '.NET',
  'ASP.NET',
  'Microservices',
  'REST API',
  'gRPC',
  'WebSockets',
  'Nginx',
  'Webpack',
  'Vite',
  'Babel',
  'Tailwind CSS',
  'Material UI',
  'Storybook',
  'Adobe XD',
  'Jira',
  'Confluence',
  'Notion',
  'Vercel',
  'Netlify',
  'Heroku',
  'DigitalOcean',
  'Firebase',
  'Amplify',
  'Stripe',
  'Twilio',
  'SendGrid',
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

// ─── India-specific location intelligence ────────────────────────────────────

export interface LocationIntelligence {
  normalizedLocation: string | null;
  locationCountry: string | null;
  isIndiaRemote: boolean;
}

const INDIA_CITY_MAP: Record<string, string> = {
  bengaluru: 'Bengaluru',
  bangalore: 'Bengaluru',
  bengalore: 'Bengaluru',
  blr: 'Bengaluru',
  mumbai: 'Mumbai',
  bombay: 'Mumbai',
  bom: 'Mumbai',
  pune: 'Pune',
  hyderabad: 'Hyderabad',
  hyd: 'Hyderabad',
  chennai: 'Chennai',
  madras: 'Chennai',
  delhi: 'Delhi NCR',
  'new delhi': 'Delhi NCR',
  'delhi ncr': 'Delhi NCR',
  ncr: 'Delhi NCR',
  gurugram: 'Gurugram',
  gurgaon: 'Gurugram',
  noida: 'Noida',
  'greater noida': 'Noida',
  faridabad: 'Faridabad',
  ghaziabad: 'Ghaziabad',
  kolkata: 'Kolkata',
  calcutta: 'Kolkata',
  ahmedabad: 'Ahmedabad',
  amdavad: 'Ahmedabad',
  jaipur: 'Jaipur',
  kochi: 'Kochi',
  cochin: 'Kochi',
  thiruvananthapuram: 'Thiruvananthapuram',
  trivandrum: 'Thiruvananthapuram',
  coimbatore: 'Coimbatore',
  indore: 'Indore',
  bhopal: 'Bhopal',
  nagpur: 'Nagpur',
  visakhapatnam: 'Visakhapatnam',
  vizag: 'Visakhapatnam',
  chandigarh: 'Chandigarh',
  lucknow: 'Lucknow',
  bhubaneswar: 'Bhubaneswar',
  mysuru: 'Mysuru',
  mysore: 'Mysuru',
  surat: 'Surat',
  vadodara: 'Vadodara',
  baroda: 'Vadodara',
  patna: 'Patna',
  ranchi: 'Ranchi',
};

const INDIA_INDICATORS = [
  'india',
  'karnataka',
  'maharashtra',
  'telangana',
  'tamil nadu',
  'andhra pradesh',
  'uttar pradesh',
  'haryana',
  'rajasthan',
  'gujarat',
  'west bengal',
  'kerala',
];

export function normalizeIndianLocation(
  location: string | null,
  description?: string
): LocationIntelligence {
  if (!location) {
    const descLower = (description ?? '').toLowerCase();
    const isIndiaRemote =
      /india[\s-]*remote|remote.*india|based in india/i.test(descLower);
    return {
      normalizedLocation: null,
      locationCountry: isIndiaRemote ? 'IN' : null,
      isIndiaRemote,
    };
  }

  const loc = location.toLowerCase().trim();

  // Multi-word keys must be checked before single-word keys to avoid partial matches
  const sortedKeys = Object.keys(INDIA_CITY_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (loc.includes(key)) {
      return {
        normalizedLocation: INDIA_CITY_MAP[key] ?? null,
        locationCountry: 'IN',
        isIndiaRemote: false,
      };
    }
  }

  if (INDIA_INDICATORS.some((ind) => loc.includes(ind))) {
    const isIndiaRemote = /remote/i.test(location);
    return {
      normalizedLocation: isIndiaRemote ? null : location,
      locationCountry: 'IN',
      isIndiaRemote,
    };
  }

  if (
    /\b(united states|usa|u\.s\.a?|new york|san francisco|seattle|austin|boston|chicago|los angeles|mountain view|palo alto|menlo park|sf bay area)\b/i.test(
      location
    )
  ) {
    return { normalizedLocation: null, locationCountry: 'US', isIndiaRemote: false };
  }

  if (
    /\b(united kingdom|uk|london|manchester|cambridge|oxford|edinburgh)\b/i.test(location)
  ) {
    return { normalizedLocation: null, locationCountry: 'GB', isIndiaRemote: false };
  }

  return { normalizedLocation: null, locationCountry: null, isIndiaRemote: false };
}

// ─── Salary extraction ────────────────────────────────────────────────────────

export interface SalaryIntelligence {
  min: number | null;
  max: number | null;
  currency: string | null;
  period: string | null;
  text: string | null;
}

export function extractSalary(description: string): SalaryIntelligence {
  const empty: SalaryIntelligence = {
    min: null,
    max: null,
    currency: null,
    period: null,
    text: null,
  };
  if (!description) return empty;

  const lpaRangePattern =
    /(?:ctc|salary|package|compensation)?[\s:]*(?:inr|₹|rs\.?)?\s*(\d+(?:[.,]\d+)?)\s*[-–to]+\s*(\d+(?:[.,]\d+)?)\s*(?:l\.?p\.?a\.?|lakhs?\s*per\s*annum|lakh\s*per\s*year)/i;
  const lpaPatternSingle =
    /(?:ctc|salary|package|compensation)?[\s:]*(?:inr|₹|rs\.?)?\s*(\d+(?:[.,]\d+)?)\s*(?:l\.?p\.?a\.?|lakhs?\s*per\s*annum|lakh\s*per\s*year)/i;
  const inrRangePattern =
    /(?:inr|₹|rs\.?)\s*(\d+(?:[,\d]*)?)\s*[-–to]+\s*(?:inr|₹|rs\.?)?\s*(\d+(?:[,\d]*)?)\s*(?:per\s*(?:annum|year|month|hour|hr))?/i;
  const usdRangePattern =
    /\$\s*(\d+(?:[.,]\d+)?)\s*k?\s*[-–to]+\s*\$\s*(\d+(?:[.,]\d+)?)\s*k?\s*(?:per\s*(?:year|annum|month|hour|hr))?/i;
  const eurRangePattern =
    /€\s*(\d+(?:[.,\d]*)?)\s*[-–to]+\s*€?\s*(\d+(?:[.,\d]*)?)\s*(?:per\s*(?:year|annum|month|hour|hr))?/i;

  function parseLakhsToInt(val: string): number {
    return Math.round(parseFloat(val.replace(/,/g, '')) * 100000);
  }

  function parseMoneyStr(val: string, isKilo: boolean): number {
    const num = parseFloat(val.replace(/,/g, ''));
    return isKilo ? Math.round(num * 1000) : Math.round(num);
  }

  function detectPeriod(text: string): string {
    const t = text.toLowerCase();
    if (/per\s*hour|\/hour|\/hr|\bhr\b/.test(t)) return 'hourly';
    if (/per\s*month|\/month|\bmonthly\b/.test(t)) return 'monthly';
    if (/per\s*annum|per\s*year|\/year|\bpa\b|\blpa\b|\bannual/.test(t)) return 'annual';
    return 'annual';
  }

  let m = description.match(lpaRangePattern);
  if (m?.[1] && m?.[2]) {
    return {
      min: parseLakhsToInt(m[1]),
      max: parseLakhsToInt(m[2]),
      currency: 'INR',
      period: 'annual',
      text: m[0].trim(),
    };
  }

  m = description.match(lpaPatternSingle);
  if (m?.[1]) {
    return {
      min: null,
      max: parseLakhsToInt(m[1]),
      currency: 'INR',
      period: 'annual',
      text: m[0].trim(),
    };
  }

  m = description.match(inrRangePattern);
  if (m?.[1] && m?.[2]) {
    const v1 = parseMoneyStr(m[1], false);
    const v2 = parseMoneyStr(m[2], false);
    if (v1 > 1000 && v2 > 1000) {
      return {
        min: Math.min(v1, v2),
        max: Math.max(v1, v2),
        currency: 'INR',
        period: detectPeriod(m[0]),
        text: m[0].trim(),
      };
    }
  }

  m = description.match(usdRangePattern);
  if (m?.[1] && m?.[2]) {
    const isKilo = /k/i.test(m[0]);
    const v1 = parseMoneyStr(m[1], isKilo || parseInt(m[1]) < 1000);
    const v2 = parseMoneyStr(m[2], isKilo || parseInt(m[2]) < 1000);
    return {
      min: Math.min(v1, v2),
      max: Math.max(v1, v2),
      currency: 'USD',
      period: detectPeriod(m[0]),
      text: m[0].trim(),
    };
  }

  m = description.match(eurRangePattern);
  if (m?.[1] && m?.[2]) {
    const v1 = parseMoneyStr(m[1], false);
    const v2 = parseMoneyStr(m[2], false);
    if (v1 > 1000 && v2 > 1000) {
      return {
        min: Math.min(v1, v2),
        max: Math.max(v1, v2),
        currency: 'EUR',
        period: detectPeriod(m[0]),
        text: m[0].trim(),
      };
    }
  }

  return empty;
}

// ─── Experience level inference ───────────────────────────────────────────────

export interface ExperienceLevelIntelligence {
  level: string | null;
  text: string | null;
}

export function inferExperienceLevel(
  title: string,
  description: string
): ExperienceLevelIntelligence {
  const titleLower = title.toLowerCase();
  const desc = description.slice(0, 3000).toLowerCase();

  if (/\b(intern|internship|trainee)\b/.test(titleLower)) {
    return { level: 'internship', text: 'Internship' };
  }

  if (
    /\b(fresher|fresh graduate|new grad|entry.?level|associate|graduate engineer|junior|jr\.?)\b/.test(
      titleLower
    )
  ) {
    return { level: 'fresher', text: 'Fresher / Entry-level' };
  }

  if (/\b(internship|intern position)\b/.test(desc)) {
    return { level: 'internship', text: 'Internship' };
  }
  if (/\b(fresher|fresh graduate|0 year|no experience required|entry.?level)\b/.test(desc)) {
    return { level: 'fresher', text: 'Fresher / Entry-level' };
  }

  // Range pattern: "3-5 years experience"
  const rangeMatch = desc.match(
    /(\d{1,2})\s*[-–]\s*(\d{1,2})\s*years?\s*(?:of\s*)?(?:relevant|professional|industry|software|engineering|work\s*)?(?:experience)?/i
  );
  if (rangeMatch?.[1] && rangeMatch?.[2]) {
    const lo = parseInt(rangeMatch[1]);
    const hi = parseInt(rangeMatch[2]);
    const textMatch = rangeMatch[0];
    if (lo === 0 || (lo <= 2 && hi <= 3)) return { level: '0_2', text: textMatch };
    if (lo <= 5 && hi <= 6) return { level: '2_5', text: textMatch };
    if (lo <= 8 && hi <= 9) return { level: '5_8', text: textMatch };
    if (lo >= 7 || hi >= 8) return { level: '8_plus', text: textMatch };
    return { level: '2_5', text: textMatch };
  }

  // Plus pattern: "5+ years of experience"
  const plusMatch = desc.match(
    /(\d{1,2})\+\s*years?\s*(?:of\s*)?(?:relevant|professional|industry|software|engineering|work\s*)?(?:experience)?/i
  );
  if (plusMatch?.[1]) {
    const n = parseInt(plusMatch[1]);
    const textMatch = plusMatch[0];
    if (n >= 8) return { level: '8_plus', text: textMatch };
    if (n >= 5) return { level: '5_8', text: textMatch };
    if (n >= 2) return { level: '2_5', text: textMatch };
    return { level: '0_2', text: textMatch };
  }

  if (
    /\b(senior|sr\.?|staff|principal|architect|lead|manager|head|director|vp)\b/.test(titleLower)
  ) {
    return { level: '5_8', text: null };
  }
  if (/\bmid.?level\b/.test(titleLower)) {
    return { level: '2_5', text: null };
  }

  return { level: null, text: null };
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

  const userSkills = profile.skills
    .filter((s) => s.source !== 'ai')
    .map((s) => s.name.trim())
    .filter(Boolean);
  const summaryConfirmed = profile.intelligenceMetadata?.summarySource !== 'ai';
  const confirmedHeadline = summaryConfirmed ? profile.headline : null;
  const hasPreferences =
    profile.preferredTitles.length > 0 ||
    (profile.desiredRoles?.length ?? 0) > 0 ||
    profile.preferredLocations.length > 0 ||
    Boolean(profile.workMode) ||
    Boolean(confirmedHeadline);

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
  const experienceTitles = profile.experience
    .filter((e) => e.source !== 'ai')
    .map((e) => e.title);
  const titleTargets = [
    ...profile.preferredTitles,
    ...(profile.desiredRoles ?? []),
    ...(confirmedHeadline ? [confirmedHeadline] : []),
    ...experienceTitles,
  ]
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const isExcludedRole = (profile.excludedRoles ?? []).some((excluded) => {
    const token = excluded.trim().toLowerCase();
    return token.length > 0 && jobTitleLower.includes(token);
  });
  if (isExcludedRole) {
    gaps.push('Matches an excluded role in your Career Interests');
  }

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
    profile.preferredTitles.length > 0 ||
    (profile.desiredRoles?.length ?? 0) > 0 ||
    Boolean(confirmedHeadline) ||
    experienceTitles.length > 0;
  const matchesAdjacentInterest = (profile.adjacentRoles ?? []).some((adj) => {
    const words = adj.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    return words.length > 0 && words.every((w) => jobTitleLower.includes(w));
  });
  const isAdjacentRole =
    matchesAdjacentInterest ||
    (hasExplicitTitles &&
      bestTitleRatio < 0.5 &&
      (matchedSkills.length >= 2 || transferableSkills.length >= 1 || skillsScore >= 50));

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
