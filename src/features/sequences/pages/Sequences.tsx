import React, { useEffect, useState, useCallback } from 'react';
import {
  Badge, Box, Button, Collapse, Divider, Flex, FormControl, FormLabel,
  Heading, HStack, IconButton, Input, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, NumberInput,
  NumberInputField, Spinner, Text, Textarea, useColorModeValue,
  useDisclosure, useToast, VStack, Select,
} from '@chakra-ui/react';
import {
  FiChevronDown, FiChevronUp, FiPlus, FiTrash2, FiUsers, FiEdit2, FiX,
} from 'react-icons/fi';
import Layout from '../../../shared/components/Layout';
import EmptyState from '../../../shared/components/EmptyState';
import SequenceService, { Sequence, SequenceEnrollment, SequenceStep } from '../services/sequence.service';
import apiClient from '../../../lib/api-client';

// ── Step editor ───────────────────────────────────────────────────────────────
function StepEditor({ step, index, total, onChange, onRemove }: {
  step:     SequenceStep;
  index:    number;
  total:    number;
  onChange: (i: number, s: SequenceStep) => void;
  onRemove: (i: number) => void;
}) {
  const bg = useColorModeValue('gray.50', 'gray.700');
  return (
    <Box bg={bg} borderRadius="lg" p={4} borderWidth={1}>
      <Flex justify="space-between" align="center" mb={3}>
        <HStack>
          <Badge colorScheme="teal" fontSize="xs">Step {index + 1}</Badge>
          {index === 0
            ? <Text fontSize="xs" color="gray.400">Sends immediately on enroll</Text>
            : <Text fontSize="xs" color="gray.400">
                <NumberInput
                  size="xs"
                  value={step.delayDays}
                  min={1}
                  max={365}
                  w="60px"
                  display="inline-flex"
                  onChange={val => onChange(index, { ...step, delayDays: parseInt(val) || 1 })}
                >
                  <NumberInputField p={1} />
                </NumberInput>
                {' '}days after step {index}
              </Text>
          }
        </HStack>
        {total > 1 && (
          <IconButton aria-label="Remove step" icon={<FiTrash2 />} size="xs" variant="ghost" colorScheme="red" onClick={() => onRemove(index)} />
        )}
      </Flex>
      <VStack align="stretch" spacing={2}>
        <Input
          placeholder="Email subject"
          size="sm"
          value={step.subject}
          onChange={e => onChange(index, { ...step, subject: e.target.value })}
        />
        <Textarea
          placeholder="Email body (plain text — personalised with customer's name)"
          size="sm"
          rows={4}
          value={step.body}
          onChange={e => onChange(index, { ...step, body: e.target.value })}
        />
      </VStack>
    </Box>
  );
}

