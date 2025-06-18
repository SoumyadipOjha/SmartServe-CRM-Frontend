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
  Divider,
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
import { Campaign, RuleCondition } from '../types/models';
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
  const refreshIntervalRef = useRef<number | null>(null);
  
  // Add these refs to control refresh behavior
  const stableCountRef = useRef<number>(0);
  const lastStatsRef = useRef<{ sent: number; failed: number }>({ sent: 0, failed: 0 });
  const totalRefreshAttempts = useRef<number>(0);
  const maxRefreshAttempts = 20; // Limit the number of refresh attempts
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    fetchCampaign();

    return () => {
      // Clean up interval and mark component as unmounted
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
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
        sent: campaign.deliveryStats.sent,
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
  }, [campaign?.status, campaign?.audienceSize]);

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
              sent: stats.sent,
              failed: stats.failed
            },
            audienceSize: stats.audienceSize
          };
          
          // Check if campaign should be marked completed based on stats
          const totalProcessed = stats.sent + stats.failed;
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
            sent: latestData.deliveryStats.sent,
            failed: latestData.deliveryStats.failed
          };
        }
        
        // Only set up refresh interval if campaign is active and not all messages processed
        if (latestData.status === 'active') {
          const totalProcessed = latestData.deliveryStats.sent + latestData.deliveryStats.failed;
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
  
  // Helper function to update campaign status in the backend if needed
  const updateCampaignStatusIfNeeded = async (campaignId: string, newStatus: string) => {
    // This would require a new endpoint in your API, or you could handle it
    // in your backend when stats are fetched
    console.log(`Campaign ${campaignId} should be marked as ${newStatus}`);
    // Uncomment and implement if you add this API endpoint
    // await apiClient.patch(`/campaigns/${campaignId}/status`, { status: newStatus });
  };

  // More accurate function to determine campaign completion status
  const checkCampaignCompletion = (stats: { sent: number; failed: number; audienceSize: number }) => {
    const totalProcessed = stats.sent + stats.failed;
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
        stats.sent !== lastStatsRef.current.sent ||
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
            sent: stats.sent,
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
        sent: stats.sent,
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
      const result = await CampaignService.activateCampaign(campaign._id);
      
      toast({
        title: 'Campaign activated',
        description: `Messages are being sent to ${result.audienceSize} customers`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Fetch updated campaign data
      fetchCampaign();
    } catch (err) {
      console.error('Error activating campaign:', err);
      setError('Failed to activate campaign');
      setActivating(false);
    }
  };

  // Helper functions for UI
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'draft':
        return 'blue';
      case 'completed':
        return 'teal';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
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
    return ((deliveryStats.sent + deliveryStats.failed) / audienceSize) * 100;
  };

  const renderChartData = () => {
    if (!campaign) return null;
    
    const data = {
      labels: ['Sent', 'Failed'],
      datasets: [
        {
          label: 'Message Delivery',
          data: [campaign.deliveryStats.sent, campaign.deliveryStats.failed],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
          ],
          borderColor: [
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
        </Flex>

        <Box mb={8}>
          <Heading size="lg" mb={2}>{campaign.name}</Heading>
          {campaign.description && (
            <Text color="gray.600" mb={4}>{campaign.description}</Text>
          )}
          <HStack spacing={4}>
            <Badge colorScheme={getStatusColor(campaign.status)} fontSize="md" px={2}>
              {campaign.status.toUpperCase()}
            </Badge>
            <Text fontSize="sm">
              Created on {new Date(campaign.createdAt).toLocaleDateString()}
            </Text>
          </HStack>
        </Box>

        {/* Campaign Progress */}
        <Card mb={6}>
          <CardHeader pb={0}>
            <Heading size="md">Campaign Progress</Heading>
          </CardHeader>
          <CardBody>
            <Progress 
              value={getProgressPercentage()} 
              size="lg" 
              colorScheme="teal"
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

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6} mb={6}>
          {/* Delivery Chart */}
          <GridItem>
            <Card>
              <CardHeader pb={0}>
                <Heading size="md">Delivery Statistics</Heading>
              </CardHeader>
              <CardBody height="300px">
                {chartData && <Bar data={chartData.data} options={chartData.options} />}
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