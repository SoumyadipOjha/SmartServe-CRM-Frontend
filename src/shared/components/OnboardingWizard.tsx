import React, { useState, useEffect } from 'react';
import {
  Box, Button, Flex, Heading, Modal, ModalContent, ModalOverlay,
  Text, HStack, Icon, CloseButton,
} from '@chakra-ui/react';
import { FiUsers, FiTrendingUp, FiMail } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = (userId: string) => `smartserve_onboarded_${userId}`;

const STEPS = [
  {
    icon: FiUsers,
    title: 'Add your first customer',
    description:
      'Import or create a contact to start tracking their activity, orders, and notes in one place.',
    cta: 'Add a customer',
    path: '/customers',
  },
  {
    icon: FiTrendingUp,
    title: 'Track a deal in the pipeline',
    description:
      'Move opportunities through stages from first contact to closed. Drag cards to update a deal\'s status as it progresses.',
    cta: 'Open pipeline',
    path: '/pipeline',
  },
  {
    icon: FiMail,
    title: 'Send your first campaign',
    description:
      'Pick an audience segment, write a message, and send a targeted email to multiple customers in one go.',
    cta: 'Create a campaign',
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

  return (
    <Modal isOpen={visible} onClose={dismiss} isCentered size="sm" closeOnOverlayClick={false}>
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent borderRadius="lg" mx={4} boxShadow="lg">
        <Box px={6} pt={5} pb={6}>
          {/* Top row: step counter + close */}
          <Flex justify="space-between" align="center" mb={5}>
            <Text fontSize="xs" color="gray.400" fontWeight="medium">
              Step {step + 1} of {STEPS.length}
            </Text>
            <CloseButton size="sm" color="gray.400" onClick={dismiss} />
          </Flex>

          {/* Step dots */}
          <HStack spacing={1.5} mb={6}>
            {STEPS.map((_, i) => (
              <Box
                key={i}
                h="3px"
                flex={1}
                borderRadius="full"
                bg={i <= step ? 'teal.500' : 'gray.200'}
                transition="background 0.2s"
              />
            ))}
          </HStack>

          {/* Icon + title */}
          <Flex align="center" gap={3} mb={3}>
            <Flex
              align="center"
              justify="center"
              w={9}
              h={9}
              borderRadius="md"
              bg="teal.50"
              flexShrink={0}
            >
              <Icon as={current.icon} boxSize={4} color="teal.600" />
            </Flex>
            <Heading size="sm" color="gray.800" fontWeight="semibold">
              {current.title}
            </Heading>
          </Flex>

          {/* Description */}
          <Text color="gray.500" fontSize="sm" lineHeight="1.6" mb={6} pl="48px">
            {current.description}
          </Text>

          {/* Actions */}
          <Flex justify="space-between" align="center">
            <Button
              size="sm"
              variant="ghost"
              color="gray.400"
              fontWeight="normal"
              _hover={{ color: 'gray.600' }}
              onClick={step > 0 ? () => setStep(s => s - 1) : dismiss}
              px={0}
            >
              {step > 0 ? 'Back' : 'Skip setup'}
            </Button>

            <HStack spacing={2}>
              {step < STEPS.length - 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  color="gray.400"
                  fontWeight="normal"
                  _hover={{ color: 'gray.600' }}
                  onClick={() => setStep(s => s + 1)}
                >
                  Skip
                </Button>
              )}
              <Button size="sm" colorScheme="teal" onClick={handleCta}>
                {current.cta}
              </Button>
            </HStack>
          </Flex>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default OnboardingWizard;
