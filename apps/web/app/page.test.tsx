import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import HomePage from "./page";

beforeAll(() => {
  if (typeof globalThis.IntersectionObserver === "undefined") {
    globalThis.IntersectionObserver = class IntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;
  }
});

describe("Landing HomePage", () => {
  it("renders hero positioning, primary CTAs, and all core sections", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Your next opportunity deserves a better approach\./i,
      })
    ).toBeInTheDocument();

    const signupLinks = screen.getAllByRole("link", {
      name: /Get started — it's free/i,
    });
    expect(signupLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of signupLinks) {
      expect(link).toHaveAttribute("href", "/signup");
    }

    expect(screen.getByRole("link", { name: /See how it works/i })).toHaveAttribute(
      "href",
      "#how-it-works"
    );

    expect(
      screen.getByRole("heading", {
        name: /One professional profile\. A resume tailored to every opportunity\./i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Know where every application stands\./i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Questions, answered plainly\./i,
      })
    ).toBeInTheDocument();
  });

  it("supports interactive Adaptive Resume approval and FAQ accordion", () => {
    render(<HomePage />);

    const approveBtn = screen.getByRole("button", { name: /Approve change/i });
    fireEvent.click(approveBtn);
    expect(screen.getByRole("button", { name: /Approved/i })).toBeInTheDocument();

    const secondFaq = screen.getByRole("button", {
      name: /Who is ApplyPilot for\?/i,
    });
    expect(secondFaq).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(secondFaq);
    expect(secondFaq).toHaveAttribute("aria-expanded", "true");
  });
});
