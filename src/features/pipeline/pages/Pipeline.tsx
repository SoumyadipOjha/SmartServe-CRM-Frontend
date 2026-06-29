import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Button, Flex, Heading, HStack, Icon, Input, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
  Select, Spinner, Stack, Text, Textarea, useColorModeValue,
  useDisclosure, useToast, VStack, Badge, NumberInput, NumberInputField,
  FormControl, FormLabel,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { FiDollarSign, FiCalendar, FiUser } from 'react-icons/fi';
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from '@hello-pangea/dnd';
import Layout from '../../../shared/components/Layout';
import DealService from '../services/deal.service';
import CustomerService from '../../../features/customers/services/customer.service';
import { Deal, DealStage } from '../../../shared/types/models';

// ── constants ─────────────────────────────────────────────────────────────────

const STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: 'lead',        label: 'Lead',        color: 'gray'   },
  { id: 'contacted',   label: 'Contacted',   color: 'blue'   },
  { id: 'proposal',    label: 'Proposal',    color: 'purple' },
  { id: 'negotiation', label: 'Negotiation', color: 'orange' },
  { id: 'won',         label: 'Won',         color: 'green'  },
  { id: 'lost',        label: 'Lost',        color: 'red'    },
];

function fmtCurrency(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 });
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── DealCard ──────────────────────────────────────────────────────────────────

function DealCard({
  deal, index, onEdit, onDelete,
}: {
  deal: Deal; index: number;
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
}) {
  const bg     = useColorModeValue('white', 'gray.700');
  const border = useColorModeValue('gray.200', 'gray.600');
  const muted  = useColorModeValue('gray.500', 'gray.400');
  const customer = typeof deal.customer === 'object' ? deal.customer : null;
  const isOverdue = deal.expectedCloseDate && new Date(deal.expectedCloseDate) < new Date() && deal.stage !== 'won' && deal.stage !== 'lost';

  return (
    <Draggable draggableId={deal._id} index={index}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          bg={bg}
          borderWidth={1}
          borderColor={snapshot.isDragging ? 'teal.400' : border}
          borderRadius="lg"
          p={3}
          shadow={snapshot.isDragging ? 'lg' : 'sm'}
          cursor="grab"
          _active={{ cursor: 'grabbing' }}
          transition="box-shadow 0.15s"
          onClick={() => onEdit(deal)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onEdit(deal)}
        >
          <Flex justify="space-between" align="flex-start" mb={1}>
            <Text fontWeight="semibold" fontSize="sm" noOfLines={2} flex={1} mr={2}>
              {deal.title}
            </Text>
            <Button
              size="xs" variant="ghost" colorScheme="red" flexShrink={0}
              onClick={e => { e.stopPropagation(); onDelete(deal._id); }}
              aria-label="Delete deal"
            >
              <Icon as={DeleteIcon} />
            </Button>
          </Flex>

          {customer && (
            <HStack spacing={1} color={muted} fontSize="xs" mb={1}>
              <Icon as={FiUser} />
              <Text noOfLines={1}>{customer.name}</Text>
            </HStack>
          )}

          {deal.value > 0 && (
            <HStack spacing={1} color="teal.500" fontSize="xs" mb={1}>
              <Icon as={FiDollarSign} />
              <Text fontWeight="bold">{fmtCurrency(deal.value)}</Text>
            </HStack>
          )}

          {deal.expectedCloseDate && (
            <HStack spacing={1} fontSize="xs" color={isOverdue ? 'red.400' : muted}>
              <Icon as={FiCalendar} />
              <Text>{fmtDate(deal.expectedCloseDate)}</Text>
              {isOverdue && <Badge colorScheme="red" fontSize="2xs">Overdue</Badge>}
            </HStack>
          )}
        </Box>
      )}
    </Draggable>
  );
}

// ── Pipeline page ─────────────────────────────────────────────────────────────

