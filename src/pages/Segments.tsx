import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge, Box, Button, Divider, Drawer, DrawerBody, DrawerCloseButton,
  DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay,
  Flex, FormControl, FormLabel, Grid, Heading, HStack, Icon,
  IconButton, Input, Select, Spinner, Stack, Tag,
  TagLabel, Text, Textarea, Tooltip, useDisclosure, useToast, VStack,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, SmallAddIcon } from '@chakra-ui/icons';
import { FiFilter, FiUsers, FiZap } from 'react-icons/fi';
import { MdOutlineBookmark, MdOutlineBookmarkBorder } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SegmentService from '../services/segment.service';
import { CampaignRules, RuleCondition, Segment, SegmentPreview } from '../types/models';

// ── constants ─────────────────────────────────────────────────────────────────

const FIELDS = [
  { value: 'totalSpend', label: 'Total Spend ($)' },
  { value: 'visits',     label: 'Visit Count' },
  { value: 'lastActivity', label: 'Days Since Last Activity' },
  { value: 'name',       label: 'Customer Name' },
  { value: 'email',      label: 'Email' },
];

const OPERATORS: Record<string, { value: string; label: string }[]> = {
  totalSpend:   [{ value: '>', label: '>' }, { value: '<', label: '<' }, { value: '>=', label: '>=' }, { value: '<=', label: '<=' }, { value: '=', label: '=' }],
  visits:       [{ value: '>', label: '>' }, { value: '<', label: '<' }, { value: '>=', label: '>=' }, { value: '<=', label: '<=' }, { value: '=', label: '=' }],
  lastActivity: [{ value: '>', label: 'more than (days)' }, { value: '<', label: 'less than (days)' }, { value: '>=', label: '>=' }, { value: '<=', label: '<=' }],
  name:         [{ value: 'contains', label: 'contains' }, { value: '=', label: 'is exactly' }],
  email:        [{ value: 'contains', label: 'contains' }, { value: '=', label: 'is exactly' }],
};

const PRESETS: { name: string; description: string; color: string; rules: CampaignRules }[] = [
  {
    name: 'High Value',
    description: 'Customers who spent over $1,000',
    color: 'yellow',
    rules: { condition: 'AND', conditions: [{ field: 'totalSpend', operator: '>', value: 1000 }] },
  },
  {
    name: 'Dormant Users',
    description: 'No activity in over 60 days',
    color: 'red',
    rules: { condition: 'AND', conditions: [{ field: 'lastActivity', operator: '<', value: 60 }] },
  },
  {
    name: 'Frequent Buyers',
    description: '5 or more visits',
    color: 'green',
    rules: { condition: 'AND', conditions: [{ field: 'visits', operator: '>=', value: 5 }] },
  },
  {
    name: 'At Risk',
    description: 'Spent over $200 but inactive 30+ days',
    color: 'orange',
    rules: { condition: 'AND', conditions: [{ field: 'totalSpend', operator: '>', value: 200 }, { field: 'lastActivity', operator: '<', value: 30 }] },
  },
  {
    name: 'New Customers',
    description: 'Only 1 visit so far',
    color: 'blue',
    rules: { condition: 'AND', conditions: [{ field: 'visits', operator: '<=', value: 1 }] },
  },
];

const EMPTY_CONDITION = (): RuleCondition => ({ field: 'totalSpend', operator: '>', value: '' });

// ── ConditionRow ──────────────────────────────────────────────────────────────

