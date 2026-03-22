import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Chatbox } from "@/components/Chatbox";
import ExitIntentPopup from "@/components/ExitIntentPopup";

// Public pages
import Index from "./pages/Index";
import BrowseServices from "./pages/BrowseServices";
import ServiceDetail from "./pages/ServiceDetail";
import FreelancerProfile from "./pages/FreelancerProfile";
import FreelancerSignup from "./pages/FreelancerSignup";
import BusinessSignup from "./pages/BusinessSignup";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import RefundPolicy from "./pages/RefundPolicy";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";

import BookCall from "./pages/BookCall";

// Admin pages
import AdminOverview from "./pages/admin/AdminOverview";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminFreelancers from "./pages/admin/AdminFreelancers";
import AdminBusinesses from "./pages/admin/AdminBusinesses";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminServices from "./pages/admin/AdminServices";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAdmins from "./pages/admin/AdminAdmins";

// Business pages
import BusinessOverview from "./pages/business/BusinessOverview";
import BusinessMyTasks from "./pages/business/BusinessMyTasks";
import BusinessTaskDetail from "./pages/business/BusinessTaskDetail";
import BusinessActiveWork from "./pages/business/BusinessActiveWork";
import BusinessCompleted from "./pages/business/BusinessCompleted";
import BusinessPayments from "./pages/business/BusinessPayments";
import BusinessMessages from "./pages/business/BusinessMessages";
import BusinessSettings from "./pages/business/BusinessSettings";
import BusinessPostTask from "./pages/business/BusinessPostTask";

// Freelancer pages
import FreelancerOverview from "./pages/freelancer/FreelancerOverview";
import FreelancerAvailableTasks from "./pages/freelancer/FreelancerAvailableTasks";
import FreelancerTaskDetail from "./pages/freelancer/FreelancerTaskDetail";
import FreelancerActiveWork from "./pages/freelancer/FreelancerActiveWork";
import FreelancerCompleted from "./pages/freelancer/FreelancerCompleted";
import FreelancerEarnings from "./pages/freelancer/FreelancerEarnings";
import FreelancerMessages from "./pages/freelancer/FreelancerMessages";
import FreelancerPortfolio from "./pages/freelancer/FreelancerPortfolio";
import FreelancerSettings from "./pages/freelancer/FreelancerSettings";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      // Never auto-retry mutations — financial operations (escrow, payments)
      // must not be retried automatically to avoid double-execution.
      retry: 0,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Chatbox />
          <ExitIntentPopup />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            {/* Public App Routes */}
            <Route path="/services" element={<BrowseServices />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/freelancer/:id" element={<FreelancerProfile />} />
            <Route path="/book-call" element={<BookCall />} />
            <Route path="/signup/freelancer" element={<FreelancerSignup />} />
            <Route path="/signup/business" element={<BusinessSignup />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />

            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminOverview /></ProtectedRoute>} />
            <Route path="/admin/applications" element={<ProtectedRoute requiredRole="admin"><AdminApplications /></ProtectedRoute>} />
            <Route path="/admin/freelancers" element={<ProtectedRoute requiredRole="admin"><AdminFreelancers /></ProtectedRoute>} />
            <Route path="/admin/businesses" element={<ProtectedRoute requiredRole="admin"><AdminBusinesses /></ProtectedRoute>} />
            <Route path="/admin/tasks" element={<ProtectedRoute requiredRole="admin"><AdminTasks /></ProtectedRoute>} />
            <Route path="/admin/services" element={<ProtectedRoute requiredRole="admin"><AdminServices /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute requiredRole="admin"><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/messages" element={<ProtectedRoute requiredRole="admin"><AdminMessages /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute requiredRole="admin"><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/admins" element={<ProtectedRoute requiredRole="admin"><AdminAdmins /></ProtectedRoute>} />

            {/* Business */}
            <Route path="/business" element={<ProtectedRoute requiredRole="business"><BusinessOverview /></ProtectedRoute>} />
            <Route path="/business/tasks" element={<ProtectedRoute requiredRole="business"><BusinessMyTasks /></ProtectedRoute>} />
            <Route path="/business/tasks/:id" element={<ProtectedRoute requiredRole="business"><BusinessTaskDetail /></ProtectedRoute>} />
            <Route path="/business/active" element={<ProtectedRoute requiredRole="business"><BusinessActiveWork /></ProtectedRoute>} />
            <Route path="/business/completed" element={<ProtectedRoute requiredRole="business"><BusinessCompleted /></ProtectedRoute>} />
            <Route path="/business/payments" element={<ProtectedRoute requiredRole="business"><BusinessPayments /></ProtectedRoute>} />
            <Route path="/business/messages" element={<ProtectedRoute requiredRole="business"><BusinessMessages /></ProtectedRoute>} />
            <Route path="/business/settings" element={<ProtectedRoute requiredRole="business"><BusinessSettings /></ProtectedRoute>} />
            <Route path="/business/post-task" element={<ProtectedRoute requiredRole="business"><BusinessPostTask /></ProtectedRoute>} />

            {/* Freelancer */}

            <Route path="/freelancer" element={<ProtectedRoute requiredRole="freelancer"><FreelancerOverview /></ProtectedRoute>} />
            <Route path="/freelancer/available-tasks" element={<ProtectedRoute requiredRole="freelancer"><FreelancerAvailableTasks /></ProtectedRoute>} />
            <Route path="/freelancer/tasks/:id" element={<ProtectedRoute requiredRole="freelancer"><FreelancerTaskDetail /></ProtectedRoute>} />
            <Route path="/freelancer/active" element={<ProtectedRoute requiredRole="freelancer"><FreelancerActiveWork /></ProtectedRoute>} />
            <Route path="/freelancer/completed" element={<ProtectedRoute requiredRole="freelancer"><FreelancerCompleted /></ProtectedRoute>} />
            <Route path="/freelancer/earnings" element={<ProtectedRoute requiredRole="freelancer"><FreelancerEarnings /></ProtectedRoute>} />
            <Route path="/freelancer/messages" element={<ProtectedRoute requiredRole="freelancer"><FreelancerMessages /></ProtectedRoute>} />
            <Route path="/freelancer/portfolio" element={<ProtectedRoute requiredRole="freelancer"><FreelancerPortfolio /></ProtectedRoute>} />
            <Route path="/freelancer/settings" element={<ProtectedRoute requiredRole="freelancer"><FreelancerSettings /></ProtectedRoute>} />

            {/* Legacy redirects - keep old paths working */}
            <Route path="/dashboard" element={<Navigate to="/freelancer" replace />} />
            <Route path="/business-dashboard" element={<Navigate to="/business" replace />} />
            <Route path="/post-task" element={<Navigate to="/business/post-task" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
