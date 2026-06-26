import React, { useEffect, useState } from 'react';
import {
  Avatar, Badge, Box, Button, Checkbox, Divider, Flex, FormControl, FormLabel,
  Grid, GridItem, Heading, HStack, Icon, Input, Select, Spinner, Stack,
  Stat, StatLabel, StatNumber, StatHelpText, Tag, TagLabel, TagCloseButton,
  Text, Textarea, VStack, useColorModeValue, useToast,
} from '@chakra-ui/react';
import {
  ArrowBackIcon, CalendarIcon, WarningIcon, AddIcon, DeleteIcon,
} from '@chakra-ui/icons';
import { MdEmail, MdPhone, MdShoppingBag, MdCampaign, MdStickyNote2 } from 'react-icons/md';
import { FiTag, FiCheckSquare, FiSliders } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import CustomerService from '../services/customer.service';
import TaskService from '../services/task.service';
import CustomFieldService, { FieldDef } from '../services/custom-field.service';
import { CustomerProfile as CustomerProfileType, Order, CommunicationLog, Note, Task } from '../types/models';

// ── helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(d: Date | string): string {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_ORDER_COLOR: Record<string, string> = {
  completed: 'green', pending: 'yellow', cancelled: 'red',
};
const STATUS_COMMS_COLOR: Record<string, string> = {
  sent: 'green', failed: 'red', pending: 'yellow',
};

function HealthBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    active:  { label: 'Active',  color: 'green' },
    at_risk: { label: 'At Risk', color: 'orange' },
    dormant: { label: 'Dormant', color: 'red' },
  };
  const { label, color } = map[status] ?? { label: status, color: 'gray' };
  return <Badge colorScheme={color} fontSize="sm" px={3} py={1} borderRadius="full">{label}</Badge>;
}

// ── sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, helpText }: { label: string; value: string; helpText?: string }) {
  const bg = useColorModeValue('white', 'gray.700');
  return (
    <Box bg={bg} borderWidth={1} borderRadius="lg" p={4} shadow="sm">
      <Stat>
        <StatLabel color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wider">{label}</StatLabel>
        <StatNumber fontSize="2xl" fontWeight="bold">{value}</StatNumber>
        {helpText && <StatHelpText mb={0}>{helpText}</StatHelpText>}
      </Stat>
    </Box>
  );
}

// ── Activity Timeline ─────────────────────────────────────────────────────────

type TimelineEvent =
  | { kind: 'order'; date: Date; data: Order }
  | { kind: 'comms'; date: Date; data: CommunicationLog }
  | { kind: 'note';  date: Date; data: Note };

