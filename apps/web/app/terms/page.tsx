import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-ui-canvas px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-[680px]">
        <Link href="/" className="font-ui text-sm text-ui-muted hover:text-ui-ink">
          ← Back to ApplyPilot
        </Link>
        <h1 className="mt-6 font-display text-3xl text-ui-ink">Terms of Service</h1>
        <p className="mt-2 font-mono text-xs text-ui-muted">Last updated: November 2026</p>

        <div className="mt-6 flex flex-col gap-5 font-ui text-[15px] leading-relaxed text-ui-body">
          <section>
            <h2 className="font-semibold text-ui-ink">1. Candidate Review & Responsibility</h2>
            <p className="mt-1.5">
              ApplyPilot provides résumé parsing, match scoring, AI tailoring drafts, and
              human-in-the-loop autofill assistance. You are solely responsible for reviewing
              and verifying all profile data, tailored documents, and form entries before
              submitting any job application.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-ui-ink">2. Acceptable Use</h2>
            <p className="mt-1.5">
              You agree to provide truthful information in your candidate profile, respect the
              terms of external employer career sites, and not misuse ApplyPilot for automated
              spam submissions or unauthorized scraping.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-ui-ink">3. Service Availability</h2>
            <p className="mt-1.5">
              ApplyPilot is provided on an &ldquo;as is&rdquo; basis during active rollout.
              We may update features, supported ATS boards, or limits over time. Questions can
              be sent to{" "}
              <a href="mailto:hello@applypilot.app" className="text-ui-ink underline">
                hello@applypilot.app
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
