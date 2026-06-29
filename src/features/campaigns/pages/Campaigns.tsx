import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Spinner,
  Stack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import Pagination from '../../../shared/components/Pagination';
import * as XLSX from 'xlsx';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { AddIcon, RepeatIcon } from '@chakra-ui/icons';
import Layout from '../../../shared/components/Layout';
import EmptyState from '../../../shared/components/EmptyState';
import CampaignService from '../services/campaign.service';
import { Campaign } from '../../../shared/types/models';
import CreateCampaign from './CreateCampaign';

const PAGE_SIZE = 10;
type CampaignSortField = 'name' | 'audienceSize' | 'createdAt';
type SortDir = 'asc' | 'desc';

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <Text as="span" color="gray.300" ml={1}>↕</Text>;
  return <Text as="span" ml={1}>{dir === 'asc' ? '↑' : '↓'}</Text>;
}

const Campaigns: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);
  const lastRefreshTimeRef = useRef<number>(0);

  // Search / filter / sort / page
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<CampaignSortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const handleCampaignSort = (field: CampaignSortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filteredCampaigns = useMemo(() => {
    let list = [...campaigns];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    if (statusFilter) {
      list = list.filter(c => c.status === statusFilter);
    }
    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'name':        return dir * a.name.localeCompare(b.name);
        case 'audienceSize': return dir * (a.audienceSize - b.audienceSize);
        case 'createdAt':   return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        default: return 0;
      }
    });
    return list;
  }, [campaigns, search, statusFilter, sortField, sortDir]);

  const campaignTotalPages = Math.max(1, Math.ceil(filteredCampaigns.length / PAGE_SIZE));
  const paginatedCampaigns = filteredCampaigns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

                const totalProcessed = stats.sent + (stats.opened ?? 0) + stats.failed;
                const isCompleted = totalProcessed >= stats.audienceSize && stats.audienceSize > 0;

                return {
                  ...campaign,
                  deliveryStats: {
                    sent:    stats.sent,
                    opened:  stats.opened ?? 0,
                    clicked: stats.clicked ?? 0,
                    failed:  stats.failed,
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
              sent:   stats.sent,
              opened: stats.opened ?? 0,
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
              const totalProcessed = updatedStat.sent + (updatedStat.opened ?? 0) + updatedStat.failed;
              const isCompleted = totalProcessed >= updatedStat.audienceSize && updatedStat.audienceSize > 0;

              return {
                ...campaign,
                deliveryStats: {
                  sent:    updatedStat.sent,
                  opened:  (updatedStat as any).opened ?? 0,
                  clicked: (updatedStat as any).clicked ?? 0,
                  failed:  updatedStat.failed,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveCampaigns, showCreateForm]);

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

  if (showCreateForm) {
    return <CreateCampaign onCancel={() => setShowCreateForm(false)} />;
  }

  return (
    <Layout>
      <Box px={{ base: 2, md: 4 }}>
        <Stack
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          spacing={4}
          mb={6}
        >
          <Heading size="lg">Marketing Campaigns</Heading>
          <HStack spacing={2} flexWrap="wrap">
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
            <Button onClick={handleExportCampaigns} colorScheme="blue">
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
        </Stack>

        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search + filter row */}
        <Flex mb={4} gap={3} flexWrap="wrap">
          <InputGroup maxW="280px">
            <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" /></InputLeftElement>
            <Input
              placeholder="Search campaigns…"
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
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          {(search || statusFilter) && (
            <Text fontSize="sm" color="gray.500" alignSelf="center">
              {filteredCampaigns.length} result{filteredCampaigns.length !== 1 ? 's' : ''}
            </Text>
          )}
        </Flex>

        {loading ? (
          <Box textAlign="center" py={8}>
            <Spinner size="xl" mb={4} color="teal.500" />
            <Text>Loading campaigns...</Text>
          </Box>
        ) : campaigns.length === 0 && !search && !statusFilter ? (
          <EmptyState
            icon="📣"
            title="No campaigns yet"
            description="Create your first email campaign to reach your customers at scale."
            ctaLabel="Create Campaign"
            onCta={() => navigate('/campaigns/create')}
          />
        ) : (
          <>
          <Box overflowX="auto">
            {loadingStats && (
              <Box textAlign="center" mb={4}>
                <Text fontSize="sm" color="gray.500">
                  <Spinner size="xs" mr={2} /> Fetching latest campaign statistics...
                </Text>
              </Box>
            )}
            <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
              <Thead>
                <Tr>
                  <Th cursor="pointer" userSelect="none" _hover={{ bg: 'gray.50' }} onClick={() => handleCampaignSort('name')}>
                    Campaign Name <SortIndicator active={sortField === 'name'} dir={sortDir} />
                  </Th>
                  <Th>Status</Th>
                  <Th cursor="pointer" userSelect="none" _hover={{ bg: 'gray.50' }} onClick={() => handleCampaignSort('audienceSize')}>
                    Audience Size <SortIndicator active={sortField === 'audienceSize'} dir={sortDir} />
                  </Th>
                  <Th>Delivery Progress</Th>
                  <Th>Success Rate</Th>
                  <Th cursor="pointer" userSelect="none" _hover={{ bg: 'gray.50' }} onClick={() => handleCampaignSort('createdAt')}>
                    Created <SortIndicator active={sortField === 'createdAt'} dir={sortDir} />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedCampaigns.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center" color="gray.400" py={6}>No campaigns match your filters</Td>
                  </Tr>
                ) : (
                  paginatedCampaigns.map((campaign) => (
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
                        {campaign.isAbTest && <Badge colorScheme="purple" fontSize="xs" ml={1}>A/B</Badge>}
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
          <Pagination
            page={page}
            totalPages={campaignTotalPages}
            totalItems={filteredCampaigns.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
          </>
        )}
      </Box>
    </Layout>
  );
};

export default Campaigns;
