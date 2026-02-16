import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock Supabase client
const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
const mockSignInWithPassword = vi.fn().mockResolvedValue({ error: null });
const mockSignInWithOtp = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/libs/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
      signInWithPassword: mockSignInWithPassword,
      signInWithOtp: mockSignInWithOtp,
    },
  }),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock react-hot-toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("react-hot-toast", () => ({
  default: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}));

// Mock config
vi.mock("@/config", () => ({
  default: {
    appName: "Test App",
    colors: { theme: "light" },
  },
}));

import Login from "@/app/signin/page";

describe("SignInPage", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    // Provide window.location.origin for redirect URL construction
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000" },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("renders Google OAuth button", () => {
    render(<Login />);
    expect(screen.getByText("Sign-up with Google")).toBeInTheDocument();
  });

  it("renders email and password inputs", () => {
    render(<Login />);
    expect(screen.getByPlaceholderText("tom@cruise.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("renders magic link button", () => {
    render(<Login />);
    expect(screen.getByText("Send Magic Link")).toBeInTheDocument();
  });

  it("renders sign in button", () => {
    render(<Login />);
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("calls signInWithOAuth with Google provider on button click", async () => {
    render(<Login />);
    fireEvent.click(screen.getByText("Sign-up with Google"));

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/api/auth/callback",
        },
      });
    });
  });

  it("calls signInWithPassword and redirects on success", async () => {
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("tom@cruise.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("Sign in"));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Signed in successfully!"
      );
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error toast on password sign-in failure", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: "Invalid credentials" },
    });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("tom@cruise.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByText("Sign in"));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Invalid credentials");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("disables buttons while loading", async () => {
    // Make signInWithPassword hang so we can check loading state
    let resolveSignIn: (value: any) => void;
    mockSignInWithPassword.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      })
    );

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("tom@cruise.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("Sign in"));

    // While loading, buttons should be disabled
    await waitFor(() => {
      expect(screen.getByText("Sign-up with Google").closest("button")).toBeDisabled();
    });

    // Resolve to clean up
    resolveSignIn!({ error: null });
    await waitFor(() => {
      expect(screen.getByText("Sign-up with Google").closest("button")).not.toBeDisabled();
    });
  });

  it("disables magic link and sign-in buttons after magic link is sent", async () => {
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("tom@cruise.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByText("Send Magic Link"));

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalled();
    });

    // After magic link, both sign-in and magic link buttons should be disabled
    await waitFor(() => {
      expect(screen.getByText("Send Magic Link").closest("button")).toBeDisabled();
      expect(screen.getByText("Sign in").closest("button")).toBeDisabled();
    });
  });

  it("calls signInWithOtp and shows success message for magic link", async () => {
    render(<Login />);

    // Enter email first (magic link requires email)
    fireEvent.change(screen.getByPlaceholderText("tom@cruise.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByText("Send Magic Link"));

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        options: {
          emailRedirectTo: "http://localhost:3000/api/auth/callback",
        },
      });
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Check your emails!");
    });
  });
});