// ── Sequence create/edit modal ────────────────────────────────────────────────
function SequenceModal({ seq, onClose, onSaved }: {
  seq:     Sequence | null;
  onClose: () => void;
  onSaved: (s: Sequence) => void;
}) {
  const [name,    setName]    = useState(seq?.name        || '');
  const [desc,    setDesc]    = useState(seq?.description || '');
  const [steps,   setSteps]   = useState<SequenceStep[]>(
    seq?.steps?.length ? seq.steps : [{ delayDays: 0, subject: '', body: '' }]
  );
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const updateStep = (i: number, s: SequenceStep) => setSteps(prev => prev.map((x, idx) => idx === i ? s : x));
  const removeStep = (i: number) => setSteps(prev => prev.filter((_, idx) => idx !== i));
  const addStep    = () => setSteps(prev => [...prev, { delayDays: 1, subject: '', body: '' }]);

  const handleSave = async () => {
    if (!name.trim()) return toast({ title: 'Name is required', status: 'warning' });
    if (steps.some(s => !s.subject.trim() || !s.body.trim()))
      return toast({ title: 'All steps need a subject and body', status: 'warning' });
    setSaving(true);
    try {
      const payload = { name, description: desc, steps };
      const saved = seq
        ? await SequenceService.update(seq._id, payload)
        : await SequenceService.create(payload);
      onSaved(saved);
    } catch {
      toast({ title: 'Failed to save sequence', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size={['full', 'full', '2xl']} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{seq ? 'Edit Sequence' : 'New Drip Sequence'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Sequence Name</FormLabel>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New Lead Welcome" />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Description (optional)</FormLabel>
              <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. 3-step welcome sequence for new leads" />
            </FormControl>
            <Divider />
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold" fontSize="sm">{steps.length} Email Step{steps.length !== 1 ? 's' : ''}</Text>
              <Button size="xs" leftIcon={<FiPlus />} onClick={addStep}>Add Step</Button>
            </Flex>
            {steps.map((s, i) => (
              <StepEditor key={i} step={s} index={i} total={steps.length} onChange={updateStep} onRemove={removeStep} />
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="teal" isLoading={saving} onClick={handleSave}>
            {seq ? 'Save Changes' : 'Create Sequence'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ── Enroll modal ──────────────────────────────────────────────────────────────
function EnrollModal({ seqId, onClose, onEnrolled }: {
  seqId:      string;
  onClose:    () => void;
  onEnrolled: (e: SequenceEnrollment) => void;
}) {
  const [customers, setCustomers] = useState<{ _id: string; name: string; email: string }[]>([]);
  const [selected,  setSelected]  = useState('');
  const [loading,   setLoading]   = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const toast = useToast();

  useEffect(() => {
    apiClient.get('/customers?limit=200').then(r => {
      setCustomers(r.data.customers || []);
      setLoading(false);
    });
  }, []);

  const handleEnroll = async () => {
    if (!selected) return toast({ title: 'Select a customer', status: 'warning' });
    setEnrolling(true);
    try {
      const enrollment = await SequenceService.enroll(seqId, selected);
      onEnrolled(enrollment);
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || 'Enrollment failed', status: 'error' });
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size={['full', 'md']}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Enroll a Customer</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading ? <Spinner /> : (
            <FormControl>
              <FormLabel>Customer</FormLabel>
              <Select placeholder="Select customer..." value={selected} onChange={e => setSelected(e.target.value)}>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name} — {c.email}</option>
                ))}
              </Select>
            </FormControl>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="teal" isLoading={enrolling} onClick={handleEnroll}>Enroll</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { active: 'blue', completed: 'green', paused: 'yellow', cancelled: 'red' };
  return <Badge colorScheme={map[status] || 'gray'} fontSize="xs">{status}</Badge>;
}

// ── Sequence card ─────────────────────────────────────────────────────────────
function SequenceCard({ seq, onEdit, onDelete }: {
  seq:      Sequence;
  onEdit:   (s: Sequence) => void;
  onDelete: (s: Sequence) => void;
}) {
  const [enrollments,  setEnrollments]  = useState<SequenceEnrollment[]>([]);
  const [loadingEnroll, setLoadingEnroll] = useState(false);
  const [showEnroll,   setShowEnroll]   = useState(false);
  const { isOpen: isEnrollOpen, onOpen: onEnrollOpen, onClose: onEnrollClose } = useDisclosure();
  const cardBg    = useColorModeValue('white', 'gray.700');
  const hoverBg   = useColorModeValue('gray.50', 'gray.600');
  const toast     = useToast();

  const loadEnrollments = useCallback(async () => {
    setLoadingEnroll(true);
    try {
      const data = await SequenceService.getEnrollments(seq._id);
      setEnrollments(data);
    } catch {
      toast({ title: 'Failed to load enrollments', status: 'error' });
    } finally {
      setLoadingEnroll(false);
    }
  }, [seq._id, toast]);

  const handleToggleEnrollments = () => {
    if (!showEnroll) loadEnrollments();
    setShowEnroll(!showEnroll);
  };

  const handleCancelEnrollment = async (enrollment: SequenceEnrollment) => {
    try {
      await SequenceService.cancelEnrollment(seq._id, enrollment._id);
      setEnrollments(prev => prev.map(e => e._id === enrollment._id ? { ...e, status: 'cancelled' } : e));
    } catch {
      toast({ title: 'Failed to cancel enrollment', status: 'error' });
    }
  };

  const handleEnrolled = (e: SequenceEnrollment) => {
    setEnrollments(prev => [e, ...prev]);
    onEnrollClose();
    toast({ title: 'Customer enrolled', status: 'success' });
  };

  return (
    <Box bg={cardBg} borderWidth={1} borderRadius="xl" p={5} shadow="sm">
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={3}>
        <Box flex={1}>
          <HStack mb={1}>
            <Text fontWeight="bold" fontSize="md">{seq.name}</Text>
            <Badge colorScheme={seq.active ? 'green' : 'gray'}>{seq.active ? 'Active' : 'Paused'}</Badge>
          </HStack>
          {seq.description && <Text fontSize="sm" color="gray.500" mb={2}>{seq.description}</Text>}
          <HStack spacing={4} fontSize="sm" color="gray.500">
            <Text>{seq.steps.length} step{seq.steps.length !== 1 ? 's' : ''}</Text>
            <Text>
              {seq.steps.reduce((sum, s, i) => sum + (i === 0 ? 0 : s.delayDays), 0)} day total duration
            </Text>
          </HStack>
        </Box>
        <HStack>
          <Button size="sm" leftIcon={<FiUsers />} colorScheme="teal" variant="outline" onClick={onEnrollOpen}>
            Enroll
          </Button>
          <IconButton aria-label="Edit" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => onEdit(seq)} />
          <IconButton aria-label="Delete" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => onDelete(seq)} />
        </HStack>
      </Flex>

      {/* Steps preview */}
      <Box mt={3}>
        <HStack spacing={2} flexWrap="wrap">
          {seq.steps.map((s, i) => (
            <Badge key={i} variant="subtle" colorScheme="purple" fontSize="xs">
              {i === 0 ? 'Day 0' : `+${seq.steps.slice(1, i + 1).reduce((a, x) => a + x.delayDays, 0)}d`}: {s.subject.slice(0, 20)}{s.subject.length > 20 ? '…' : ''}
            </Badge>
          ))}
        </HStack>
      </Box>

      {/* Enrollments */}
      <Box mt={3}>
        <Button size="xs" variant="ghost" color="gray.500" rightIcon={showEnroll ? <FiChevronUp /> : <FiChevronDown />} onClick={handleToggleEnrollments}>
          {showEnroll ? 'Hide' : 'Show'} Enrollments
        </Button>
        <Collapse in={showEnroll}>
          <Box mt={2}>
            {loadingEnroll ? <Spinner size="sm" /> : enrollments.length === 0 ? (
              <Text fontSize="sm" color="gray.400" pl={1}>No enrollments yet</Text>
            ) : (
              <VStack align="stretch" spacing={1} maxH="200px" overflowY="auto">
                {enrollments.map(e => {
                  const cust = typeof e.customer === 'object' ? e.customer : null;
                  return (
                    <Flex key={e._id} align="center" justify="space-between" px={2} py={1} borderRadius="md" _hover={{ bg: hoverBg }}>
                      <HStack spacing={2}>
                        <Text fontSize="sm">{cust?.name || '—'}</Text>
                        <Text fontSize="xs" color="gray.500">{cust?.email}</Text>
                        <StatusBadge status={e.status} />
                      </HStack>
                      <HStack spacing={1}>
                        <Text fontSize="xs" color="gray.400">Step {e.currentStep + 1}/{seq.steps.length}</Text>
                        {e.status === 'active' && (
                          <IconButton
                            aria-label="Cancel"
                            icon={<FiX />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleCancelEnrollment(e)}
                          />
                        )}
                      </HStack>
                    </Flex>
                  );
                })}
              </VStack>
            )}
          </Box>
        </Collapse>
      </Box>

      {isEnrollOpen && <EnrollModal seqId={seq._id} onClose={onEnrollClose} onEnrolled={handleEnrolled} />}
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const Sequences: React.FC = () => {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [editSeq,   setEditSeq]   = useState<Sequence | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    SequenceService.getAll()
      .then(setSequences)
      .catch(() => toast({ title: 'Failed to load sequences', status: 'error' }))
      .finally(() => setLoading(false));
  }, [toast]);

  const openCreate = () => { setEditSeq(null); onOpen(); };
  const openEdit   = (s: Sequence) => { setEditSeq(s); onOpen(); };

  const handleSaved = (saved: Sequence) => {
    setSequences(prev => {
      const idx = prev.findIndex(s => s._id === saved._id);
      return idx >= 0 ? prev.map(s => s._id === saved._id ? saved : s) : [saved, ...prev];
    });
    onClose();
    toast({ title: editSeq ? 'Sequence updated' : 'Sequence created', status: 'success' });
  };

  const handleDelete = async (seq: Sequence) => {
    if (!window.confirm(`Delete "${seq.name}" and all its enrollments?`)) return;
    try {
      await SequenceService.remove(seq._id);
      setSequences(prev => prev.filter(s => s._id !== seq._id));
      toast({ title: 'Sequence deleted', status: 'success' });
    } catch {
      toast({ title: 'Failed to delete', status: 'error' });
    }
  };

  return (
    <Layout>
      <Box p={[3, 5, 6]}>
        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
          <Box>
            <Heading size="lg">Drip Sequences</Heading>
            <Text color="gray.500" fontSize="sm" mt={1}>
              Automated multi-step email sequences — enroll customers and emails send on a schedule
            </Text>
          </Box>
          <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={openCreate}>New Sequence</Button>
        </Flex>

        {loading ? (
          <Flex justify="center" mt={20}><Spinner size="xl" color="teal.400" /></Flex>
        ) : sequences.length === 0 ? (
          <EmptyState
            icon="✉️"
            title="No sequences yet"
            description="Build automated email sequences to nurture leads and follow up with customers on autopilot."
            ctaLabel="Create Sequence"
            onCta={openCreate}
          />
        ) : (
          <VStack align="stretch" spacing={4}>
            {sequences.map(seq => (
              <SequenceCard key={seq._id} seq={seq} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </VStack>
        )}
      </Box>

      {isOpen && (
        <SequenceModal seq={editSeq} onClose={onClose} onSaved={handleSaved} />
      )}
    </Layout>
  );
};

export default Sequences;
