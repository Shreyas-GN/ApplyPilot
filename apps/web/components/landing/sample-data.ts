/**
 * Shared fictional sample scenario reused across every product artifact on the
 * landing page, per docs/design/PRODUCT_EXHIBITION.md §2. Not real user data.
 */
export const sampleCandidate = {
  name: "Asha Rao",
  targetRole: "Backend Software Engineer",
  location: "Bengaluru / Remote",
  experienceLevel: "Early career",
  skills: ["Python", "FastAPI", "PostgreSQL", "REST APIs"],
};

export const sampleOpportunity = {
  role: "Backend Engineer",
  company: "Northstar Systems",
  workMode: "Hybrid",
  location: "Bengaluru",
  requirements: ["Python", "API development", "Relational databases"],
};

export const sampleOpportunityList = [
  {
    id: "northstar",
    role: "Backend Engineer",
    company: "Northstar Systems",
    location: "Bengaluru · Hybrid",
    tags: ["Python", "FastAPI"],
    fitLevel: "High Alignment",
    reasoning: "Aligns on Python and FastAPI — the core backend skills highlighted on Asha's profile.",
    selected: true,
  },
  {
    id: "rivermark",
    role: "Platform Engineer",
    company: "Rivermark Labs",
    location: "Remote",
    tags: ["Python", "PostgreSQL"],
    fitLevel: "Strong Match",
    reasoning: "Direct match on PostgreSQL indexing and API design; pipeline automation is an easy ramp-up.",
    selected: false,
  },
  {
    id: "coastline",
    role: "Software Engineer, APIs",
    company: "Coastline Data",
    location: "Bengaluru · Hybrid",
    tags: ["REST APIs", "Python"],
    fitLevel: "Good Match",
    reasoning: "Matches RESTful API standards; recommends highlighting query optimization in your cover letter.",
    selected: false,
  },
];
