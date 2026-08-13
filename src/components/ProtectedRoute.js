import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";

function ProtectedRoute() {
  // Your authentication check logic (e.g. cookie or token check)
  const isAuthenticated = true; 

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <AdminNavbar />
      <main className="bg-light min-vh-100">
        <Outlet />
      </main>
    </>
  );
}

export default ProtectedRoute;