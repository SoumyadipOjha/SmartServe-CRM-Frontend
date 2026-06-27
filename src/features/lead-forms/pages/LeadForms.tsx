import React, { useEffect, useState } from 'react';
import {
  Box, Button, Flex, Heading, HStack, IconButton, Modal, ModalBody, ModalCloseButton,
  ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spinner, Switch, Tag, Text,
  Tooltip, useColorModeValue, useDisclosure, useToast, VStack, Badge, Input,
  FormControl, FormLabel, Select, Divider, Code, Collapse,
} from '@chakra-ui/react';
import { FiCopy, FiExternalLink, FiPlus, FiTrash2, FiEdit2, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Layout from '../../../shared/components/Layout';
import LeadFormService, { LeadForm, LeadFormField } from '../services/lead-form.service';

const FIELD_TYPES = ['text','email','phone','textarea'] as const;

const defaultFields: LeadFormField[] = [
  { label: 'Full Name',     fieldKey: 'name',    fieldType: 'text',     required: true  },
  { label: 'Email Address', fieldKey: 'email',   fieldType: 'email',    required: true  },
  { label: 'Phone Number',  fieldKey: 'phone',   fieldType: 'phone',    required: false },
  { label: 'Message',       fieldKey: 'message', fieldType: 'textarea', required: false },
];

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// ── Field editor row ──────────────────────────────────────────────────────────
function FieldRow({ field, index, onChange, onRemove }: {
  field: LeadFormField;
  index: number;
  onChange: (i: number, f: LeadFormField) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <Flex gap={2} align="center" wrap="wrap">
      <Input
        placeholder="Label"
        value={field.label}
        size="sm"
        flex={2}
        onChange={e => onChange(index, { ...field, label: e.target.value, fieldKey: slugify(e.target.value) })}
      />
      <Select
        value={field.fieldType}
        size="sm"
        flex={1}
        onChange={e => onChange(index, { ...field, fieldType: e.target.value as LeadFormField['fieldType'] })}
      >
        {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </Select>
      <HStack spacing={1}>
        <Text fontSize="xs" color="gray.500">Required</Text>
        <Switch
          size="sm"
          isChecked={field.required}
          onChange={e => onChange(index, { ...field, required: e.target.checked })}
        />
      </HStack>
      <IconButton
        aria-label="Remove field"
        icon={<FiTrash2 />}
        size="xs"
        variant="ghost"
        colorScheme="red"
        onClick={() => onRemove(index)}
      />
    </Flex>
  );
}

// ── Create / Edit modal ───────────────────────────────────────────────────────
function FormModal({ editForm, onClose, onSave }: {
  editForm: LeadForm | null;
  onClose: () => void;
  onSave:  (form: LeadForm) => void;
}) {
  const [name,          setName]          = useState(editForm?.name          || '');
  const [submitMessage, setSubmitMessage] = useState(editForm?.submitMessage || "Thank you! We'll be in touch soon.");
  const [fields,        setFields]        = useState<LeadFormField[]>(editForm?.fields || defaultFields);
  const [saving,        setSaving]        = useState(false);
  const toast = useToast();

  const updateField = (i: number, f: LeadFormField) => setFields(prev => prev.map((x, idx) => idx === i ? f : x));
  const removeField = (i: number) => setFields(prev => prev.filter((_, idx) => idx !== i));
  const addField    = () => setFields(prev => [...prev, { label: 'New Field', fieldKey: `field_${prev.length}`, fieldType: 'text', required: false }]);

  const handleSave = async () => {
    if (!name.trim()) return toast({ title: 'Form name is required', status: 'warning' });
    if (!fields.length) return toast({ title: 'Add at least one field', status: 'warning' });
    setSaving(true);
    try {
      const payload = { name, submitMessage, fields };
      const saved = editForm
        ? await LeadFormService.updateForm(editForm._id, payload)
        : await LeadFormService.createForm(payload);
      onSave(saved);
    } catch {
      toast({ title: 'Failed to save form', status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size={['full', 'xl']} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{editForm ? 'Edit Form' : 'New Lead Form'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Form Name</FormLabel>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Contact Us" />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Thank-you message after submit</FormLabel>
              <Input value={submitMessage} onChange={e => setSubmitMessage(e.target.value)} />
            </FormControl>
            <Divider />
            <Flex justify="space-between" align="center">
              <Text fontWeight="semibold" fontSize="sm">Fields</Text>
              <Button size="xs" leftIcon={<FiPlus />} onClick={addField}>Add Field</Button>
            </Flex>
            <VStack align="stretch" spacing={2}>
              {fields.map((f, i) => (
                <FieldRow key={i} field={f} index={i} onChange={updateField} onRemove={removeField} />
              ))}
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="teal" isLoading={saving} onClick={handleSave}>
            {editForm ? 'Save Changes' : 'Create Form'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ── Embed code panel ──────────────────────────────────────────────────────────
function EmbedPanel({ form }: { form: LeadForm }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const publicUrl = `${window.location.origin}/forms/${form.token}`;
  const embedCode = `<iframe src="${publicUrl}" width="100%" height="500" frameborder="0" style="border-radius:12px"></iframe>`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied`, status: 'success', duration: 1500 });
  };

  return (
    <Box>
      <Button size="xs" variant="ghost" rightIcon={open ? <FiChevronUp /> : <FiChevronDown />} onClick={() => setOpen(!open)}>
        Embed / Share
      </Button>
      <Collapse in={open}>
        <VStack align="stretch" spacing={2} mt={2} p={3} borderWidth={1} borderRadius="md" fontSize="xs">
          <Flex align="center" gap={2}>
            <Code flex={1} p={1} noOfLines={1}>{publicUrl}</Code>
            <IconButton aria-label="Copy link" icon={<FiCopy />} size="xs" onClick={() => copy(publicUrl, 'Link')} />
            <IconButton aria-label="Open link" icon={<FiExternalLink />} size="xs" as="a" href={publicUrl} target="_blank" />
          </Flex>
          <Text color="gray.500">Iframe embed:</Text>
          <Flex align="flex-start" gap={2}>
            <Code flex={1} p={1} whiteSpace="pre-wrap" wordBreak="break-all">{embedCode}</Code>
            <IconButton aria-label="Copy embed" icon={<FiCopy />} size="xs" onClick={() => copy(embedCode, 'Embed code')} />
          </Flex>
        </VStack>
      </Collapse>
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const LeadForms: React.FC = () => {
  const [forms,    setForms]    = useState<LeadForm[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editForm, setEditForm] = useState<LeadForm | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.700');
  const toast  = useToast();

  useEffect(() => {
    LeadFormService.getForms()
      .then(setForms)
      .catch(() => toast({ title: 'Failed to load forms', status: 'error' }))
      .finally(() => setLoading(false));
  }, [toast]);

  const openCreate = () => { setEditForm(null); onOpen(); };
  const openEdit   = (f: LeadForm) => { setEditForm(f); onOpen(); };

  const handleSaved = (saved: LeadForm) => {
    setForms(prev => {
      const idx = prev.findIndex(f => f._id === saved._id);
      return idx >= 0 ? prev.map(f => f._id === saved._id ? saved : f) : [saved, ...prev];
    });
    onClose();
    toast({ title: editForm ? 'Form updated' : 'Form created', status: 'success' });
  };

  const toggleActive = async (form: LeadForm) => {
    try {
      const updated = await LeadFormService.updateForm(form._id, { active: !form.active });
      setForms(prev => prev.map(f => f._id === form._id ? updated : f));
    } catch {
      toast({ title: 'Failed to update form', status: 'error' });
    }
  };

  const deleteForm = async (form: LeadForm) => {
    if (!window.confirm(`Delete "${form.name}"?`)) return;
    try {
      await LeadFormService.deleteForm(form._id);
      setForms(prev => prev.filter(f => f._id !== form._id));
      toast({ title: 'Form deleted', status: 'success' });
    } catch {
      toast({ title: 'Failed to delete', status: 'error' });
    }
  };

  return (
    <Layout>
      <Box p={[3, 5, 6]}>
        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
          <Box>
            <Heading size="lg">Lead Capture Forms</Heading>
            <Text color="gray.500" fontSize="sm" mt={1}>
              Create embeddable forms — leads go straight into your Customers list tagged "lead"
            </Text>
          </Box>
          <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={openCreate}>New Form</Button>
        </Flex>

        {loading ? (
          <Flex justify="center" mt={20}><Spinner size="xl" color="teal.400" /></Flex>
        ) : forms.length === 0 ? (
          <Flex direction="column" align="center" justify="center" mt={20} gap={3}>
            <Text color="gray.500">No lead forms yet.</Text>
            <Button colorScheme="teal" leftIcon={<FiPlus />} onClick={openCreate}>Create your first form</Button>
          </Flex>
        ) : (
          <VStack align="stretch" spacing={4}>
            {forms.map(form => (
              <Box key={form._id} bg={cardBg} borderWidth={1} borderRadius="xl" p={5} shadow="sm">
                <Flex justify="space-between" align="flex-start" wrap="wrap" gap={3}>
                  <Box flex={1}>
                    <HStack mb={1}>
                      <Text fontWeight="bold" fontSize="md">{form.name}</Text>
                      <Badge colorScheme={form.active ? 'green' : 'gray'}>
                        {form.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </HStack>
                    <HStack spacing={4} fontSize="sm" color="gray.500" mb={3}>
                      <Text>{form.fields.length} field{form.fields.length !== 1 ? 's' : ''}</Text>
                      <Text>{form.submissionsCount} submission{form.submissionsCount !== 1 ? 's' : ''}</Text>
                    </HStack>
                    <HStack spacing={1} mb={3} flexWrap="wrap">
                      {form.fields.map(f => (
                        <Tag key={f.fieldKey} size="sm" colorScheme="gray">
                          {f.label}{f.required ? ' *' : ''}
                        </Tag>
                      ))}
                    </HStack>
                    <EmbedPanel form={form} />
                  </Box>
                  <HStack>
                    <Tooltip label={form.active ? 'Deactivate' : 'Activate'}>
                      <Switch isChecked={form.active} onChange={() => toggleActive(form)} colorScheme="teal" />
                    </Tooltip>
                    <IconButton aria-label="Edit" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => openEdit(form)} />
                    <IconButton aria-label="Delete" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => deleteForm(form)} />
                  </HStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {isOpen && (
        <FormModal editForm={editForm} onClose={onClose} onSave={handleSaved} />
      )}
    </Layout>
  );
};

export default LeadForms;
