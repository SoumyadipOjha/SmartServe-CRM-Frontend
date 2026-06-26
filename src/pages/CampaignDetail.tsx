import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Heading,
  Text,
  Grid,
  GridItem,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Alert,
  AlertTitle,
  AlertDescription,
  useToast,
  Progress,
  Card,
  CardHeader,
  CardBody,
  Stack,
  List,
  ListItem,
  HStack,
  Tag,
  Spinner,
} from '@chakra-ui/react';
import { ArrowBackIcon, AlertIcon } from '@chakra-ui/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Layout from '../components/Layout';
import CampaignService from '../services/campaign.service';
import { Campaign, CampaignJob, RuleCondition } from '../types/models';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [job, setJob] = useState<CampaignJob | null>(null);
  const refreshIntervalRef = useRef<number | null>(null);
  const jobPollRef = useRef<number | null>(null);
  
  // Add these refs to control refresh behavior
  const stableCountRef = useRef<number>(0);
  const lastStatsRef = useRef<{ sent: number; opened: number; failed: number }>({ sent: 0, opened: 0, failed: 0 });
  const totalRefreshAttempts = useRef<number>(0);
  const maxRefreshAttempts = 20; // Limit the number of refresh attempts
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    fetchCampaign();

    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      if (jobPollRef.current) {
        clearInterval(jobPollRef.current);
        jobPollRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!campaign || !mountedRef.current) return;

    // Clean up existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (campaign.status === 'active') {
      const totalProcessed = campaign.deliveryStats.sent + campaign.deliveryStats.failed;

      // Store current stats for comparison
      lastStatsRef.current = {
        sent:   campaign.deliveryStats.sent,
        opened: campaign.deliveryStats.opened ?? 0,
        failed: campaign.deliveryStats.failed,
      };

      // Check if we need to continue refreshing
      const allProcessed = totalProcessed >= campaign.audienceSize;

      if (allProcessed) {
        console.log('All messages processed, no need to refresh');
        return;
      }

      // Reset refresh counters when we start a new refresh cycle
      if (!isRefreshing) {
        totalRefreshAttempts.current = 0;
        stableCountRef.current = 0;
      }

      // Start a new refresh interval with a longer delay (3s instead of 1.5s)
      // to reduce server load and prevent excessive refreshing
      refreshIntervalRef.current = window.setInterval(() => {
        if (mountedRef.current) {
          refreshCampaignStats();
        }
      }, 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.status, campaign?.audienceSize]);

  // Auto-start job polling when campaign enters queued/active state
  useEffect(() => {
    if (!campaign || !id) return;
    if ((campaign.status === 'queued' || campaign.status === 'active') && !jobPollRef.current) {
      startJobPolling(id);
    }
    if (campaign.status === 'completed' || campaign.status === 'cancelled') {
      if (jobPollRef.current) {
        clearInterval(jobPollRef.current);
        jobPollRef.current = null;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.status]);

  const fetchCampaign = async () => {
    if (!id || !mountedRef.current) return;

    try {
      setLoading(true);
      const data = await CampaignService.getCampaign(id);
      
      // Let's get fresh stats immediately as part of the initial load
      let latestData = data;
      
      // If campaign has an audience, always get the latest stats
      if (data.audienceSize > 0) {
        try {
          const stats = await CampaignService.getCampaignStats(id);
          
          // Update with fresh stats
          latestData = {
            ...data,
            deliveryStats: {
              sent:   stats.sent,
              opened: stats.opened ?? 0,
              failed: stats.failed,
            },
            audienceSize: stats.audienceSize
          };

          // Check if campaign should be marked completed based on stats
          const totalProcessed = stats.sent + (stats.opened ?? 0) + stats.failed;
          const isCompleted = totalProcessed >= stats.audienceSize && stats.audienceSize > 0;
          
          if (isCompleted && latestData.status === 'active') {
            latestData.status = 'completed';
            // If campaign is now complete, we should update it in the database
            try {
              await updateCampaignStatusIfNeeded(id, 'completed');
            } catch (err) {
              console.error('Error updating campaign status:', err);
              // Non-critical error, continue showing the page
            }
          }
        } catch (err) {
          console.error('Error fetching campaign stats during initial load:', err);
          // We'll still show the campaign with potentially stale stats
        }
      }

      // Only set state if component is still mounted
      if (mountedRef.current) {
        setCampaign(latestData);
        setError(null);

        // Store the stats reference for comparison
        if (latestData.deliveryStats) {
          lastStatsRef.current = {
            sent:   latestData.deliveryStats.sent,
            opened: latestData.deliveryStats.opened ?? 0,
            failed: latestData.deliveryStats.failed,
          };
        }

        // Only set up refresh interval if campaign is active and not all messages processed
        if (latestData.status === 'active') {
          const totalProcessed = latestData.deliveryStats.sent + (latestData.deliveryStats.opened ?? 0) + latestData.deliveryStats.failed;
          if (totalProcessed < latestData.audienceSize) {
            setupRefreshInterval();
          }
        }
      }
    } catch (err) {
      console.error('Error fetching campaign:', err);
      if (mountedRef.current) {
        setError('Failed to load campaign details');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };
  
  // Helper function to set up refresh interval
  const setupRefreshInterval = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = window.setInterval(() => {
      if (mountedRef.current) {
        refreshCampaignStats();
      }
    }, 3000);
  };
  
  const startJobPolling = (campaignId: string) => {
    if (jobPollRef.current) clearInterval(jobPollRef.current);
    jobPollRef.current = window.setInterval(async () => {
      if (!mountedRef.current) return;
      try {
        const latestJob = await CampaignService.getJobStatus(campaignId);
        if (!mountedRef.current) return;
        setJob(latestJob);
        if (latestJob.status === 'completed' || latestJob.status === 'failed') {
          clearInterval(jobPollRef.current!);
          jobPollRef.current = null;
          // Refresh campaign data to get final status
          setTimeout(() => { if (mountedRef.current) fetchCampaign(); }, 500);
        }
      } catch {
        // job endpoint returns 404 if no job yet — safe to ignore
      }
    }, 1500);
  };

  // Helper function to update campaign status in the backend if needed
  const updateCampaignStatusIfNeeded = async (campaignId: string, newStatus: string) => {
    // This would require a new endpoint in your API, or you could handle it
    // in your backend when stats are fetched
    console.log(`Campaign ${campaignId} should be marked as ${newStatus}`);
    // Uncomment and implement if you add this API endpoint
    // await apiClient.patch(`/campaigns/${campaignId}/status`, { status: newStatus });
  };

  // More accurate function to determine campaign completion status
  const checkCampaignCompletion = (stats: { sent: number; opened?: number; failed: number; audienceSize: number }) => {
    const totalProcessed = stats.sent + (stats.opened ?? 0) + stats.failed;
    return totalProcessed >= stats.audienceSize && stats.audienceSize > 0;
  };

  // More reliable function to refresh campaign stats
  const refreshCampaignStats = async (force = false) => {
    if (!id || !campaign || !mountedRef.current) return;

    // Rate limit refreshes unless forced
    const now = Date.now();
    if (!force && now - lastRefreshTime.current < 2000) {
      return; // Don't refresh more than once every 2 seconds
    }

    lastRefreshTime.current = now;
    totalRefreshAttempts.current++;

    try {
      setIsRefreshing(true);
      const stats = await CampaignService.getCampaignStats(id);

      if (!mountedRef.current) return;

      // Compare with last stats to detect changes
      const statsChanged =
        stats.sent   !== lastStatsRef.current.sent   ||
        (stats.opened ?? 0) !== lastStatsRef.current.opened ||
        stats.failed !== lastStatsRef.current.failed;

      if (statsChanged) {
        // Stats changed, reset stable counter
        stableCountRef.current = 0;
      } else {
        // Stats haven't changed, increment stable counter
        stableCountRef.current++;
      }

      // Check if campaign should be marked as completed
      const isCompleted = checkCampaignCompletion(stats);

      // Update the stats and potentially the status
      setCampaign((prevCampaign) => {
        if (!prevCampaign) return null;

        return {
          ...prevCampaign,
          deliveryStats: {
            sent:   stats.sent,
            opened: stats.opened ?? 0,
            failed: stats.failed,
          },
          audienceSize: stats.audienceSize,
          status: isCompleted && prevCampaign.status === 'active'
            ? 'completed'
            : prevCampaign.status
        };
      });

      // Store current stats for next comparison
      lastStatsRef.current = {
        sent:   stats.sent,
        opened: stats.opened ?? 0,
        failed: stats.failed,
      };

      // Determine if we should stop refreshing
      const shouldStopRefreshing =
        isCompleted || 
        stableCountRef.current >= 3 ||
        totalRefreshAttempts.current >= maxRefreshAttempts;

      if (shouldStopRefreshing && refreshIntervalRef.current) {
        console.log(
          'Stopping automatic refreshing, reason: ',
          isCompleted
            ? 'All processed'
            : stableCountRef.current >= 3
            ? 'Stats stable'
            : 'Max attempts'
        );

        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;

        // If campaign is completed but still marked as active, do a full refresh
        if (isCompleted && campaign.status === 'active') {
          setTimeout(() => {
            if (mountedRef.current) {
              fetchCampaign();
            }
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Error refreshing campaign stats:', err);
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  };
  
  // Add reference to track last refresh time
  const lastRefreshTime = useRef<number>(0);

  const activateCampaign = async () => {
    if (!campaign || campaign.status !== 'draft') return;

    try {
      setActivating(true);
      await CampaignService.activateCampaign(campaign._id);

      toast({
        title: 'Campaign queued',
        description: 'Delivery is running in the background. Progress will update automatically.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      // Optimistically update status and start polling
      setCampaign(prev => prev ? { ...prev, status: 'queued' } : prev);
      startJobPolling(campaign._id);
    } catch (err) {
      console.error('Error activating campaign:', err);
      setError('Failed to activate campaign');
    } finally {
      setActivating(false);
    }
  };

  // Helper functions for UI
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':    return 'green';
      case 'queued':    return 'orange';
      case 'draft':     return 'blue';
      case 'completed': return 'teal';
      case 'cancelled': return 'red';
      default:          return 'gray';
    }
  };

  const formatRuleOperator = (operator: string) => {
    switch (operator) {
      case '>': return 'is greater than';
      case '<': return 'is less than';
      case '>=': return 'is greater than or equal to';
      case '<=': return 'is less than or equal to';
      case '=': return 'equals';
      case '!=': return 'does not equal';
      case 'contains': return 'contains';
      default: return operator;
    }
  };

  const getProgressPercentage = () => {
    if (!campaign) return 0;
    const { audienceSize, deliveryStats } = campaign;
    if (audienceSize === 0) return 0;
    return ((deliveryStats.sent + (deliveryStats.opened ?? 0) + deliveryStats.failed) / audienceSize) * 100;
  };

  const renderChartData = () => {
    if (!campaign) return null;

    const opened     = campaign.deliveryStats.opened ?? 0;
    const dispatched = campaign.deliveryStats.sent;   // SMTP accepted, inbox delivery unconfirmed
    const failed     = campaign.deliveryStats.failed;

    const data = {
      labels: ['Opened', 'Dispatched', 'Failed'],
      datasets: [
        {
          label: 'Email Engagement',
          data: [opened, dispatched, failed],
          backgroundColor: [
            'rgba(56, 161, 105, 0.7)',   // green — confirmed opened
            'rgba(54, 162, 235, 0.6)',   // blue  — SMTP accepted, not yet opened
            'rgba(255, 99, 132, 0.6)',   // red   — SMTP rejected
          ],
          borderColor: [
            'rgba(56, 161, 105, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
    
    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: false,
        },
      },
    };
    
    return { data, options };
  };

  // Render rule conditions in human-readable format
  const renderRuleCondition = (condition: RuleCondition) => {
    return (
      <ListItem key={`${condition.field}-${condition.value}`}>
        <Text>
          <Tag colorScheme="teal" mr={2}>{condition.field}</Tag> 
          {formatRuleOperator(condition.operator)} 
          <Tag colorScheme="blue" ml={2}>
            {typeof condition.value === 'object' 
              ? JSON.stringify(condition.value) 
              : condition.value}
          </Tag>
        </Text>
      </ListItem>
    );
  };

  if (loading) {
    return (
      <Layout>
        <Text>Loading campaign details...</Text>
      </Layout>
    );
  }

  if (error || !campaign) {
    return (
      <Layout>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error || 'Campaign not found'}</AlertDescription>
        </Alert>
        <Button 
          leftIcon={<ArrowBackIcon />} 
          mt={4} 
          onClick={() => navigate('/campaigns')}
        >
          Back to Campaigns
        </Button>
      </Layout>
    );
  }

  const chartData = renderChartData();

  return (
    <Layout>
      <Box>
        <Flex justify="space-between" align="center" mb={6}>
          <Button 
            leftIcon={<ArrowBackIcon />} 
            variant="outline" 
            onClick={() => navigate('/campaigns')}
          >
            Back to Campaigns
          </Button>

          {campaign.status === 'draft' && (
            <Button
              colorScheme="green"
              onClick={activateCampaign}
              isLoading={activating}
            >
              Activate Campaign
            </Button>
          )}
          {campaign.status === 'queued' && (
            <Button colorScheme="orange" isLoading leftIcon={<Spinner size="xs" />} isDisabled>
              Queued…
            </Button>
          )}
        </Flex>

        <Box mb={8}>
          <Heading size="lg" mb={2}>{campaign.name}</Heading>
          {campaign.description && (
            <Text color="gray.600" mb={4}>{campaign.description}</Text>
          )}
          <HStack spacing={4} flexWrap="wrap">
            <Badge colorScheme={getStatusColor(campaign.status)} fontSize="md" px={2}>
              {campaign.status.toUpperCase()}
            </Badge>
            {campaign.isAbTest && <Badge colorScheme="purple" fontSize="sm" px={2}>A/B TEST</Badge>}
            <Text fontSize="sm">
              Created on {new Date(campaign.createdAt).toLocaleDateString()}
            </Text>
          </HStack>
        </Box>

        {/* Campaign Progress */}
        <Card mb={6}>
          <CardHeader pb={0}>
            <Flex justify="space-between" align="center">
              <Heading size="md">Campaign Progress</Heading>
              {(campaign.status === 'queued' || (job && job.status === 'processing')) && (
                <HStack spacing={2}>
                  <Spinner size="sm" color="orange.400" />
                  <Text fontSize="sm" color="orange.500" fontWeight="medium">
                    {campaign.status === 'queued' && (!job || job.status === 'queued')
                      ? 'Waiting in queue…'
                      : job
                        ? `Sending ${job.processed} / ${job.total || '?'}…`
                        : 'Processing…'}
                  </Text>
                </HStack>
              )}
            </Flex>
          </CardHeader>
          <CardBody>
            <Progress
              value={
                job && job.total > 0
                  ? (job.processed / job.total) * 100
                  : getProgressPercentage()
              }
              size="lg"
              colorScheme={campaign.status === 'queued' ? 'orange' : 'teal'}
              isIndeterminate={campaign.status === 'queued' && (!job || job.total === 0)}
              mb={4}
            />
            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
              <Stat>
                <StatLabel>Audience Size</StatLabel>
                <StatNumber>{campaign.audienceSize}</StatNumber>
                <StatHelpText>Total customers</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Messages Sent</StatLabel>
                <StatNumber>{campaign.deliveryStats.sent}</StatNumber>
                <StatHelpText>
                  {campaign.audienceSize > 0 
                    ? `${Math.round((campaign.deliveryStats.sent / campaign.audienceSize) * 100)}% of audience` 
                    : 'No audience'
                  }
                </StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Failed Deliveries</StatLabel>
                <StatNumber>{campaign.deliveryStats.failed}</StatNumber>
                <StatHelpText>
                  {campaign.audienceSize > 0 
                    ? `${Math.round((campaign.deliveryStats.failed / campaign.audienceSize) * 100)}% of audience` 
                    : 'No messages sent'
                  }
                </StatHelpText>
              </Stat>
            </Grid>
          </CardBody>
        </Card>

        {/* A/B Comparison Card */}
        {campaign.isAbTest && campaign.variants && campaign.variants.length >= 2 && (
          <Card mb={6} borderWidth={2} borderColor="purple.200">
            <CardHeader pb={0}>
              <Flex align="center" gap={3}>
                <Heading size="md">A/B Test Results</Heading>
                <Badge colorScheme="purple">SPLIT TEST</Badge>
                {(() => {
                  const a = campaign.variants![0];
                  const b = campaign.variants![1];
                  const rateA = a.deliveryStats.sent + a.deliveryStats.failed > 0
                    ? a.deliveryStats.sent / (a.deliveryStats.sent + a.deliveryStats.failed) : 0;
                  const rateB = b.deliveryStats.sent + b.deliveryStats.failed > 0
                    ? b.deliveryStats.sent / (b.deliveryStats.sent + b.deliveryStats.failed) : 0;
                  if (rateA === 0 && rateB === 0) return null;
                  const winner = rateA >= rateB ? 'A' : 'B';
                  return <Badge colorScheme="green" ml="auto">Variant {winner} winning</Badge>;
                })()}
              </Flex>
            </CardHeader>
            <CardBody>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                {campaign.variants!.map(v => {
                  const total = v.deliveryStats.sent + v.deliveryStats.failed;
                  const rate = total > 0 ? Math.round((v.deliveryStats.sent / total) * 100) : 0;
                  const color = v.label === 'A' ? 'blue' : 'purple';
                  return (
                    <Box key={v.label} borderWidth={1} borderRadius="lg" p={4} borderColor={`${color}.200`} bg={`${color}.50`}>
                      <HStack mb={3}>
                        <Badge colorScheme={color} fontSize="md" px={2}>Variant {v.label}</Badge>
                        <Text fontSize="sm" color="gray.500">{v.audienceSize} customers</Text>
                      </HStack>
                      <Stack spacing={2}>
                        <Flex justify="space-between">
                          <Text fontSize="sm" color="gray.600">Sent</Text>
                          <Text fontWeight="bold" color="green.600">{v.deliveryStats.sent}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text fontSize="sm" color="gray.600">Failed</Text>
                          <Text fontWeight="bold" color="red.500">{v.deliveryStats.failed}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text fontSize="sm" color="gray.600">Success rate</Text>
                          <Text fontWeight="bold" color={`${color}.600`}>{rate}%</Text>
                        </Flex>
                      </Stack>
                      <Progress value={rate} colorScheme={color} size="sm" mt={3} borderRadius="full" />
                      <Box mt={3} p={3} bg="white" borderRadius="md" borderWidth={1} borderColor={`${color}.100`}>
                        <Text fontSize="xs" color="gray.500" mb={1} fontWeight="semibold">MESSAGE</Text>
                        <Text fontSize="sm" noOfLines={3}>{v.message}</Text>
                      </Box>
                    </Box>
                  );
                })}
              </Grid>
            </CardBody>
          </Card>
        )}

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6} mb={6}>
          {/* Delivery Chart */}
          <GridItem>
            <Card>
              <CardHeader pb={0}>
                <Heading size="md">Delivery Statistics</Heading>
              </CardHeader>
              <CardBody>
                <Box height="260px">
                  {chartData && <Bar data={chartData.data} options={chartData.options} />}
                </Box>
                <Stack spacing={1} mt={3} pt={3} borderTopWidth="1px" borderColor="gray.100">
                  <HStack spacing={2} align="flex-start">
                    <Box w={3} h={3} borderRadius="sm" bg="green.400" flexShrink={0} mt="3px" />
                    <Text fontSize="xs" color="gray.600"><Text as="span" fontWeight="semibold">Opened</Text> — recipient opened the email (tracking pixel confirmed)</Text>
                  </HStack>
                  <HStack spacing={2} align="flex-start">
                    <Box w={3} h={3} borderRadius="sm" bg="blue.400" flexShrink={0} mt="3px" />
                    <Text fontSize="xs" color="gray.600"><Text as="span" fontWeight="semibold">Dispatched</Text> — accepted by Gmail SMTP, but inbox delivery is unconfirmed (may be in spam)</Text>
                  </HStack>
                  <HStack spacing={2} align="flex-start">
                    <Box w={3} h={3} borderRadius="sm" bg="red.400" flexShrink={0} mt="3px" />
                    <Text fontSize="xs" color="gray.600"><Text as="span" fontWeight="semibold">Failed</Text> — SMTP rejected the email (invalid address or server error)</Text>
                  </HStack>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Audience Rules */}
          <GridItem>
            <Card>
              <CardHeader pb={0}>
                <Heading size="md">Audience Segment Rules</Heading>
              </CardHeader>
              <CardBody>
                <Text mb={2}>
                  {campaign.rules.condition === 'AND' 
                    ? 'All of the following conditions must match:' 
                    : 'Any of the following conditions must match:'}
                </Text>
                <List spacing={2} styleType="disc" pl={4}>
                  {campaign.rules.conditions.map(renderRuleCondition)}
                </List>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Campaign Message */}
        <Card>
          <CardHeader pb={0}>
            <Heading size="md">Campaign Message</Heading>
          </CardHeader>
          <CardBody>
            <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
              <Text whiteSpace="pre-wrap">{campaign.message}</Text>
            </Box>
          </CardBody>
        </Card>
      </Box>
    </Layout>
  );
};

export default CampaignDetail;