import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Heading, 
  SimpleGrid, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText,
  Text,
  Link,
  Button,
  Flex,
  Icon,
  Badge,
  Progress,
  useColorModeValue,
  Stack,
  Divider,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import Layout from '../components/Layout';
import CustomerService from '../services/customer.service';
import OrderService from '../services/order.service';
import CampaignService from '../services/campaign.service';
import { Customer, Order, Campaign } from '../types/models';
import { FiUsers, FiShoppingCart, FiDollarSign, FiMail, FiArrowUp } from 'react-icons/fi';

// Register Chart.js components

const Dashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Color schemes
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const subtleText = useColorModeValue('gray.600', 'gray.400');
  const successColor = useColorModeValue('teal.500', 'teal.300');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [customersData, ordersData, campaignsData] = await Promise.all([
          CustomerService.getCustomers(),
          OrderService.getOrders(),
          CampaignService.getCampaigns()
        ]);

        setCustomers(customersData);
        setOrders(ordersData);
        setCampaigns(campaignsData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate summary statistics
  const totalCustomers = customers.length;
  const totalOrders = orders.length;
  const totalCampaigns = campaigns.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);  
  // Get recent items for display
  const recentCustomers = customers.slice(0, 5);
  const recentOrders = orders.slice(0, 5);
  const recentCampaigns = campaigns.slice(0, 3);

  
  
  // Prepare campaign performance data
  
  

  return (
    <Layout>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="lg">Dashboard Overview</Heading>
      </Flex>

      {/* Key Metrics */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Stat 
          p={6}
          shadow="md" 
          borderRadius="lg" 
          bg={cardBg}
          borderLeft="4px solid"
          borderColor="teal.400"
          transition="transform 0.3s"
          _hover={{ transform: 'translateY(-5px)', shadow: 'lg' }}
        >
          <Flex justify="space-between">
            <Box>
              <StatLabel fontSize="sm" color={subtleText}>Total Customers</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>{totalCustomers}</StatNumber>
              <StatHelpText mb={0}>
                <Link as={RouterLink} to="/customers" color={successColor}>View details</Link>
              </StatHelpText>
            </Box>
            <Flex 
              w="12" 
              h="12" 
              bg="teal.50" 
              color="teal.400" 
              borderRadius="full" 
              align="center" 
              justify="center"
            >
              <Icon as={FiUsers} boxSize="6" />
            </Flex>
          </Flex>
        </Stat>
        
        <Stat 
          p={6}
          shadow="md" 
          borderRadius="lg" 
          bg={cardBg}
          borderLeft="4px solid"
          borderColor="blue.400"
          transition="transform 0.3s"
          _hover={{ transform: 'translateY(-5px)', shadow: 'lg' }}
        >
          <Flex justify="space-between">
            <Box>
              <StatLabel fontSize="sm" color={subtleText}>Total Orders</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>{totalOrders}</StatNumber>
              <StatHelpText mb={0}>
                <Link as={RouterLink} to="/orders" color={successColor}>View details</Link>
              </StatHelpText>
            </Box>
            <Flex 
              w="12" 
              h="12" 
              bg="blue.50" 
              color="blue.400" 
              borderRadius="full" 
              align="center" 
              justify="center"
            >
              <Icon as={FiShoppingCart} boxSize="6" />
            </Flex>
          </Flex>
        </Stat>
        
        <Stat 
          p={6}
          shadow="md" 
          borderRadius="lg" 
          bg={cardBg}
          borderLeft="4px solid"
          borderColor="green.400"
          transition="transform 0.3s"
          _hover={{ transform: 'translateY(-5px)', shadow: 'lg' }}
        >
          <Flex justify="space-between">
            <Box>
              <StatLabel fontSize="sm" color={subtleText}>Total Revenue</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>${totalRevenue.toFixed(2)}</StatNumber>
              <StatHelpText mb={0}>
                <Flex align="center" color="green.500">
                  <Icon as={FiArrowUp} mr={1} />
                  <Text fontSize="sm">From all orders</Text>
                </Flex>
              </StatHelpText>
            </Box>
            <Flex 
              w="12" 
              h="12" 
              bg="green.50" 
              color="green.400" 
              borderRadius="full" 
              align="center" 
              justify="center"
            >
              <Icon as={FiDollarSign} boxSize="6" />
            </Flex>
          </Flex>
        </Stat>
        
        <Stat 
          p={6}
          shadow="md" 
          borderRadius="lg" 
          bg={cardBg}
          borderLeft="4px solid"
          borderColor="purple.400"
          transition="transform 0.3s"
          _hover={{ transform: 'translateY(-5px)', shadow: 'lg' }}
        >
          <Flex justify="space-between">
            <Box>
              <StatLabel fontSize="sm" color={subtleText}>Campaigns</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>{totalCampaigns}</StatNumber>
              <StatHelpText mb={0}>
                <Link as={RouterLink} to="/campaigns" color={successColor}>View details</Link>
              </StatHelpText>
            </Box>
            <Flex 
              w="12" 
              h="12" 
              bg="purple.50" 
              color="purple.400" 
              borderRadius="full" 
              align="center" 
              justify="center"
            >
              <Icon as={FiMail} boxSize="6" />
            </Flex>
          </Flex>
        </Stat>
      </SimpleGrid>

      {/* Recent Activities Grid */}
      <Grid templateColumns={{ base: "1fr", lg: "1.5fr 1fr" }} gap={6}>
        <Box>
          
          <Heading size="md" mt={8} mb={4}>Recent Campaigns</Heading>
          <Stack spacing={4}>
            {recentCampaigns.length > 0 ? (
              recentCampaigns.map((campaign) => (
                <Box 
                  key={campaign._id} 
                  p={5} 
                  bg={cardBg} 
                  shadow="md" 
                  borderRadius="lg"
                  transition="transform 0.2s"
                  _hover={{ transform: 'translateY(-2px)' }}
                >
                  <Flex justify="space-between" mb={2}>
                    <Heading size="sm">{campaign.name}</Heading>
                    <Badge colorScheme={campaign.status === 'active' ? 'green' : 'gray'}>
                      {campaign.status}
                    </Badge>
                  </Flex>
                  <Text fontSize="sm" color={subtleText} mb={3}>
                    Audience Size: {campaign.audienceSize}
                  </Text>
                  <Box mb={2}>
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="xs">Delivery Rate</Text>
                      <Text fontSize="xs" fontWeight="bold">
                        {campaign.audienceSize > 0
                          ? Math.round((campaign.deliveryStats.sent / campaign.audienceSize) * 100)
                          : 0}%
                      </Text>
                    </Flex>
                    <Progress 
                      value={campaign.audienceSize > 0
                        ? (campaign.deliveryStats.sent / campaign.audienceSize) * 100
                        : 0
                      } 
                      size="sm" 
                      colorScheme="teal" 
                      borderRadius="full" 
                    />
                  </Box>
                  <Flex fontSize="sm" justify="space-between" mt={3} color={subtleText}>
                    <Text>Sent: {campaign.deliveryStats.sent}</Text>
                    <Text>Failed: {campaign.deliveryStats.failed}</Text>
                  </Flex>
                </Box>
              ))
            ) : (
              <Box p={5} bg={cardBg} shadow="md" borderRadius="lg">
                <Text>No campaigns yet</Text>
              </Box>
            )}
            <Box textAlign="center" mt={2}>
              <Button 
                as={RouterLink} 
                to="/campaigns" 
                colorScheme="teal" 
                size="sm"
              >
                View all campaigns
              </Button>
            </Box>
          </Stack>
        </Box>

        
        
        <Box>
          <Heading size="md" mb={4}>Recent Customers</Heading>
          <Box bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
            {recentCustomers.length > 0 ? (
              recentCustomers.map((customer, index) => (
                <React.Fragment key={customer._id}>
                  <Flex p={4} align="center">
                    <Box 
                      bg="teal.400"
                      color="white"
                      borderRadius="full"
                      w={10}
                      h={10}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="bold"
                      mr={3}
                    >
                      {customer.name.charAt(0).toUpperCase()}
                    </Box>
                    <Box flex="1">
                      <Text fontWeight="bold" color={textColor}>{customer.name}</Text>
                      <Text fontSize="sm" color={subtleText}>{customer.email}</Text>
                    </Box>
                  </Flex>
                  {index < recentCustomers.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              <Text p={4}>No customers yet</Text>
            )}
            <Box p={3} bg="gray.50" borderTop="1px" borderColor={borderColor}>
              <Link as={RouterLink} to="/customers" color={successColor} fontWeight="medium">
                View all customers
              </Link>
            </Box>
          </Box>

          <Heading size="md" mb={4} mt={4}>Recent Orders</Heading>
          <Box bg={cardBg} shadow="md" borderRadius="lg" overflow="hidden">
            {recentOrders.length > 0 ? (
              recentOrders.map((order, index) => (
                <React.Fragment key={order._id}>
                  <Flex p={4} justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="bold" color={textColor}>
                        {typeof order.customer === 'object' ? order.customer.name : 'Customer'}
                      </Text>
                      <Text fontSize="sm" color={subtleText}>
                        {new Date(order.orderDate).toLocaleDateString()} • Order #{order._id.slice(-4)}
                      </Text>
                    </Box>
                    <Badge colorScheme="green" fontSize="md" py={1} px={3} borderRadius="lg">
                      ${order.amount.toFixed(2)}
                    </Badge>
                  </Flex>
                  {index < recentOrders.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              <Text p={4}>No orders yet</Text>
            )}
            <Box p={3} bg="gray.50" borderTop="1px" borderColor={borderColor}>
              <Link as={RouterLink} to="/orders" color={successColor} fontWeight="medium">
                View all orders
              </Link>
            </Box>
          </Box> 
        </Box>
      </Grid>
    </Layout>
  );
};

export default Dashboard;