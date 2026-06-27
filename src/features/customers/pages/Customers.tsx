import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td,
  IconButton, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl,
  FormLabel, Input, InputGroup, InputLeftElement, Stack, Text, Alert,
  AlertIcon, AlertDescription, HStack, useToast
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import Layout from '../../../shared/components/Layout';
import Pagination from '../../../shared/components/Pagination';
import CustomerService from '../services/customer.service';
import { Customer } from '../../../shared/types/models';
import BulkUploadButton from '../components/BulkUploadButton';
import ExportButton from '../components/ExportButton';
import { useQueryClient } from 'react-query';

const PAGE_SIZE = 15;
type SortField = 'name' | 'totalSpend' | 'visits' | 'lastActivity';
type SortDir = 'asc' | 'desc';

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <Text as="span" color="gray.300" ml={1}>↕</Text>;
  return <Text as="span" ml={1}>{dir === 'asc' ? '↑' : '↓'}</Text>;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Search / sort / page
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setCustomers(await CustomerService.getCustomers());
      setError(null);
    } catch {
      setError('Error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let list = [...customers];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'name':         return dir * a.name.localeCompare(b.name);
        case 'totalSpend':   return dir * (a.totalSpend - b.totalSpend);
        case 'visits':       return dir * (a.visits - b.visits);
        case 'lastActivity': return dir * (new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime());
        default:             return 0;
      }
    });
    return list;
  }, [customers, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setIsEditing(false);
    setFormData({ name: '', email: '', phone: '' });
    onOpen();
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditing(true);
    setFormData({ name: customer.name, email: customer.email, phone: customer.phone || '' });
    onOpen();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await CustomerService.deleteCustomer(id);
        setCustomers(prev => prev.filter(c => c._id !== id));
      } catch {
        setError('Error deleting customer');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selectedCustomer) {
        await CustomerService.updateCustomer(selectedCustomer._id, formData);
        setCustomers(prev => prev.map(c => c._id === selectedCustomer._id ? { ...c, ...formData } : c));
      } else {
        const newCustomer = await CustomerService.createCustomer(formData);
        setCustomers(prev => [newCustomer, ...prev]);
      }
      onClose();
    } catch {
      setError(`Error ${isEditing ? 'updating' : 'creating'} customer`);
    }
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries('customers');
    fetchCustomers();
    toast({ title: 'Customers Imported', description: 'Customer list has been updated', status: 'success', duration: 3000, isClosable: true });
  };

  const thProps = (field: SortField) => ({
    cursor: 'pointer' as const,
    userSelect: 'none' as const,
    onClick: () => handleSort(field),
    _hover: { bg: 'gray.50' },
  });

  return (
    <Layout>
      <Box p={[2, 4, 6]}>
        <Flex direction={['column', 'row']} justify="space-between" align={['stretch', 'center']} mb={6} gap={4}>
          <Heading size={['md', 'lg']}>Customers</Heading>
          <Stack direction={['column', 'row']} spacing={2}>
            <ExportButton customers={customers || []} />
            <BulkUploadButton onUploadSuccess={handleUploadSuccess} />
            <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={handleAddNew} width={['100%', 'auto']}>Add Customer</Button>
          </Stack>
        </Flex>

        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon /><AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search bar */}
        <Flex mb={4} gap={3} flexWrap="wrap">
          <InputGroup flex={{ base: 1, md: 'none' }} maxW={{ base: '100%', md: '320px' }}>
            <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" /></InputLeftElement>
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </InputGroup>
          {search && (
            <Text fontSize="sm" color="gray.500" alignSelf="center">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </Text>
          )}
        </Flex>

        {loading ? (
          <Text>Loading customers…</Text>
        ) : (
          <>
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th {...thProps('name')}>
                      Name <SortIndicator active={sortField === 'name'} dir={sortDir} />
                    </Th>
                    <Th>Email</Th>
                    <Th display={['none', 'table-cell']}>Phone</Th>
                    <Th display={['none', 'table-cell']} {...thProps('totalSpend')}>
                      Total Spend <SortIndicator active={sortField === 'totalSpend'} dir={sortDir} />
                    </Th>
                    <Th display={['none', 'table-cell']} {...thProps('visits')}>
                      Visits <SortIndicator active={sortField === 'visits'} dir={sortDir} />
                    </Th>
                    <Th display={['none', 'table-cell']} {...thProps('lastActivity')}>
                      Last Activity <SortIndicator active={sortField === 'lastActivity'} dir={sortDir} />
                    </Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginated.length === 0 ? (
                    <Tr><Td colSpan={7}>{search ? 'No customers match your search' : 'No customers found'}</Td></Tr>
                  ) : (
                    paginated.map(customer => (
                      <Tr key={customer._id}>
                        <Td>
                          <Text
                            as={RouterLink}
                            to={`/customers/${customer._id}`}
                            color="teal.500"
                            fontWeight="medium"
                            _hover={{ textDecoration: 'underline' }}
                          >
                            {customer.name}
                          </Text>
                        </Td>
                        <Td>{customer.email}</Td>
                        <Td display={['none', 'table-cell']}>{customer.phone || '-'}</Td>
                        <Td display={['none', 'table-cell']}>${customer.totalSpend.toFixed(2)}</Td>
                        <Td display={['none', 'table-cell']}>{customer.visits}</Td>
                        <Td display={['none', 'table-cell']}>{new Date(customer.lastActivity).toLocaleDateString()}</Td>
                        <Td>
                          <HStack spacing={1}>
                            <IconButton aria-label="Edit customer" icon={<EditIcon />} size="sm" onClick={() => handleEdit(customer)} />
                            <IconButton aria-label="Delete customer" icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={() => handleDelete(customer._id)} />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size={['xs', 'md']}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditing ? 'Edit Customer' : 'Add New Customer'}</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Stack spacing={4}>
                <FormControl id="name" isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input name="name" value={formData.name} onChange={handleInputChange} />
                </FormControl>
                <FormControl id="email" isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input name="email" type="email" value={formData.email} onChange={handleInputChange} />
                </FormControl>
                <FormControl id="phone">
                  <FormLabel>Phone</FormLabel>
                  <Input name="phone" value={formData.phone} onChange={handleInputChange} />
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
              <Button colorScheme="teal" type="submit">{isEditing ? 'Update' : 'Create'}</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default Customers;
