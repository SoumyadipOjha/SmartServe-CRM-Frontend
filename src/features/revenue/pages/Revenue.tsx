import React, { useEffect, useState } from 'react';
import {
  Box, Flex, Grid, Heading, HStack, Spinner, Stat, StatArrow,
  StatHelpText, StatLabel, StatNumber, Text, useColorModeValue, Badge,
} from '@chakra-ui/react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import Layout from '../../../shared/components/Layout';
import apiClient from '../../../lib/api-client';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
);

// ── types ─────────────────────────────────────────────────────────────────────

interface MonthlyPoint  { month: string; revenue: number; orders: number }
interface ForecastPoint { month: string; projected: number }
interface StageData     { count: number; value: number }
interface WonLostPoint  { month: string; won: number; lost: number; wonValue: number; lostValue: number }

interface ForecastData {
  monthlyRevenue: MonthlyPoint[];
  forecast:       ForecastPoint[];
  pipeline: {
    byStage:          Record<string, StageData>;
    weightedValue:    number;
    totalActiveValue: number;
  };
  wonLost: { byMonth: WonLostPoint[]; winRate: number | null; totalWon: number; totalLost: number };
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return '$' + (n / 1_000).toFixed(1) + 'k';
  return '$' + n.toLocaleString();
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split('-');
  return new Date(+y, +m - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
}

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead', contacted: 'Contacted', proposal: 'Proposal',
  negotiation: 'Negotiation', won: 'Won', lost: 'Lost',
};
const STAGE_COLORS: Record<string, string> = {
  lead: '#A0AEC0', contacted: '#63B3ED', proposal: '#B794F4',
  negotiation: '#F6AD55', won: '#68D391', lost: '#FC8181',
};
const STAGE_PROB: Record<string, number> = {
  lead: 10, contacted: 25, proposal: 50, negotiation: 75, won: 100, lost: 0,
};

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, trend }: {
  label: string; value: string; sub?: string; trend?: 'increase' | 'decrease';
}) {
  const bg = useColorModeValue('white', 'gray.700');
  return (
    <Box bg={bg} borderWidth={1} borderRadius="xl" p={5} shadow="sm">
      <Stat>
        <StatLabel color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
          {label}
        </StatLabel>
        <StatNumber fontSize="2xl" fontWeight="bold">{value}</StatNumber>
        {sub && (
          <StatHelpText mb={0}>
            {trend && <StatArrow type={trend} />}
            {sub}
          </StatHelpText>
        )}
      </Stat>
    </Box>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

const Revenue: React.FC = () => {
  const [data, setData]     = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const cardBg = useColorModeValue('white', 'gray.700');
  const gridBg = useColorModeValue('gray.50', 'gray.800');

  useEffect(() => {
    apiClient.get<ForecastData>('/analytics/forecast')
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load forecast data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><Flex justify="center" mt={20}><Spinner size="xl" color="teal.400" /></Flex></Layout>;
  if (error || !data) return <Layout><Flex justify="center" mt={20}><Text color="red.400">{error}</Text></Flex></Layout>;

  const { monthlyRevenue, forecast, pipeline, wonLost } = data;

  // ── Revenue + forecast line chart ──────────────────────────────────────────
  const allMonths   = [...monthlyRevenue.map(m => fmtMonth(m.month)), ...forecast.map(f => fmtMonth(f.month))];
  const actualVals  = monthlyRevenue.map(m => m.revenue);
  const forecastVals = [
    ...new Array(monthlyRevenue.length - 1).fill(null),
    monthlyRevenue[monthlyRevenue.length - 1].revenue, // connect line
    ...forecast.map(f => f.projected),
  ];

  const revenueChartData = {
    labels: allMonths,
    datasets: [
      {
        label: 'Actual Revenue',
        data: actualVals,
        borderColor: '#38B2AC',
        backgroundColor: 'rgba(56,178,172,0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
      {
        label: 'Projected Revenue',
        data: forecastVals,
        borderColor: '#F6AD55',
        backgroundColor: 'rgba(246,173,85,0.10)',
        borderDash: [6, 4],
        fill: false,
        tension: 0.4,
        pointRadius: 3,
      },
    ],
  };

  const revenueChartOpts = {
    responsive: true,
    plugins: { legend: { position: 'top' as const }, title: { display: false } },
    scales: {
      y: { ticks: { callback: (v: any) => fmtCurrency(v) } },
    },
  };

  // ── Won vs Lost bar chart ─────────────────────────────────────────────────
  const wlMonths = wonLost.byMonth.map(m => fmtMonth(m.month));
  const wonLostChartData = {
    labels: wlMonths,
    datasets: [
      { label: 'Won',  data: wonLost.byMonth.map(m => m.won),  backgroundColor: 'rgba(104,211,145,0.8)' },
      { label: 'Lost', data: wonLost.byMonth.map(m => m.lost), backgroundColor: 'rgba(252,129,129,0.8)' },
    ],
  };

  // ── Pipeline bar by stage ─────────────────────────────────────────────────
  const activeStages = ['lead','contacted','proposal','negotiation'];
  const pipelineChartData = {
    labels: activeStages.map(s => STAGE_LABELS[s]),
    datasets: [{
      label: 'Pipeline Value',
      data:  activeStages.map(s => pipeline.byStage[s]?.value || 0),
      backgroundColor: activeStages.map(s => STAGE_COLORS[s]),
      borderRadius: 6,
    }],
  };
  const pipelineChartOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { ticks: { callback: (v: any) => fmtCurrency(v) } } },
  };

  // KPI calcs
  const totalActualRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
  const lastMonth  = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;
  const prevMonth  = monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0;
  const momChange  = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;

  return (
    <Layout>
      <Box p={[3, 5, 6]}>
        <Heading size="lg" mb={1}>Revenue Forecast</Heading>
        <Text color="gray.500" fontSize="sm" mb={6}>
          12-month actuals · 3-month projection · deal pipeline weighted by stage probability
        </Text>

        {/* ── KPI row ── */}
        <Grid templateColumns={['1fr', '1fr 1fr', 'repeat(4,1fr)']} gap={3} mb={8}>
          <KpiCard
            label="12-Month Revenue"
            value={fmtCurrency(totalActualRevenue)}
            sub="from orders"
          />
          <KpiCard
            label="Last Month"
            value={fmtCurrency(lastMonth)}
            sub={`${Math.abs(momChange).toFixed(1)}% vs prev month`}
            trend={momChange >= 0 ? 'increase' : 'decrease'}
          />
          <KpiCard
            label="Weighted Pipeline"
            value={fmtCurrency(pipeline.weightedValue)}
            sub="probability-adjusted"
          />
          <KpiCard
            label="Win Rate"
            value={wonLost.winRate !== null ? `${wonLost.winRate}%` : '—'}
            sub={`${wonLost.totalWon} won · ${wonLost.totalLost} lost`}
          />
        </Grid>

        {/* ── Revenue + Forecast line ── */}
        <Box bg={cardBg} borderWidth={1} borderRadius="xl" p={[3, 5]} shadow="sm" mb={6}>
          <Heading size="sm" mb={4}>Revenue Trend & 3-Month Forecast</Heading>
          <Box overflowX="auto">
            <Box minW={{ base: '300px', md: '480px' }}>
              <Line data={revenueChartData} options={revenueChartOpts} />
            </Box>
          </Box>
        </Box>

        <Grid templateColumns={['1fr', '1fr', '1fr 1fr']} gap={6} mb={6}>
          {/* ── Pipeline by stage ── */}
          <Box bg={cardBg} borderWidth={1} borderRadius="xl" p={[3, 5]} shadow="sm">
            <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
              <Heading size="sm">Active Pipeline by Stage</Heading>
              <Text fontSize="xs" color="gray.500">Total: {fmtCurrency(pipeline.totalActiveValue)}</Text>
            </Flex>
            <Box overflowX="auto">
              <Box minW="280px">
                <Bar data={pipelineChartData} options={pipelineChartOpts} />
              </Box>
            </Box>

            {/* Stage breakdown table */}
            <Box mt={4} bg={gridBg} borderRadius="lg" overflow="hidden" overflowX="auto">
              {activeStages.map(s => {
                const { count, value } = pipeline.byStage[s] || { count: 0, value: 0 };
                return (
                  <Flex key={s} px={3} py={2} align="center" borderBottomWidth={1} borderColor="gray.100" _last={{ borderBottom: 0 }}>
                    <Box w={2} h={2} borderRadius="full" bg={STAGE_COLORS[s]} mr={2} flexShrink={0} />
                    <Text fontSize="sm" flex={1}>{STAGE_LABELS[s]}</Text>
                    <HStack spacing={3}>
                      <Badge colorScheme="gray" fontSize="xs">{count} deal{count !== 1 ? 's' : ''}</Badge>
                      <Badge colorScheme="gray" fontSize="xs">{STAGE_PROB[s]}% prob</Badge>
                      <Text fontSize="sm" fontWeight="semibold" w="70px" textAlign="right">{fmtCurrency(value)}</Text>
                    </HStack>
                  </Flex>
                );
              })}
            </Box>
          </Box>

          {/* ── Won vs Lost ── */}
          <Box bg={cardBg} borderWidth={1} borderRadius="xl" p={[3, 5]} shadow="sm">
            <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
              <Heading size="sm">Won vs Lost (12 months)</Heading>
              {wonLost.winRate !== null && (
                <Badge colorScheme={wonLost.winRate >= 50 ? 'green' : 'orange'} fontSize="sm" px={2}>
                  {wonLost.winRate}% win rate
                </Badge>
              )}
            </Flex>
            <Box overflowX="auto">
              <Box minW="280px">
                <Bar
                  data={wonLostChartData}
                  options={{ responsive: true, plugins: { legend: { position: 'top' as const } } }}
                />
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* ── Forecast table ── */}
        <Box bg={cardBg} borderWidth={1} borderRadius="xl" p={[3, 5]} shadow="sm">
          <Heading size="sm" mb={4}>3-Month Revenue Projection</Heading>
          <Text fontSize="xs" color="gray.400" mb={3}>
            Based on 3-month trailing average of actual order revenue
          </Text>
          <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap={4}>
            {forecast.map(f => (
              <Box key={f.month} bg={gridBg} borderRadius="lg" p={4} textAlign="center">
                <Text fontSize="xs" color="gray.500" mb={1}>{fmtMonth(f.month)}</Text>
                <Text fontSize="xl" fontWeight="bold" color="orange.400">{fmtCurrency(f.projected)}</Text>
                <Text fontSize="xs" color="gray.400">projected</Text>
              </Box>
            ))}
          </Grid>
        </Box>
      </Box>
    </Layout>
  );
};

export default Revenue;
