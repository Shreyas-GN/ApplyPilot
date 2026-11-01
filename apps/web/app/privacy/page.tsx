import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-ap-paper px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-[640px]">
        <Link href="/" className="font-ui text-sm text-ap-muted hover:text-ap-ink">
          ← Back to ApplyPilot
        </Link>
        <h1 className="mt-6 font-display text-3xl text-ap-ink">Privacy</h1>
        <p className="mt-4 font-ui text-[15px] leading-relaxed text-ap-body">
          We&apos;re finalising a complete privacy policy covering what data ApplyPilot collects,
          how it&apos;s used, and how you can export or delete it. In the meantime: your profile
          and
          résumé data are scoped to your account only, and are never shared with third parties.
          If you have questions now, reach us at{" "}
          <a href="mailto:hello@applypilot.app" className="text-ap-ink underline">
            hello@applypilot.app
          </a>
          .
        </p>
      </div>
    </main>
  );
}
