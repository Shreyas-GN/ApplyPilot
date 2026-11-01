import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ControlledEntryList, type ControlledEntry } from "./controlled-entry-list";

const fields = [
  { name: "company", label: "Company", type: "text" as const },
  { name: "title", label: "Title", type: "text" as const },
];

// A real stateful wrapper, not just a spy standing in for onChange — the
// list's inputs are controlled (value + onChange), so without state that
// actually re-renders between keystrokes, each keystroke would be diffed
// against the same stale initial value instead of the previous keystroke's
// result. `onChangeSpy` still observes every call for assertions.
function Wrapper({
  initial,
  onChangeSpy,
}: {
  initial: ControlledEntry[];
  onChangeSpy: (items: ControlledEntry[]) => void;
}) {
  const [items, setItems] = useState(initial);
  return (
    <ControlledEntryList
      items={items}
      onChange={(next) => {
        setItems(next);
        onChangeSpy(next);
      }}
      fields={fields}
      emptyLabel="Nothing extracted."
      blankValues={{ company: "", title: "" }}
    />
  );
}

describe("ControlledEntryList (resume parsing review)", () => {
  it("shows an AI-suggested badge and a low-confidence warning for low-confidence AI entries", () => {
    const items: ControlledEntry[] = [
      { values: { company: "Acme", title: "Engineer" }, source: "ai", confidence: 0.3 },
    ];
    render(<Wrapper initial={items} onChangeSpy={vi.fn()} />);

    expect(screen.getByText(/ai-suggested/i)).toBeInTheDocument();
    expect(screen.getByText(/low confidence/i)).toBeInTheDocument();
  });

  it("does not show a low-confidence warning for high-confidence AI entries", () => {
    const items: ControlledEntry[] = [
      { values: { company: "Acme", title: "Engineer" }, source: "ai", confidence: 0.95 },
    ];
    render(<Wrapper initial={items} onChangeSpy={vi.fn()} />);

    expect(screen.getByText(/ai-suggested/i)).toBeInTheDocument();
    expect(screen.queryByText(/low confidence/i)).not.toBeInTheDocument();
  });

  it("lets the user correct an AI-extracted field, marking it as user-sourced on change", async () => {
    const items: ControlledEntry[] = [
      { values: { company: "Wrong Co", title: "Engineer" }, source: "ai", confidence: 0.4 },
    ];
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Wrapper initial={items} onChangeSpy={onChange} />);

    const companyInput = screen.getByLabelText("Company");
    await user.clear(companyInput);
    await user.type(companyInput, "Correct Co");

    const lastCall = onChange.mock.calls.at(-1)?.[0] as ControlledEntry[];
    const updatedEntry = lastCall[0];
    if (!updatedEntry) throw new Error("onChange was not called with an entry");
    expect(updatedEntry.values.company).toBe("Correct Co");
    expect(updatedEntry.source).toBe("user");
  });

  it("adds a new blank entry when '+ Add' is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Wrapper initial={[]} onChangeSpy={onChange} />);

    expect(screen.getByText(/nothing extracted/i)).toBeInTheDocument();
    await user.click(screen.getByText("+ Add"));

    expect(onChange).toHaveBeenCalledWith([{ values: { company: "", title: "" }, source: "user", confidence: 1 }]);
  });

  it("removes an entry when 'Remove' is clicked", async () => {
    const items: ControlledEntry[] = [
      { values: { company: "Acme", title: "Engineer" }, source: "user", confidence: 1 },
    ];
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Wrapper initial={items} onChangeSpy={onChange} />);

    await user.click(screen.getByText("Remove"));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
