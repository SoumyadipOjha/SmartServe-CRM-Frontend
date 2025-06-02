import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, CSSReset, Spinner, Box, Text, Center } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import the CreateCampaign component directly
import CreateCampaign from './pages/CreateCampaign';

// Use lazy loading for other components
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Campaigns = React.lazy(() => import('./pages/Campaigns'));
const CampaignDetail = React.lazy(() => import('./pages/CampaignDetail'));
const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallback'));

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
  
  return <>{children}</>;
};

function App() {
  return (
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
  );
}

export default App;
