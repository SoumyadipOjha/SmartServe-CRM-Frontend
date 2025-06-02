import React from 'react';
import { Box, Container, Flex, useColorModeValue } from '@chakra-ui/react';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const contentBgColor = useColorModeValue('white', 'gray.800');

  return (
    <Box minH="100vh" bg={bgColor}>
      <Navigation />
      <Box as="main" ml={{ base: 0, md: '240px' }} transition=".3s ease">
        <Box
          maxW="7xl"
          mx="auto"
          px={{ base: '4', md: '8', lg: '12' }}
          py="6"
        >
          <Box
            borderRadius="lg"
            bg={contentBgColor}
            shadow="sm"
            p={{ base: '4', md: '6' }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;