import { ProfileArtifact } from "./artifacts/profile-artifact";
import { DiscoveryArtifact } from "./artifacts/discovery-artifact";
import { PreparationArtifact } from "./artifacts/preparation-artifact";
import { TrackerArtifact } from "./artifacts/tracker-artifact";

const STEPS = [
  {
    number: "01",
    title: "Build your profile",
    body: "Bring your experience, skills and résumé into one structured profile.",
    Artifact: ProfileArtifact,
  },
  {
    number: "02",
    title: "Find relevant roles",
    body: "Explore opportunities against your experience and preferences.",
    Artifact: DiscoveryArtifact,
  },
  {
    number: "03",
    title: "Prepare your application",
    body: "Review tailored application material before using it.",
    Artifact: PreparationArtifact,
  },
  {
    number: "04",
    title: "Keep the process moving",
    body: "Track applications and know what needs attention next.",
    Artifact: TrackerArtifact,
  },
];

export function Workflow() {
  return (
    <section id="how-it-works" className="bg-ap-paper py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="max-w-xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-ap-vermilion">How it works</p>
          <h2 className="mt-3 font-display text-[32px] leading-[1.1] text-ap-ink sm:text-[40px]">
            One workflow, from profile to progress.
          </h2>
        </div>

        <div className="mt-12 flex flex-col gap-16 sm:mt-16 sm:gap-20">
          {STEPS.map((step, index) => {
            const reversed = index % 2 === 1;
            return (
              <div
                key={step.number}
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16`}
              >
                <div className={reversed ? "lg:order-2" : undefined}>
                  <span className="font-mono text-sm text-ap-muted">{step.number}</span>
                  <h3 className="mt-2 font-display text-2xl text-ap-ink sm:text-[28px]">{step.title}</h3>
                  <p className="mt-3 max-w-sm font-ui text-[15px] leading-relaxed text-ap-body">{step.body}</p>
                </div>
                <div className={reversed ? "lg:order-1" : undefined}>
                  <step.Artifact compact />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
