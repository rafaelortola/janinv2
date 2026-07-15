import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage, { RegisterPage } from './pages/auth/AuthPages';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import MembersPage from './pages/MembersPage';
import BacklogPage from './pages/projects/BacklogPage';
import BoardPage from './pages/projects/BoardPage';
import SprintsPage from './pages/projects/SprintsPage';
import QaPage from './pages/projects/QaPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/projects/:projectId/backlog" element={<BacklogPage />} />
              <Route path="/projects/:projectId/board" element={<BoardPage />} />
              <Route path="/projects/:projectId/sprints" element={<SprintsPage />} />
              <Route path="/projects/:projectId/qa" element={<QaPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