function TimelineItem({ event, onDeleteNote }: { event: TimelineEvent; onDeleteNote?: (id: string) => void }) {
  const bg = useColorModeValue('white', 'gray.700');
  const muted = useColorModeValue('gray.500', 'gray.400');

  if (event.kind === 'order') {
    const o = event.data;
    return (
      <Flex gap={3} align="flex-start">
        <Flex w={8} h={8} borderRadius="full" bg="teal.50" color="teal.500" align="center" justify="center" flexShrink={0} mt={1}>
          <Icon as={MdShoppingBag} boxSize={4} />
        </Flex>
        <Box flex={1} bg={bg} borderWidth={1} borderRadius="md" p={3} shadow="sm">
          <Flex justify="space-between" align="center" mb={1}>
            <Text fontWeight="semibold" fontSize="sm">Order — {fmtCurrency(o.amount)}</Text>
            <Badge colorScheme={STATUS_ORDER_COLOR[o.status] ?? 'gray'} fontSize="xs">{o.status}</Badge>
          </Flex>
          <Text fontSize="xs" color={muted}>{o.products.map(p => `${p.name} ×${p.quantity}`).join(', ')}</Text>
          <Text fontSize="xs" color={muted} mt={1}>{fmtDateTime(o.orderDate)}</Text>
        </Box>
      </Flex>
    );
  }

  if (event.kind === 'comms') {
    const c = event.data;
    const campaign = typeof c.campaign === 'object' ? c.campaign : null;
    return (
      <Flex gap={3} align="flex-start">
        <Flex w={8} h={8} borderRadius="full" bg="purple.50" color="purple.500" align="center" justify="center" flexShrink={0} mt={1}>
          <Icon as={MdCampaign} boxSize={4} />
        </Flex>
        <Box flex={1} bg={bg} borderWidth={1} borderRadius="md" p={3} shadow="sm">
          <Flex justify="space-between" align="center" mb={1}>
            <Text fontWeight="semibold" fontSize="sm">{campaign ? campaign.name : 'Campaign email'}</Text>
            <Badge colorScheme={STATUS_COMMS_COLOR[c.status] ?? 'gray'} fontSize="xs">{c.status}</Badge>
          </Flex>
          <Text fontSize="xs" color={muted} noOfLines={2}>{c.message}</Text>
          {c.failureReason && (
            <HStack color="red.400" fontSize="xs" mt={1}>
              <Icon as={WarningIcon} />
              <Text>{c.failureReason}</Text>
            </HStack>
          )}
          <Text fontSize="xs" color={muted} mt={1}>{fmtDateTime(c.sentAt)}</Text>
        </Box>
      </Flex>
    );
  }

  // note
  const n = event.data;
  return (
    <Flex gap={3} align="flex-start">
      <Flex w={8} h={8} borderRadius="full" bg="yellow.50" color="yellow.600" align="center" justify="center" flexShrink={0} mt={1}>
        <Icon as={MdStickyNote2} boxSize={4} />
      </Flex>
      <Box flex={1} bg={bg} borderWidth={1} borderRadius="md" p={3} shadow="sm">
        <Flex justify="space-between" align="flex-start">
          <Text fontSize="sm" flex={1} mr={2} whiteSpace="pre-wrap">{n.content}</Text>
          {onDeleteNote && (
            <Button size="xs" variant="ghost" colorScheme="red" onClick={() => onDeleteNote(n._id)} aria-label="Delete note" flexShrink={0}>
              <Icon as={DeleteIcon} />
            </Button>
          )}
        </Flex>
        <Text fontSize="xs" color={muted} mt={2}>{fmtDateTime(n.createdAt)}</Text>
      </Box>
    </Flex>
  );
}

// ── Tags Section ─────────────────────────────────────────────────────────────

function TagsPanel({ customerId, initialTags }: { customerId: string; initialTags: string[] }) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const addTag = async () => {
    const t = input.trim().toLowerCase();
    if (!t || tags.includes(t)) { setInput(''); return; }
    const next = [...tags, t];
    setSaving(true);
    try {
      await CustomerService.updateTags(customerId, next);
      setTags(next);
    } catch {
      toast({ title: 'Failed to save tag', status: 'error', duration: 2000 });
    } finally { setSaving(false); setInput(''); }
  };

  const removeTag = async (tag: string) => {
    const next = tags.filter(t => t !== tag);
    setSaving(true);
    try {
      await CustomerService.updateTags(customerId, next);
      setTags(next);
    } catch {
      toast({ title: 'Failed to remove tag', status: 'error', duration: 2000 });
    } finally { setSaving(false); }
  };

  return (
    <Box>
      <HStack mb={3} spacing={2}>
        <Icon as={FiTag} color="teal.500" />
        <Heading size="sm">Tags</Heading>
      </HStack>
      <Flex flexWrap="wrap" gap={2} mb={3}>
        {tags.length === 0 && <Text fontSize="sm" color="gray.400">No tags yet</Text>}
        {tags.map(tag => (
          <Tag key={tag} colorScheme="teal" borderRadius="full" size="md">
            <TagLabel>{tag}</TagLabel>
            <TagCloseButton onClick={() => removeTag(tag)} isDisabled={saving} />
          </Tag>
        ))}
      </Flex>
      <HStack>
        <Input
          size="sm"
          placeholder="Add tag (e.g. vip, enterprise)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTag()}
          maxW="220px"
        />
        <Button size="sm" colorScheme="teal" leftIcon={<AddIcon />} onClick={addTag} isLoading={saving} isDisabled={!input.trim()}>
          Add
        </Button>
      </HStack>
    </Box>
  );
}

// ── Notes Panel ───────────────────────────────────────────────────────────────