const Pipeline: React.FC = () => {
  const [deals, setDeals]       = useState<Deal[]>([]);
  const [loading, setLoading]   = useState(true);
  const [customers, setCustomers] = useState<{ _id: string; name: string; email: string }[]>([]);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [saving, setSaving]     = useState(false);

  // New deal form state
  const [form, setForm] = useState({
    title: '', customerId: '', stage: 'lead' as DealStage,
    value: '', expectedCloseDate: '', notes: '',
  });

  const { isOpen: isNewOpen, onOpen: onNewOpen, onClose: onNewClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const toast  = useToast();
  const colBg  = useColorModeValue('gray.50', 'gray.800');
  const colBorder = useColorModeValue('gray.200', 'gray.600');

  // Edit form state (mirrors deal fields)
  const [editForm, setEditForm] = useState({
    title: '', stage: 'lead' as DealStage, value: '',
    expectedCloseDate: '', notes: '',
  });

  useEffect(() => {
    Promise.all([
      DealService.getDeals(),
      CustomerService.getCustomers(),
    ]).then(([d, c]) => {
      setDeals(d);
      setCustomers(c);
    }).catch(() => toast({ title: 'Failed to load pipeline', status: 'error', duration: 3000 }))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dealsByStage = useCallback((stage: DealStage) =>
    deals.filter(d => d.stage === stage).sort((a, b) => a.order - b.order),
  [deals]);

  const stageTotal = (stage: DealStage) =>
    dealsByStage(stage).reduce((sum, d) => sum + d.value, 0);

  // ── drag end ────────────────────────────────────────────────────────────────
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStage = destination.droppableId as DealStage;
    const srcStage = source.droppableId as DealStage;

    // Build new ordered list optimistically
    const srcItems  = dealsByStage(srcStage).filter(d => d._id !== draggableId);
    const destItems = dealsByStage(newStage).filter(d => d._id !== draggableId);
    const movedDeal = deals.find(d => d._id === draggableId)!;
    destItems.splice(destination.index, 0, { ...movedDeal, stage: newStage });

    const updates: { id: string; stage: DealStage; order: number }[] = [];
    srcItems.forEach((d, i)  => updates.push({ id: d._id, stage: srcStage, order: i }));
    destItems.forEach((d, i) => updates.push({ id: d._id, stage: newStage, order: i }));

    // Optimistic update
    setDeals(prev => {
      const map = new Map(prev.map(d => [d._id, d]));
      updates.forEach(u => { const d = map.get(u.id); if (d) map.set(u.id, { ...d, stage: u.stage, order: u.order }); });
      return Array.from(map.values());
    });

    try {
      await DealService.reorderDeals(updates);
    } catch {
      toast({ title: 'Failed to save order', status: 'error', duration: 2000 });
      // Revert by re-fetching
      DealService.getDeals().then(setDeals);
    }
  };

  // ── create deal ─────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.title.trim() || !form.customerId) return;
    setSaving(true);
    try {
      const deal = await DealService.createDeal({
        title:             form.title.trim(),
        customerId:        form.customerId,
        stage:             form.stage,
        value:             parseFloat(form.value) || 0,
        expectedCloseDate: form.expectedCloseDate || null,
        notes:             form.notes,
      });
      setDeals(prev => [...prev, deal]);
      setForm({ title: '', customerId: '', stage: 'lead', value: '', expectedCloseDate: '', notes: '' });
      onNewClose();
      toast({ title: 'Deal created', status: 'success', duration: 2000 });
    } catch {
      toast({ title: 'Failed to create deal', status: 'error', duration: 2000 });
    } finally { setSaving(false); }
  };

  // ── edit deal ────────────────────────────────────────────────────────────────
  const openEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setEditForm({
      title:             deal.title,
      stage:             deal.stage,
      value:             deal.value > 0 ? String(deal.value) : '',
      expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().slice(0, 10) : '',
      notes:             deal.notes ?? '',
    });
    onEditOpen();
  };

  const handleEdit = async () => {
    if (!editingDeal) return;
    setSaving(true);
    try {
      const updated = await DealService.updateDeal(editingDeal._id, {
        title:             editForm.title.trim(),
        stage:             editForm.stage,
        value:             parseFloat(editForm.value) || 0,
        expectedCloseDate: editForm.expectedCloseDate || null,
        notes:             editForm.notes,
      });
      setDeals(prev => prev.map(d => d._id === updated._id ? updated : d));
      onEditClose();
      toast({ title: 'Deal updated', status: 'success', duration: 2000 });
    } catch {
      toast({ title: 'Failed to update deal', status: 'error', duration: 2000 });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await DealService.deleteDeal(id);
      setDeals(prev => prev.filter(d => d._id !== id));
      toast({ title: 'Deal deleted', status: 'info', duration: 2000 });
    } catch {
      toast({ title: 'Failed to delete deal', status: 'error', duration: 2000 });
    }
  };

  const totalPipeline = deals
    .filter(d => d.stage !== 'lost')
    .reduce((s, d) => s + d.value, 0);

  return (
    <Layout>
      <Box p={[3, 5, 6]}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
          <Box>
            <Heading size="lg">Deal Pipeline</Heading>
            <Text fontSize="sm" color="gray.500" mt={1}>
              {deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').length} active deals
              · {fmtCurrency(totalPipeline)} pipeline value
            </Text>
          </Box>
          <Button colorScheme="teal" leftIcon={<AddIcon />} onClick={onNewOpen}>
            Add Deal
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" mt={20}><Spinner size="xl" color="teal.400" /></Flex>
        ) : (
          <Box overflowX="auto" pb={4} mx={{ base: -2, md: 0 }}>
            <Text display={{ base: 'block', md: 'none' }} fontSize="xs" color="gray.400" mb={2} pl={2}>
              Swipe to see all stages · Tap a card to edit
            </Text>
            <DragDropContext onDragEnd={onDragEnd}>
              <Flex gap={3} minW="max-content" px={{ base: 2, md: 0 }}>
                {STAGES.map(({ id, label, color }) => {
                  const colDeals = dealsByStage(id);
                  const colValue = stageTotal(id);
                  return (
                    <Box
                      key={id}
                      w="240px"
                      flexShrink={0}
                      bg={colBg}
                      borderWidth={1}
                      borderColor={colBorder}
                      borderRadius="xl"
                      p={3}
                    >
                      {/* Column header */}
                      <Flex justify="space-between" align="center" mb={3}>
                        <HStack spacing={2}>
                          <Badge colorScheme={color} borderRadius="full" px={2}>
                            {colDeals.length}
                          </Badge>
                          <Text fontWeight="bold" fontSize="sm">{label}</Text>
                        </HStack>
                        {colValue > 0 && (
                          <Text fontSize="xs" color="gray.500" fontWeight="medium">
                            {fmtCurrency(colValue)}
                          </Text>
                        )}
                      </Flex>

                      {/* Cards */}
                      <Droppable droppableId={id}>
                        {(provided, snapshot) => (
                          <Stack
                            spacing={2}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            minH="80px"
                            borderRadius="md"
                            bg={snapshot.isDraggingOver ? `${color}.50` : 'transparent'}
                            transition="background 0.1s"
                            p={1}
                          >
                            {colDeals.map((deal, index) => (
                              <DealCard
                                key={deal._id}
                                deal={deal}
                                index={index}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                              />
                            ))}
                            {provided.placeholder}
                            {colDeals.length === 0 && !snapshot.isDraggingOver && (
                              <Text fontSize="xs" color="gray.400" textAlign="center" py={4}>
                                Drop here
                              </Text>
                            )}
                          </Stack>
                        )}
                      </Droppable>
                    </Box>
                  );
                })}
              </Flex>
            </DragDropContext>
          </Box>
        )}
      </Box>

      {/* ── New deal modal ── */}
      <Modal isOpen={isNewOpen} onClose={onNewClose} size={['full', 'md']} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Deal</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Deal title</FormLabel>
                <Input
                  placeholder="e.g. Enterprise contract Q3"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Customer</FormLabel>
                <Select
                  placeholder="Select customer"
                  value={form.customerId}
                  onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))}
                >
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name} — {c.email}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Stage</FormLabel>
                <Select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value as DealStage }))}>
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Value ($)</FormLabel>
                <NumberInput min={0} value={form.value} onChange={v => setForm(p => ({ ...p, value: v }))}>
                  <NumberInputField placeholder="0" />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Expected close date</FormLabel>
                <Input
                  type="date"
                  value={form.expectedCloseDate}
                  onChange={e => setForm(p => ({ ...p, expectedCloseDate: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Notes</FormLabel>
                <Textarea
                  placeholder="Any relevant context…"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  fontSize="sm"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onNewClose}>Cancel</Button>
            <Button
              colorScheme="teal" isLoading={saving}
              isDisabled={!form.title.trim() || !form.customerId}
              onClick={handleCreate}
            >
              Create Deal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Edit deal modal ── */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size={['full', 'md']} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Deal</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Deal title</FormLabel>
                <Input
                  value={editForm.title}
                  onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Stage</FormLabel>
                <Select value={editForm.stage} onChange={e => setEditForm(p => ({ ...p, stage: e.target.value as DealStage }))}>
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Value ($)</FormLabel>
                <NumberInput min={0} value={editForm.value} onChange={v => setEditForm(p => ({ ...p, value: v }))}>
                  <NumberInputField placeholder="0" />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Expected close date</FormLabel>
                <Input
                  type="date"
                  value={editForm.expectedCloseDate}
                  onChange={e => setEditForm(p => ({ ...p, expectedCloseDate: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Notes</FormLabel>
                <Textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  fontSize="sm"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onEditClose}>Cancel</Button>
            <Button
              colorScheme="teal" isLoading={saving}
              isDisabled={!editForm.title.trim()}
              onClick={handleEdit}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default Pipeline;
