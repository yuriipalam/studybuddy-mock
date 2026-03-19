import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import MessagesPage from "@/pages/MessagesPage";
import ProjectsPage from "@/pages/ProjectsPage";
import TopicsPage from "@/pages/TopicsPage";
import JobsPage from "@/pages/JobsPage";
import ExpertsPage from "@/pages/ExpertsPage";
import StudentsPage from "@/pages/StudentsPage";
import SupervisorsPage from "@/pages/SupervisorsPage";
import CompaniesPage from "@/pages/CompaniesPage";
import CompanyDetailPage from "@/pages/CompanyDetailPage";
import UniversitiesPage from "@/pages/UniversitiesPage";
import StudyProgramsPage from "@/pages/StudyProgramsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/people/experts" element={<ExpertsPage />} />
            <Route path="/people/students" element={<StudentsPage />} />
            <Route path="/people/supervisors" element={<SupervisorsPage />} />
            <Route path="/organizations/companies" element={<CompaniesPage />} />
            <Route path="/organizations/companies/:id" element={<CompanyDetailPage />} />
            <Route path="/organizations/study-programs" element={<StudyProgramsPage />} />
            <Route path="/organizations/universities" element={<UniversitiesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
