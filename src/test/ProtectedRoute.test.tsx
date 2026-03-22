import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// ─── Minimal mocks ────────────────────────────────────────────────────────────

// Mock Supabase client (avoids real network calls and env var requirement)
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// Helper: render ProtectedRoute in a controlled auth state
async function renderProtectedRoute(
  authState: {
    user: object | null;
    profile: { account_status?: string; role?: string } | null;
    roles: string[];
    loading: boolean;
  },
  requiredRole?: string
) {
  // Dynamically import after mocks are set up
  const { AuthContext } = await import("@/contexts/AuthContext");
  const { default: ProtectedRoute } = await import("@/components/ProtectedRoute");

  const mockSignOut = vi.fn().mockResolvedValue(undefined);

  const contextValue = {
    session: null,
    user: authState.user as any,
    profile: authState.profile as any,
    roles: authState.roles as any,
    loading: authState.loading,
    signOut: mockSignOut,
    refreshProfile: vi.fn(),
  };

  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <AuthContext.Provider value={contextValue}>
        <ProtectedRoute requiredRole={requiredRole as any}>
          <div data-testid="protected-content">Authenticated Content</div>
        </ProtectedRoute>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loader while auth is resolving", async () => {
    const { container } = await renderProtectedRoute({
      user: null,
      profile: null,
      roles: [],
      loading: true,
    });
    // Loading spinner should be present; no redirect, no content
    expect(container.querySelector(".animate-spin")).not.toBeNull();
    expect(screen.queryByTestId("protected-content")).toBeNull();
  });

  it("redirects unauthenticated user to /login", async () => {
    await renderProtectedRoute({
      user: null,
      profile: null,
      roles: [],
      loading: false,
    });
    // MemoryRouter will render nothing after Navigate to /login
    expect(screen.queryByTestId("protected-content")).toBeNull();
  });

  it("blocks suspended account and calls signOut", async () => {
    const { default: ProtectedRoute } = await import("@/components/ProtectedRoute");
    const { AuthContext } = await import("@/contexts/AuthContext");
    const mockSignOut = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <AuthContext.Provider
          value={{
            session: null,
            user: { id: "user-1" } as any,
            profile: { account_status: "suspended", role: "freelancer" } as any,
            roles: ["freelancer"] as any,
            loading: false,
            signOut: mockSignOut,
            refreshProfile: vi.fn(),
          }}
        >
          <ProtectedRoute>
            <div data-testid="protected-content">Content</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Content should NOT be visible — suspended user is kicked out
    expect(screen.queryByTestId("protected-content")).toBeNull();
    // signOut must be invoked to clear the session
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("blocks revoked account and calls signOut", async () => {
    const { default: ProtectedRoute } = await import("@/components/ProtectedRoute");
    const { AuthContext } = await import("@/contexts/AuthContext");
    const mockSignOut = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <AuthContext.Provider
          value={{
            session: null,
            user: { id: "user-2" } as any,
            profile: { account_status: "revoked", role: "business" } as any,
            roles: ["business"] as any,
            loading: false,
            signOut: mockSignOut,
            refreshProfile: vi.fn(),
          }}
        >
          <ProtectedRoute requiredRole="business">
            <div data-testid="protected-content">Content</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.queryByTestId("protected-content")).toBeNull();
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("allows active account with correct role", async () => {
    await renderProtectedRoute(
      {
        user: { id: "user-3" },
        profile: { account_status: "active", role: "business" },
        roles: ["business"],
        loading: false,
      },
      "business"
    );

    expect(screen.getByTestId("protected-content")).not.toBeNull();
  });

  it("blocks active account with wrong role", async () => {
    await renderProtectedRoute(
      {
        user: { id: "user-4" },
        profile: { account_status: "active", role: "freelancer" },
        roles: ["freelancer"],
        loading: false,
      },
      "business" // requires business but user is freelancer
    );

    expect(screen.queryByTestId("protected-content")).toBeNull();
  });

  it("allows active account with no role requirement", async () => {
    await renderProtectedRoute({
      user: { id: "user-5" },
      profile: { account_status: "active", role: "freelancer" },
      roles: ["freelancer"],
      loading: false,
    });

    expect(screen.getByTestId("protected-content")).not.toBeNull();
  });
});
