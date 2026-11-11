import type {
  AiRoleSuggestionDto,
  ProfileDto,
  ProfileIntelligenceDto,
  ProfileIntelligenceMetadataDto,
  ProfileSuggestionDto,
  SectionCompletenessDto,
} from "@/lib/types";

interface RoleRule {
  keywords: string[];
  desired: string[];
  adjacent: string[];
  basis: string;
}

// Deterministic heuristic mapping from confirmed skills/titles to exploratory
// career role ideas. These are always surfaced strictly as unverified AI
// suggestions and are never treated as confirmed candidate preferences.
const ROLE_EXPLORATION_RULES: RoleRule[] = [
  {
    keywords: ["react", "next.js", "nextjs", "typescript", "javascript", "frontend", "css", "tailwind"],
    desired: ["Frontend Engineer", "Full-Stack Engineer"],
    adjacent: ["Design Engineer", "Product Engineer"],
    basis: "confirmed frontend & TypeScript stack",
  },
  {
    keywords: ["node", "node.js", "express", "postgresql", "postgres", "sql", "api", "backend", "go", "java", "spring"],
    desired: ["Backend Engineer", "Full-Stack Engineer"],
    adjacent: ["Platform Engineer", "API Solutions Engineer"],
    basis: "confirmed backend & database experience",
  },
  {
    keywords: ["python", "machine learning", "ml", "pytorch", "tensorflow", "llm", "ai", "nlp", "data science"],
    desired: ["AI / ML Engineer", "Applied AI Engineer"],
    adjacent: ["Data Scientist", "MLOps Engineer"],
    basis: "confirmed Python & AI/ML capabilities",
  },
  {
    keywords: ["data", "analytics", "tableau", "power bi", "dbt", "snowflake", "bigquery", "spark"],
    desired: ["Data Engineer", "Analytics Engineer"],
    adjacent: ["Data Analyst", "BI Engineer"],
    basis: "confirmed data & analytics toolkit",
  },
  {
    keywords: ["aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ci/cd", "devops", "linux"],
    desired: ["DevOps Engineer", "Cloud Infrastructure Engineer"],
    adjacent: ["Site Reliability Engineer", "Platform Engineer"],
    basis: "confirmed cloud & infrastructure skills",
  },
  {
    keywords: ["product", "roadmap", "stakeholder", "agile", "scrum", "user research"],
    desired: ["Product Manager", "Technical Product Manager"],
    adjacent: ["Product Operations Manager", "Solutions Architect"],
    basis: "confirmed product & delivery background",
  },
  {
    keywords: ["figma", "ux", "ui", "design system", "prototyping", "wireframe"],
    desired: ["Product Designer", "UI/UX Designer"],
    adjacent: ["Design Systems Engineer", "UX Researcher"],
    basis: "confirmed design & UX experience",
  },
  {
    keywords: ["qa", "playwright", "cypress", "selenium", "testing", "automation"],
    desired: ["QA Automation Engineer", "SDET"],
    adjacent: ["Quality Engineering Lead", "Release Engineer"],
    basis: "confirmed test automation expertise",
  },
];

export function parseIntelligenceMetadata(
  raw: unknown
): ProfileIntelligenceMetadataDto {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const obj = raw as Record<string, unknown>;
  const dismissedRaw = Array.isArray(obj.dismissedRoleSuggestions)
    ? obj.dismissedRoleSuggestions.filter((v): v is string => typeof v === "string")
    : [];

  return {
    personalInfoSource:
      obj.personalInfoSource === "ai" || obj.personalInfoSource === "user"
        ? obj.personalInfoSource
        : undefined,
    summarySource:
      obj.summarySource === "ai" || obj.summarySource === "user"
        ? obj.summarySource
        : undefined,
    dismissedRoleSuggestions: dismissedRaw,
  };
}

