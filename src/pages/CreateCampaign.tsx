import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Textarea,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Alert,
  AlertIcon,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  InputGroup,
  Tag,
  TagLabel,
  Tooltip,
  Collapse,
  Skeleton
} from '@chakra-ui/react';
import { QueryBuilder } from 'react-querybuilder';
import 'react-querybuilder/dist/query-builder.css';
import Layout from '../components/Layout';
import CampaignService from '../services/campaign.service';
import AIService from '../services/ai.service';
import { CampaignRules } from '../types/models';

// Fields for the query builder
const fields = [
  { name: 'name', label: 'Customer Name' },
  { name: 'email', label: 'Email' },
  { name: 'totalSpend', label: 'Total Spend', inputType: 'number' },
  { name: 'visits', label: 'Visit Count', inputType: 'number' },
  { name: 'lastActivity', label: 'Last Activity Date', inputType: 'date' }
];

interface CreateCampaignProps {
  onCancel?: () => void;
}

const CreateCampaign: React.FC<CreateCampaignProps> = ({ onCancel }) => {
  const navigate = useNavigate();
  const toast = useToast();

  // Color scheme
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const subtleText = useColorModeValue('gray.600', 'gray.400');
  const highlightBg = useColorModeValue('pink.50', 'pink.900');
  const highlightBorder = useColorModeValue('pink.200', 'pink.700');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    message: ''
  });

  // Natural language segment description
  const [segmentDescription, setSegmentDescription] = useState('');

  // Query builder state
  const [rules, setRules] = useState<CampaignRules>({
    condition: 'AND',
    conditions: []
  });

  // UI states
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [loading, setLoading] = useState({
    preview: false,
    aiConversion: false,
    aiMessage: false,
    submit: false
  });
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('details');
  const [showMessagePreview, setShowMessagePreview] = useState(false);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Convert natural language to rules using AI
  const handleConvertToRules = async () => {
    if (!segmentDescription) return;

    try {
      setLoading((prev) => ({ ...prev, aiConversion: true }));
      setError(null);
      const convertedRules = await AIService.convertNaturalLanguageToRules(segmentDescription);
      setRules(convertedRules);
      
      // Preview audience after conversion
      previewAudience(convertedRules);
      
      toast({
        title: 'Segment converted',
        description: 'Natural language segment has been converted to rules',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right'
      });
    } catch (err) {
      console.error('Error converting natural language:', err);
      setError('Failed to convert natural language to rules. Please try a different description or use the rule builder.');
    } finally {
      setLoading((prev) => ({ ...prev, aiConversion: false }));
    }
  };

  // Generate promotional message using AI
  const handleGenerateMessage = async () => {
    if (!formData.name) {
      toast({
        title: 'Campaign name required',
        description: 'Please provide a campaign name to generate a message',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-right'
      });
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, aiMessage: true }));
      setError(null);
      
      // Use the campaign name and description to generate a better message
      const goalText = formData.description 
        ? `${formData.name}: ${formData.description}`
        : formData.name;
      
      console.log('Generating message for goal:', goalText);
      const generatedMessage = await AIService.generatePromotionalMessage(goalText);
      console.log('Generated message:', generatedMessage);
      
      if (!generatedMessage || generatedMessage.trim() === '') {
        throw new Error('Received empty message from AI service');
      }
      
      // Set the message directly in the form data state
      setFormData(prev => {
        const updated = { ...prev, message: generatedMessage };
        console.log('Updated form data:', updated);
        return updated;
      });

      // Show message preview
      setShowMessagePreview(true);
      
      // Show success message with the actual generated text
      toast({
        title: 'Message generated',
        description: `AI has created a personalized message for your campaign`,
        status: 'success',
        duration: 4000,
        isClosable: true,
        position: 'top-right'
      });
    } catch (err) {
      console.error('Error generating message:', err);
      setError('Failed to generate message. Please try writing your own message.');
      
      // Show error with more details
      toast({
        title: 'Message generation failed',
        description: 'Could not generate message. Please try again or write your own message.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right'
      });
    } finally {
      setLoading((prev) => ({ ...prev, aiMessage: false }));
    }
  };

  // Preview audience size
  const previewAudience = async (rulesData: CampaignRules = rules) => {
    if (rulesData.conditions.length === 0) {
      setAudienceCount(null);
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, preview: true }));
      const count = await CampaignService.previewAudience(rulesData);
      setAudienceCount(count);
      
      // Show feedback when audience is found
      if (count > 0) {
        toast({
          title: 'Audience preview',
          description: `Your campaign will target ${count} customers`,
          status: 'info',
          duration: 3000,
          isClosable: true,
          position: 'top-right'
        });
      }
    } catch (err) {
      console.error('Error previewing audience:', err);
      toast({
        title: 'Preview failed',
        description: 'Unable to preview audience size',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right'
      });
    } finally {
      setLoading((prev) => ({ ...prev, preview: false }));
    }
  };

  // Handle query builder changes
  const handleRulesChange = (newRules: any) => {
    const formattedRules: CampaignRules = {
      condition: newRules.combinator,
      conditions: newRules.rules.map((rule: any) => ({
        field: rule.field,
        operator: rule.operator,
        value: rule.value
      }))
    };
    
    setRules(formattedRules);
    
    // Preview audience after a short delay for better UX
    const handler = setTimeout(() => {
      previewAudience(formattedRules);
    }, 500);
    
    return () => clearTimeout(handler);
  };

  // Create the campaign
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: 'Campaign name required',
        description: 'Please provide a name for your campaign',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-right'
      });
      return;
    }
    
    if (rules.conditions.length === 0) {
      toast({
        title: 'Segment rules required',
        description: 'Please define audience segment rules for your campaign',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-right'
      });
      return;
    }
    
    if (!formData.message) {
      toast({
        title: 'Message required',
        description: 'Please write a message for your campaign',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-right'
      });
      return;
    }
    
    try {
      setLoading((prev) => ({ ...prev, submit: true }));
      setError(null);
      
      const campaign = await CampaignService.createCampaign({
        ...formData,
        rules
      });
      
      toast({
        title: 'Campaign created',
        description: 'Your campaign has been created successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      });
      
      navigate(`/campaigns/${campaign._id}`);
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      
      // Extract detailed validation errors if available
      let errorMessage = 'Failed to create campaign';
      
      if (err.response?.data?.errors) {
        // Format validation errors from express-validator
        const validationErrors = err.response.data.errors.map((e: any) => e.msg).join(', ');
        errorMessage = `Validation failed: ${validationErrors}`;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(`${errorMessage}. Please check your input and try again.`);
      
      toast({
        title: 'Campaign creation failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      });
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  // Handle navigation and cancellation
  const handleGoBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/campaigns');
    }
  };
  return (
    <Layout>
      <Box as="form" onSubmit={handleSubmit}>
        <Flex 
          justify="space-between" 
          align="center" 
          mb={8}
          pb={4}
          borderBottom="1px"
          borderColor={borderColor}
        >
          <Box>
            <Heading size="lg">Create New Campaign</Heading>
            <Text color={subtleText} mt={1}>
              Define your audience, craft your message, and launch your campaign
            </Text>
          </Box>
          
          <HStack>
            <Button
              onClick={handleGoBack}
              variant="outline"
              mr={2}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              colorScheme="pink"
              isLoading={loading.submit}
              size="lg"
              // leftIcon={<IconWrapper icon={FiSend} />}
              boxShadow="md"
            >
              Create Campaign
            </Button>
          </HStack>
        </Flex>

        {error && (
          <Alert status="error" mb={8} borderRadius="md">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 1. Campaign Details Section */}
        <Collapse in={activeSection === 'details'} animateOpacity>
          <Card mb={8} variant="outline" bg={cardBg} shadow="sm">
            <CardHeader pb={0}>
              <Heading size="md">
                <Flex align="center">
                  Campaign Details
                </Flex>
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Campaign Name</FormLabel>
                  <Input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Spring Sale Promotion"
                    bg="white"
                    borderColor={borderColor}
                    size="lg"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontWeight="medium">Description</FormLabel>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Description of the campaign's purpose"
                    rows={3}
                    bg="white"
                    borderColor={borderColor}
                  />
                </FormControl>
                
                <Flex justify="flex-end">
                  <Button 
                    onClick={() => setActiveSection('audience')} 
                    colorScheme="pink"
                    isDisabled={!formData.name || !formData.description}
                  >
                    Next
                  </Button>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </Collapse>

        {/* 2. Audience Segment Rules Section */}
        <Collapse in={activeSection === 'audience'} animateOpacity>
          <Card mb={8} variant="outline" bg={cardBg} shadow="sm">
            <CardHeader pb={0}>
              <Heading size="md">
                <Flex align="center">
                  Define Your Audience
                </Flex>
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Tabs 
                  variant="line" 
                  colorScheme="pink"
                  isFitted
                >
                  <TabList mb={4}>
                    <Tab 
                      fontWeight="medium" 
                      _selected={{ 
                        color: 'pink.500', 
                        borderColor: 'pink.500',
                        bg: highlightBg 
                      }}
                    >
                      <Flex align="center">
                        Natural Language
                      </Flex>
                    </Tab>
                    <Tab 
                      fontWeight="medium" 
                      _selected={{ 
                        color: 'pink.500', 
                        borderColor: 'pink.500',
                        bg: highlightBg 
                      }}
                    >
                      <Flex align="center">
                        Rule Builder
                      </Flex>
                    </Tab>
                  </TabList>
                  
                  <TabPanels>
                    {/* Natural Language Tab */}
                    <TabPanel px={0}>
                      <VStack spacing={4} align="stretch">
                        <FormControl>
                          <FormLabel fontWeight="medium">Describe your target audience</FormLabel>
                          <Textarea
                            value={segmentDescription}
                            onChange={(e) => setSegmentDescription(e.target.value)}
                            placeholder="E.g., Customers who spent more than $500 and visited at least 3 times in the last month"
                            rows={4}
                            bg="white"
                            borderColor={borderColor}
                            borderRadius="md"
                            p={4}
                            boxShadow="sm"
                            fontSize="md"
                          />
                          <FormHelperText>
                            Use natural language to describe the customers you want to target
                          </FormHelperText>
                        </FormControl>
                        
                        <Button 
                          onClick={handleConvertToRules} 
                          colorScheme="pink"
                          size="lg"
                          isLoading={loading.aiConversion}
                          isDisabled={!segmentDescription}
                          w="full"
                          mb={2}
                        >
                          Convert to Rules with AI
                        </Button>

                        {rules.conditions.length > 0 && (
                          <Box 
                            p={4} 
                            bg={highlightBg} 
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={highlightBorder}
                          >
                            <Text fontWeight="medium" mb={2}>AI converted your description into:</Text>
                            <VStack align="stretch" spacing={2}>
                              {rules.conditions.map((rule, idx) => (
                                <Tag 
                                  key={idx} 
                                  size="lg" 
                                  borderRadius="full" 
                                  variant="subtle"
                                  colorScheme="pink"
                                >
                                  <TagLabel>
                                    {rule.field} {rule.operator} {rule.value}
                                  </TagLabel>
                                </Tag>
                              ))}
                              <Text fontWeight="medium" fontSize="sm" mt={2}>
                                Using {rules.condition} condition
                              </Text>
                            </VStack>
                          </Box>
                        )}
                      </VStack>
                    </TabPanel>
                    
                    {/* Rule Builder Tab */}
                    <TabPanel px={0}>
                      <Box 
                        border="1px" 
                        borderColor={borderColor} 
                        borderRadius="md" 
                        p={4}
                        bg="white"
                        boxShadow="sm"
                      >
                        <QueryBuilder
                          fields={fields}
                          query={{
                            combinator: rules.condition,
                            rules: rules.conditions.map(c => ({
                              field: c.field,
                              operator: c.operator,
                              value: c.value
                            }))
                          }}
                          onQueryChange={handleRulesChange}
                        />
                      </Box>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
                
                {/* Audience Preview */}
                <Box 
                  mt={6} 
                  p={5} 
                  bg={cardBg} 
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  position="relative"
                  overflow="hidden"
                >
                  <Flex justify="space-between" alignItems="center">
                    <HStack spacing={4}>
                      <Flex 
                        w={12} 
                        h={12} 
                        bg="blue.50" 
                        color="blue.500" 
                        borderRadius="full" 
                        justify="center"
                        align="center"
                      >
                      </Flex>
                      <Box>
                        <Text fontWeight="bold" fontSize="xl">
                          {loading.preview ? (
                            <Skeleton height="30px" width="80px" />
                          ) : audienceCount !== null ? (
                            <>{audienceCount} <Text as="span" fontSize="md" fontWeight="normal" color={subtleText}>customers</Text></>
                          ) : (
                            'No audience'
                          )}
                        </Text>
                        <Text fontSize="sm" color={subtleText}>
                          {rules.conditions.length > 0 
                            ? `Based on ${rules.conditions.length} condition${rules.conditions.length !== 1 ? 's' : ''} with ${rules.condition} logic` 
                            : 'Define audience conditions above'}
                        </Text>
                      </Box>
                    </HStack>
                    
                    <HStack>
                      <Tooltip label="Refresh audience count" placement="top">
                        <Button
                          size="sm"
                          variant="ghost"
                          isLoading={loading.preview}
                          onClick={() => previewAudience()}
                          isDisabled={rules.conditions.length === 0}
                        >
                          Refresh
                        </Button>
                      </Tooltip>
                    </HStack>
                  </Flex>
                  
                  {audienceCount === 0 && rules.conditions.length > 0 && (
                    <Alert status="warning" mt={4} borderRadius="md">
                      <AlertIcon />
                      <AlertDescription>
                        No customers match your current criteria. Consider adjusting your rules.
                      </AlertDescription>
                    </Alert>
                  )}
                </Box>
                
                <Flex justify="space-between">
                  <Button 
                    onClick={() => setActiveSection('details')} 
                    variant="outline"
                  >
                    Back to Details
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveSection('message')} 
                    colorScheme="pink"
                    isDisabled={rules.conditions.length === 0}
                  >
                    Next
                  </Button>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </Collapse>

        {/* 3. Message Composition Section */}
        <Collapse in={activeSection === 'message'} animateOpacity>
          <Card mb={8} variant="outline" bg={cardBg} shadow="sm">
            <CardHeader pb={0}>
              <Heading size="md">
                <Flex align="center">
                  Craft Your Message
                </Flex>
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontWeight="medium">Message Content</FormLabel>
                  <InputGroup>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Enter your message. Use {{name}} to personalize with customer's name."
                      rows={6}
                      maxLength={5000}
                      bg="white"
                      borderColor={borderColor}
                      fontSize="md"
                      p={4}
                    />
                    
                  </InputGroup>
                  <FormHelperText>
                    Your message will be sent to {audienceCount || 'all'} customers in the defined segment.
                  </FormHelperText>
                </FormControl>
                
                <Button 
                  onClick={handleGenerateMessage} 
                  colorScheme="pink"
                  size="lg" 
                  isLoading={loading.aiMessage}
                  w="full"
                >
                  Generate Personalized Message with AI
                </Button>
                
                {/* Message preview */}
                <Collapse in={showMessagePreview || (!!formData.message && formData.message.length > 20)} animateOpacity>
                  <Box 
                    p={6} 
                    bg={highlightBg} 
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={highlightBorder}
                    mt={4}
                  >
                    <Flex justify="space-between" mb={4}>
                      <Heading size="sm">Message Preview</Heading>
                      <Badge colorScheme="blue">Personalized</Badge>
                    </Flex>
                    <Box 
                      p={5} 
                      bg="white" 
                      borderRadius="md" 
                      borderWidth="1px"
                      borderColor={borderColor}
                      boxShadow="sm"
                    >
                      <Text whiteSpace="pre-wrap" fontSize="md">
                        {formData.message.replace('{{name}}', 'John')}
                      </Text>
                    </Box>
                    <Text fontSize="xs" mt={3} color={subtleText}>
                      This shows how your message will look with a sample customer name.
                    </Text>
                  </Box>
                </Collapse>
                
                <Flex justify="space-between" mt={4}>
                  <Button 
                    onClick={() => setActiveSection('audience')} 
                    variant="outline"
                  >
                    Back to Audience
                  </Button>
                  
                  <Button 
                    type="submit" 
                    colorScheme="pink" 
                    size="lg"
                    isLoading={loading.submit}
                    isDisabled={!formData.name || !formData.message || rules.conditions.length === 0}
                  >
                    Create Campaign
                  </Button>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </Collapse>
      </Box>
    </Layout>
  );
};

export default CreateCampaign;