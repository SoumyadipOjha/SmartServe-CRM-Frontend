import React, { useState, useEffect, useRef } from 'react';
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
  Text,
  Alert,
  AlertIcon,
  AlertDescription,
  Progress,
  HStack,
  Spinner
} from '@chakra-ui/react';
import * as XLSX from 'xlsx';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { AddIcon, RepeatIcon } from '@chakra-ui/icons';
import Layout from '../components/Layout';
import CampaignService from '../services/campaign.service';
import { Campaign } from '../types/models';
import CreateCampaign from './CreateCampaign';

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);
  const lastRefreshTimeRef = useRef<number>(0);

  const hasActiveCampaigns = campaigns.some(c => c.status === 'active');

  const fetchCampaigns = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const campaignsData = await CampaignService.getCampaigns();

      if (campaignsData.length > 0) {
        setLoadingStats(true);

        const campaignsWithFreshStats = await Promise.all(
          campaignsData.map(async (campaign) => {
            try {
              if (campaign.status === 'active' || campaign.audienceSize > 0) {
                const stats = await CampaignService.getCampaignStats(campaign._id);

                const totalProcessed = stats.sent + stats.failed;
                const isCompleted = totalProcessed >= stats.audienceSize && stats.audienceSize > 0;

                return {
                  ...campaign,
                  deliveryStats: {
                    sent: stats.sent,
                    failed: stats.failed
                  },
                  audienceSize: stats.audienceSize,
                  status: isCompleted && campaign.status === 'active' ? 'completed' : campaign.status
                };
              }

              return campaign;
            } catch (err) {
              console.error(`Error fetching stats for campaign ${campaign._id}:`, err);
              return campaign;
            }
          })
        );

        if (mountedRef.current) {
          setCampaigns(campaignsWithFreshStats);
          setError(null);
        }
      } else {
        if (mountedRef.current) {
          setCampaigns(campaignsData);
          setError(null);
        }
      }

      lastRefreshTimeRef.current = Date.now();
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      if (mountedRef.current) {
        setError('Error fetching campaigns');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingStats(false);
      }
    }
  };

  const refreshActiveCampaignStats = async () => {
    if (!hasActiveCampaigns) return;

    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 3000) return;

    try {
      const activeCampaigns = campaigns.filter(c => c.status === 'active');

      const updatedStats = await Promise.all(
        activeCampaigns.map(async (campaign) => {
          try {
            const stats = await CampaignService.getCampaignStats(campaign._id);
            return {
              id: campaign._id,
              sent: stats.sent,
              failed: stats.failed,
              audienceSize: stats.audienceSize
            };
          } catch (err) {
            console.error(`Error fetching stats for campaign ${campaign._id}:`, err);
            return null;
          }
        })
      );

      if (mountedRef.current) {
        setCampaigns(prevCampaigns =>
          prevCampaigns.map(campaign => {
            const updatedStat = updatedStats.find(s => s && s.id === campaign._id);

            if (updatedStat) {
              const totalProcessed = updatedStat.sent + updatedStat.failed;
              const isCompleted = totalProcessed >= updatedStat.audienceSize && updatedStat.audienceSize > 0;

              return {
                ...campaign,
                deliveryStats: {
                  sent: updatedStat.sent,
                  failed: updatedStat.failed
                },
                audienceSize: updatedStat.audienceSize,
                status: isCompleted ? 'completed' : campaign.status
              };
            }

            return campaign;
          })
        );

        lastRefreshTimeRef.current = now;
      }
    } catch (err) {
      console.error('Error refreshing campaign stats:', err);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    if (!showCreateForm) {
      fetchCampaigns();
    }

    return () => {
      mountedRef.current = false;

      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [showCreateForm, location.pathname]);

  useEffect(() => {
    if (hasActiveCampaigns && !refreshTimerRef.current) {
      refreshTimerRef.current = window.setInterval(() => {
        if (mountedRef.current && !showCreateForm) {
          refreshActiveCampaignStats();
        }
      }, 5000);
    } else if (!hasActiveCampaigns && refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [hasActiveCampaigns, showCreateForm]);

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

  const calculateDeliveryProgress = (campaign: Campaign) => {
    if (campaign.audienceSize === 0) return 0;
    return ((campaign.deliveryStats.sent + campaign.deliveryStats.failed) / campaign.audienceSize) * 100;
  };

  const calculateSuccessRate = (campaign: Campaign) => {
    const totalProcessed = campaign.deliveryStats.sent + campaign.deliveryStats.failed;
    if (totalProcessed === 0) return '0%';
    return `${Math.round((campaign.deliveryStats.sent / totalProcessed) * 100)}%`;
  };

  const handleCreateCampaign = () => {
    setShowCreateForm(true);
  };

  const handleRefresh = () => {
    fetchCampaigns(false);
  };

  if (showCreateForm) {
    return <CreateCampaign onCancel={() => setShowCreateForm(false)} />;
  }


const handleExportCampaigns = () => {
  const headers = [
    'Campaign Name',
    'Status',
    'Audience Size',
    'Sent',
    'Failed',
    'Success Rate',
    'Created Date'
  ];

  const rows = campaigns.map(c => {
    const totalSent = c.deliveryStats.sent;
    const totalFailed = c.deliveryStats.failed;
    const totalProcessed = totalSent + totalFailed;
    const successRate =
      totalProcessed > 0
        ? `${Math.round((totalSent / totalProcessed) * 100)}%`
        : '0%';

    return [
      c.name,
      c.status,
      c.audienceSize,
      totalSent,
      totalFailed,
      successRate,
      new Date(c.createdAt).toLocaleDateString()
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Campaigns');
  XLSX.writeFile(workbook, `campaigns-${new Date().toISOString().split('T')[0]}.xlsx`);
};


  return (
    <Layout>
      <Box>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Marketing Campaigns</Heading>
          <HStack spacing={2}>
            <Button
              onClick={handleRefresh}
              leftIcon={<RepeatIcon />}
              variant="outline"
              size="md"
              isLoading={refreshing}
              isDisabled={loading}
            >
              Refresh
            </Button>
            <HStack spacing={2}>

  <Button
    onClick={handleExportCampaigns}
    colorScheme="blue"
  >
    Export Campaigns
  </Button>

  <Button
    onClick={handleCreateCampaign}
    leftIcon={<AddIcon />}
    colorScheme="teal"
  >
    Create Campaign
  </Button>
</HStack>

          </HStack>
        </Flex>

        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Box textAlign="center" py={8}>
            <Spinner size="xl" mb={4} color="teal.500" />
            <Text>Loading campaigns...</Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            {loadingStats && (
              <Box textAlign="center" mb={4}>
                <Text fontSize="sm" color="gray.500">
                  <Spinner size="xs" mr={2} /> Fetching latest campaign statistics...
                </Text>
              </Box>
            )}
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Campaign Name</Th>
                  <Th>Status</Th>
                  <Th>Audience Size</Th>
                  <Th>Delivery Progress</Th>
                  <Th>Success Rate</Th>
                  <Th>Created</Th>
                </Tr>
              </Thead>
              <Tbody>
                {campaigns.length === 0 ? (
                  <Tr>
                    <Td colSpan={6}>No campaigns found</Td>
                  </Tr>
                ) : (
                  campaigns.map((campaign) => (
                    <Tr key={campaign._id}>
                      <Td>
                        <Text
                          as={RouterLink}
                          to={`/campaigns/${campaign._id}`}
                          color="teal.500"
                          fontWeight="medium"
                        >
                          {campaign.name}
                        </Text>
                        {campaign.description && (
                          <Text fontSize="sm" color="gray.600" noOfLines={1}>
                            {campaign.description}
                          </Text>
                        )}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </Td>
                      <Td>{campaign.audienceSize}</Td>
                      <Td>
                        <Box>
                          <Progress
                            value={calculateDeliveryProgress(campaign)}
                            size="sm"
                            colorScheme="teal"
                          />
                          <Text fontSize="xs" mt={1}>
                            {campaign.deliveryStats.sent + campaign.deliveryStats.failed} of {campaign.audienceSize} sent
                          </Text>
                        </Box>
                      </Td>
                      <Td>{calculateSuccessRate(campaign)}</Td>
                      <Td>{new Date(campaign.createdAt).toLocaleDateString()}</Td>
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

export default Campaigns;