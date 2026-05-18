import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./authContext";
import { canAccessRoute } from "../logic/permissionEngine";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!canAccessRoute(currentUser, location.pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-lg text-slate-400">
        Prieiga uždrausta
      </div>
    );
  }

  return <>{children}</>;
};