export function buildAiRoleSuggestions(
  profile: Pick<
    ProfileDto,
    | "headline"
    | "skills"
    | "experience"
    | "preferredTitles"
    | "desiredRoles"
    | "adjacentRoles"
    | "excludedRoles"
    | "intelligenceMetadata"
  >
): AiRoleSuggestionDto[] {
  const confirmedSkills = profile.skills
    .filter((s) => s.source !== "ai")
    .map((s) => s.name.toLowerCase());
  const confirmedTitles = profile.experience
    .filter((e) => e.source !== "ai")
    .map((e) => e.title.toLowerCase());
  const meta = profile.intelligenceMetadata;
  const confirmedHeadline =
    meta?.summarySource !== "ai" && profile.headline
      ? profile.headline.toLowerCase()
      : "";

  const corpus = [
    ...confirmedSkills,
    ...confirmedTitles,
    ...(confirmedHeadline ? [confirmedHeadline] : []),
  ];

  if (corpus.length === 0) {
    return [];
  }

  const existingNormalized = new Set<string>(
    [
      ...(profile.preferredTitles ?? []),
      ...(profile.desiredRoles ?? []),
      ...(profile.adjacentRoles ?? []),
      ...(profile.excludedRoles ?? []),
      ...(meta?.dismissedRoleSuggestions ?? []),
    ].map((r) => r.trim().toLowerCase())
  );

  const suggestions: AiRoleSuggestionDto[] = [];
  const seen = new Set<string>();

  for (const rule of ROLE_EXPLORATION_RULES) {
    const matched = rule.keywords.some((kw) =>
      corpus.some((token) => token.includes(kw))
    );
    if (!matched) continue;

    for (const role of rule.desired) {
      const key = role.toLowerCase();
      if (existingNormalized.has(key) || seen.has(key)) continue;
      seen.add(key);
      suggestions.push({
        role,
        kind: "desired",
        reason: `Matches your ${rule.basis}`,
        source: "ai_suggested",
      });
    }

    for (const role of rule.adjacent) {
      const key = role.toLowerCase();
      if (existingNormalized.has(key) || seen.has(key)) continue;
      seen.add(key);
      suggestions.push({
        role,
        kind: "adjacent",
        reason: `Adjacent path leveraging your ${rule.basis}`,
        source: "ai_suggested",
      });
    }
  }

  return suggestions.slice(0, 6);
}

