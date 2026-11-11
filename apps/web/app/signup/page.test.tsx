import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "./page";

const pushMock = vi.fn();
const registerMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ register: registerMock, user: null, loading: false, login: vi.fn(), logout: vi.fn() }),
}));

describe("SignupPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
    registerMock.mockClear();
  });

  it("shows a validation error and never calls register when the password is too short", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("calls register with the entered credentials and navigates to onboarding on success", async () => {
    registerMock.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "correct-horse-battery");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(registerMock).toHaveBeenCalledWith("alice@example.com", "correct-horse-battery"));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/onboarding"));
  });

  it("shows the server's error message when registration fails (e.g. duplicate email)", async () => {
    const { ApiError } = await import("@/lib/api-client");
    registerMock.mockRejectedValueOnce(new ApiError(409, "An account with this email already exists."));
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "correct-horse-battery");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows check-your-email state without navigating when email confirmation is required", async () => {
    registerMock.mockResolvedValueOnce({ requiresEmailConfirmation: true });
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "correct-horse-battery");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
