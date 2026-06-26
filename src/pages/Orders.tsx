import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Badge, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel,
  Input, InputGroup, InputLeftElement, Select, Stack, Text, Alert,
  AlertIcon, AlertDescription, IconButton, NumberInput, NumberInputField,
  HStack, Menu, MenuButton, MenuList, MenuItem, useToast
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ChevronDownIcon, SearchIcon } from '@chakra-ui/icons';
import { FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import OrderService from '../services/order.service';
import CustomerService from '../services/customer.service';
import { Order, Customer, Product } from '../types/models';

const PAGE_SIZE = 15;
type SortField = 'amount' | 'orderDate';
type SortDir = 'asc' | 'desc';

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <Text as="span" color="gray.300" ml={1}>↕</Text>;
  return <Text as="span" ml={1}>{dir === 'asc' ? '↑' : '↓'}</Text>;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Search / filter / sort / page
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('orderDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'orderDate' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let list = [...orders];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o => {
        const name = o.customer && typeof o.customer === 'object' && 'name' in o.customer
          ? (o.customer as Customer).name.toLowerCase() : '';
        return name.includes(q);
      });
    }
    if (statusFilter) {
      list = list.filter(o => o.status === statusFilter);
    }
    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'amount') return dir * (a.amount - b.amount);
      return dir * (new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
    });
    return list;
  }, [orders, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAddNew = () => {
    setFormData({ customer: customers.length > 0 ? customers[0]._id : '', amount: 0, products: [{ name: '', quantity: 1, price: 0 }] });
    onOpen();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (index: number, field: keyof Product, value: string | number) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    const amount = updatedProducts.reduce((sum, p) => sum + p.quantity * p.price, 0);
    setFormData(prev => ({ ...prev, products: updatedProducts, amount }));
  };

  const addProductRow = () => {
    setFormData(prev => ({ ...prev, products: [...prev.products, { name: '', quantity: 1, price: 0 }] }));
  };

  const removeProductRow = (index: number) => {
    if (formData.products.length === 1) return;
    const updatedProducts = formData.products.filter((_, i) => i !== index);
    const amount = updatedProducts.reduce((sum, p) => sum + p.quantity * p.price, 0);
    setFormData(prev => ({ ...prev, products: updatedProducts, amount }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newOrder = await OrderService.createOrder(formData);
      setOrders(prev => [newOrder, ...prev]);
      toast({ title: 'Order created', status: 'success', duration: 3000, isClosable: true });
      onClose();
    } catch {
      setError('Failed to create order. Please try again.');
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    try {
      const updatedOrder = await OrderService.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o._id === orderId ? updatedOrder : o));
      toast({ title: 'Status updated', description: `Order marked as ${newStatus}`, status: 'success', duration: 3000, isClosable: true });
    } catch {
      setError('Failed to update order status.');
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
    const rows = orders.map(o => [
      o._id,
      o.customer && typeof o.customer === 'object' && 'name' in o.customer ? (o.customer as Customer).name : 'Unknown',
      `$${o.amount.toFixed(2)}`,
      new Date(o.orderDate).toLocaleDateString(),
      o.status
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `orders-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const thProps = (field: SortField) => ({
    cursor: 'pointer' as const,
    userSelect: 'none' as const,
    onClick: () => handleSort(field),
    _hover: { bg: 'gray.50' },
  });

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
            <AlertIcon /><AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search + filter row */}
        <Flex mb={4} gap={3} flexWrap="wrap">
          <InputGroup maxW="280px">
            <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" /></InputLeftElement>
            <Input
              placeholder="Search by customer name…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </InputGroup>
          <Select
            maxW="180px"
            placeholder="All statuses"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          {(search || statusFilter) && (
            <Text fontSize="sm" color="gray.500" alignSelf="center">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </Text>
          )}
        </Flex>

        {loading ? (
          <Text>Loading orders…</Text>
        ) : (
          <>
            <Box overflowX="auto">
              <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
                <Thead>
                  <Tr>
                    <Th>Order ID</Th>
                    <Th>Customer</Th>
                    <Th {...thProps('amount')}>Amount <SortIndicator active={sortField === 'amount'} dir={sortDir} /></Th>
                    <Th {...thProps('orderDate')}>Date <SortIndicator active={sortField === 'orderDate'} dir={sortDir} /></Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginated.length === 0 ? (
                    <Tr><Td colSpan={6}>{search || statusFilter ? 'No orders match your filters' : 'No orders found'}</Td></Tr>
                  ) : (
                    paginated.map(order => (
                      <Tr key={order._id}>
                        <Td>{order._id.substring(0, 8)}…</Td>
                        <Td>
                          {order.customer && typeof order.customer === 'object' && 'name' in order.customer
                            ? (order.customer as Customer).name : 'Unknown Customer'}
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
            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </Box>

      {/* New Order Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New Order</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Customer</FormLabel>
                  <Select name="customer" value={formData.customer} onChange={handleInputChange}>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </Select>
                </FormControl>
                <Text fontWeight="medium">Products</Text>
                {formData.products.map((product, index) => (
                  <HStack key={index} spacing={2} align="flex-end">
                    <FormControl flex={2}>
                      <FormLabel fontSize="sm">Product Name</FormLabel>
                      <Input size="sm" value={product.name} onChange={e => handleProductChange(index, 'name', e.target.value)} />
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel fontSize="sm">Qty</FormLabel>
                      <NumberInput size="sm" value={product.quantity} min={1} onChange={val => handleProductChange(index, 'quantity', Number(val))}>
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel fontSize="sm">Price</FormLabel>
                      <NumberInput size="sm" value={product.price} min={0} onChange={val => handleProductChange(index, 'price', Number(val))}>
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    <IconButton aria-label="Remove" icon={<DeleteIcon />} size="sm" colorScheme="red" isDisabled={formData.products.length === 1} onClick={() => removeProductRow(index)} />
                  </HStack>
                ))}
                <Button size="sm" variant="outline" onClick={addProductRow}>+ Add Product</Button>
                <Text fontWeight="semibold">Total: ${formData.amount.toFixed(2)}</Text>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
              <Button colorScheme="teal" type="submit">Create Order</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default Orders;
