import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/src/lib/auth";
import { ThemeProvider } from "@/src/lib/ThemeContext";
import LandingPage from "@/src/components/LandingPage";
import LoginPage from "@/src/components/LoginPage";
import SignupPage from "@/src/components/SignupPage";
import ERPDashboardLayout from "@/src/components/ERPDashboardLayout";
import DashboardHome from "@/src/components/DashboardHome";
import CRMModule from "@/src/components/CRMModule";
import InventoryModule from "@/src/components/InventoryModule";
import HRModule from "@/src/components/HRModule";
import AccountingModule from "@/src/components/AccountingModule";
import ProjectModule from "@/src/components/ProjectModule";
import AnalyticsModule from "@/src/components/AnalyticsModule";
import BillingPage from "@/src/components/BillingPage";
import SettingsPage from "@/src/components/SettingsPage";
import UserManagement from "@/src/components/UserManagement";
import ProfilePage from "@/src/components/ProfilePage";
import MessagingModule from "@/src/components/MessagingModule";
import AIAssistant from "@/src/components/AIAssistant";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      <AIAssistant />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="erp-theme">
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected ERP Routes */}
          <Route
            path="/erp"
            element={
              <ProtectedRoute>
                <ERPDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="crm" element={<CRMModule />} />
            <Route path="messages" element={<MessagingModule />} />
            <Route path="hr" element={<HRModule />} />
            <Route path="inventory" element={<InventoryModule />} />
            <Route path="accounting" element={<AccountingModule />} />
            <Route path="projects" element={<ProjectModule />} />
            <Route path="analytics" element={<AnalyticsModule />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