export function computeProfileIntelligence(
  profile: Omit<ProfileDto, "intelligence" | "completionPercent">
): ProfileIntelligenceDto {
  const meta = profile.intelligenceMetadata ?? {};

  // 1. Personal Information (weight: 15)
  const hasPersonalFields = Boolean(
    profile.fullName?.trim() &&
      (profile.email?.trim() || profile.phone?.trim() || profile.location?.trim())
  );
  const hasAnyPersonalValue = Boolean(
    profile.fullName?.trim() ||
      profile.phone?.trim() ||
      profile.location?.trim() ||
      profile.linkedinUrl?.trim() ||
      profile.githubUrl?.trim() ||
      profile.portfolioUrl?.trim()
  );
  const personalIsAiUnverified = meta.personalInfoSource === "ai" && hasAnyPersonalValue;
  const personalLinksCount = [
    profile.linkedinUrl,
    profile.githubUrl,
    profile.portfolioUrl,
  ].filter((v) => Boolean(v?.trim())).length;

  let personalConfirmedScore = 0;
  if (!personalIsAiUnverified && hasPersonalFields) {
    personalConfirmedScore = personalLinksCount > 0 ? 15 : 10;
  }
  const personalPotentialScore = hasPersonalFields
    ? personalLinksCount > 0
      ? 15
      : 10
    : 0;

  // 2. Professional Summary (weight: 10)
  const hasSummaryFields = Boolean(profile.headline?.trim() && profile.summary?.trim());
  const hasAnySummaryValue = Boolean(profile.headline?.trim() || profile.summary?.trim());
  const summaryIsAiUnverified = meta.summarySource === "ai" && hasAnySummaryValue;
  const summaryConfirmedScore =
    !summaryIsAiUnverified && hasSummaryFields
      ? 10
      : !summaryIsAiUnverified && hasAnySummaryValue
        ? 5
        : 0;
  const summaryPotentialScore = hasSummaryFields ? 10 : hasAnySummaryValue ? 5 : 0;

  // 3. Skills & Technologies (weight: 15)
  const confirmedSkills = profile.skills.filter((s) => s.source !== "ai");
  const aiSkills = profile.skills.filter((s) => s.source === "ai");
  const skillsConfirmedScore =
    confirmedSkills.length >= 3 ? 15 : confirmedSkills.length > 0 ? 8 : 0;
  const skillsPotentialScore =
    profile.skills.length >= 3 ? 15 : profile.skills.length > 0 ? 8 : 0;

  // 4. Work Experience (weight: 15)
  const confirmedExp = profile.experience.filter((e) => e.source !== "ai");
  const aiExp = profile.experience.filter((e) => e.source === "ai");
  const expConfirmedScore = confirmedExp.length > 0 ? 15 : 0;
  const expPotentialScore = profile.experience.length > 0 ? 15 : 0;

  // 5. Education (weight: 10)
  const confirmedEdu = profile.education.filter((e) => e.source !== "ai");
  const aiEdu = profile.education.filter((e) => e.source === "ai");
  const eduConfirmedScore = confirmedEdu.length > 0 ? 10 : 0;
  const eduPotentialScore = profile.education.length > 0 ? 10 : 0;

  // 6. Projects (weight: 10)
  const confirmedProjects = profile.projects.filter((p) => p.source !== "ai");
  const aiProjects = profile.projects.filter((p) => p.source === "ai");
  const projectsConfirmedScore = confirmedProjects.length > 0 ? 10 : 0;
  const projectsPotentialScore = profile.projects.length > 0 ? 10 : 0;

  // 7. Certifications (weight: 5)
  const confirmedCerts = profile.certifications.filter((c) => c.source !== "ai");
  const aiCerts = profile.certifications.filter((c) => c.source === "ai");
  const certsConfirmedScore = confirmedCerts.length > 0 ? 5 : 0;
  const certsPotentialScore = profile.certifications.length > 0 ? 5 : 0;

  // 8. Career Preferences (weight: 10)
  const hasPrefsCore = profile.preferredTitles.length > 0;
  const hasPrefsContext = Boolean(
    profile.workMode ||
      profile.preferredLocations.length > 0 ||
      profile.employmentTypes.length > 0 ||
      profile.preferredExperienceLevel
  );
  const prefsConfirmedScore =
    hasPrefsCore && hasPrefsContext ? 10 : hasPrefsCore || hasPrefsContext ? 5 : 0;

  // 9. Career Interests (weight: 10)
  const desiredRoles = profile.desiredRoles ?? [];
  const adjacentRoles = profile.adjacentRoles ?? [];
  const excludedRoles = profile.excludedRoles ?? [];
  const hasDesired = desiredRoles.length > 0;
  const hasInterestBreadth =
    adjacentRoles.length > 0 ||
    excludedRoles.length > 0 ||
    profile.preferredIndustries.length > 0;
  const interestsConfirmedScore =
    hasDesired && hasInterestBreadth ? 10 : hasDesired || hasInterestBreadth ? 5 : 0;

  const sections: SectionCompletenessDto[] = [
    {
      id: "personal_info",
      label: "Personal Info",
      complete: personalConfirmedScore >= 15,
      confirmedCount: personalIsAiUnverified ? 0 : hasAnyPersonalValue ? 1 : 0,
      aiUnverifiedCount: personalIsAiUnverified ? 1 : 0,
      provenance: personalIsAiUnverified
        ? "ai"
        : hasAnyPersonalValue
          ? "user"
          : "empty",
      weight: 15,
      earnedWeight: personalConfirmedScore,
    },
    {
      id: "professional_summary",
      label: "Summary",
      complete: summaryConfirmedScore >= 10,
      confirmedCount: summaryIsAiUnverified ? 0 : hasAnySummaryValue ? 1 : 0,
      aiUnverifiedCount: summaryIsAiUnverified ? 1 : 0,
      provenance: summaryIsAiUnverified
        ? "ai"
        : hasAnySummaryValue
          ? "user"
          : "empty",
      weight: 10,
      earnedWeight: summaryConfirmedScore,
    },
    {
      id: "skills",
      label: "Skills",
      complete: confirmedSkills.length >= 3,
      confirmedCount: confirmedSkills.length,
      aiUnverifiedCount: aiSkills.length,
      provenance:
        aiSkills.length > 0 && confirmedSkills.length === 0
          ? "ai"
          : confirmedSkills.length > 0
            ? "user"
            : "empty",
      weight: 15,
      earnedWeight: skillsConfirmedScore,
    },
    {
      id: "experience",
      label: "Experience",
      complete: confirmedExp.length > 0,
      confirmedCount: confirmedExp.length,
      aiUnverifiedCount: aiExp.length,
      provenance:
        aiExp.length > 0 && confirmedExp.length === 0
          ? "ai"
          : confirmedExp.length > 0
            ? "user"
            : "empty",
      weight: 15,
      earnedWeight: expConfirmedScore,
    },
    {
      id: "education",
      label: "Education",
      complete: confirmedEdu.length > 0,
      confirmedCount: confirmedEdu.length,
      aiUnverifiedCount: aiEdu.length,
      provenance:
        aiEdu.length > 0 && confirmedEdu.length === 0
          ? "ai"
          : confirmedEdu.length > 0
            ? "user"
            : "empty",
      weight: 10,
      earnedWeight: eduConfirmedScore,
    },
    {
      id: "projects",
      label: "Projects",
      complete: confirmedProjects.length > 0,
      confirmedCount: confirmedProjects.length,
      aiUnverifiedCount: aiProjects.length,
      provenance:
        aiProjects.length > 0 && confirmedProjects.length === 0
          ? "ai"
          : confirmedProjects.length > 0
            ? "user"
            : "empty",
      weight: 10,
      earnedWeight: projectsConfirmedScore,
    },
    {
      id: "certifications",
      label: "Certifications",
      complete: confirmedCerts.length > 0,
      confirmedCount: confirmedCerts.length,
      aiUnverifiedCount: aiCerts.length,
      provenance:
        aiCerts.length > 0 && confirmedCerts.length === 0
          ? "ai"
          : confirmedCerts.length > 0
            ? "user"
            : "empty",
      weight: 5,
      earnedWeight: certsConfirmedScore,
    },
    {
      id: "career_preferences",
      label: "Preferences",
      complete: prefsConfirmedScore >= 10,
      confirmedCount: prefsConfirmedScore > 0 ? 1 : 0,
      aiUnverifiedCount: 0,
      provenance: prefsConfirmedScore > 0 ? "user" : "empty",
      weight: 10,
      earnedWeight: prefsConfirmedScore,
    },
    {
      id: "career_interests",
      label: "Interests",
      complete: interestsConfirmedScore >= 10,
      confirmedCount: interestsConfirmedScore > 0 ? 1 : 0,
      aiUnverifiedCount: 0,
      provenance: interestsConfirmedScore > 0 ? "user" : "empty",
      weight: 10,
      earnedWeight: interestsConfirmedScore,
    },
  ];

  const confirmedPercent = Math.min(
    sections.reduce((acc, s) => acc + s.earnedWeight, 0),
    100
  );
  const totalWithAiPercent = Math.min(
    personalPotentialScore +
      summaryPotentialScore +
      skillsPotentialScore +
      expPotentialScore +
      eduPotentialScore +
      projectsPotentialScore +
      certsPotentialScore +
      prefsConfirmedScore +
      interestsConfirmedScore,
    100
  );

  const unverifiedAiCount = sections.reduce(
    (acc, s) => acc + s.aiUnverifiedCount,
    0
  );
  const confirmedItemCount =
    confirmedSkills.length +
    confirmedExp.length +
    confirmedEdu.length +
    confirmedProjects.length +
    confirmedCerts.length;

  const suggestions: ProfileSuggestionDto[] = [];

  if (unverifiedAiCount > 0) {
    const affectedLabels = sections
      .filter((s) => s.aiUnverifiedCount > 0)
      .map((s) => `${s.label} (${s.aiUnverifiedCount})`)
      .join(", ");
    const firstAiSection = sections.find((s) => s.aiUnverifiedCount > 0)!;
    suggestions.push({
      id: "verify_ai_entries",
      sectionId: firstAiSection.id,
      title: `Confirm ${unverifiedAiCount} AI-extracted ${unverifiedAiCount === 1 ? "entry" : "entries"}`,
      description: `Pending verification in ${affectedLabels}. Unverified AI entries are excluded from resume tailoring and match scoring until confirmed.`,
      actionLabel: "Review now",
      priority: "high",
      kind: "verify_ai",
    });
  }

  if (!hasPersonalFields) {
    suggestions.push({
      id: "complete_personal_info",
      sectionId: "personal_info",
      title: "Add core identity & contact details",
      description:
        "Include your full name, email, phone, and city so tailored resumes and application forms populate accurately.",
      actionLabel: "Edit Personal Info",
      priority: "high",
      kind: "complete_missing",
    });
  } else if (personalLinksCount === 0) {
    suggestions.push({
      id: "add_personal_links",
      sectionId: "personal_info",
      title: "Link LinkedIn, GitHub, or portfolio",
      description:
        "Verified profile URLs strengthen recruiter confidence and autofill job board applications.",
      actionLabel: "Add links",
      priority: "medium",
      kind: "enrich",
    });
  }

  if (!hasSummaryFields) {
    suggestions.push({
      id: "complete_summary",
      sectionId: "professional_summary",
      title: "Define your headline, summary, and career stage",
      description:
        "A crisp positioning headline and summary anchor ATS keywords and tailoring tone.",
      actionLabel: "Write summary",
      priority: "high",
      kind: "complete_missing",
    });
  }

  if (confirmedSkills.length < 3 && aiSkills.length === 0) {
    suggestions.push({
      id: "add_confirmed_skills",
      sectionId: "skills",
      title: "Add at least 3 verified skills",
      description:
        "List categorized skills with proficiency and evidence so job matching scores accurately.",
      actionLabel: "Add skills",
      priority: "high",
      kind: "complete_missing",
    });
  } else if (
    confirmedSkills.length > 0 &&
    confirmedSkills.every((s) => !s.proficiency && !s.evidence)
  ) {
    suggestions.push({
      id: "enrich_skill_evidence",
      sectionId: "skills",
      title: "Add proficiency or evidence to your skills",
      description:
        "Backing top skills with years of experience or concrete evidence sharpens resume tailoring.",
      actionLabel: "Enrich skills",
      priority: "low",
      kind: "enrich",
    });
  }

  if (confirmedExp.length === 0 && aiExp.length === 0) {
    suggestions.push({
      id: "add_experience",
      sectionId: "experience",
      title: "Add work experience",
      description:
        "Document roles, dates, responsibilities, and measurable achievements for tailored resumes.",
      actionLabel: "Add experience",
      priority: "high",
      kind: "complete_missing",
    });
  } else if (
    confirmedExp.length > 0 &&
    confirmedExp.every((e) => (e.achievements?.length ?? 0) === 0)
  ) {
    suggestions.push({
      id: "add_experience_achievements",
      sectionId: "experience",
      title: "Highlight measurable achievements in experience",
      description:
        "Adding outcome-focused achievements and technologies improves resume tailoring quality.",
      actionLabel: "Update experience",
      priority: "medium",
      kind: "enrich",
    });
  }

  if (confirmedEdu.length === 0 && aiEdu.length === 0) {
    suggestions.push({
      id: "add_education",
      sectionId: "education",
      title: "Add your education history",
      description:
        "Include institution, degree, specialization, graduation year, and grade where applicable.",
      actionLabel: "Add education",
      priority: "medium",
      kind: "complete_missing",
    });
  }

  if (confirmedProjects.length === 0 && aiProjects.length === 0) {
    suggestions.push({
      id: "add_projects",
      sectionId: "projects",
      title: "Showcase 1-2 key projects",
      description:
        "Projects with technologies, contributions, and GitHub/live links prove hands-on execution.",
      actionLabel: "Add project",
      priority: "medium",
      kind: "complete_missing",
    });
  }

  if (prefsConfirmedScore < 10) {
    suggestions.push({
      id: "set_preferences",
      sectionId: "career_preferences",
      title: "Set target roles, work mode, and compensation",
      description:
        "Complete Career Preferences so ApplyPilot filters and ranks opportunities to your exact targets.",
      actionLabel: "Set preferences",
      priority: "medium",
      kind: "complete_missing",
    });
  }

  if (interestsConfirmedScore < 10) {
    suggestions.push({
      id: "set_interests",
      sectionId: "career_interests",
      title: "Specify desired & adjacent roles in Career Interests",
      description:
        "Separating core roles, adjacent roles to explore, and excluded roles prevents noisy recommendations.",
      actionLabel: "Configure interests",
      priority: "medium",
      kind: "complete_missing",
    });
  }

  const aiSuggestedRoles = buildAiRoleSuggestions(profile);

  return {
    confirmedPercent,
    totalWithAiPercent,
    unverifiedAiCount,
    confirmedItemCount,
    sections,
    suggestions: suggestions.slice(0, 6),
    aiSuggestedRoles,
  };
}

