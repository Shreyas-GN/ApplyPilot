import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-ap-paper px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-[640px]">
        <Link href="/" className="font-ui text-sm text-ap-muted hover:text-ap-ink">
          ← Back to ApplyPilot
        </Link>
        <h1 className="mt-6 font-display text-3xl text-ap-ink">Terms</h1>
        <p className="mt-4 font-ui text-[15px] leading-relaxed text-ap-body">
          We&apos;re finalising complete terms of service. ApplyPilot is in active development: some
          features described on our site are previews of upcoming capability rather than
          generally available today. Questions in the meantime can go to{" "}
          <a href="mailto:hello@applypilot.app" className="text-ap-ink underline">
            hello@applypilot.app
          </a>
          .
        </p>
      </div>
    </main>
  );
}
