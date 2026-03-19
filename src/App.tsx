import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { MessagingProvider } from "@/contexts/MessagingContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import MessagesPage from "@/pages/MessagesPage";
import ProjectsPage from "@/pages/ProjectsPage";
import TopicsPage from "@/pages/TopicsPage";
import JobsPage from "@/pages/JobsPage";
import ExpertsPage from "@/pages/ExpertsPage";
import ExpertDetailPage from "@/pages/ExpertDetailPage";
import StudentsPage from "@/pages/StudentsPage";
import StudentDetailPage from "@/pages/StudentDetailPage";
import SupervisorsPage from "@/pages/SupervisorsPage";
import SupervisorDetailPage from "@/pages/SupervisorDetailPage";
import CompaniesPage from "@/pages/CompaniesPage";
import CompanyDetailPage from "@/pages/CompanyDetailPage";
import UniversitiesPage from "@/pages/UniversitiesPage";
import UniversityDetailPage from "@/pages/UniversityDetailPage";
import StudyProgramsPage from "@/pages/StudyProgramsPage";
import StudyProgramDetailPage from "@/pages/StudyProgramDetailPage";
import RankingPage from "@/pages/RankingPage";
import SettingsPage from "@/pages/SettingsPage";
import StudentRequestsPage from "@/pages/StudentRequestsPage";
import OnboardingPage from "@/pages/OnboardingPage";
import RegisterPage from "@/pages/RegisterPage";
import TopicApplicationPage from "@/pages/TopicApplicationPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <UserProfileProvider>
      <MessagingProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/topics/:topicId/apply" element={<TopicApplicationPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/people/experts" element={<ExpertsPage />} />
            <Route path="/people/experts/:id" element={<ExpertDetailPage />} />
            <Route path="/people/students" element={<StudentsPage />} />
            <Route path="/people/students/:id" element={<StudentDetailPage />} />
            <Route path="/people/supervisors" element={<SupervisorsPage />} />
            <Route path="/people/supervisors/:id" element={<SupervisorDetailPage />} />
            <Route path="/organizations/companies" element={<CompaniesPage />} />
            <Route path="/organizations/companies/:id" element={<CompanyDetailPage />} />
            <Route path="/organizations/study-programs" element={<StudyProgramsPage />} />
            <Route path="/organizations/study-programs/:id" element={<StudyProgramDetailPage />} />
            <Route path="/organizations/universities" element={<UniversitiesPage />} />
            <Route path="/organizations/universities/:id" element={<UniversityDetailPage />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/requests" element={<StudentRequestsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </MessagingProvider>
    </UserProfileProvider>
  );
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
