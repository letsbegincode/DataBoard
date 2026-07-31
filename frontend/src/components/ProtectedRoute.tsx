import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageSkeleton } from "./Skeleton";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}
