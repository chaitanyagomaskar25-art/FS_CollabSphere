import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CreateProjectPage from "./pages/CreateProjectPage.jsx";
import ProjectLayout from "./layouts/ProjectLayout.jsx";
import ProjectDetailsPage from "./pages/ProjectDetailsPage.jsx";
import ProjectNotesPage from "./pages/ProjectNotesPage.jsx";
import ProjectFilesPage from "./pages/ProjectFilesPage.jsx";
import ProjectAnalyticsPage from "./pages/ProjectAnalyticsPage.jsx";
import ProjectSharePage from "./pages/ProjectSharePage.jsx";
import PublicProjectPage from "./pages/PublicProjectPage.jsx";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Unauthenticated Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route
                  path="/public/:shareId"
                  element={<PublicProjectPage />}
                />
                {/* Protected Workspace Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/new"
                  element={
                    <ProtectedRoute>
                      <CreateProjectPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Individual Project Workspace */}
                <Route
                  path="/projects/:projectId"
                  element={
                    <ProtectedRoute>
                      <ProjectLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<ProjectDetailsPage />} />
                  <Route path="notes" element={<ProjectNotesPage />} />
                  <Route path="files" element={<ProjectFilesPage />} />
                  <Route path="analytics" element={<ProjectAnalyticsPage />} />
                  <Route path="share" element={<ProjectSharePage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
