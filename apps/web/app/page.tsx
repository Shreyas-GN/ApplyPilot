import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { Workflow } from "@/components/landing/workflow";
import { Differentiation } from "@/components/landing/differentiation";
import { CandidateControl } from "@/components/landing/candidate-control";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <main className="bg-ap-paper">
      <Nav />
      <Hero />
      <TrustStrip />
      <Workflow />
      <Differentiation />
      <CandidateControl />
      <ProductShowcase />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
