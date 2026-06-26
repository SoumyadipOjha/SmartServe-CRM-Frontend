import React, { useEffect, useState } from 'react';
import {
  Avatar, Badge, Box, Button, Divider, Flex, Grid, GridItem,
  Heading, HStack, Icon, Spinner, Stack, Stat, StatLabel,
  StatNumber, StatHelpText, Tag, Text, VStack, useColorModeValue,
} from '@chakra-ui/react';
import {
  ArrowBackIcon, CalendarIcon, WarningIcon,
} from '@chakra-ui/icons';
import { MdEmail, MdPhone, MdShoppingBag, MdCampaign } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import CustomerService from '../services/customer.service';
import { CustomerProfile as CustomerProfileType, Order, CommunicationLog } from '../types/models';

// ── helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_ORDER_COLOR: Record<string, string> = {
  completed: 'green',
  pending: 'yellow',
  cancelled: 'red',
};

const STATUS_COMMS_COLOR: Record<string, string> = {
  sent: 'green',
  failed: 'red',
  pending: 'yellow',
};

function HealthBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    active:   { label: 'Active',   color: 'green' },
    at_risk:  { label: 'At Risk',  color: 'orange' },
    dormant:  { label: 'Dormant',  color: 'red' },
  };
  const { label, color } = map[status] ?? { label: status, color: 'gray' };
  return <Badge colorScheme={color} fontSize="sm" px={3} py={1} borderRadius="full">{label}</Badge>;
}

// ── sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, helpText }: { label: string; value: string; helpText?: string }) {
  const bg = useColorModeValue('white', 'gray.700');
  return (
    <Box bg={bg} borderWidth={1} borderRadius="lg" p={4} shadow="sm">
      <Stat>
        <StatLabel color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
          {label}
        </StatLabel>
        <StatNumber fontSize="2xl" fontWeight="bold">{value}</StatNumber>
        {helpText && <StatHelpText mb={0}>{helpText}</StatHelpText>}
      </Stat>
    </Box>
  );
}

function OrderCard({ order }: { order: Order }) {
  const bg = useColorModeValue('white', 'gray.700');
  return (
    <Box bg={bg} borderWidth={1} borderRadius="lg" p={4} shadow="sm">
      <Flex justify="space-between" align="flex-start" mb={2}>
        <HStack>
          <Icon as={MdShoppingBag} color="teal.400" />
          <Text fontWeight="semibold">{fmtCurrency(order.amount)}</Text>
        </HStack>
        <Badge colorScheme={STATUS_ORDER_COLOR[order.status] ?? 'gray'}>
          {order.status}
        </Badge>
      </Flex>

      <VStack align="stretch" spacing={1} mb={3}>
        {order.products.map((p, i) => (
          <Text key={i} fontSize="sm" color="gray.600">
            {p.name} × {p.quantity} — {fmtCurrency(p.price)}
          </Text>
        ))}
      </VStack>

      <HStack color="gray.400" fontSize="xs">
        <Icon as={CalendarIcon} />
        <Text>{fmtDate(order.orderDate)}</Text>
      </HStack>
    </Box>
  );
}

