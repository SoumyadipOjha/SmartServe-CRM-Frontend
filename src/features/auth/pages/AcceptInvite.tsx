import React, { useEffect, useState } from 'react';
import {
  Box, Button, Flex, FormControl, FormLabel, Heading, Input, Spinner,
  Text, useColorModeValue, useToast, VStack, Badge,
} from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../../lib/api-client';
import { useAuth } from '../../../shared/context/AuthContext';

const AcceptInvite: React.FC = () => {
  const [params]     = useSearchParams();
  const token        = params.get('token') || '';
  const [info,       setInfo]       = useState<{ email: string; teamRole: string; invitedBy: { name: string } } | null>(null);
  const [name,       setName]       = useState('');
  const [loading,    setLoading]    = useState(true);
  const [joining,    setJoining]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  useAuth();
  const navigate     = useNavigate();
  const toast        = useToast();
  const cardBg       = useColorModeValue('white', 'gray.800');
  const pageBg       = useColorModeValue('gray.50', 'gray.900');
  const infoBg       = useColorModeValue('teal.50', 'teal.900');

  useEffect(() => {
    if (!token) { setError('Invalid invite link.'); setLoading(false); return; }
    apiClient.get(`/team/invite-info/${token}`)
      .then(r => { setInfo(r.data); setLoading(false); })
      .catch(e => {
        setError(e?.response?.data?.message || 'This invite is invalid or has expired.');
        setLoading(false);
      });
  }, [token]);

  const handleJoin = async () => {
    if (!name.trim()) return toast({ title: 'Please enter your name', status: 'warning' });
    setJoining(true);
    try {
      const res = await apiClient.post('/team/accept', { token, name });
      // Store token and redirect
      localStorage.setItem('token', res.data.token);
      window.location.href = '/';
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || 'Failed to accept invite', status: 'error' });
    } finally {
      setJoining(false);
    }
  };

  return (
    <Flex minH="100vh" bg={pageBg} align="center" justify="center" p={4}>
      <Box w="100%" maxW="440px">
        <Text textAlign="center" fontSize="sm" color="teal.500" fontWeight="bold" mb={6} letterSpacing="wide">
          ⚡ Flayx CRM
        </Text>
        <Box bg={cardBg} borderRadius="2xl" shadow="lg" p={[6, 8]}>
          {loading && <Flex justify="center" py={10}><Spinner size="xl" color="teal.400" /></Flex>}

          {!loading && error && (
            <Flex direction="column" align="center" py={10} gap={3}>
              <Text fontSize="3xl">😕</Text>
              <Heading size="md">Invalid Invite</Heading>
              <Text color="gray.500" textAlign="center">{error}</Text>
              <Button colorScheme="teal" variant="outline" onClick={() => navigate('/login')}>Go to Login</Button>
            </Flex>
          )}

          {!loading && !error && info && (
            <>
              <Heading size="lg" mb={1}>You're invited!</Heading>
              <Text fontSize="sm" color="gray.500" mb={4}>
                <strong>{info.invitedBy.name}</strong> invited you to join their Flayx workspace as{' '}
                <Badge colorScheme="blue">{info.teamRole}</Badge>
              </Text>
              <Text fontSize="sm" mb={6} p={3} bg={infoBg} borderRadius="md" color="teal.700">
                Joining as: <strong>{info.email}</strong>
              </Text>
              <VStack align="stretch" spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Your Name</FormLabel>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  />
                </FormControl>
                <Button colorScheme="teal" size="lg" isLoading={joining} onClick={handleJoin}>
                  Join Team
                </Button>
              </VStack>
            </>
          )}
        </Box>
      </Box>
    </Flex>
  );
};

export default AcceptInvite;
