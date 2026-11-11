import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-ap-paper px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-[680px]">
        <Link href="/" className="font-ui text-sm text-ap-muted hover:text-ap-ink">
          ← Back to ApplyPilot
        </Link>
        <h1 className="mt-6 font-display text-3xl text-ap-ink">Privacy Policy</h1>
        <p className="mt-2 font-mono text-xs text-ap-muted">Last updated: November 2026</p>

        <div className="mt-6 flex flex-col gap-5 font-ui text-[15px] leading-relaxed text-ap-body">
          <section>
            <h2 className="font-semibold text-ap-ink">1. Information We Collect</h2>
            <p className="mt-1.5">
              ApplyPilot stores the account credentials, structured career profile details,
              uploaded PDF/DOCX résumés, AI-tailored drafts, tracked job applications, and
              activity logs you choose to create. Every database table is scoped to your
              authenticated user account.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-ap-ink">2. Infrastructure & AI Processing</h2>
            <p className="mt-1.5">
              Authentication, relational storage, and private résumé files are hosted on
              Supabase. When you upload a résumé or trigger AI tailoring, relevant text is
              sent to Anthropic Claude solely to extract your profile or draft your requested
              material. ApplyPilot never requests or stores your third-party ATS passwords.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-ap-ink">3. Chrome Extension Co-Pilot</h2>
            <p className="mt-1.5">
              When paired, the Chrome Extension uses a revocable device token scoped to your
              account and operates only on supported job pages when you open and confirm
              actions inside the popup.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-ap-ink">4. Export & Deletion Rights</h2>
            <p className="mt-1.5">
              You can download a complete JSON copy of your profile, résumés metadata, tailored
              drafts, and application history anytime in Settings, or permanently delete your
              account (including stored files and auth credentials). For questions, contact{" "}
              <a href="mailto:hello@applypilot.app" className="text-ap-ink underline">
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
