import React, { useEffect, useState } from 'react';
import { Box, Center, Spinner, Text, VStack, Alert, AlertIcon } from '@chakra-ui/react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback: React.FC = () => {
  const { checkToken, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Check if there's an error in the URL
        const searchParams = new URLSearchParams(location.search);
        const errorParam = searchParams.get('error');
        
        if (errorParam) {
          setError(errorParam.replace(/_/g, ' '));
          setProcessing(false);
          return;
        }
        
        // Check token and navigate when done
        await checkToken();
        setProcessing(false);
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try again.');
        setProcessing(false);
      }
    };

    processAuth();
  }, [location.search, checkToken]);

  // Redirect once authentication is confirmed
  if (!processing && !isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Redirect to login if there was an error or auth failed
  if (!processing && !isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Center h="100vh">
      <VStack spacing={4}>
        {error ? (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        ) : (
          <>
            <Spinner size="xl" color="teal.500" thickness="4px" />
            <Text>Completing authentication...</Text>
          </>
        )}
      </VStack>
    </Center>
  );
};

export default AuthCallback;