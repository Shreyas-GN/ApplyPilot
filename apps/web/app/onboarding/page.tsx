"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updateProfileSchema } from "@applypilot/validators";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api-client";

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingWizard />
    </ProtectedRoute>
  );
}

function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleBasicInfoSubmit(event: FormEvent) {
    event.preventDefault();
    const result = updateProfileSchema.safeParse({
      fullName: fullName || undefined,
      headline: headline || undefined,
      location: location || undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid input.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.patch("/profile", result.data);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-lg font-semibold text-brand-700">ApplyPilot</p>
        <Card>
          <div className="mb-4 flex gap-1">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-brand-500" : "bg-slate-200"}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-brand-500" : "bg-slate-200"}`} />
          </div>

          {step === 1 ? (
            <>
              <h1 className="mb-1 text-xl font-semibold text-slate-900">Tell us about yourself</h1>
              <p className="mb-6 text-sm text-slate-500">
                A couple of basics to get your profile started. You can fill in everything else later.
              </p>
              {error && (
                <div className="mb-4">
                  <Alert tone="error">{error}</Alert>
                </div>
              )}
              <form onSubmit={handleBasicInfoSubmit} className="flex flex-col gap-4">
                <TextField
                  label="Full name"
                  name="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <TextField
                  label="Headline"
                  name="headline"
                  placeholder="e.g. Senior Software Engineer"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
                <TextField
                  label="Location"
                  name="location"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <Button type="submit" loading={submitting} className="w-full">
                  Continue
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="mb-1 text-xl font-semibold text-slate-900">Upload your resume</h1>
              <p className="mb-6 text-sm text-slate-500">
                We&apos;ll extract your experience, education, and skills automatically — you review
                and confirm everything before it&apos;s added to your profile.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => router.push("/studio?tab=resumes")} className="w-full">
                  Upload a resume
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                >
                  I&apos;ll do this later
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
