/**
 * Shared illustrative sample data for product demonstrations across the landing page.
 * Clearly labeled as illustrative sample data — never presented as real customer metrics.
 */

export const sampleCandidate = {
  name: "Asha Rao",
  targetRole: "Backend Software Engineer",
  location: "Bengaluru · Hybrid or Remote",
  experienceLevel: "3 years · Early-career",
  completionPercent: 88,
  skills: ["Python", "FastAPI", "PostgreSQL", "REST APIs", "Docker", "Pytest"],
  experience: [
    {
      role: "Backend Developer",
      company: "Kaveri Cloud Services",
      period: "2023 – Present",
      bullet: "Built backend APIs using Python and FastAPI for internal workflow tooling.",
    },
    {
      role: "Software Engineer Intern",
      company: "Finch Analytics",
      period: "2022 – 2023",
      bullet: "Implemented data validation pipelines and unit tests with Pytest.",
    },
  ],
  education: {
    degree: "B.E. in Computer Science",
    institution: "Visvesvaraya Technological University",
    year: "2022",
  },
  projects: [
    {
      name: "QueryLedger",
      detail: "Open-source FastAPI + PostgreSQL telemetry service with 99.4% test coverage.",
    },
  ],
};

export type OpportunityDemo = {
  id: string;
  role: string;
  company: string;
  location: string;
  alignmentLabel: string;
  summary: string;
  aligns: Array<{ label: string; evidence: string }>;
  needsAttention: Array<{ label: string; note: string }>;
  resumeVersion: string;
  originalTitle: string;
  originalBullet: string;
  tailoredTitle: string;
  tailoredBullet: string;
  tailoringReason: string;
};

export const sampleOpportunities: OpportunityDemo[] = [
  {
    id: "backend-engineer",
    role: "Backend Engineer",
    company: "Example company",
    location: "Bengaluru · Hybrid",
    alignmentLabel: "Strong alignment",
    summary:
      "Core Python and FastAPI requirements match your verified experience; two infrastructure areas need confirmation.",
    aligns: [
      {
        label: "Python and FastAPI experience",
        evidence: "Verified in Backend Developer role at Kaveri Cloud Services",
      },
      {
        label: "REST API development",
        evidence: "Confirmed across work history and QueryLedger project",
      },
      {
        label: "Relevant backend projects",
        evidence: "QueryLedger FastAPI + PostgreSQL telemetry service",
      },
    ],
    needsAttention: [
      {
        label: "Production database experience is not clearly demonstrated",
        note: "PostgreSQL appears in your project work, but production scale isn't detailed yet.",
      },
      {
        label: "Cloud deployment experience needs confirmation",
        note: "Docker is listed in skills; add deployment context if applicable.",
      },
    ],
    resumeVersion: "Asha_Rao_Backend_ExampleCo_v2.pdf",
    originalTitle: "Backend Developer",
    originalBullet: "Built backend APIs using Python and FastAPI.",
    tailoredTitle: "Python Backend Engineer",
    tailoredBullet:
      "Developed REST APIs using Python and FastAPI, with experience in backend application development and PostgreSQL-backed services.",
    tailoringReason:
      "Reframed using your verified Kaveri Cloud Services API work and QueryLedger PostgreSQL project — no unverified skills added.",
  },
  {
    id: "platform-engineer",
    role: "Platform Engineer",
    company: "Rivermark Labs",
    location: "Remote",
    alignmentLabel: "Moderate alignment",
    summary:
      "Strong Python and testing foundation; container orchestration experience is listed as preferred.",
    aligns: [
      {
        label: "Python service architecture",
        evidence: "Verified in 2+ years of FastAPI backend development",
      },
      {
        label: "Automated testing discipline",
        evidence: "Pytest suites across Finch Analytics & QueryLedger",
      },
    ],
    needsAttention: [
      {
        label: "Kubernetes orchestration not found on profile",
        note: "Listed as a preferred qualification — consider addressing in cover note.",
      },
    ],
    resumeVersion: "Asha_Rao_Platform_Rivermark_v1.pdf",
    originalTitle: "Backend Developer",
    originalBullet: "Built backend APIs using Python and FastAPI.",
    tailoredTitle: "Backend & Platform Developer",
    tailoredBullet:
      "Engineered containerized Python/FastAPI services with automated Pytest verification and structured telemetry.",
    tailoringReason:
      "Highlights your Docker skill and Pytest automation from your verified profile without inventing Kubernetes experience.",
  },
];

export type PipelineStage = "Saved" | "Applied" | "Interview" | "Offers";

export const samplePipelineCounts: Record<PipelineStage, string> = {
  Saved: "08",
  Applied: "12",
  Interview: "03",
  Offers: "01",
};

export const samplePipelineApplications: Array<{
  id: string;
  role: string;
  company: string;
  location: string;
  stage: PipelineStage;
  resumeVersion: string;
  updatedAt: string;
  note: string;
}> = [
    {
      id: "app-1",
      role: "Backend Engineer",
      company: "Example company",
      location: "Bengaluru · Hybrid",
      stage: "Interview",
      resumeVersion: "Backend_ExampleCo_v2.pdf",
      updatedAt: "Technical round · Thu 2:00 PM",
      note: "Prepare PostgreSQL indexing examples from QueryLedger.",
    },
    {
      id: "app-2",
      role: "Platform Engineer",
      company: "Rivermark Labs",
      location: "Remote",
      stage: "Applied",
      resumeVersion: "Platform_Rivermark_v1.pdf",
      updatedAt: "Applied 3 days ago",
      note: "Follow-up reminder set for next Tuesday.",
    },
    {
      id: "app-3",
      role: "Software Engineer, APIs",
      company: "Coastline Data",
      location: "Bengaluru · Hybrid",
      stage: "Saved",
      resumeVersion: "Not tailored yet",
      updatedAt: "Saved yesterday",
      note: "Review missing cloud deployment requirement before tailoring.",
    },
    {
      id: "app-4",
      role: "Junior Systems Engineer",
      company: "Meridian Tech",
      location: "Bengaluru",
      stage: "Offers",
      resumeVersion: "Systems_Meridian_v3.pdf",
      updatedAt: "Offer received",
      note: "Comparing role scope and compensation against target preferences.",
    },
  ];

export const sampleOpportunity = {
  role: "Backend Engineer",
  company: "Example company",
  workMode: "Hybrid",
  location: "Bengaluru",
  requirements: ["Python", "API development", "Relational databases"],
};

export const sampleOpportunityList = [
  {
    id: "backend-engineer",
    role: "Backend Engineer",
    company: "Example company",
    location: "Bengaluru · Hybrid",
    tags: ["Python", "FastAPI"],
    fitLevel: "Strong alignment",
    reasoning: "Aligns on Python and FastAPI — the core backend skills highlighted on Asha's profile.",
    selected: true,
  },
  {
    id: "platform-engineer",
    role: "Platform Engineer",
    company: "Rivermark Labs",
    location: "Remote",
    tags: ["Python", "PostgreSQL"],
    fitLevel: "Moderate alignment",
    reasoning: "Direct match on Python and testing; container orchestration is listed as preferred.",
    selected: false,
  },
];