function NotesPanel({ customerId, initialNotes, onNoteAdded, onNoteDeleted }: {
  customerId: string;
  initialNotes: Note[];
  onNoteAdded: (note: Note) => void;
  onNoteDeleted: (id: string) => void;
}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const noteBg = useColorModeValue('white', 'gray.700');

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const note = await CustomerService.addNote(customerId, text.trim());
      onNoteAdded(note);
      setText('');
    } catch {
      toast({ title: 'Failed to save note', status: 'error', duration: 2000 });
    } finally { setSaving(false); }
  };

  return (
    <Box>
      <HStack mb={3} spacing={2}>
        <Icon as={MdStickyNote2} color="yellow.500" />
        <Heading size="sm">Notes ({initialNotes.length})</Heading>
      </HStack>
      <VStack align="stretch" spacing={2} mb={4} maxH="300px" overflowY="auto">
        {initialNotes.length === 0 && <Text fontSize="sm" color="gray.400">No notes yet</Text>}
        {[...initialNotes].reverse().map(note => (
          <Box key={note._id} p={3} borderWidth={1} borderRadius="md" bg={noteBg}>
            <Flex justify="space-between" align="flex-start">
              <Text fontSize="sm" flex={1} mr={2} whiteSpace="pre-wrap">{note.content}</Text>
              <Button size="xs" variant="ghost" colorScheme="red" onClick={() => onNoteDeleted(note._id)} aria-label="Delete note" flexShrink={0}>
                <Icon as={DeleteIcon} />
              </Button>
            </Flex>
            <Text fontSize="xs" color="gray.400" mt={2}>{fmtDateTime(note.createdAt)}</Text>
          </Box>
        ))}
      </VStack>
      <Textarea
        placeholder="Add a note — meeting recap, preferences, follow-up context…"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        fontSize="sm"
        mb={2}
        maxLength={2000}
      />
      <Flex justify="space-between" align="center">
        <Text fontSize="xs" color="gray.400">{text.length}/2000</Text>
        <Button size="sm" colorScheme="yellow" onClick={handleAdd} isLoading={saving} isDisabled={!text.trim()}>
          Save Note
        </Button>
      </Flex>
    </Box>
  );
}

// ── Tasks Panel ───────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = { high: 'red', medium: 'orange', low: 'gray' };

