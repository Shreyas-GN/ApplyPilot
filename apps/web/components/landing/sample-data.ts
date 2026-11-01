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
    role: "Backend Engineer",
    company: "Northstar Systems",
    location: "Bengaluru · Hybrid",
    tags: ["Python", "FastAPI"],
    selected: true,
  },
  {
    role: "Platform Engineer",
    company: "Rivermark Labs",
    location: "Remote",
    tags: ["Python", "PostgreSQL"],
    selected: false,
  },
  {
    role: "Software Engineer, APIs",
    company: "Coastline Data",
    location: "Bengaluru · Hybrid",
    tags: ["REST APIs", "Python"],
    selected: false,
  },
];
