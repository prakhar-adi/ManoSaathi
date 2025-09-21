import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navigation from "./components/Navigation";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CounselorDashboard from "./pages/CounselorDashboard";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import PeerSupportEntry from "./pages/PeerSupportEntry";
import PeerSupportForum from "./pages/PeerSupportForum";
import LandingPage from "./pages/LandingPage";
import BookingEntry from "./pages/BookingEntry";
import CounselorSelection from "./pages/CounselorSelection";
import BookingAvailability from "./pages/BookingAvailability";
import BookingForm from "./pages/BookingForm";
import BookingSuccess from "./pages/BookingSuccess";
import ResourceHubDashboard from "./pages/ResourceHubDashboard";
import ResourceViewer from "./components/ResourceViewer";
import NotFound from "./pages/NotFound";
import ChatbotWidget from "./components/ChatbotWidget";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/landing" replace />;
  }
  
  return <>{children}</>;
};

// Role-based Dashboard Router
const DashboardRouter = () => {
  const { profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  switch (profile?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'counselor':
      return <CounselorDashboard />;
    case 'student':
    default:
      return <StudentDashboard />;
  }
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ChatbotWidget />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Navigation />
                <DashboardRouter />
              </ProtectedRoute>
            } />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/chat" element={
              <ProtectedRoute>
                <Navigation />
                <ChatPage />
              </ProtectedRoute>
            } />
            <Route path="/resources" element={
              <ProtectedRoute>
                <Navigation />
                <ResourceHubDashboard />
              </ProtectedRoute>
            } />
            <Route path="/resources/:resourceId" element={
              <ProtectedRoute>
                <Navigation />
                <ResourceViewer />
              </ProtectedRoute>
            } />
            <Route path="/booking" element={<BookingEntry />} />
            <Route path="/booking/counselors" element={<CounselorSelection />} />
            <Route path="/booking/availability/:counselorId" element={<BookingAvailability />} />
            <Route path="/booking/form" element={
              <ProtectedRoute>
                <Navigation />
                <BookingForm />
              </ProtectedRoute>
            } />
            <Route path="/booking/success/:bookingId" element={<BookingSuccess />} />
            <Route path="/peer-support" element={<PeerSupportEntry />} />
            <Route path="/peer-support/forum" element={<PeerSupportForum />} />
            <Route path="/community" element={
              <ProtectedRoute>
                <Navigation />
                <div className="min-h-screen bg-background flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Peer Support</h1>
                    <p className="text-muted-foreground">Community platform coming soon...</p>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;