function TasksPanel({ customerId }: { customerId: string }) {
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle]     = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [saving, setSaving]   = useState(false);
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.700');
  const muted = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    TaskService.getTasksForCustomer(customerId)
      .then(setTasks)
      .catch(() => toast({ title: 'Could not load tasks', status: 'error', duration: 2000 }))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const task = await TaskService.createTask(customerId, {
        title: title.trim(),
        dueDate: dueDate || null,
        priority,
      });
      setTasks(prev => [task, ...prev]);
      setTitle(''); setDueDate(''); setPriority('medium');
    } catch {
      toast({ title: 'Failed to create task', status: 'error', duration: 2000 });
    } finally { setSaving(false); }
  };

  const toggleComplete = async (task: Task) => {
    try {
      const updated = await TaskService.updateTask(task._id, { completed: !task.completed });
      setTasks(prev => prev.map(t => t._id === task._id ? updated : t));
    } catch {
      toast({ title: 'Failed to update task', status: 'error', duration: 2000 });
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await TaskService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch {
      toast({ title: 'Failed to delete task', status: 'error', duration: 2000 });
    }
  };

  const pending   = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  return (
    <Box>
      <HStack mb={3} spacing={2}>
        <Icon as={FiCheckSquare} color="blue.500" />
        <Heading size="sm">Tasks & Reminders ({pending.length} open)</Heading>
      </HStack>

      {/* Add task form */}
      <VStack align="stretch" spacing={2} mb={4} p={3} borderWidth={1} borderRadius="md" bg={bg}>
        <Input
          size="sm"
          placeholder="Task title (e.g. Follow up on proposal)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <HStack>
          <Input
            size="sm"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            flex={1}
            placeholder="Due date"
          />
          <Select size="sm" value={priority} onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high')} w="110px">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Button size="sm" colorScheme="blue" leftIcon={<AddIcon />} onClick={handleAdd} isLoading={saving} isDisabled={!title.trim()}>
            Add
          </Button>
        </HStack>
      </VStack>

      {loading && <Spinner size="sm" />}

      {/* Pending tasks */}
      <VStack align="stretch" spacing={2} mb={3}>
        {pending.length === 0 && !loading && (
          <Text fontSize="sm" color={muted}>No open tasks — add one above</Text>
        )}
        {pending.map(task => (
          <Flex key={task._id} align="center" gap={2} p={2} borderWidth={1} borderRadius="md" bg={bg}>
            <Checkbox isChecked={false} onChange={() => toggleComplete(task)} colorScheme="blue" flexShrink={0} />
            <Box flex={1} minW={0}>
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{task.title}</Text>
              {task.dueDate && (
                <Text fontSize="xs" color={new Date(task.dueDate) < new Date() ? 'red.400' : muted}>
                  Due {fmtDate(task.dueDate)}
                </Text>
              )}
            </Box>
            <Badge colorScheme={PRIORITY_COLOR[task.priority]} fontSize="xs" flexShrink={0}>{task.priority}</Badge>
            <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(task._id)} aria-label="Delete task" flexShrink={0}>
              <Icon as={DeleteIcon} />
            </Button>
          </Flex>
        ))}
      </VStack>

      {/* Completed tasks (collapsed by default) */}
      {completed.length > 0 && (
        <Box>
          <Text fontSize="xs" color={muted} mb={2} fontWeight="medium">Completed ({completed.length})</Text>
          <VStack align="stretch" spacing={1}>
            {completed.slice(0, 5).map(task => (
              <Flex key={task._id} align="center" gap={2} p={2} borderRadius="md" opacity={0.6}>
                <Checkbox isChecked onChange={() => toggleComplete(task)} colorScheme="blue" flexShrink={0} />
                <Text fontSize="sm" textDecoration="line-through" flex={1} noOfLines={1}>{task.title}</Text>
                <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDelete(task._id)} aria-label="Delete task" flexShrink={0}>
                  <Icon as={DeleteIcon} />
                </Button>
              </Flex>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
}

// ── Custom Fields Panel ───────────────────────────────────────────────────────

function CustomFieldsPanel({ customerId, initialValues }: {
  customerId: string;
  initialValues: Record<string, unknown>;
}) {
  const [defs, setDefs]           = useState<FieldDef[]>([]);
  const [values, setValues]       = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(initialValues).map(([k, v]) => [k, String(v ?? '')]))
  );
  const [newName, setNewName]     = useState('');
  const [newType, setNewType]     = useState<FieldDef['fieldType']>('text');
  const [saving, setSaving]       = useState(false);
  const [addingDef, setAddingDef] = useState(false);
  const [dirty, setDirty]         = useState(false);
  const toast  = useToast();
  const bg     = useColorModeValue('white', 'gray.700');
  const muted  = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    CustomFieldService.getFieldDefs().then(setDefs)
      .catch(() => toast({ title: 'Could not load custom fields', status: 'error', duration: 2000 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await CustomFieldService.setCustomerFields(customerId, values);
      setDirty(false);
      toast({ title: 'Custom fields saved', status: 'success', duration: 2000 });
    } catch {
      toast({ title: 'Failed to save', status: 'error', duration: 2000 });
    } finally { setSaving(false); }
  };

  const handleAddDef = async () => {
    if (!newName.trim()) return;
    setAddingDef(true);
    try {
      const def = await CustomFieldService.createFieldDef(newName.trim(), newType);
      setDefs(prev => [...prev, def]);
      setNewName(''); setNewType('text');
    } catch {
      toast({ title: 'Failed to create field', status: 'error', duration: 2000 });
    } finally { setAddingDef(false); }
  };

  const handleDeleteDef = async (def: FieldDef) => {
    try {
      await CustomFieldService.deleteFieldDef(def._id);
      setDefs(prev => prev.filter(d => d._id !== def._id));
      setValues(prev => { const next = { ...prev }; delete next[def.key]; return next; });
    } catch {
      toast({ title: 'Failed to delete field', status: 'error', duration: 2000 });
    }
  };

  return (
    <Box>
      <HStack mb={3} spacing={2}>
        <Icon as={FiSliders} color="purple.500" />
        <Heading size="sm">Custom Fields</Heading>
      </HStack>

      {defs.length === 0 && (
        <Text fontSize="sm" color={muted} mb={3}>No custom fields yet — add one below</Text>
      )}

      <VStack align="stretch" spacing={3} mb={4}>
        {defs.map(def => (
          <FormControl key={def._id}>
            <FormLabel fontSize="xs" color={muted} mb={1} display="flex" justifyContent="space-between">
              <span>{def.name}</span>
              <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleDeleteDef(def)}>
                <Icon as={DeleteIcon} />
              </Button>
            </FormLabel>
            {def.fieldType === 'boolean' ? (
              <Select
                size="sm" bg={bg}
                value={values[def.key] ?? ''}
                onChange={e => handleChange(def.key, e.target.value)}
              >
                <option value="">—</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            ) : (
              <Input
                size="sm" bg={bg}
                type={def.fieldType === 'number' ? 'number' : def.fieldType === 'date' ? 'date' : 'text'}
                value={values[def.key] ?? ''}
                onChange={e => handleChange(def.key, e.target.value)}
                placeholder={`Enter ${def.name.toLowerCase()}`}
              />
            )}
          </FormControl>
        ))}
      </VStack>

      {dirty && (
        <Button size="sm" colorScheme="purple" mb={4} onClick={handleSave} isLoading={saving} w="full">
          Save Changes
        </Button>
      )}

      {/* Add new field definition */}
      <Box p={3} borderWidth={1} borderRadius="md" bg={bg}>
        <Text fontSize="xs" fontWeight="semibold" color={muted} mb={2}>Add custom field</Text>
        <HStack spacing={2}>
          <Input
            size="sm" placeholder="Field name"
            value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddDef()}
            flex={1}
          />
          <Select size="sm" value={newType} onChange={e => setNewType(e.target.value as FieldDef['fieldType'])} w="100px">
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">Yes/No</option>
          </Select>
          <Button size="sm" colorScheme="purple" leftIcon={<AddIcon />} onClick={handleAddDef} isLoading={addingDef} isDisabled={!newName.trim()}>
            Add
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CustomerProfileType | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const headerBg = useColorModeValue('white', 'gray.700');
  const toast = useToast();

  useEffect(() => {
    if (!id) return;
    CustomerService.getCustomerProfile(id)
      .then(d => {
        setData(d);
        setNotes(d.customer.notes ?? []);
      })
      .catch(() => setError('Could not load customer profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleNoteAdded = (note: Note) => setNotes(prev => [...prev, note]);

  const handleNoteDeleted = async (noteId: string) => {
    if (!id) return;
    try {
      await CustomerService.deleteNote(id, noteId);
      setNotes(prev => prev.filter(n => n._id !== noteId));
    } catch {
      toast({ title: 'Failed to delete note', status: 'error', duration: 2000 });
    }
  };

  // Build unified activity timeline
  const timeline: TimelineEvent[] = data
    ? [
        ...data.orders.map(o => ({ kind: 'order' as const, date: new Date(o.orderDate), data: o })),
        ...data.communicationLogs.map(c => ({ kind: 'comms' as const, date: new Date(c.sentAt), data: c })),
        ...notes.map(n => ({ kind: 'note' as const, date: new Date(n.createdAt), data: n })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime())
    : [];

  return (
    <Layout>
      <Box p={[3, 5, 8]} maxW="1100px" mx="auto">
        <Button leftIcon={<ArrowBackIcon />} variant="ghost" size="sm" mb={6} onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>

        {loading && <Flex justify="center" align="center" h="60vh"><Spinner size="xl" color="teal.400" /></Flex>}
        {error && <Flex justify="center" align="center" h="60vh"><Text color="red.400">{error}</Text></Flex>}

        {data && (() => {
          const { customer, stats } = data;
          return (
            <Stack spacing={8}>
              {/* ── HEADER CARD ── */}
              <Box bg={headerBg} borderWidth={1} borderRadius="xl" p={6} shadow="sm">
                <Flex gap={5} align="flex-start" direction={['column', 'row']}>
                  <Avatar name={customer.name} size="xl" bg="teal.400" color="white" getInitials={initials} flexShrink={0} />
                  <Box flex={1}>
                    <Flex align="center" gap={3} wrap="wrap" mb={2}>
                      <Heading size="lg">{customer.name}</Heading>
                      <HealthBadge status={stats.healthStatus} />
                    </Flex>
                    <Stack spacing={1} mb={3}>
                      <HStack color="gray.500" fontSize="sm">
                        <Icon as={MdEmail} /><Text>{customer.email}</Text>
                      </HStack>
                      {customer.phone && (
                        <HStack color="gray.500" fontSize="sm">
                          <Icon as={MdPhone} /><Text>{customer.phone}</Text>
                        </HStack>
                      )}
                      <HStack color="gray.400" fontSize="sm">
                        <Icon as={CalendarIcon} />
                        <Text>Customer since {fmtDate(customer.createdAt)}</Text>
                        <Text>·</Text>
                        <Text>Last active {fmtDate(customer.lastActivity)}</Text>
                      </HStack>
                    </Stack>
                    {/* Tags inline on header */}
                    <TagsPanel customerId={customer._id} initialTags={customer.tags ?? []} />
                  </Box>
                </Flex>
              </Box>

              {/* ── STATS ROW ── */}
              <Grid templateColumns={['repeat(2, 1fr)', 'repeat(2, 1fr)', 'repeat(4, 1fr)']} gap={4}>
                <StatCard label="Lifetime Value" value={fmtCurrency(customer.totalSpend)} helpText={`avg ${fmtCurrency(stats.avgOrderValue)} / order`} />
                <StatCard label="Total Orders" value={String(stats.orderCount)} helpText={stats.orderCount === 0 ? 'No orders yet' : undefined} />
                <StatCard label="Total Visits" value={String(customer.visits)} />
                <StatCard label="Days Since Active" value={String(stats.daysSinceLastActivity)}
                  helpText={stats.daysSinceLastActivity <= 7 ? 'Recently active' : stats.daysSinceLastActivity <= 30 ? 'Moderately active' : 'Needs re-engagement'} />
              </Grid>

              {/* ── NOTES / TASKS + TIMELINE ── */}
              <Grid templateColumns={['1fr', '1fr', '1fr 1.4fr']} gap={8} alignItems="start">

                {/* Left column: Notes + Tasks */}
                <GridItem>
                  <Stack spacing={5}>
                    <Box borderWidth={1} borderRadius="xl" p={5} bg={headerBg} shadow="sm">
                      <NotesPanel
                        customerId={customer._id}
                        initialNotes={notes}
                        onNoteAdded={handleNoteAdded}
                        onNoteDeleted={handleNoteDeleted}
                      />
                    </Box>
                    <Box borderWidth={1} borderRadius="xl" p={5} bg={headerBg} shadow="sm">
                      <TasksPanel customerId={customer._id} />
                    </Box>
                    <Box borderWidth={1} borderRadius="xl" p={5} bg={headerBg} shadow="sm">
                      <CustomFieldsPanel
                        customerId={customer._id}
                        initialValues={customer.customFields ?? {}}
                      />
                    </Box>
                  </Stack>
                </GridItem>

                {/* Activity Timeline */}
                <GridItem>
                  <Flex align="center" justify="space-between" mb={4}>
                    <Heading size="md">Activity Timeline</Heading>
                    <Text fontSize="xs" color="gray.400">{timeline.length} events</Text>
                  </Flex>
                  <Divider mb={4} />
                  {timeline.length === 0 ? (
                    <Box borderWidth={1} borderRadius="lg" borderStyle="dashed" p={8} textAlign="center" color="gray.400">
                      <Text>No activity yet</Text>
                    </Box>
                  ) : (
                    <Stack spacing={3}>
                      {timeline.map((event, i) => (
                        <TimelineItem
                          key={`${event.kind}-${i}`}
                          event={event}
                          onDeleteNote={event.kind === 'note' ? handleNoteDeleted : undefined}
                        />
                      ))}
                    </Stack>
                  )}
                </GridItem>
              </Grid>
            </Stack>
          );
        })()}
      </Box>
    </Layout>
  );
};

export default CustomerProfile;
