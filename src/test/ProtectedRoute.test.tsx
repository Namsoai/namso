import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// ─── Supabase mock — factory values must be inlined (vi.mock is hoisted) ────
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

// Static imports — safe now that supabase is mocked
import { AuthContext } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// ─── Helper ─────────────────────────────────────────────────────────────────
function renderProtectedRoute(
  authState: {
    user: object | null;
    profile: { account_status?: string; role?: string } | null;
    roles: string[];
    loading: boolean;
  },
  requiredRole?: string
) {
  const signOutMock = vi.fn().mockResolvedValue(undefined);

  const contextValue = {
    session: null,
    user: authState.user as any,
    profile: authState.profile as any,
    roles: authState.roles as any,
    loading: authState.loading,
    signOut: signOutMock,
    refreshProfile: vi.fn(),
  };

  const result = render(
    <MemoryRouter initialEntries={["/protected"]}>
      <AuthContext.Provider value={contextValue}>
        <ProtectedRoute requiredRole={requiredRole as any}>
          <div data-testid="protected-content">Authenticated Content</div>
        </ProtectedRoute>
      </AuthContext.Provider>
    </MemoryRouter>
  );

  return { ...result, signOutMock };
}

// ─── Tests ──────────────────────────────────────────────────────────────────
describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loader while auth is resolving", () => {
    const { container } = renderProtectedRoute({
      user: null,
      profile: null,
      roles: [],
      loading: true,
    });
    expect(container.querySelector(".animate-spin")).not.toBeNull();
    expect(screen.queryByTestId("protected-content")).toBeNull();
  });

  it("redirects unauthenticated user to /login", () => {
    renderProtectedRoute({
      user: null,
      profile: null,
      roles: [],
      loading: false,
    });
    expect(screen.queryByTestId("protected-content")).toBeNull();
  });

  it("blocks suspended account and calls signOut", () => {
    const { signOutMock } = renderProtectedRoute({
      user: { id: "user-1" },
      profile: { account_status: "suspended", role: "freelancer" },
      roles: ["freelancer"],
      loading: false,
    });
    expect(screen.queryByTestId("protected-content")).toBeNull();
    expect(signOutMock).toHaveBeenCalledOnce();
  });

  it("blocks revoked account and calls signOut", () => {
    const { signOutMock } = renderProtectedRoute(
      {
        user: { id: "user-2" },
        profile: { account_status: "revoked", role: "business" },
        roles: ["business"],
        loading: false,
      },
      "business"
    );
    expect(screen.queryByTestId("protected-content")).toBeNull();
    expect(signOutMock).toHaveBeenCalledOnce();
  });

  it("allows active account with correct role", () => {
    renderProtectedRoute(
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

  it("blocks active account with wrong role", () => {
    renderProtectedRoute(
      {
        user: { id: "user-4" },
        profile: { account_status: "active", role: "freelancer" },
        roles: ["freelancer"],
        loading: false,
      },
      "business"
    );
    expect(screen.queryByTestId("protected-content")).toBeNull();
  });

  it("allows active account with no role requirement", () => {
    renderProtectedRoute({
      user: { id: "user-5" },
      profile: { account_status: "active", role: "freelancer" },
      roles: ["freelancer"],
      loading: false,
    });
    expect(screen.getByTestId("protected-content")).not.toBeNull();
  });
});
