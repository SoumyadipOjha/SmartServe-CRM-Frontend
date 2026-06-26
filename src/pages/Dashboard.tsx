import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  HStack,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { Link as RouterLink } from 'react-router-dom';
import Layout from '../components/Layout';
import AnalyticsService, { AnalyticsSummary } from '../services/analytics.service';
import { FiUsers, FiShoppingCart, FiDollarSign, FiMail, FiArrowUp, FiWifi, FiWifiOff } from 'react-icons/fi';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const pulseAnim = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`;

const formatSecondsAgo = (s: number): string => {
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':    return 'green';
    case 'queued':    return 'orange';
    case 'completed': return 'teal';
    case 'cancelled': return 'red';
    default:          return 'blue';
  }
};

const Dashboard: React.FC = () => {
  const [summary, setSummary]         = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [isLive, setIsLive]           = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo]   = useState(0);
  const esRef = useRef<EventSource | null>(null);

  const cardBg      = useColorModeValue('white', 'gray.700');
  const textColor   = useColorModeValue('gray.700', 'gray.200');
  const subtleText  = useColorModeValue('gray.500', 'gray.400');
  const successColor = useColorModeValue('teal.500', 'teal.300');

  // ── Data fetching + SSE ────────────────────────────────────────────────────

  useEffect(() => {
    // Immediate REST fetch so the page isn't blank while SSE connects
    AnalyticsService.getSummary()
      .then(data => {
        setSummary(data);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load dashboard data');
        setLoading(false);
      });

    // SSE for live push updates
    const url = AnalyticsService.getStreamUrl();
    const es  = new EventSource(url);
    esRef.current = es;

    es.addEventListener('summary', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as AnalyticsSummary;
        setSummary(data);
        setLastUpdated(new Date());
        setIsLive(true);
        setLoading(false);
      } catch (_) {}
    });

    es.addEventListener('heartbeat', () => setIsLive(true));
    es.onerror = () => setIsLive(false);

    return () => {
      es.close();
    };
  }, []);

  // Tick the "X seconds ago" counter every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (lastUpdated) {
        setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // ── Chart data ─────────────────────────────────────────────────────────────

  const revenueChartData = useMemo(() => {
    if (!summary) return { labels: [], datasets: [] };
    const days = summary.orders.revenueByDay;
    return {
      labels: days.map(d => {
        const date = new Date(d.date + 'T12:00:00');
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }),
      datasets: [{
        label: 'Revenue ($)',
        data: days.map(d => d.revenue),
        fill: true,
        backgroundColor: 'rgba(56, 178, 172, 0.12)',
        borderColor: 'rgba(56, 178, 172, 1)',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      }],
    };
  }, [summary]);

  const healthChartData = useMemo(() => {
    if (!summary) return { labels: [], datasets: [] };
    const { health } = summary.customers;
    return {
      labels: ['Active', 'At Risk', 'Dormant'],
      datasets: [{
        data: [health.active, health.at_risk, health.dormant],
        backgroundColor: [
          'rgba(56, 161, 105, 0.8)',
          'rgba(214, 158, 46, 0.8)',
          'rgba(113, 128, 150, 0.8)',
        ],
        borderColor: [
          'rgba(56, 161, 105, 1)',
          'rgba(214, 158, 46, 1)',
          'rgba(113, 128, 150, 1)',
        ],
        borderWidth: 1,
      }],
    };
  }, [summary]);

  const deliveryChartData = useMemo(() => {
    if (!summary) return { labels: [], datasets: [] };
    const { delivery } = summary.campaigns;
    return {
      labels: ['Delivered', 'Failed'],
      datasets: [{
        data: [delivery.sent, delivery.failed],
        backgroundColor: ['rgba(56, 178, 172, 0.8)', 'rgba(245, 101, 101, 0.8)'],
        borderColor:     ['rgba(56, 178, 172, 1)',   'rgba(245, 101, 101, 1)'],
        borderWidth: 1,
      }],
    };
  }, [summary]);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` $${ctx.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: { ticks: { maxTicksLimit: 7, maxRotation: 0 } },
      y: { ticks: { callback: (v: any) => `$${Number(v).toLocaleString()}` } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: true, position: 'bottom' as const } },
  };

  // ── Render guards ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <Flex justify="center" align="center" h="50vh">
          <Text>Loading dashboard data…</Text>
        </Flex>
      </Layout>
    );
  }

  if (error || !summary) {
    return (
      <Layout>
        <Flex justify="center" align="center" h="50vh" direction="column">
          <Text color="red.500" mb={4}>{error || 'No data available'}</Text>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Flex>
      </Layout>
    );
  }

  const { customers, orders, campaigns } = summary;
  const recentCampaigns = campaigns.recent;

  return (
    <Layout>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={2}>
        <Heading as="h1" size="lg">Dashboard Overview</Heading>
        <HStack spacing={3}>
          {lastUpdated && (
            <Text fontSize="sm" color={subtleText}>
              Updated {formatSecondsAgo(secondsAgo)}
            </Text>
          )}
          <Badge
            colorScheme={isLive ? 'green' : 'gray'}
            fontSize="sm"
            px={3}
            py={1}
            borderRadius="full"
          >
            <Flex align="center" gap={1}>
              <Box
                w={2}
                h={2}
                borderRadius="full"
                bg={isLive ? 'green.400' : 'gray.400'}
                animation={isLive ? `${pulseAnim} 1.5s ease-in-out infinite` : undefined}
              />
              <Icon as={isLive ? FiWifi : FiWifiOff} boxSize={3} />
              <Text ml={1}>{isLive ? 'Live' : 'Offline'}</Text>
            </Flex>
          </Badge>
        </HStack>
      </Flex>

      {/* ── Key Metrics ────────────────────────────────────────────────────── */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>

        {/* Customers */}
        <Stat
          p={6} shadow="md" borderRadius="lg" bg={cardBg}
          borderLeft="4px solid" borderColor="teal.400"
          transition="transform 0.2s" _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
        >
          <Flex justify="space-between">
            <Box>
              <StatLabel fontSize="sm" color={subtleText}>Total Customers</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
                {customers.total}
              </StatNumber>
              <StatHelpText mb={0}>
                <HStack spacing={2} mt={1} fontSize="xs">
                  <Badge colorScheme="green" variant="subtle">{customers.health.active} active</Badge>
                  <Badge colorScheme="orange" variant="subtle">{customers.health.at_risk} at risk</Badge>
                </HStack>
              </StatHelpText>
            </Box>
            <Flex w="12" h="12" bg="teal.50" color="teal.400" borderRadius="full" align="center" justify="center">
              <Icon as={FiUsers} boxSize="6" />
            </Flex>
          </Flex>
        </Stat>

        {/* Revenue */}
        <Stat
          p={6} shadow="md" borderRadius="lg" bg={cardBg}
          borderLeft="4px solid" borderColor="green.400"
          transition="transform 0.2s" _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
        >
          <Flex justify="space-between">
            <Box>
              <StatLabel fontSize="sm" color={subtleText}>Total Revenue</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
                ${orders.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </StatNumber>
              <StatHelpText mb={0}>
                <Flex align="center" color="green.500" fontSize="sm">
                  <Icon as={FiArrowUp} mr={1} />
                  Avg ${orders.avgOrderValue.toFixed(2)} / order
                </Flex>
              </StatHelpText>
            </Box>
            <Flex w="12" h="12" bg="green.50" color="green.400" borderRadius="full" align="center" justify="center">
              <Icon as={FiDollarSign} boxSize="6" />
            </Flex>
          </Flex>
        </Stat>

        {/* Orders */}
        <Stat
          p={6} shadow="md" borderRadius="lg" bg={cardBg}
          borderLeft="4px solid" borderColor="blue.400"
          transition="transform 0.2s" _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
        >
          <Flex justify="space-between">
            <Box>
              <StatLabel fontSize="sm" color={subtleText}>Total Orders</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
                {orders.total}
              </StatNumber>
              <StatHelpText mb={0}>
                <Link as={RouterLink} to="/orders" color={successColor} fontSize="sm">
                  View all orders
                </Link>
              </StatHelpText>
            </Box>
            <Flex w="12" h="12" bg="blue.50" color="blue.400" borderRadius="full" align="center" justify="center">
              <Icon as={FiShoppingCart} boxSize="6" />
            </Flex>
          </Flex>
        </Stat>

        {/* Campaigns */}
        <Stat
          p={6} shadow="md" borderRadius="lg" bg={cardBg}
          borderLeft="4px solid" borderColor="purple.400"
          transition="transform 0.2s" _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
        >
          <Flex justify="space-between">
            <Box>
              <StatLabel fontSize="sm" color={subtleText}>Campaigns</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color={textColor}>
                {campaigns.total}
              </StatNumber>
              <StatHelpText mb={0}>
                <HStack spacing={2} mt={1} fontSize="xs">
                  {campaigns.active > 0 && (
                    <Badge colorScheme="green" variant="subtle">
                      {campaigns.active} running
                    </Badge>
                  )}
                  <Badge colorScheme="teal" variant="subtle">
                    {campaigns.deliveryRate}% delivery
                  </Badge>
                </HStack>
              </StatHelpText>
            </Box>
            <Flex w="12" h="12" bg="purple.50" color="purple.400" borderRadius="full" align="center" justify="center">
              <Icon as={FiMail} boxSize="6" />
            </Flex>
          </Flex>
        </Stat>
      </SimpleGrid>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        {/* 30-day revenue line chart */}
        <Box p={{ base: 4, md: 6 }} bg={cardBg} shadow="md" borderRadius="lg" height={{ base: '260px', md: '350px' }}>
          <Heading size={{ base: 'sm', md: 'md' }} mb={3}>Revenue Trend (Last 30 Days)</Heading>
          <Box height="calc(100% - 40px)">
            <Line data={revenueChartData} options={lineChartOptions as any} />
          </Box>
        </Box>

        {/* Delivery + Health doughnuts */}
        <SimpleGrid columns={2} spacing={{ base: 3, md: 6 }}>
          <Box p={{ base: 3, md: 5 }} bg={cardBg} shadow="md" borderRadius="lg">
            <Heading size="sm" mb={2}>Campaign Delivery</Heading>
            <Box height={{ base: '140px', md: '190px' }}>
              <Doughnut data={deliveryChartData} options={doughnutOptions} />
            </Box>
          </Box>
          <Box p={{ base: 3, md: 5 }} bg={cardBg} shadow="md" borderRadius="lg">
            <Heading size="sm" mb={2}>Customer Health</Heading>
            <Box height={{ base: '140px', md: '190px' }}>
              <Doughnut data={healthChartData} options={doughnutOptions} />
            </Box>
          </Box>
        </SimpleGrid>
      </SimpleGrid>

      {/* ── Recent Activity ─────────────────────────────────────────────────── */}
      <Grid templateColumns={{ base: '1fr', lg: '1.5fr 1fr' }} gap={6}>

        {/* Recent Campaigns */}
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">Recent Campaigns</Heading>
            <Link as={RouterLink} to="/campaigns" color={successColor} fontSize="sm" fontWeight="medium">
              View all
            </Link>
          </Flex>
          <Stack spacing={4}>
            {recentCampaigns.length > 0 ? (
              recentCampaigns.map(campaign => {
                const deliveryPct = campaign.audienceSize > 0
                  ? Math.round((campaign.deliveryStats.sent / campaign.audienceSize) * 100)
                  : 0;
                return (
                  <Box
                    key={campaign._id}
                    p={5}
                    bg={cardBg}
                    shadow="md"
                    borderRadius="lg"
                    transition="transform 0.2s"
                    _hover={{ transform: 'translateY(-2px)' }}
                  >
                    <Flex justify="space-between" mb={2} align="flex-start">
                      <Box>
                        <Text
                          as={RouterLink}
                          to={`/campaigns/${campaign._id}`}
                          fontWeight="semibold"
                          color="teal.500"
                          _hover={{ textDecoration: 'underline' }}
                        >
                          {campaign.name}
                        </Text>
                        {campaign.isAbTest && (
                          <Badge colorScheme="purple" fontSize="xs" ml={2}>A/B</Badge>
                        )}
                      </Box>
                      <Badge colorScheme={getStatusColor(campaign.status)} flexShrink={0}>
                        {campaign.status}
                      </Badge>
                    </Flex>
                    <Text fontSize="sm" color={subtleText} mb={3}>
                      Audience: {campaign.audienceSize.toLocaleString()}
                    </Text>
                    <Box>
                      <Flex justify="space-between" mb={1}>
                        <Text fontSize="xs" color={subtleText}>Delivery rate</Text>
                        <Text fontSize="xs" fontWeight="bold">{deliveryPct}%</Text>
                      </Flex>
                      <Progress
                        value={deliveryPct}
                        size="sm"
                        colorScheme="teal"
                        borderRadius="full"
                      />
                    </Box>
                    <Flex fontSize="xs" justify="space-between" mt={2} color={subtleText}>
                      <Text>Sent: {campaign.deliveryStats.sent.toLocaleString()}</Text>
                      <Text>Failed: {campaign.deliveryStats.failed.toLocaleString()}</Text>
                      <Text>{new Date(campaign.createdAt).toLocaleDateString()}</Text>
                    </Flex>
                  </Box>
                );
              })
            ) : (
              <Box p={5} bg={cardBg} shadow="md" borderRadius="lg">
                <Text color={subtleText}>No campaigns yet</Text>
              </Box>
            )}
            <Box textAlign="center">
              <Button as={RouterLink} to="/campaigns" colorScheme="teal" variant="outline" size="sm">
                View all campaigns
              </Button>
            </Box>
          </Stack>
        </Box>

        {/* Performance Summary */}
        <Box>
          <Heading size="md" mb={4}>Performance Summary</Heading>
          <Box p={6} bg={cardBg} shadow="md" borderRadius="lg" mb={6}>
            <Stack spacing={5}>
              <Box>
                <Flex justify="space-between" mb={2}>
                  <Text fontWeight="medium">Average Order Value</Text>
                  <Text fontWeight="bold">${orders.avgOrderValue.toFixed(2)}</Text>
                </Flex>
                <Progress
                  value={Math.min((orders.avgOrderValue / 2000) * 100, 100)}
                  size="sm"
                  colorScheme="blue"
                  borderRadius="full"
                />
              </Box>

              <Box>
                <Flex justify="space-between" mb={2}>
                  <Text fontWeight="medium">Campaign Delivery Rate</Text>
                  <Text fontWeight="bold">{campaigns.deliveryRate}%</Text>
                </Flex>
                <Progress
                  value={campaigns.deliveryRate}
                  size="sm"
                  colorScheme="green"
                  borderRadius="full"
                />
              </Box>

              <Divider />

              {/* Customer health breakdown */}
              <Box>
                <Text fontWeight="medium" mb={3}>Customer Health</Text>
                <Stack spacing={2}>
                  {[
                    { label: 'Active (last 30d)',  count: customers.health.active,  color: 'green'  },
                    { label: 'At Risk (30–60d)',   count: customers.health.at_risk,  color: 'orange' },
                    { label: 'Dormant (60d+)',     count: customers.health.dormant,  color: 'gray'   },
                  ].map(({ label, count, color }) => (
                    <Flex key={label} justify="space-between" align="center">
                      <HStack spacing={2}>
                        <Box w={2} h={2} borderRadius="full" bg={`${color}.400`} />
                        <Text fontSize="sm">{label}</Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="bold">{count}</Text>
                    </Flex>
                  ))}
                </Stack>
              </Box>

              <Divider />

              {/* All-time delivery */}
              <Box>
                <Text fontWeight="medium" mb={2}>All-Time Deliveries</Text>
                <Flex justify="space-between" fontSize="sm">
                  <Text color="teal.500" fontWeight="bold">
                    {campaigns.delivery.sent.toLocaleString()} sent
                  </Text>
                  <Text color="red.400" fontWeight="bold">
                    {campaigns.delivery.failed.toLocaleString()} failed
                  </Text>
                </Flex>
              </Box>

              <Box textAlign="center">
                <Button
                  as={RouterLink}
                  to="/campaigns"
                  leftIcon={<Icon as={FiMail} />}
                  colorScheme="teal"
                  size="sm"
                >
                  Create Campaign
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
