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
  AlertDescription
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import Layout from '../components/Layout';
import CustomerService from '../services/customer.service';
import { Customer } from '../types/models';

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

  return (
    <Layout>
      <Box>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Customers</Heading>
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="teal" 
            onClick={handleAddNew}
          >
            Add Customer
          </Button>
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
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Total Spend</Th>
                  <Th>Visits</Th>
                  <Th>Last Activity</Th>
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
                      <Td>{customer.phone || '-'}</Td>
                      <Td>${customer.totalSpend.toFixed(2)}</Td>
                      <Td>{customer.visits}</Td>
                      <Td>{new Date(customer.lastActivity).toLocaleDateString()}</Td>
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
      <Modal isOpen={isOpen} onClose={onClose}>
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