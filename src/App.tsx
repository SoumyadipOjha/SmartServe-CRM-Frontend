import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, CSSReset, Spinner, Box, Text, Center } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { QueryClient, QueryClientProvider } from 'react-query';

// Import the CreateCampaign component directly
import CreateCampaign from './features/campaigns/pages/CreateCampaign';
import OnboardingWizard from './shared/components/OnboardingWizard';

// Use lazy loading for other components
const Login = React.lazy(() => import('./features/auth/pages/Login'));
const Dashboard = React.lazy(() => import('./features/dashboard/pages/Dashboard'));
const Customers = React.lazy(() => import('./features/customers/pages/Customers'));
const Orders = React.lazy(() => import('./features/orders/pages/Orders'));
const Campaigns = React.lazy(() => import('./features/campaigns/pages/Campaigns'));
const CampaignDetail = React.lazy(() => import('./features/campaigns/pages/CampaignDetail'));
const CustomerProfile = React.lazy(() => import('./features/customers/pages/CustomerProfile'));
const Segments = React.lazy(() => import('./features/segments/pages/Segments'));
const AuthCallbackPage = React.lazy(() => import('./features/auth/pages/AuthCallback'));
const Pipeline     = React.lazy(() => import('./features/pipeline/pages/Pipeline'));
const Revenue      = React.lazy(() => import('./features/revenue/pages/Revenue'));
const LeadForms    = React.lazy(() => import('./features/lead-forms/pages/LeadForms'));
const Sequences    = React.lazy(() => import('./features/sequences/pages/Sequences'));
const TeamSettings = React.lazy(() => import('./features/team/pages/TeamSettings'));
const PublicLeadForm = React.lazy(() => import('./features/lead-forms/pages/PublicLeadForm'));
const AcceptInvite   = React.lazy(() => import('./features/auth/pages/AcceptInvite'));

// Create a client
const queryClient = new QueryClient();

// Improved loading component
const LoadingFallback = ({ componentName = "component" }) => (
  <Center height="100vh">
    <Box textAlign="center">
      <Spinner size="xl" color="teal.500" mb={4} />
      <Text>Loading {componentName}...</Text>
    </Box>
  </Center>
);

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback componentName="authentication" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <OnboardingWizard />
      {children}
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <CSSReset />
        <AuthProvider>
          <Router>
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={
                <React.Suspense fallback={<LoadingFallback componentName="login page" />}>
                  <Login />
                </React.Suspense>
              } />
              <Route path="/auth/success" element={
                <React.Suspense fallback={<LoadingFallback componentName="authentication" />}>
                  <AuthCallbackPage />
                </React.Suspense>
              } />

              {/* Public — no auth required */}
              <Route path="/forms/:token" element={
                <React.Suspense fallback={<LoadingFallback componentName="form" />}>
                  <PublicLeadForm />
                </React.Suspense>
              } />
              <Route path="/accept-invite" element={
                <React.Suspense fallback={<LoadingFallback componentName="invite" />}>
                  <AcceptInvite />
                </React.Suspense>
              } />
              
              {/* Dashboard */}
              <Route path="/" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<LoadingFallback componentName="dashboard" />}>
                    <Dashboard />
                  </React.Suspense>
                </ProtectedRoute>
              } />
              
              {/* Customer routes */}
              <Route path="/customers" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<LoadingFallback componentName="customers page" />}>
                    <Customers />
                  </React.Suspense>
                </ProtectedRoute>
              } />
              
              {/* Customer profile route */}
              <Route path="/customers/:id" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<LoadingFallback componentName="customer profile" />}>
                    <CustomerProfile />
                  </React.Suspense>
                </ProtectedRoute>
              } />

              {/* Segments */}
              <Route path="/segments" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<LoadingFallback componentName="segments" />}>
                    <Segments />
                  </React.Suspense>
                </ProtectedRoute>
              } />

              {/* Order routes */}
              <Route path="/orders" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<LoadingFallback componentName="orders page" />}>
                    <Orders />
                  </React.Suspense>
                </ProtectedRoute>
              } />
              
              {/* Campaign routes - IMPORTANT: The order matters here */}
              {/* First the campaigns list route */}
              <Route path="/campaigns" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<LoadingFallback componentName="campaigns page" />}>
                    <Campaigns />
                  </React.Suspense>
                </ProtectedRoute>
              } />
              
              {/* Special case - the CreateCampaign component directly loaded without suspense */}
              <Route path="/campaigns/create" element={
                <ProtectedRoute>
                  <CreateCampaign />
                </ProtectedRoute>
              } />
              
              {/* Revenue Forecast */}
              <Route path="/revenue" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<LoadingFallback componentName="revenue" />}>
                    <Revenue />
                  </React.Suspense>
                </ProtectedRoute>
              } />

              {/* Pipeline / Kanban */}
              <Route path="/pipeline" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<LoadingFallback componentName="pipeline" />}>
                    <Pipeline />
                  </React.Suspense>
                </ProtectedRoute>
              } />

              {/* Lead Capture Forms */}
              <Route path="/lead-forms" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<LoadingFallback componentName="lead forms" />}>
                    <LeadForms />
                  </React.Suspense>
                </ProtectedRoute>
              } />

              {/* Drip Sequences */}
              <Route path="/sequences" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<LoadingFallback componentName="sequences" />}>
                    <Sequences />
                  </React.Suspense>
                </ProtectedRoute>
              } />

              {/* Team Settings */}
              <Route path="/team" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<LoadingFallback componentName="team settings" />}>
                    <TeamSettings />
                  </React.Suspense>
                </ProtectedRoute>
              } />

              {/* Last the dynamic campaign detail route */}
              <Route path="/campaigns/:id" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<LoadingFallback componentName="campaign details" />}>
                    <CampaignDetail />
                  </React.Suspense>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default App;
