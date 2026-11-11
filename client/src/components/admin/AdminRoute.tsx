import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminLoginPage } from '../../pages/admin/AdminLoginPage';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] flex items-center justify-center px-6 text-center text-white">
        <p className="font-tech text-xs uppercase tracking-[0.2em] text-neutral-500">Checking admin session…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return location.pathname === '/admin/login' ? (
      <AdminLoginPage />
    ) : (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
};