function ConditionRow({
  condition, index, onChange, onRemove, canRemove,
}: {
  condition: RuleCondition;
  index: number;
  onChange: (i: number, c: RuleCondition) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}) {
  const ops = OPERATORS[condition.field] ?? OPERATORS['totalSpend'];
  return (
    <HStack spacing={2} align="center" flexWrap="wrap">
      <Select
        size="sm" value={condition.field} w="160px"
        onChange={e => onChange(index, { ...condition, field: e.target.value, operator: ((OPERATORS[e.target.value] ?? [])[0]?.value ?? '>') as RuleCondition['operator'], value: '' })}
      >
        {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </Select>
      <Select
        size="sm" value={condition.operator} w="130px"
        onChange={e => onChange(index, { ...condition, operator: e.target.value as any })}
      >
        {ops.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <Input
        size="sm" w="100px" placeholder="value"
        value={String(condition.value)}
        onChange={e => onChange(index, { ...condition, value: e.target.value })}
      />
      {canRemove && (
        <IconButton aria-label="Remove condition" icon={<DeleteIcon />} size="sm" variant="ghost" colorScheme="red" onClick={() => onRemove(index)} />
      )}
    </HStack>
  );
}

// ── PreviewPanel ──────────────────────────────────────────────────────────────

function PreviewPanel({ preview, loading }: { preview: SegmentPreview | null; loading: boolean }) {
  if (loading) return <Flex justify="center" py={4}><Spinner size="sm" color="teal.400" /></Flex>;
  if (!preview) return null;
  return (
    <Box bg="teal.50" borderRadius="md" p={4} borderWidth={1} borderColor="teal.100">
      <Flex align="center" gap={3}>
        <Icon as={FiUsers} color="teal.500" boxSize={5} />
        <Text fontWeight="bold" fontSize="xl" color="teal.700">{preview.count}</Text>
        <Text color="teal.600" fontSize="sm">customers match</Text>
        {preview.excludedCount > 0 && (
          <Badge colorScheme="orange" ml="auto">{preview.excludedCount} excluded</Badge>
        )}
      </Flex>
      {preview.samples.length > 0 && (
        <HStack mt={3} spacing={2} flexWrap="wrap">
          <Text fontSize="xs" color="gray.500">e.g.</Text>
          {preview.samples.map(s => (
            <Tag key={s._id} size="sm" colorScheme="teal" borderRadius="full">
              <TagLabel>{s.name}</TagLabel>
            </Tag>
          ))}
        </HStack>
      )}
      {preview.count === 0 && (
        <Text fontSize="sm" color="orange.500" mt={2}>No customers match these rules. Try adjusting the conditions.</Text>
      )}
    </Box>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

const Segments: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [segments, setSegments] = useState<Segment[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Drawer state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [combinator, setCombinator] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<RuleCondition[]>([EMPTY_CONDITION()]);
  const [exclusions, setExclusions] = useState<RuleCondition[]>([]);
  const [showExclusions, setShowExclusions] = useState(false);
  const [preview, setPreview] = useState<SegmentPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── fetch saved segments ──
  const fetchSegments = useCallback(async () => {
    setLoadingList(true);
    try {
      setSegments(await SegmentService.getSegments());
    } catch {
      toast({ title: 'Could not load segments', status: 'error', duration: 3000 });
    } finally {
      setLoadingList(false);
    }
  }, [toast]);

  useEffect(() => { fetchSegments(); }, [fetchSegments]);

  // ── live preview with debounce ──
  const triggerPreview = useCallback((rules: CampaignRules, excl: RuleCondition[]) => {
    if (rules.conditions.length === 0) { setPreview(null); return; }
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        setPreview(await SegmentService.preview(rules, excl));
      } finally {
        setPreviewLoading(false);
      }
    }, 500);
  }, []);

  const currentRules: CampaignRules = { condition: combinator, conditions };

  const handleConditionChange = (i: number, c: RuleCondition) => {
    const next = conditions.map((x, idx) => (idx === i ? c : x));
    setConditions(next);
    triggerPreview({ condition: combinator, conditions: next }, exclusions);
  };
  const handleExclusionChange = (i: number, c: RuleCondition) => {
    const next = exclusions.map((x, idx) => (idx === i ? c : x));
    setExclusions(next);
    triggerPreview(currentRules, next);
  };
  const handleCombinatorChange = (v: 'AND' | 'OR') => {
    setCombinator(v);
    triggerPreview({ condition: v, conditions }, exclusions);
  };

  // ── drawer open helpers ──
  const openBlank = () => {
    setName(''); setDescription(''); setCombinator('AND');
    setConditions([EMPTY_CONDITION()]); setExclusions([]);
    setShowExclusions(false); setPreview(null);
    onOpen();
  };
  const openPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name); setDescription(preset.description);
    setCombinator(preset.rules.condition);
    setConditions([...preset.rules.conditions]);
    setExclusions([]); setShowExclusions(false);
    triggerPreview(preset.rules, []);
    onOpen();
  };

  // ── save ──
  const handleSave = async () => {
    if (!name.trim()) { toast({ title: 'Name is required', status: 'warning', duration: 2000 }); return; }
    if (conditions.length === 0) { toast({ title: 'Add at least one condition', status: 'warning', duration: 2000 }); return; }
    setSaving(true);
    try {
      const seg = await SegmentService.createSegment({ name, description, rules: currentRules, exclusions });
      setSegments(prev => [seg, ...prev]);
      toast({ title: `"${seg.name}" saved`, status: 'success', duration: 3000 });
      onClose();
    } catch {
      toast({ title: 'Failed to save segment', status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  // ── delete ──
  const handleDelete = async (id: string, segName: string) => {
    if (!window.confirm(`Delete segment "${segName}"?`)) return;
    try {
      await SegmentService.deleteSegment(id);
      setSegments(prev => prev.filter(s => s._id !== id));
      toast({ title: 'Segment deleted', status: 'info', duration: 2000 });
    } catch {
      toast({ title: 'Delete failed', status: 'error', duration: 2000 });
    }
  };

  // ── use in campaign ──
  const goToCampaignWithSegment = (segment: Segment) => {
    navigate('/campaigns/create', { state: { segmentRules: segment.rules, segmentName: segment.name } });
  };

  const ruleSummary = (seg: Segment) => {
    const parts = seg.rules.conditions.map(c => `${c.field} ${c.operator} ${c.value}`);
    const str = parts.join(` ${seg.rules.condition} `);
    return str.length > 60 ? str.slice(0, 57) + '…' : str;
  };

  return (
    <Layout>
      <Box p={[3, 5, 8]} maxW="1100px" mx="auto">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <Heading size="lg">Segments</Heading>
            <Text color="gray.500" fontSize="sm" mt={1}>Save reusable audience filters to target the right customers every time</Text>
          </Box>
          <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={openBlank}>New Segment</Button>
        </Flex>

        {/* Preset templates */}
        <Box mb={10}>
          <Flex align="center" gap={2} mb={4}>
            <Icon as={FiZap} color="yellow.400" />
            <Heading size="sm" color="gray.600">Quick-Start Templates</Heading>
          </Flex>
          <Grid templateColumns={['repeat(2,1fr)', 'repeat(3,1fr)', 'repeat(5,1fr)']} gap={3}>
            {PRESETS.map(p => (
              <Box
                key={p.name}
                borderWidth={1} borderRadius="lg" p={4} cursor="pointer"
                _hover={{ shadow: 'md', borderColor: `${p.color}.300`, bg: `${p.color}.50` }}
                transition="all 0.15s"
                onClick={() => openPreset(p)}
              >
                <Badge colorScheme={p.color} mb={2}>{p.name}</Badge>
                <Text fontSize="xs" color="gray.500" lineHeight="1.4">{p.description}</Text>
                <Text fontSize="xs" color={`${p.color}.500`} mt={2} fontWeight="semibold">Use template →</Text>
              </Box>
            ))}
          </Grid>
        </Box>

        <Divider mb={8} />

        {/* Saved segments */}
        <Box>
          <Flex align="center" gap={2} mb={4}>
            <Icon as={MdOutlineBookmark} color="teal.400" boxSize={5} />
            <Heading size="sm" color="gray.600">Saved Segments</Heading>
            <Badge colorScheme="teal" ml={1}>{segments.length}</Badge>
          </Flex>

          {loadingList ? (
            <Flex justify="center" py={12}><Spinner color="teal.400" /></Flex>
          ) : segments.length === 0 ? (
            <Box borderWidth={1} borderRadius="xl" borderStyle="dashed" p={12} textAlign="center" color="gray.400">
              <Icon as={MdOutlineBookmarkBorder} boxSize={10} mb={3} />
              <Text>No saved segments yet. Use a template or create one from scratch.</Text>
            </Box>
          ) : (
            <Stack spacing={3}>
              {segments.map(seg => (
                <Box key={seg._id} borderWidth={1} borderRadius="lg" p={4} bg="white" _hover={{ shadow: 'sm' }} transition="box-shadow 0.15s">
                  <Flex justify="space-between" align="flex-start" gap={3} flexWrap="wrap">
                    <Box flex={1} minW="0">
                      <Flex align="center" gap={2} mb={1}>
                        <Text fontWeight="semibold">{seg.name}</Text>
                        <Badge colorScheme="gray" size="sm">{seg.rules.condition}</Badge>
                        {seg.exclusions?.length > 0 && <Badge colorScheme="orange" size="sm">{seg.exclusions.length} excluded</Badge>}
                      </Flex>
                      {seg.description && <Text fontSize="sm" color="gray.500" mb={1}>{seg.description}</Text>}
                      <Text fontSize="xs" color="gray.400" fontFamily="mono" noOfLines={1}>{ruleSummary(seg)}</Text>
                    </Box>
                    <HStack spacing={2} flexShrink={0}>
                      <Button size="sm" colorScheme="teal" variant="outline" leftIcon={<Icon as={FiFilter} />} onClick={() => goToCampaignWithSegment(seg)}>
                        Use in Campaign
                      </Button>
                      <Tooltip label="Delete segment">
                        <IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDelete(seg._id, seg.name)} />
                      </Tooltip>
                    </HStack>
                  </Flex>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Box>

      {/* ── New Segment Drawer ── */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth={1}>
            <Flex align="center" gap={2}>
              <Icon as={FiFilter} color="teal.400" />
              New Segment
            </Flex>
          </DrawerHeader>

          <DrawerBody overflowY="auto" py={5}>
            <VStack spacing={6} align="stretch">
              {/* Name + description */}
              <FormControl isRequired>
                <FormLabel fontSize="sm">Segment Name</FormLabel>
                <Input placeholder="e.g. High Value Customers" value={name} onChange={e => setName(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Description</FormLabel>
                <Textarea placeholder="Optional note about this segment" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
              </FormControl>

              <Divider />

              {/* Include rules */}
              <Box>
                <Flex justify="space-between" align="center" mb={3}>
                  <Text fontWeight="semibold" fontSize="sm">Include customers where</Text>
                  <HStack spacing={1}>
                    {(['AND', 'OR'] as const).map(v => (
                      <Button key={v} size="xs" colorScheme={combinator === v ? 'teal' : 'gray'} variant={combinator === v ? 'solid' : 'outline'} onClick={() => handleCombinatorChange(v)}>{v}</Button>
                    ))}
                  </HStack>
                </Flex>

                <VStack spacing={2} align="stretch">
                  {conditions.map((c, i) => (
                    <ConditionRow key={i} condition={c} index={i} onChange={handleConditionChange} onRemove={idx => { const next = conditions.filter((_, j) => j !== idx); setConditions(next); triggerPreview({ condition: combinator, conditions: next }, exclusions); }} canRemove={conditions.length > 1} />
                  ))}
                </VStack>
                <Button size="sm" leftIcon={<SmallAddIcon />} variant="ghost" colorScheme="teal" mt={2} onClick={() => setConditions(prev => [...prev, EMPTY_CONDITION()])}>Add condition</Button>
              </Box>

              {/* Exclusion rules */}
              <Box>
                <Button size="sm" variant="ghost" colorScheme="orange" leftIcon={showExclusions ? <DeleteIcon /> : <SmallAddIcon />} onClick={() => { setShowExclusions(v => !v); if (showExclusions) { setExclusions([]); triggerPreview(currentRules, []); } }}>
                  {showExclusions ? 'Remove exclusion rules' : 'Add exclusion rules'}
                </Button>
                {showExclusions && (
                  <Box mt={3} pl={2} borderLeftWidth={2} borderColor="orange.200">
                    <Text fontSize="xs" color="orange.500" mb={2}>Exclude customers where ANY of these match:</Text>
                    <VStack spacing={2} align="stretch">
                      {exclusions.length === 0 && (
                        <Button size="sm" leftIcon={<SmallAddIcon />} variant="ghost" colorScheme="orange" onClick={() => setExclusions([EMPTY_CONDITION()])}>Add exclusion condition</Button>
                      )}
                      {exclusions.map((c, i) => (
                        <ConditionRow key={i} condition={c} index={i} onChange={handleExclusionChange} onRemove={idx => { const next = exclusions.filter((_, j) => j !== idx); setExclusions(next); triggerPreview(currentRules, next); }} canRemove={true} />
                      ))}
                      {exclusions.length > 0 && (
                        <Button size="sm" leftIcon={<SmallAddIcon />} variant="ghost" colorScheme="orange" onClick={() => setExclusions(prev => [...prev, EMPTY_CONDITION()])}>Add another</Button>
                      )}
                    </VStack>
                  </Box>
                )}
              </Box>

              <Divider />

              {/* Live preview */}
              <Box>
                <Text fontWeight="semibold" fontSize="sm" mb={3}>Audience Preview</Text>
                <PreviewPanel preview={preview} loading={previewLoading} />
                {!preview && !previewLoading && (
                  <Text fontSize="sm" color="gray.400">Add conditions above to see matching customers.</Text>
                )}
              </Box>
            </VStack>
          </DrawerBody>

          <DrawerFooter borderTopWidth={1} gap={3}>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button colorScheme="teal" isLoading={saving} onClick={handleSave} leftIcon={<Icon as={MdOutlineBookmark} />}>
              Save Segment
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Layout>
  );
};

export default Segments;
