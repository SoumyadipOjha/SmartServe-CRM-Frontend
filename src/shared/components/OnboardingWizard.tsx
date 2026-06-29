import React, { useState, useEffect } from 'react';
import {
  Box, Button, Flex, Heading, Modal, ModalContent, ModalOverlay,
  Progress, Text, HStack, VStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = (userId: string) => `smartserve_onboarded_${userId}`;

const STEPS = [
  {
    icon: '👥',
    title: 'Add your first customer',
    description:
      'Start building your customer base. Add a contact so you can track activity, send emails, and manage deals from one place.',
    cta: 'Go to Customers',
    path: '/customers',
  },
  {
    icon: '📊',
    title: 'Create your first deal',
    description:
      'Use the Pipeline to track deals through stages — Lead, Proposal, Negotiation, and Won. Move deals forward with drag-and-drop.',
    cta: 'Open Pipeline',
    path: '/pipeline',
  },
  {
    icon: '📣',
    title: 'Send your first campaign',
    description:
      'Reach all your customers at once with a targeted email campaign. Set audience rules, write your message, and hit send.',
    cta: 'Create Campaign',
    path: '/campaigns/create',
  },
];

const OnboardingWizard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!currentUser?._id) return;
    const done = localStorage.getItem(STORAGE_KEY(currentUser._id));
    if (!done) setVisible(true);
  }, [currentUser]);

  const dismiss = () => {
    if (currentUser?._id) {
      localStorage.setItem(STORAGE_KEY(currentUser._id), '1');
    }
    setVisible(false);
  };

  const handleCta = () => {
    const target = STEPS[step].path;
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
    navigate(target);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Modal isOpen={visible} onClose={dismiss} isCentered size="md" closeOnOverlayClick={false}>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" overflow="hidden" mx={4}>
        {/* Header gradient */}
        <Box
          bgGradient="linear(135deg, teal.600, teal.800)"
          px={8}
          pt={8}
          pb={6}
        >
          <Flex justify="space-between" align="flex-start" mb={4}>
            <Text color="whiteAlpha.700" fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
              Getting started · Step {step + 1} of {STEPS.length}
            </Text>
            <Button
              variant="ghost"
              size="xs"
              color="whiteAlpha.600"
              _hover={{ color: 'white' }}
              onClick={dismiss}
            >
              Skip tour
            </Button>
          </Flex>
          <Text fontSize="4xl" mb={3}>{current.icon}</Text>
          <Heading size="md" color="white" mb={1}>{current.title}</Heading>
          <Progress value={progress} size="xs" colorScheme="whiteAlpha" bg="whiteAlpha.300" borderRadius="full" mt={4} />
        </Box>

        {/* Body */}
        <Box px={8} py={6}>
          <Text color="gray.600" fontSize="sm" lineHeight="tall" mb={6}>
            {current.description}
          </Text>

          <VStack spacing={3}>
            <Button
              colorScheme="teal"
              w="full"
              onClick={handleCta}
            >
              {current.cta}
            </Button>

            {step < STEPS.length - 1 && (
              <HStack spacing={3} w="full">
                {step > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} flex={1}>
                    Back
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setStep(s => s + 1)} flex={1}>
                  Skip this step
                </Button>
              </HStack>
            )}
          </VStack>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default OnboardingWizard;
