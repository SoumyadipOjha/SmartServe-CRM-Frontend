import React from 'react';
import { Box, Button, Center, Flex, Heading, Text, VStack, Icon } from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { isAuthenticated, isLoading, login } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="gray.50"
    >
      <Box
        p={8}
        maxWidth="500px"
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
        bg="white"
      >
        <VStack spacing={4} align="center">
          <Heading as="h1" size="xl">Mini CRM Platform</Heading>
          <Text color="gray.600">Log in to access your customer and campaign management dashboard</Text>
          
          <Box h="50px" />
          
          <Button
            w="full"
            maxW="md"
            variant="outline"
            leftIcon={<Icon as={FcGoogle} boxSize="20px" />}
            onClick={login}
            isLoading={isLoading}
          >
            Sign in with Google
          </Button>
          
          <Text fontSize="sm" color="gray.500" mt={6} textAlign="center">
            This platform is part of the Xeno SDE Internship 2025 Project
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
};

export default Login;