import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  Alert,
  AlertIcon,
  AlertDescription,
  HStack,
  useToast
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import Layout from '../components/Layout';
import CustomerService from '../services/customer.service';
import { Customer } from '../types/models';
import BulkUploadButton from '../pages/BulkUploadButton';
import ExportButton from '../pages/ExportButton';
import { useQueryClient } from 'react-query';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await CustomerService.getCustomers();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError('Error fetching customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setIsEditing(false);
    setFormData({
      name: '',
      email: '',
      phone: ''
    });
    onOpen();
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditing(true);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || ''
    });
    onOpen();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await CustomerService.deleteCustomer(id);
        setCustomers(customers.filter(customer => customer._id !== id));
      } catch (err) {
        setError('Error deleting customer');
        console.error(err);
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
        setCustomers(customers.map(c => 
          c._id === selectedCustomer._id ? { ...c, ...formData } : c
        ));
      } else {
        const newCustomer = await CustomerService.createCustomer(formData);
        setCustomers([newCustomer, ...customers]);
      }
      onClose();
    } catch (err) {
      setError(`Error ${isEditing ? 'updating' : 'creating'} customer`);
      console.error(err);
    }
  };

  const handleUploadSuccess = () => {
    // Refresh customers data
    queryClient.invalidateQueries('customers');
    toast({
      title: 'Customers Imported',
      description: 'Customer list has been updated',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Layout>
      <Box p={[2, 4, 6]}>
        <Flex
          direction={['column', 'row']}
          justify="space-between"
          align={['stretch', 'center']}
          mb={6}
          gap={4}
        >
          <Heading size={['md', 'lg']}>Customers</Heading>
          <Stack direction={['column', 'row']} spacing={2}>
            <ExportButton customers={customers || []} />
            <BulkUploadButton onUploadSuccess={handleUploadSuccess} />
            <Button 
              leftIcon={<AddIcon />} 
              colorScheme="teal" 
              onClick={handleAddNew}
              width={['100%', 'auto']}
            >
              Add Customer
            </Button>
          </Stack>
        </Flex>

        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Text>Loading customers...</Text>
        ) : (
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th display={['none', 'table-cell']}>Phone</Th>
                  <Th display={['none', 'table-cell']}>Total Spend</Th>
                  <Th display={['none', 'table-cell']}>Visits</Th>
                  <Th display={['none', 'table-cell']}>Last Activity</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {customers.length === 0 ? (
                  <Tr>
                    <Td colSpan={7}>No customers found</Td>
                  </Tr>
                ) : (
                  customers.map((customer) => (
                    <Tr key={customer._id}>
                      <Td>{customer.name}</Td>
                      <Td>{customer.email}</Td>
                      <Td display={['none', 'table-cell']}>{customer.phone || '-'}</Td>
                      <Td display={['none', 'table-cell']}>${customer.totalSpend.toFixed(2)}</Td>
                      <Td display={['none', 'table-cell']}>{customer.visits}</Td>
                      <Td display={['none', 'table-cell']}>{new Date(customer.lastActivity).toLocaleDateString()}</Td>
                      <Td>
                        <IconButton
                          aria-label="Edit customer"
                          icon={<EditIcon />}
                          size="sm"
                          mr={2}
                          onClick={() => handleEdit(customer)}
                        />
                        <IconButton
                          aria-label="Delete customer"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDelete(customer._id)}
                        />
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Add/Edit Customer Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size={['xs', 'md']}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditing ? 'Edit Customer' : 'Add New Customer'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Stack spacing={4}>
                <FormControl id="name" isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </FormControl>
                
                <FormControl id="email" isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </FormControl>
                
                <FormControl id="phone">
                  <FormLabel>Phone</FormLabel>
                  <Input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </FormControl>
              </Stack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="teal" type="submit">
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default Customers;