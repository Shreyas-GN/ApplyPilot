import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold text-brand-700">ApplyPilot</span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link href="/signup">
            <Button>Sign up</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Find better jobs. Apply smarter.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
          Upload your resume, build a structured profile, and keep every version of your resume
          organized in one place — with AI assistance you stay fully in control of.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup">
            <Button className="px-6 py-3 text-base">Get started — it&apos;s free</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="px-6 py-3 text-base">
              Log in
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "1. Upload your resume",
              body: "PDF or DOCX. We extract the text and let AI suggest a structured profile — you review and confirm every field.",
            },
            {
              title: "2. Build your profile",
              body: "Experience, education, skills, projects, and job preferences — organized and ready to reuse everywhere.",
            },
            {
              title: "3. Track your resumes",
              body: "Keep multiple versions, pick a primary, and see exactly what's been parsed by AI vs. confirmed by you.",
            },
          ].map((step) => (
            <div key={step.title} className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
