import React from 'react';
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
  useColorModeValue
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiHome, FiUsers, FiShoppingCart, FiMail, FiBookmark, FiArrowLeft, FiTrello, FiTrendingUp, FiClipboard, FiRepeat, FiSettings } from 'react-icons/fi';

const Navigation: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const canGoBack = window.history.length > 1 && location.pathname !== '/';
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
    { name: 'Dashboard',  path: '/',          icon: <FiHome /> },
    { name: 'Customers',  path: '/customers', icon: <FiUsers /> },
    { name: 'Pipeline',   path: '/pipeline',  icon: <FiTrello /> },
    { name: 'Revenue',    path: '/revenue',   icon: <FiTrendingUp /> },
    { name: 'Orders',     path: '/orders',    icon: <FiShoppingCart /> },
    { name: 'Campaigns',  path: '/campaigns',  icon: <FiMail /> },
    { name: 'Sequences',  path: '/sequences',  icon: <FiRepeat /> },
    { name: 'Lead Forms', path: '/lead-forms', icon: <FiClipboard /> },
    { name: 'Segments',   path: '/segments',   icon: <FiBookmark /> },
    { name: 'Team',       path: '/team',       icon: <FiSettings /> },
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
      pos="sticky"
      top="0"
      zIndex="banner"
    >
      <HStack spacing={1}>
        <IconButton
          aria-label="Open menu"
          icon={<FiMenu />}
          variant="ghost"
          onClick={onOpen}
        />
        {canGoBack && (
          <IconButton
            aria-label="Go back"
            icon={<FiArrowLeft />}
            variant="ghost"
            size="sm"
            color="gray.500"
            onClick={() => navigate(-1)}
          />
        )}
      </HStack>
      <Text fontSize="lg" fontWeight="bold" color={activeColor}>Flayx</Text>
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
    <Flex
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      zIndex="sticky"
      h="full"
      direction="column"
      bg={sidebarBg}
      borderColor={borderColor}
      borderRightWidth="1px"
      w="240px"
      display={{ base: 'none', md: 'flex' }}
    >
      {/* Logo */}
      <Flex px="4" py="5" align="center" flexShrink={0}>
        <Text fontSize="2xl" fontWeight="bold" color={activeColor}>
          Flayx
        </Text>
      </Flex>

      {/* Scrollable nav links */}
      <Flex
        direction="column"
        as="nav"
        fontSize="md"
        color="gray.600"
        aria-label="Main Navigation"
        flex="1"
        overflowY="auto"
        overflowX="hidden"
        pb="2"
        css={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.15)', borderRadius: '4px' },
        }}
      >
        {navLinks.map((link) => (
          <Link
            key={link.path}
            as={RouterLink}
            to={link.path}
            p="4"
            mx="4"
            my="0.5"
            borderRadius="lg"
            role="group"
            cursor="pointer"
            bg={isActive(link.path) ? activeBg : 'transparent'}
            color={isActive(link.path) ? activeColor : 'inherit'}
            fontWeight={isActive(link.path) ? 'semibold' : 'normal'}
            _hover={{ bg: hoverBg, color: activeColor }}
          >
            <HStack spacing="3">
              <Box fontSize="lg">{link.icon}</Box>
              <Text>{link.name}</Text>
            </HStack>
          </Link>
        ))}
      </Flex>

      {/* User section — always visible at bottom */}
      {currentUser && (
        <Flex
          flexShrink={0}
          px="4"
          py="4"
          align="center"
          borderTop="1px"
          borderColor={borderColor}
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
    </Flex>
  );

  return (
    <>
      {MobileNav}
      {Sidebar}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Flayx</DrawerHeader>
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
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default Navigation;