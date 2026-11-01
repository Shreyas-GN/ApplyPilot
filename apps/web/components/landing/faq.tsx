import { ChevronDown } from "lucide-react";

const FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "What is ApplyPilot?",
    answer:
      "ApplyPilot is an AI-assisted job-search workspace. It connects your candidate profile, relevant opportunities, application preparation and follow-through in one place.",
  },
  {
    question: "Who is it for?",
    answer:
      "New graduates, active job seekers applying to multiple roles, career switchers, and experienced candidates exploring better opportunities.",
  },
  {
    question: "Does it work with my existing résumé?",
    answer:
      "Yes. Upload a PDF or DOCX résumé and ApplyPilot extracts a structured profile from it — you review and confirm every field before it's saved.",
  },
  {
    question: "Does ApplyPilot apply to jobs automatically?",
    answer:
      "Not today. Application preparation and submission automation are still in development. Nothing is sent or submitted without your review and approval.",
  },
  {
    question: "Can I review and edit application material?",
    answer:
      "Yes — reviewing and editing is the default. Any AI-suggested change is shown to you before it's used, and you can edit or discard it.",
  },
  {
    question: "Which job sources and application systems are supported?",
    answer:
      "Job discovery, matching and application-system coverage are still in development. We'll publish the supported list as each integration ships and is tested.",
  },
  {
    question: "Is my personal information secure?",
    answer:
      "Your account is protected with industry-standard password hashing and session security, and your profile data is scoped to your account only.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Pricing isn't finalised yet. You can create a profile and manage your résumés today at no cost — we'll share pricing details before anything changes.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="bg-ap-paper py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[760px] px-5 sm:px-8">
        <h2 className="font-display text-[32px] leading-[1.1] text-ap-ink sm:text-[40px]">
          Questions, answered plainly.
        </h2>

        <div className="mt-10 divide-y divide-ap-line border-t border-ap-line">
          {FAQS.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-ui text-[16px] font-medium text-ap-ink [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  className="h-5 w-5 flex-shrink-0 text-ap-muted transition-transform duration-150 group-open:rotate-180"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 max-w-xl font-ui text-[15px] leading-relaxed text-ap-body">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
