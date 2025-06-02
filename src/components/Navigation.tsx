import React, { useState } from 'react';
import {
  Box, 
  Flex, 
  Link, 
  Button, 
  Text, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem, 
  Avatar,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  VStack,
  HStack,
  useColorModeValue,
  Tooltip,
  Heading
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiHome, FiUsers, FiShoppingCart, FiMail, FiPlus } from 'react-icons/fi';

const Navigation: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [mobileView, setMobileView] = useState(false);

  // Colors
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const activeBg = useColorModeValue('teal.50', 'teal.900');
  const activeColor = useColorModeValue('teal.600', 'teal.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const topNavBg = useColorModeValue('white', 'gray.800');

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: <FiHome /> },
    { name: 'Customers', path: '/customers', icon: <FiUsers /> },
    { name: 'Orders', path: '/orders', icon: <FiShoppingCart /> },
    { name: 'Campaigns', path: '/campaigns', icon: <FiMail /> }
  ];

  // Mobile navigation
  const MobileNav = (
    <Flex
      display={{ base: 'flex', md: 'none' }}
      align="center" 
      justify="space-between" 
      bg={topNavBg}
      px="4"
      py="2"
      borderBottomWidth="1px"
      borderColor={borderColor}
      shadow="sm"
    >
      <IconButton
        aria-label="Open menu"
        icon={<FiMenu />}
        variant="ghost"
        onClick={onOpen}
      />
      <Text fontSize="lg" fontWeight="bold" color={activeColor}>SmartServe</Text>
      {currentUser && (
        <Menu>
          <MenuButton as={Button} rounded="full" variant="link" cursor="pointer">
            <Avatar size="sm" name={currentUser.name} src={currentUser.picture} />
          </MenuButton>
          <MenuList>
            <MenuItem>{currentUser.name}</MenuItem>
            <MenuItem>{currentUser.email}</MenuItem>
            <MenuItem onClick={logout}>Logout</MenuItem>
          </MenuList>
        </Menu>
      )}
    </Flex>
  );

  // Desktop sidebar
  const Sidebar = (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      zIndex="sticky"
      h="full"
      pb="10"
      overflowX="hidden"
      overflowY="auto"
      bg={sidebarBg}
      borderColor={borderColor}
      borderRightWidth="1px"
      w="240px"
      display={{ base: 'none', md: 'block' }}
    >
      <Flex px="4" py="5" align="center">
        <Text fontSize="2xl" fontWeight="bold" color={activeColor}>
          SmartServe
        </Text>
      </Flex>
      <Flex
        direction="column"
        as="nav"
        fontSize="md"
        color="gray.600"
        aria-label="Main Navigation"
        mt="6"
      >
        {navLinks.map((link) => (
          <Link
            key={link.path}
            as={RouterLink}
            to={link.path}
            p="4"
            mx="4"
            borderRadius="lg"
            role="group"
            cursor="pointer"
            bg={isActive(link.path) ? activeBg : 'transparent'}
            color={isActive(link.path) ? activeColor : 'inherit'}
            fontWeight={isActive(link.path) ? 'semibold' : 'normal'}
            _hover={{
              bg: hoverBg,
              color: activeColor,
            }}
          >
            <HStack spacing="3">
              <Box fontSize="lg">{link.icon}</Box>
              <Text>{link.name}</Text>
            </HStack>
          </Link>
        ))}

        <Link
          as={RouterLink}
          to="/campaigns/create"
          p="4"
          mx="4"
          borderRadius="lg"
          role="group"
          cursor="pointer"
          bg={isActive('/campaigns/create') ? activeBg : 'teal.500'}
          color={isActive('/campaigns/create') ? activeColor : 'white'}
          fontWeight="semibold"
          _hover={{
            bg: 'teal.600',
            color: 'white',
          }}
          mt="6"
        >
          <HStack spacing="3">
            <Box fontSize="lg"><FiPlus /></Box>
            <Text>New Campaign</Text>
          </HStack>
        </Link>
      </Flex>

      {currentUser && (
        <Flex
          pos="absolute"
          bottom="5"
          width="100%"
          px="4"
          align="center"
          borderTop="1px"
          borderColor={borderColor}
          pt="4"
        >
          <Menu>
            <MenuButton as={Button} variant="ghost" size="sm" width="100%">
              <HStack spacing="3">
                <Avatar size="sm" name={currentUser.name} src={currentUser.picture} />
                <Flex direction="column" alignItems="flex-start" flex="1" overflow="hidden">
                  <Text fontWeight="semibold" noOfLines={1}>{currentUser.name}</Text>
                  <Text fontSize="xs" color="gray.500" noOfLines={1}>{currentUser.email}</Text>
                </Flex>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem onClick={logout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      )}
    </Box>
  );

  return (
    <>
      {MobileNav}
      {Sidebar}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">SmartServe</DrawerHeader>
          <DrawerBody p="0">
            <VStack align="stretch" spacing="0">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  as={RouterLink}
                  to={link.path}
                  onClick={onClose}
                  p="4"
                  borderRadius="0"
                  role="group"
                  cursor="pointer"
                  bg={isActive(link.path) ? activeBg : 'transparent'}
                  color={isActive(link.path) ? activeColor : 'inherit'}
                  fontWeight={isActive(link.path) ? 'semibold' : 'normal'}
                  _hover={{
                    bg: hoverBg,
                    color: activeColor,
                  }}
                >
                  <HStack spacing="3">
                    <Box fontSize="lg">{link.icon}</Box>
                    <Text>{link.name}</Text>
                  </HStack>
                </Link>
              ))}
              <Link
                as={RouterLink}
                to="/campaigns/create"
                onClick={onClose}
                p="4"
                borderRadius="0"
                role="group"
                cursor="pointer"
                bg="teal.500"
                color="white"
                fontWeight="semibold"
                _hover={{
                  bg: 'teal.600',
                  color: 'white',
                }}
                mt="2"
              >
                <HStack spacing="3">
                  <Box fontSize="lg"><FiPlus /></Box>
                  <Text>New Campaign</Text>
                </HStack>
              </Link>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Navigation;