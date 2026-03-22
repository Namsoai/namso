import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["user_role"];
type AccountStatus = Database["public"]["Enums"]["account_status"];

const ACTIVE_STATUS: AccountStatus = "active";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

/**
 * ProtectedRoute — Enforces authentication, account_status, and RBAC.
 *
 * Gate order:
 *   1. Loading spinner while session resolves
 *   2. Unauthenticated → /login
 *   3. account_status !== 'active' → sign out + /login?reason=account_suspended
 *   4. Role mismatch → /
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, roles, profile, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Gate 1: Must be authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Gate 2: Account must be active (admin-managed suspension/freeze/revoke)
  // profile may be null briefly on first load — only block once profile is loaded
  if (profile && profile.account_status && profile.account_status !== ACTIVE_STATUS) {
    // Fire-and-forget async signOut so the UI immediately redirects
    signOut();
    return <Navigate to="/login?reason=account_suspended" replace />;
  }

  // Gate 3: Role-based access control
  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