function CommsCard({ log }: { log: CommunicationLog }) {
  const bg = useColorModeValue('white', 'gray.700');
  const campaign = typeof log.campaign === 'object' ? log.campaign : null;
  return (
    <Box bg={bg} borderWidth={1} borderRadius="lg" p={4} shadow="sm">
      <Flex justify="space-between" align="flex-start" mb={2}>
        <HStack>
          <Icon as={MdCampaign} color="purple.400" />
          <Text fontWeight="semibold" fontSize="sm">
            {campaign ? campaign.name : 'Campaign'}
          </Text>
        </HStack>
        <Badge colorScheme={STATUS_COMMS_COLOR[log.status] ?? 'gray'}>
          {log.status}
        </Badge>
      </Flex>

      <Text fontSize="sm" color="gray.600" noOfLines={2} mb={3}>
        {log.message}
      </Text>

      {log.failureReason && (
        <HStack color="red.400" fontSize="xs" mb={2}>
          <Icon as={WarningIcon} />
          <Text>{log.failureReason}</Text>
        </HStack>
      )}

      <HStack color="gray.400" fontSize="xs">
        <Icon as={CalendarIcon} />
        <Text>{fmtDate(log.sentAt)}</Text>
      </HStack>
    </Box>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CustomerProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const headerBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    if (!id) return;
    CustomerService.getCustomerProfile(id)
      .then(setData)
      .catch(() => setError('Could not load customer profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Layout>
      <Box p={[3, 5, 8]} maxW="1100px" mx="auto">
        <Button
          leftIcon={<ArrowBackIcon />}
          variant="ghost"
          size="sm"
          mb={6}
          onClick={() => navigate('/customers')}
        >
          Back to Customers
        </Button>

        {loading && (
          <Flex justify="center" align="center" h="60vh">
            <Spinner size="xl" color="teal.400" />
          </Flex>
        )}

        {error && (
          <Flex justify="center" align="center" h="60vh">
            <Text color="red.400">{error}</Text>
          </Flex>
        )}

        {data && (() => {
          const { customer, orders, communicationLogs, stats } = data;
          return (
            <Stack spacing={8}>
              {/* ── HEADER CARD ── */}
              <Box bg={headerBg} borderWidth={1} borderRadius="xl" p={6} shadow="sm">
                <Flex gap={5} align="flex-start" direction={['column', 'row']}>
                  <Avatar
                    name={customer.name}
                    size="xl"
                    bg="teal.400"
                    color="white"
                    getInitials={initials}
                    flexShrink={0}
                  />
                  <Box flex={1}>
                    <Flex align="center" gap={3} wrap="wrap" mb={2}>
                      <Heading size="lg">{customer.name}</Heading>
                      <HealthBadge status={stats.healthStatus} />
                    </Flex>

                    <Stack spacing={1}>
                      <HStack color="gray.500" fontSize="sm">
                        <Icon as={MdEmail} />
                        <Text>{customer.email}</Text>
                      </HStack>
                      {customer.phone && (
                        <HStack color="gray.500" fontSize="sm">
                          <Icon as={MdPhone} />
                          <Text>{customer.phone}</Text>
                        </HStack>
                      )}
                      <HStack color="gray.400" fontSize="sm">
                        <Icon as={CalendarIcon} />
                        <Text>Customer since {fmtDate(customer.createdAt)}</Text>
                        <Text>·</Text>
                        <Text>Last active {fmtDate(customer.lastActivity)}</Text>
                      </HStack>
                    </Stack>
                  </Box>
                </Flex>
              </Box>

              {/* ── STATS ROW ── */}
              <Grid
                templateColumns={['repeat(2, 1fr)', 'repeat(2, 1fr)', 'repeat(4, 1fr)']}
                gap={4}
              >
                <StatCard
                  label="Lifetime Value"
                  value={fmtCurrency(customer.totalSpend)}
                  helpText={`avg ${fmtCurrency(stats.avgOrderValue)} / order`}
                />
                <StatCard
                  label="Total Orders"
                  value={String(stats.orderCount)}
                  helpText={stats.orderCount === 0 ? 'No orders yet' : undefined}
                />
                <StatCard
                  label="Total Visits"
                  value={String(customer.visits)}
                />
                <StatCard
                  label="Days Since Active"
                  value={String(stats.daysSinceLastActivity)}
                  helpText={
                    stats.daysSinceLastActivity <= 7 ? 'Recently active' :
                    stats.daysSinceLastActivity <= 30 ? 'Moderately active' :
                    'Needs re-engagement'
                  }
                />
              </Grid>

              {/* ── TWO COLUMN SECTIONS ── */}
              <Grid templateColumns={['1fr', '1fr', '1fr 1fr']} gap={8} alignItems="start">

                {/* Orders */}
                <GridItem>
                  <Flex align="center" justify="space-between" mb={4}>
                    <Heading size="md">Order History</Heading>
                    <Tag colorScheme="teal" size="sm">{orders.length} orders</Tag>
                  </Flex>
                  <Divider mb={4} />
                  {orders.length === 0 ? (
                    <Box
                      borderWidth={1} borderRadius="lg" borderStyle="dashed"
                      p={8} textAlign="center" color="gray.400"
                    >
                      <Icon as={MdShoppingBag} boxSize={8} mb={2} />
                      <Text>No orders yet</Text>
                    </Box>
                  ) : (
                    <Stack spacing={3}>
                      {orders.map(o => <OrderCard key={o._id} order={o} />)}
                    </Stack>
                  )}
                </GridItem>

                {/* Campaign history */}
                <GridItem>
                  <Flex align="center" justify="space-between" mb={4}>
                    <Heading size="md">Campaign History</Heading>
                    <Tag colorScheme="purple" size="sm">{communicationLogs.length} messages</Tag>
                  </Flex>
                  <Divider mb={4} />
                  {communicationLogs.length === 0 ? (
                    <Box
                      borderWidth={1} borderRadius="lg" borderStyle="dashed"
                      p={8} textAlign="center" color="gray.400"
                    >
                      <Icon as={MdCampaign} boxSize={8} mb={2} />
                      <Text>No campaigns received yet</Text>
                    </Box>
                  ) : (
                    <Stack spacing={3}>
                      {communicationLogs.map(log => <CommsCard key={log._id} log={log} />)}
                    </Stack>
                  )}
                </GridItem>
              </Grid>
            </Stack>
          );
        })()}
      </Box>
    </Layout>
  );
};

export default CustomerProfile;
