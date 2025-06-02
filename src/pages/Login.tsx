import React from 'react';
import { Box, Button, Flex, Heading, Text, VStack, Icon, Grid, SimpleGrid, useColorModeValue } from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiMail, FiPieChart } from 'react-icons/fi';
import { IconType } from 'react-icons';

interface FeatureCardProps {
  icon: IconType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <VStack
    p={6}
    bg={useColorModeValue('white', 'gray.800')}
    rounded="xl"
    borderWidth="1px"
    borderColor={useColorModeValue('gray.100', 'gray.700')}
    align="start"
    spacing={4}
    height="full"
    shadow="sm"
    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
    transition="all 0.2s"
  >
    <Box p={2} bg="pink.50" rounded="lg">
      <Icon as={icon} boxSize="6" color="pink.500" />
    </Box>
    <VStack align="start" spacing={2}>
      <Text fontWeight="bold" fontSize="lg">{title}</Text>
      <Text color="gray.600" fontSize="sm">{description}</Text>
    </VStack>
  </VStack>
);

const Login: React.FC = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const bgColor = useColorModeValue('gray.50', 'gray.900'); // Move Hook to top level

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} minH="100vh">
      <Flex
        direction="column"
        p={12}
        bg={bgColor} // Use the value from Hook
        justify="center"
      >
        <VStack spacing={8} align="start" maxW="600px" mx="auto">
          <VStack align="start" spacing={2}>
            <Heading as="h1" size="2xl" color="pink.600">SmartServe</Heading>
            <Text fontSize="xl" color="gray.600">
              Your all-in-one platform for customer and campaign management
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
            <FeatureCard
              icon={FiUsers}
              title="Customer Management"
              description="Efficiently manage and track your customer relationships in one place"
            />
            <FeatureCard
              icon={FiMail}
              title="Campaign Tools"
              description="Create and monitor marketing campaigns with powerful analytics"
            />
            <FeatureCard
              icon={FiPieChart}
              title="Analytics Dashboard"
              description="Get real-time insights into your business performance"
            />
            <FeatureCard
              icon={FiUsers}
              title="Team Collaboration"
              description="Work seamlessly with your team members across projects"
            />
          </SimpleGrid>
        </VStack>
      </Flex>

      <Flex
        direction="column"
        align="center"
        justify="center"
        p={12}
        bg="white"
      >
        <VStack spacing={8} maxW="400px" w="full">
          <VStack spacing={4}>
            <Heading size="lg">Welcome Back</Heading>
            <Text color="gray.600" textAlign="center">
              Log in to your dashboard to manage your campaigns and customers
            </Text>
          </VStack>

          <Button
            size="lg"
            w="full"
            variant="outline"
            leftIcon={<Icon as={FcGoogle} boxSize="24px" />}
            onClick={login}
            isLoading={isLoading}
            p={6}
            borderRadius="full"
            borderWidth={2}
            _hover={{
              bg: 'gray.50',
              transform: 'translateY(-2px)',
              shadow: 'md'
            }}
            transition="all 0.2s"
          >
            Sign in with Google
          </Button>

          <Text fontSize="sm" color="gray.500" textAlign="center">
            This platform is part of the Xeno SDE Internship 2025 Project
          </Text>
        </VStack>
      </Flex>
    </Grid>
  );
};

export default Login;