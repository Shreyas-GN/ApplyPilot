import { FolderKanban, Compass, ListChecks } from "lucide-react";

const ITEMS = [
  { icon: FolderKanban, text: "Your profile, in one place" },
  { icon: Compass, text: "Understand the fit before you apply" },
  { icon: ListChecks, text: "Keep every application organised" },
];

export function TrustStrip() {
  return (
    <section className="border-y border-ap-line bg-ap-paper-deep">
      <div className="mx-auto grid max-w-[1200px] gap-6 px-5 py-8 sm:grid-cols-3 sm:px-8 sm:py-10">
        {ITEMS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <Icon className="h-5 w-5 flex-shrink-0 text-ap-ink" strokeWidth={1.75} aria-hidden="true" />
            <p className="font-ui text-[15px] text-ap-body">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
