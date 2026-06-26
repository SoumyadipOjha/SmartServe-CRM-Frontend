import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Button, Container, Divider, Flex, HStack,
  Heading, Icon, SimpleGrid, Text, VStack, useToast,
} from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import {
  MdOutlinePlayCircle, MdArrowForward, MdCheck, MdKeyboardArrowUp,
} from 'react-icons/md';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  {
    title: 'Import your customers',
    desc: 'Connect existing data or start fresh. Contacts, orders, and activity in one clean view.',
  },
  {
    title: 'Build smart segments',
    desc: 'Filter by spend, visits, or last activity. See exactly who qualifies before you hit send.',
  },
  {
    title: 'Launch AI campaigns',
    desc: 'AI writes personalised messages per segment. Track opens and run A/B tests automatically.',
  },
];

const FEATURES = [
  { title: 'Live analytics',  desc: 'Real-time dashboard that updates as emails open and campaigns run.' },
  { title: 'Open tracking',   desc: 'Know who opened which email with per-customer tracking — not just totals.' },
  { title: 'A/B testing',     desc: 'Two message variants, split 50 / 50 automatically across your audience.' },
  { title: 'One-click send',  desc: 'Segment, preview, and fire a campaign to hundreds of customers in minutes.' },
];

// ── App preview widget ────────────────────────────────────────────────────────
function AppPreview() {
  const bars = [38, 62, 28, 78, 52, 91, 47];
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="10px"
      p={{ base: 4, md: 5 }}
      maxW={{ base: 'full', lg: '340px' }}
      mx="auto"
    >
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Box>
          <Text fontSize="10px" color="gray.400" mb={0.5} letterSpacing="0.5px" textTransform="uppercase">
            Campaign open rate
          </Text>
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="700" color="gray.900" lineHeight="1">
            68%
          </Text>
        </Box>
        <Box
          bg="teal.50"
          color="teal.700"
          borderRadius="4px"
          px={2}
          py={0.5}
          fontSize="11px"
          fontWeight="600"
          whiteSpace="nowrap"
        >
          ↑ 12% this week
        </Box>
      </Flex>

      <HStack align="flex-end" spacing={1.5} h={{ base: '56px', md: '68px' }} mb={4}>
        {bars.map((h, i) => (
          <Box
            key={i}
            flex={1}
            borderRadius="2px 2px 0 0"
            bg={i === 5 ? 'teal.500' : 'teal.100'}
            h={`${h}%`}
          />
        ))}
      </HStack>

      <Box borderTop="1px solid" borderColor="gray.100" pt={3}>
        <Flex justify="space-between">
          {[
            { label: 'Customers', val: '2,847' },
            { label: 'Dispatched', val: '1,204' },
            { label: 'Campaigns',  val: '12'    },
          ].map((s) => (
            <Box key={s.label}>
              <Text fontSize="10px" color="gray.400" mb={0.5}>{s.label}</Text>
              <Text fontSize="sm" fontWeight="600" color="gray.800">{s.val}</Text>
            </Box>
          ))}
        </Flex>
      </Box>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const Login: React.FC = () => {
  const { isAuthenticated, isLoading, login, demoLogin } = useAuth();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [showBackTop, setShowBackTop]     = useState(false);
  const toast = useToast();

  const howRef   = useRef<HTMLDivElement>(null);
  const featRef  = useRef<HTMLDivElement>(null);
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 150);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    try {
      await demoLogin();
    } catch {
      toast({
        title: 'Demo login failed',
        description: 'Could not connect to the server. Make sure the backend is running.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      setIsDemoLoading(false);
    }
  };

  const scroll = (ref: React.RefObject<HTMLDivElement>) =>
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <Box bg="white" minH="100vh" color="gray.800">

      {/* ── Back to top ────────────────────────────────────────────────────── */}
      {showBackTop && (
        <Flex
          position="fixed"
          bottom={{ base: 6, md: 8 }}
          right={{ base: 4, md: 8 }}
          zIndex={9999}
          align="center"
          justify="center"
          w="44px"
          h="44px"
          borderRadius="full"
          bg="teal.600"
          color="white"
          cursor="pointer"
          onClick={scrollTop}
          boxShadow="0 4px 14px rgba(0,0,0,0.25)"
          _hover={{ bg: 'teal.700' }}
        >
          <Icon as={MdKeyboardArrowUp} boxSize="22px" />
        </Flex>
      )}

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <Box
        position="sticky"
        top={0}
        zIndex={100}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        <Container maxW="1100px" px={{ base: 4, md: 6 }}>
          <Flex h="56px" align="center" justify="space-between">
            <Text fontWeight="bold" fontSize="lg" color="teal.600" letterSpacing="-0.5px">
              Flayx
            </Text>
            <HStack spacing={7} display={{ base: 'none', md: 'flex' }}>
              <Text
                fontSize="sm" color="gray.500" cursor="pointer"
                _hover={{ color: 'gray.900' }}
                onClick={() => scroll(howRef)}
              >
                How it works
              </Text>
              <Text
                fontSize="sm" color="gray.500" cursor="pointer"
                _hover={{ color: 'gray.900' }}
                onClick={() => scroll(featRef)}
              >
                Features
              </Text>
            </HStack>
            <Button
              size="sm"
              colorScheme="teal"
              onClick={() => scroll(loginRef)}
              px={{ base: 3, md: 4 }}
            >
              Sign In
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <Container maxW="1100px" px={{ base: 4, md: 6 }} py={{ base: 10, md: 16, lg: 24 }}>
        <Flex
          gap={{ base: 10, lg: 16 }}
          align="center"
          direction={{ base: 'column', lg: 'row' }}
        >
          {/* Copy */}
          <VStack align="flex-start" spacing={{ base: 5, md: 6 }} flex={1} minW={0}>
            <Heading
              as="h1"
              fontSize={{ base: '2xl', sm: '3xl', md: '4xl', lg: '52px' }}
              fontWeight="800"
              lineHeight="1.15"
              letterSpacing={{ base: '-0.5px', md: '-1px', lg: '-2px' }}
              color="gray.900"
            >
              Turn customer data
              <br />
              <Text as="span" color="teal.600">into revenue.</Text>
            </Heading>

            <Text
              color="gray.500"
              fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}
              maxW="420px"
              lineHeight="1.8"
            >
              Segment your audience, write AI-powered campaigns, and see who opens every email — all in one place.
            </Text>

            {/* Buttons — stack on small mobile, row on sm+ */}
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              gap={3}
              w={{ base: 'full', sm: 'auto' }}
            >
              <Button
                colorScheme="teal"
                size={{ base: 'md', md: 'lg' }}
                leftIcon={<Icon as={MdOutlinePlayCircle} boxSize="18px" />}
                onClick={handleDemoLogin}
                isLoading={isDemoLoading}
                loadingText="Loading…"
                px={7}
                w={{ base: 'full', sm: 'auto' }}
              >
                Try Demo Free
              </Button>
              <Button
                variant="ghost"
                size={{ base: 'md', md: 'lg' }}
                color="gray.500"
                rightIcon={<Icon as={MdArrowForward} boxSize="15px" />}
                _hover={{ color: 'teal.600', bg: 'transparent' }}
                onClick={() => scroll(loginRef)}
                w={{ base: 'full', sm: 'auto' }}
                justifyContent={{ base: 'center', sm: 'flex-start' }}
              >
                Sign in
              </Button>
            </Flex>

            <Text fontSize="xs" color="gray.400">
              Pre-loaded with demo data. No account needed.
            </Text>
          </VStack>

          {/* Visual — full width on mobile, constrained on desktop */}
          <Box
            flex={1}
            w="full"
            minW={0}
            maxW={{ base: '400px', lg: 'none' }}
            mx={{ base: 'auto', lg: '0' }}
          >
            <AppPreview />
          </Box>
        </Flex>
      </Container>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <Box
        ref={howRef}
        bg="gray.50"
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="gray.100"
        py={{ base: 12, lg: 20 }}
        scrollMarginTop="56px"
      >
        <Container maxW="1100px" px={{ base: 4, md: 6 }}>
          <VStack spacing={2} mb={{ base: 10, md: 12 }} textAlign="center">
            <Heading
              fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
              fontWeight="700"
              letterSpacing="-0.5px"
              color="gray.900"
            >
              How it works
            </Heading>
            <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }}>
              Three steps from raw data to a running campaign.
            </Text>
          </VStack>

          <Box position="relative">
            {/* Connecting line — desktop only */}
            <Box
              position="absolute"
              h="1px"
              bg="gray.200"
              display={{ base: 'none', md: 'block' }}
              style={{ top: '20px', left: 'calc(100% / 6)', right: 'calc(100% / 6)' }}
            />

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 8, md: 10 }}>
              {STEPS.map((step, i) => (
                <Flex
                  key={i}
                  direction={{ base: 'row', md: 'column' }}
                  align={{ base: 'flex-start', md: 'center' }}
                  gap={{ base: 4, md: 0 }}
                >
                  {/* Step circle */}
                  <Flex
                    w="40px"
                    h="40px"
                    minW="40px"
                    borderRadius="full"
                    bg="teal.600"
                    color="white"
                    align="center"
                    justify="center"
                    fontWeight="700"
                    fontSize="sm"
                    position="relative"
                    zIndex={1}
                    mb={{ base: 0, md: 5 }}
                  >
                    {i + 1}
                  </Flex>

                  {/* Text */}
                  <Box>
                    <Text
                      fontWeight="600"
                      fontSize={{ base: 'sm', md: 'md' }}
                      color="gray.800"
                      mb={1.5}
                      textAlign={{ base: 'left', md: 'center' }}
                    >
                      {step.title}
                    </Text>
                    <Text
                      fontSize="sm"
                      color="gray.500"
                      lineHeight="1.75"
                      textAlign={{ base: 'left', md: 'center' }}
                    >
                      {step.desc}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </SimpleGrid>
          </Box>
        </Container>
      </Box>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <Box
        ref={featRef}
        py={{ base: 12, lg: 20 }}
        scrollMarginTop="56px"
      >
        <Container maxW="1100px" px={{ base: 4, md: 6 }}>
          <VStack spacing={2} mb={{ base: 10, md: 12 }} textAlign="center">
            <Heading
              fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
              fontWeight="700"
              letterSpacing="-0.5px"
              color="gray.900"
            >
              Everything you need
            </Heading>
            <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }}>
              Built for teams who want results, not complexity.
            </Text>
          </VStack>

          <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="10px"
            overflow="hidden"
          >
            <SimpleGrid columns={{ base: 1, md: 2 }}>
              {FEATURES.map((feat, i) => (
                <Box
                  key={feat.title}
                  p={{ base: 5, md: 7 }}
                  borderRight={{ base: 'none', md: i % 2 === 0 ? '1px solid' : 'none' }}
                  borderBottom={
                    // mobile (1-col): border under all except last item
                    // desktop (2-col): border under top row only (i < 2)
                    {
                      base: i < FEATURES.length - 1 ? '1px solid' : 'none',
                      md: i < 2 ? '1px solid' : 'none',
                    }
                  }
                  borderColor="gray.200"
                >
                  <Text
                    fontWeight="600"
                    fontSize={{ base: 'sm', md: 'md' }}
                    color="gray.800"
                    mb={1.5}
                  >
                    {feat.title}
                  </Text>
                  <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500" lineHeight="1.8">
                    {feat.desc}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </Container>
      </Box>

      {/* ── Sign In ─────────────────────────────────────────────────────────── */}
      <Box
        ref={loginRef}
        bg="gray.50"
        borderTop="1px solid"
        borderColor="gray.100"
        py={{ base: 12, lg: 20 }}
        scrollMarginTop="56px"
      >
        <Container maxW="400px" px={{ base: 4, md: 6 }}>
          <Box
            bg="white"
            borderRadius="10px"
            border="1px solid"
            borderColor="gray.200"
            overflow="hidden"
          >
            <Box h="3px" bg="teal.500" />
            <VStack spacing={5} p={{ base: 5, md: 7 }}>
              <VStack spacing={1} textAlign="center">
                <Heading fontSize={{ base: 'lg', md: 'xl' }} fontWeight="700" color="gray.800">
                  Get started
                </Heading>
                <Text color="gray.500" fontSize="sm">
                  Sign in with Google or explore the demo.
                </Text>
              </VStack>

              <VStack spacing={3} w="full">
                <Button
                  w="full"
                  variant="outline"
                  borderColor="gray.300"
                  color="gray.700"
                  leftIcon={<Icon as={FcGoogle} boxSize="18px" />}
                  onClick={login}
                  isLoading={isLoading && !isDemoLoading}
                  loadingText="Redirecting…"
                  _hover={{ borderColor: 'teal.400', color: 'teal.600', bg: 'teal.50' }}
                  fontSize="sm"
                >
                  Sign in with Google
                </Button>

                <Flex align="center" w="full" gap={3}>
                  <Divider />
                  <Text fontSize="xs" color="gray.400" whiteSpace="nowrap">or</Text>
                  <Divider />
                </Flex>

                <Button
                  w="full"
                  colorScheme="teal"
                  leftIcon={<Icon as={MdOutlinePlayCircle} boxSize="18px" />}
                  onClick={handleDemoLogin}
                  isLoading={isDemoLoading}
                  loadingText="Loading demo…"
                  fontSize="sm"
                >
                  Try Demo — no login required
                </Button>

                <Text fontSize="xs" color="gray.400" textAlign="center">
                  Pre-loaded with 10 customers, orders &amp; campaigns
                </Text>
              </VStack>

              <VStack spacing={2} w="full" align="flex-start">
                {[
                  'No credit card required',
                  'Real email sending via SMTP',
                  'AI-written campaign messages',
                ].map((item) => (
                  <HStack key={item} spacing={2}>
                    <Icon as={MdCheck} color="teal.500" boxSize="13px" flexShrink={0} />
                    <Text fontSize="xs" color="gray.500">{item}</Text>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </Box>
        </Container>
      </Box>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <Box borderTop="1px solid" borderColor="gray.200" py={5}>
        <Container maxW="1100px" px={{ base: 4, md: 6 }}>
          <Flex
            justify="space-between"
            align="center"
            direction={{ base: 'column', md: 'row' }}
            gap={1.5}
          >
            <Text color="teal.600" fontWeight="bold" fontSize="sm">Flayx</Text>
            <Text color="gray.400" fontSize="xs">© 2025 Flayx. AI-powered CRM.</Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Login;
