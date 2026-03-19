import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BusinessStateProvider } from "./contexts/BusinessStateContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PageLoader } from "./components/PageLoader";
import { AppLayout } from "./components/layout/AppLayout";
import { DevStateSwitch } from "./components/DevStateSwitch";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const StationsPage = lazy(() => import("./pages/StationsPage"));
const SessionsPage = lazy(() => import("./pages/SessionsPage"));
const BusinessProfilePage = lazy(() => import("./pages/BusinessProfilePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const TariffsPage = lazy(() => import("./pages/TariffsPage"));
const FinancePage = lazy(() => import("./pages/FinancePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const VerifyPage = lazy(() => import("./pages/VerifyPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('[ProtectedRoute] isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);

  if (isLoading) {
    console.log('[ProtectedRoute] Showing loader');
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] Allowing access');
  return <>{children}</>;
}

function LoginPageWrapper() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BusinessStateProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<LoginPageWrapper />} />
                  <Route path="/verify/:token" element={<VerifyPage />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="stations" element={<StationsPage />} />
                    <Route path="sessions" element={<SessionsPage />} />
                    <Route path="business-profile" element={<BusinessProfilePage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="tariffs" element={<TariffsPage />} />
                    <Route path="finance" element={<FinancePage />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <DevStateSwitch />
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </BusinessStateProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
