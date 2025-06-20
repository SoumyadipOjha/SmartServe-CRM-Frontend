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
import { FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
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
    const amount = updatedProducts.reduce((sum, product) => sum + (product.quantity * product.price), 0);
    setFormData(prev => ({ ...prev, products: updatedProducts, amount }));
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
    const amount = updatedProducts.reduce((sum, product) => sum + (product.quantity * product.price), 0);
    setFormData(prev => ({ ...prev, products: updatedProducts, amount }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newOrder = await OrderService.createOrder(formData);
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      toast({ title: "Order created", description: "New order has been successfully created", status: "success", duration: 3000, isClosable: true });
      onClose();
    } catch (err) {
      setError('Failed to create order. Please try again.');
      console.error('Error creating order:', err);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    try {
      const updatedOrder = await OrderService.updateOrderStatus(orderId, newStatus);
      setOrders(prevOrders => prevOrders.map(order => order._id === orderId ? updatedOrder : order));
      toast({ title: 'Status updated', description: `Order has been marked as ${newStatus}`, status: 'success', duration: 3000, isClosable: true });
    } catch (err) {
      setError('Failed to update order status. Please try again.');
      console.error('Error updating order status:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'yellow';
    }
  };

  const handleExcelExport = () => {
    const headers = ['Order ID', 'Customer Name', 'Amount', 'Date', 'Status'];
    const rows = orders.map(order => [
      order._id,
      order.customer && typeof order.customer === 'object' && 'name' in order.customer
        ? order.customer.name
        : 'Unknown Customer',
      `$${order.amount.toFixed(2)}`,
      new Date(order.orderDate).toLocaleDateString(),
      order.status
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, `orders-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Layout>
      <Box px={{ base: 2, md: 4 }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={4} mb={6}>
          <Heading size="lg">Orders</Heading>
          <HStack spacing={2} flexWrap="wrap">
            <Button leftIcon={<FiDownload />} colorScheme="green" onClick={handleExcelExport}>Export Orders</Button>
            <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={handleAddNew}>New Order</Button>
          </HStack>
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
            <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
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
                  <Tr><Td colSpan={6}>No orders found</Td></Tr>
                ) : (
                  orders.map(order => (
                    <Tr key={order._id}>
                      <Td>{order._id.substring(0, 8)}...</Td>
                      <Td>
                        {order.customer && typeof order.customer === 'object' && 'name' in order.customer
                          ? order.customer.name
                          : 'Unknown Customer'}
                      </Td>
                      <Td>${order.amount.toFixed(2)}</Td>
                      <Td>{new Date(order.orderDate).toLocaleDateString()}</Td>
                      <Td><Badge colorScheme={getStatusColor(order.status)}>{order.status}</Badge></Td>
                      <Td>
                        <Menu>
                          <MenuButton as={Button} size="sm" rightIcon={<ChevronDownIcon />}>Update Status</MenuButton>
                          <MenuList>
                            <MenuItem isDisabled={order.status === 'pending'} onClick={() => handleStatusUpdate(order._id, 'pending')}>Mark as Pending</MenuItem>
                            <MenuItem isDisabled={order.status === 'completed'} onClick={() => handleStatusUpdate(order._id, 'completed')}>Mark as Completed</MenuItem>
                            <MenuItem isDisabled={order.status === 'cancelled'} onClick={() => handleStatusUpdate(order._id, 'cancelled')}>Mark as Cancelled</MenuItem>
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
    </Layout>
  );
};

export default Orders;
