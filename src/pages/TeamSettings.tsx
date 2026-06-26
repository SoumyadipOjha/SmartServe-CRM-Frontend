import React, { useEffect, useState } from 'react';
import {
  Avatar, Badge, Box, Button, Divider, Flex, FormControl, FormLabel,
  Heading, HStack, IconButton, Input, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Spinner,
  Tag, Text, useColorModeValue, useDisclosure, useToast, VStack,
} from '@chakra-ui/react';
import { FiMail, FiPlus, FiTrash2, FiUserMinus, FiUsers } from 'react-icons/fi';
import Layout from '../components/Layout';
import TeamService, { TeamMember, TeamInvite } from '../services/team.service';
import { useAuth } from '../context/AuthContext';

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = { owner: 'purple', admin: 'blue', member: 'gray' };
  return <Badge colorScheme={map[role] || 'gray'} textTransform="capitalize">{role}</Badge>;
}

// ── Invite modal ──────────────────────────────────────────────────────────────
function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: (inv: TeamInvite, link: string) => void }) {
  const [email,    setEmail]    = useState('');
  const [role,     setRole]     = useState<'admin' | 'member'>('member');
  const [sending,  setSending]  = useState(false);
  const toast = useToast();

  const handleInvite = async () => {
    if (!email.trim()) return toast({ title: 'Email is required', status: 'warning' });
    setSending(true);
    try {
      const result = await TeamService.invite(email.trim(), role);
      onInvited(result.invite, result.inviteLink);
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || 'Invite failed', status: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size={['full', 'md']}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Invite Team Member</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Email Address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colleague@company.com"
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Role</FormLabel>
              <Select value={role} onChange={e => setRole(e.target.value as 'admin' | 'member')}>
                <option value="member">Member — read/write access to CRM data</option>
                <option value="admin">Admin — member + can invite/remove team</option>
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="teal" isLoading={sending} leftIcon={<FiMail />} onClick={handleInvite}>
            Send Invite
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ── Invite link modal (shown after sending) ───────────────────────────────────
function InviteLinkModal({ link, onClose }: { link: string; onClose: () => void }) {
  const toast = useToast();
  const copy = () => {
    navigator.clipboard.writeText(link);
    toast({ title: 'Invite link copied', status: 'success', duration: 1500 });
  };
  return (
    <Modal isOpen onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Invite Sent!</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color="gray.500" mb={3}>
            Share this link with your team member (expires in 7 days):
          </Text>
          <Box bg={useColorModeValue('gray.50','gray.700')} borderRadius="md" p={3} wordBreak="break-all" fontSize="sm">
            {link}
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="teal" onClick={copy}>Copy Link</Button>
          <Button variant="ghost" ml={3} onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TeamSettings: React.FC = () => {
  const [members,  setMembers]  = useState<TeamMember[]>([]);
  const [invites,  setInvites]  = useState<TeamInvite[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const { isOpen: isInviteOpen, onOpen: onInviteOpen, onClose: onInviteClose } = useDisclosure();
  const { currentUser } = useAuth();
  const cardBg = useColorModeValue('white', 'gray.700');
  const toast  = useToast();

  const isOwnerOrAdmin = currentUser?.teamRole === 'owner' || currentUser?.teamRole === 'admin';

  useEffect(() => {
    Promise.all([TeamService.getTeam(), TeamService.getInvites()])
      .then(([m, i]) => { setMembers(m); setInvites(i); })
      .catch(() => toast({ title: 'Failed to load team', status: 'error' }))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleInvited = (inv: TeamInvite, link: string) => {
    setInvites(prev => [inv, ...prev]);
    onInviteClose();
    setInviteLink(link);
  };

  const revokeInvite = async (inv: TeamInvite) => {
    try {
      await TeamService.revokeInvite(inv._id);
      setInvites(prev => prev.filter(i => i._id !== inv._id));
      toast({ title: 'Invite revoked', status: 'success' });
    } catch {
      toast({ title: 'Failed to revoke invite', status: 'error' });
    }
  };

  const removeMember = async (member: TeamMember) => {
    if (!window.confirm(`Remove ${member.name} from the team?`)) return;
    try {
      await TeamService.removeMember(member._id);
      setMembers(prev => prev.filter(m => m._id !== member._id));
      toast({ title: `${member.name} removed`, status: 'success' });
    } catch {
      toast({ title: 'Failed to remove member', status: 'error' });
    }
  };

  const changeRole = async (member: TeamMember, role: string) => {
    try {
      const updated = await TeamService.updateRole(member._id, role);
      setMembers(prev => prev.map(m => m._id === member._id ? { ...m, teamRole: updated.teamRole } : m));
      toast({ title: 'Role updated', status: 'success' });
    } catch {
      toast({ title: 'Failed to update role', status: 'error' });
    }
  };

  return (
    <Layout>
      <Box p={[3, 5, 6]} maxW={{ base: '100%', lg: '800px' }}>
        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
          <Box>
            <Heading size="lg">Team Members</Heading>
            <Text color="gray.500" fontSize="sm" mt={1}>
              Invite colleagues — they share access to your CRM data
            </Text>
          </Box>
          {isOwnerOrAdmin && (
            <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={onInviteOpen}>Invite Member</Button>
          )}
        </Flex>

        {loading ? (
          <Flex justify="center" mt={20}><Spinner size="xl" color="teal.400" /></Flex>
        ) : (
          <>
            {/* Active members */}
            <Box bg={cardBg} borderWidth={1} borderRadius="xl" overflow="hidden" shadow="sm" mb={6}>
              <Box px={5} py={3} borderBottomWidth={1}>
                <Text fontWeight="semibold" fontSize="sm">
                  <FiUsers style={{ display: 'inline', marginRight: 6 }} />
                  Active Members ({members.length})
                </Text>
              </Box>
              <VStack align="stretch" spacing={0} divider={<Divider />}>
                {members.map(m => {
                  const isMe = m._id === (currentUser as any)?._id || m.email === currentUser?.email;
                  const isOwner = m.teamRole === 'owner';
                  return (
                    <Flex key={m._id} px={5} py={4} align="center" justify="space-between" wrap="wrap" gap={3}>
                      <HStack spacing={3}>
                        <Avatar size="sm" name={m.name} />
                        <Box>
                          <HStack>
                            <Text fontWeight="medium" fontSize="sm">{m.name}</Text>
                            {isMe && <Tag size="sm" colorScheme="teal">You</Tag>}
                          </HStack>
                          <Text fontSize="xs" color="gray.500">{m.email}</Text>
                        </Box>
                      </HStack>
                      <HStack spacing={3}>
                        {isOwnerOrAdmin && !isMe && !isOwner ? (
                          <Select
                            size="sm"
                            value={m.teamRole}
                            minW="100px"
                            maxW="130px"
                            onChange={e => changeRole(m, e.target.value)}
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </Select>
                        ) : (
                          <RoleBadge role={m.teamRole} />
                        )}
                        {isOwnerOrAdmin && !isMe && !isOwner && (
                          <IconButton
                            aria-label="Remove member"
                            icon={<FiUserMinus />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => removeMember(m)}
                          />
                        )}
                      </HStack>
                    </Flex>
                  );
                })}
              </VStack>
            </Box>

            {/* Pending invites */}
            {isOwnerOrAdmin && invites.length > 0 && (
              <Box bg={cardBg} borderWidth={1} borderRadius="xl" overflow="hidden" shadow="sm">
                <Box px={5} py={3} borderBottomWidth={1}>
                  <Text fontWeight="semibold" fontSize="sm">
                    Pending Invites ({invites.length})
                  </Text>
                </Box>
                <VStack align="stretch" spacing={0} divider={<Divider />}>
                  {invites.map(inv => (
                    <Flex key={inv._id} px={5} py={4} align="center" justify="space-between" wrap="wrap" gap={3}>
                      <HStack spacing={3}>
                        <Avatar size="sm" name={inv.email} bg="gray.300" />
                        <Box>
                          <Text fontSize="sm">{inv.email}</Text>
                          <Text fontSize="xs" color="gray.500">
                            Expires {new Date(inv.expiresAt).toLocaleDateString()}
                          </Text>
                        </Box>
                      </HStack>
                      <HStack>
                        <RoleBadge role={inv.teamRole} />
                        <IconButton
                          aria-label="Revoke invite"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => revokeInvite(inv)}
                        />
                      </HStack>
                    </Flex>
                  ))}
                </VStack>
              </Box>
            )}
          </>
        )}
      </Box>

      {isInviteOpen && <InviteModal onClose={onInviteClose} onInvited={handleInvited} />}
      {inviteLink && <InviteLinkModal link={inviteLink} onClose={() => setInviteLink(null)} />}
    </Layout>
  );
};

export default TeamSettings;
