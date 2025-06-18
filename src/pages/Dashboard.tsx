import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  GridItem, 
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
  HStack
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import Layout from '../components/Layout';
import CustomerService from '../services/customer.service';
import OrderService from '../services/order.service';
import CampaignService from '../services/campaign.service';
import { Customer, Order, Campaign } from '../types/models';
import { FiUsers, FiShoppingCart, FiDollarSign, FiMail, FiTrendingUp, FiTrendingDown, FiArrowUp } from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

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
  const warningColor = useColorModeValue('orange.500', 'orange.300');

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
  
  // Calculate average order value
  const avgOrderValue = totalOrders ? (totalRevenue / totalOrders) : 0;
  
  // Get recent items for display
  const recentCustomers = customers.slice(0, 5);
  const recentOrders = orders.slice(0, 5);
  const recentCampaigns = campaigns.slice(0, 3);

  // Prepare chart data
  const prepareSalesData = () => {
    // Group orders by date
    const dateGroups: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    
    // Initialize with zeros
    last7Days.forEach(date => {
      dateGroups[date] = 0;
    });
    
    // Fill with actual data
    orders.forEach(order => {
      const date = new Date(order.orderDate).toISOString().split('T')[0];
      if (last7Days.includes(date)) {
        dateGroups[date] = (dateGroups[date] || 0) + order.amount;
      }
    });
    
    return {
      labels: last7Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString(undefined, { weekday: 'short' });
      }),
      datasets: [
        {
          label: 'Revenue',
          data: Object.values(dateGroups),
          fill: true,
          backgroundColor: 'rgba(56, 178, 172, 0.2)',
          borderColor: 'rgba(56, 178, 172, 1)',
          tension: 0.4
        }
      ]
    };
  };
  
  // Prepare campaign performance data
  const prepareCampaignData = () => {
    const sent = campaigns.reduce((sum, campaign) => sum + campaign.deliveryStats.sent, 0);
    const failed = campaigns.reduce((sum, campaign) => sum + campaign.deliveryStats.failed, 0);
    const total = sent + failed;
    
    return {
      labels: ['Sent', 'Failed'],
      datasets: [
        {
          data: [sent, failed],
          backgroundColor: ['rgba(56, 178, 172, 0.8)', 'rgba(245, 101, 101, 0.8)'],
          borderColor: ['rgba(56, 178, 172, 1)', 'rgba(245, 101, 101, 1)'],
          borderWidth: 1
        }
      ]
    };
  };

  // Prepare customer segments data (mock data, in real app would be from actual segmentation)
  const prepareCustomerSegmentsData = () => {
    // For demo, create segments based on order values
    const highValue = orders.filter(o => o.amount > 1000).length;
    const midValue = orders.filter(o => o.amount >= 500 && o.amount <= 1000).length;
    const lowValue = orders.filter(o => o.amount < 500).length;
    
    return {
      labels: ['High Value', 'Mid Value', 'Regular'],
      datasets: [
        {
          data: [highValue, midValue, lowValue],
          backgroundColor: ['rgba(56, 161, 105, 0.8)', 'rgba(214, 158, 46, 0.8)', 'rgba(113, 128, 150, 0.8)'],
          borderColor: ['rgba(56, 161, 105, 1)', 'rgba(214, 158, 46, 1)', 'rgba(113, 128, 150, 1)'],
          borderWidth: 1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <Flex justify="center" align="center" h="50vh">
          <Text>Loading dashboard data...</Text>
        </Flex>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Flex justify="center" align="center" h="50vh" direction="column">
          <Text color="red.500" mb={4}>{error}</Text>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size="lg">Dashboard Overview</Heading>
        <HStack>
          <Badge colorScheme="green" fontSize="md" p={2} borderRadius="md">
            <Flex align="center">
              <Icon as={FiTrendingUp} mr={1} />
              <Text>Live Data</Text>
            </Flex>
          </Badge>
        </HStack>
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

      {/* Charts Section */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Box p={6} bg={cardBg} shadow="md" borderRadius="lg" height="350px">
          <Flex justify="space-between" mb={4}>
            <Heading size="md">Revenue Trend (Last 7 Days)</Heading>
          </Flex>
          <Box height="calc(100% - 40px)">
            <Line data={prepareSalesData()} options={chartOptions} />
          </Box>
        </Box>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box p={6} bg={cardBg} shadow="md" borderRadius="lg">
            <Heading size="md" mb={4}>Campaign Performance</Heading>
            <Box height="200px">
              <Doughnut 
                data={prepareCampaignData()} 
                options={{
                  ...chartOptions,
                  cutout: '70%'
                }} 
              />
            </Box>
          </Box>
          
          <Box p={6} bg={cardBg} shadow="md" borderRadius="lg">
            <Heading size="md" mb={4}>Customer Segments</Heading>
            <Box height="200px">
              <Doughnut 
                data={prepareCustomerSegmentsData()} 
                options={{
                  ...chartOptions,
                  cutout: '70%'
                }} 
              />
            </Box>
          </Box>
        </SimpleGrid>
      </SimpleGrid>

      {/* Recent Activities Grid */}
      <Grid templateColumns={{ base: "1fr", lg: "1.5fr 1fr" }} gap={6}>
        <Box>
          <Heading size="md" mb={4}>Recent Orders</Heading>
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
                variant="outline" 
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
          
          <Box mt={8} p={6} bg={cardBg} shadow="md" borderRadius="lg">
            <Heading size="md" mb={4}>Performance Summary</Heading>
            <Stack spacing={4}>
              <Box>
                <Flex justify="space-between" mb={2}>
                  <Text fontWeight="medium">Average Order Value</Text>
                  <Text fontWeight="bold">${avgOrderValue.toFixed(2)}</Text>
                </Flex>
                <Progress value={Math.min(avgOrderValue / 20, 100)} size="sm" colorScheme="blue" borderRadius="full" />
              </Box>
              
              <Box>
                <Flex justify="space-between" mb={2}>
                  <Text fontWeight="medium">Campaign Success Rate</Text>
                  <Text fontWeight="bold">
                    {totalCampaigns && campaigns.reduce((sum, c) => sum + c.deliveryStats.sent, 0) > 0
                      ? Math.round(
                          (campaigns.reduce((sum, c) => sum + c.deliveryStats.sent, 0) /
                            (campaigns.reduce((sum, c) => sum + c.deliveryStats.sent, 0) +
                              campaigns.reduce((sum, c) => sum + c.deliveryStats.failed, 0))) *
                            100
                        )
                      : 0}%
                  </Text>
                </Flex>
                <Progress 
                  value={
                    totalCampaigns && campaigns.reduce((sum, c) => sum + c.deliveryStats.sent, 0) > 0
                      ? (campaigns.reduce((sum, c) => sum + c.deliveryStats.sent, 0) /
                         (campaigns.reduce((sum, c) => sum + c.deliveryStats.sent, 0) +
                          campaigns.reduce((sum, c) => sum + c.deliveryStats.failed, 0))) *
                        100
                      : 0
                  } 
                  size="sm" 
                  colorScheme="green" 
                  borderRadius="full" 
                />
              </Box>
              
              <Box mt={2} textAlign="center">
                <Button 
                  as={RouterLink} 
                  to="/campaigns/create" 
                  leftIcon={<FiMail />}
                  colorScheme="teal"
                  size="sm"
                >
                  Create New Campaign
                </Button>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Grid>
    </Layout>
  );
};

export default Dashboard;