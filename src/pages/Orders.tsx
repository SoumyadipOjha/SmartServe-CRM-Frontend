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
  Badge,
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
  Select,
  Stack,
  Text,
  Alert,
  AlertIcon,
  AlertDescription,
  IconButton,
  NumberInput,
  NumberInputField,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ChevronDownIcon } from '@chakra-ui/icons';
import Layout from '../components/Layout';
import OrderService from '../services/order.service';
import CustomerService from '../services/customer.service';
import { Order, Customer, Product } from '../types/models';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    customer: '',
    amount: 0,
    products: [{ name: '', quantity: 1, price: 0 }]
  });

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersData, customersData] = await Promise.all([
          OrderService.getOrders(),
          CustomerService.getCustomers()
        ]);
        setOrders(ordersData);
        setCustomers(customersData);
        setError(null);
      } catch (err) {
        setError('Failed to load orders and customers. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddNew = () => {
    setFormData({
      customer: customers.length > 0 ? customers[0]._id : '',
      amount: 0,
      products: [{ name: '', quantity: 1, price: 0 }]
    });
    onOpen();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (index: number, field: keyof Product, value: string | number) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    
    const amount = updatedProducts.reduce(
      (sum, product) => sum + (product.quantity * product.price), 
      0
    );
    
    setFormData(prev => ({ 
      ...prev, 
      products: updatedProducts,
      amount
    }));
  };

  const addProductRow = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { name: '', quantity: 1, price: 0 }]
    }));
  };

  const removeProductRow = (index: number) => {
    if (formData.products.length === 1) return;
    
    const updatedProducts = formData.products.filter((_, i) => i !== index);
    
    const amount = updatedProducts.reduce(
      (sum, product) => sum + (product.quantity * product.price), 
      0
    );
    
    setFormData(prev => ({ 
      ...prev, 
      products: updatedProducts,
      amount
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newOrder = await OrderService.createOrder(formData);
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      toast({
        title: "Order created",
        description: "New order has been successfully created",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (err) {
      setError('Failed to create order. Please try again.');
      console.error('Error creating order:', err);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    try {
      const updatedOrder = await OrderService.updateOrderStatus(orderId, newStatus);
      
      setOrders(prevOrders => 
        prevOrders.map(order => order._id === orderId ? updatedOrder : order)
      );
      
      toast({
        title: 'Status updated',
        description: `Order has been marked as ${newStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setError('Failed to update order status. Please try again.');
      console.error('Error updating order status:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'yellow';
    }
  };

  return (
    <Layout>
      <Box>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Orders</Heading>
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="teal"
            onClick={handleAddNew}
          >
            New Order
          </Button>
        </Flex>

        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Text>Loading orders...</Text>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Order ID</Th>
                  <Th>Customer</Th>
                  <Th>Amount</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {orders.length === 0 ? (
                  <Tr>
                    <Td colSpan={6}>No orders found</Td>
                  </Tr>
                ) : (
                  orders.map((order) => (
                    <Tr key={order._id}>
                      <Td>{order._id.substring(0, 8)}...</Td>
                      <Td>
                        {typeof order.customer === 'object' 
                          ? order.customer.name 
                          : 'Unknown Customer'}
                      </Td>
                      <Td>${order.amount.toFixed(2)}</Td>
                      <Td>{new Date(order.orderDate).toLocaleDateString()}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Menu>
                          <MenuButton as={Button} size="sm" rightIcon={<ChevronDownIcon />}>
                            Update Status
                          </MenuButton>
                          <MenuList>
                            <MenuItem 
                              isDisabled={order.status === 'pending'}
                              onClick={() => handleStatusUpdate(order._id, 'pending')}
                            >
                              Mark as Pending
                            </MenuItem>
                            <MenuItem 
                              isDisabled={order.status === 'completed'}
                              onClick={() => handleStatusUpdate(order._id, 'completed')}
                            >
                              Mark as Completed
                            </MenuItem>
                            <MenuItem 
                              isDisabled={order.status === 'cancelled'}
                              onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                            >
                              Mark as Cancelled
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Order</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Stack spacing={4}>
                <FormControl id="customer" isRequired>
                  <FormLabel>Customer</FormLabel>
                  <Select 
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                  >
                    {customers.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} ({customer.email})
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <Box mt={4}>
                  <Flex justify="space-between" mb={2}>
                    <Text fontWeight="bold">Products</Text>
                    <Button size="sm" onClick={addProductRow} colorScheme="teal">
                      + Add Product
                    </Button>
                  </Flex>
                  
                  {formData.products.map((product, index) => (
                    <HStack key={index} spacing={2} mt={2}>
                      <FormControl>
                        <Input
                          placeholder="Product name"
                          value={product.name}
                          onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                          isRequired
                        />
                      </FormControl>
                      
                      <FormControl w="100px">
                        <NumberInput
                          min={1}
                          value={product.quantity}
                          onChange={(_, value) => handleProductChange(index, 'quantity', value)}
                        >
                          <NumberInputField placeholder="Qty" />
                        </NumberInput>
                      </FormControl>
                      
                      <FormControl w="120px">
                        <NumberInput
                          min={0}
                          precision={2}
                          step={0.01}
                          value={product.price}
                          onChange={(_, value) => handleProductChange(index, 'price', value)}
                        >
                          <NumberInputField placeholder="Price" />
                        </NumberInput>
                      </FormControl>
                      
                      <IconButton
                        aria-label="Remove product"
                        icon={<DeleteIcon />}
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => removeProductRow(index)}
                        isDisabled={formData.products.length === 1}
                      />
                    </HStack>
                  ))}
                </Box>

                <Text fontWeight="bold" mt={4}>
                  Total: ${formData.amount.toFixed(2)}
                </Text>
              </Stack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="teal" type="submit">
                Create Order
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default Orders;