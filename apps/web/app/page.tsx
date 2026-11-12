import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem-section";
import { WorkspaceIntro } from "@/components/landing/workspace-intro";
import { CandidateIntelligence } from "@/components/landing/candidate-intelligence";
import { OpportunityIntelligence } from "@/components/landing/opportunity-intelligence";
import { AdaptiveResume } from "@/components/landing/adaptive-resume";
import { ApplicationCompanion } from "@/components/landing/application-companion";
import { ApplicationTracking } from "@/components/landing/application-tracking";
import { PhilosophySection } from "@/components/landing/philosophy-section";
import { TrustPrivacy } from "@/components/landing/trust-privacy";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <main className="bg-lp-bg text-lp-ink">
      <Nav />
      <Hero />
      <ProblemSection />
      <WorkspaceIntro />
      <CandidateIntelligence />
      <OpportunityIntelligence />
      <AdaptiveResume />
      <ApplicationCompanion />
      <ApplicationTracking />
      <PhilosophySection />
      <TrustPrivacy />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
