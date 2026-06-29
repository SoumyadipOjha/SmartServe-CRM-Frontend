import React, { useState, useEffect } from 'react';
import { Box, Button, CloseButton, Flex, HStack, Text } from '@chakra-ui/react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from '../context/AuthContext';

const DISMISSED_KEY = (userId: string) => `smartserve_push_dismissed_${userId}`;

const PushNotificationBanner: React.FC = () => {
  const { currentUser } = useAuth();
  const { permission, isSubscribed, isLoading, isSupported, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true); // start hidden until check

  useEffect(() => {
    if (!currentUser?._id) return;
    const wasDismissed = localStorage.getItem(DISMISSED_KEY(currentUser._id));
    setDismissed(!!wasDismissed);
  }, [currentUser]);

  const handleDismiss = () => {
    if (currentUser?._id) {
      localStorage.setItem(DISMISSED_KEY(currentUser._id), '1');
    }
    setDismissed(true);
  };

  const handleEnable = async () => {
    await subscribe();
    handleDismiss();
  };

  if (
    !isSupported ||
    dismissed ||
    isSubscribed ||
    permission === 'granted' ||
    permission === 'denied' ||
    permission === 'unsupported'
  ) {
    return null;
  }

  return (
    <Box
      bg="teal.600"
      color="white"
      px={{ base: 4, md: 6 }}
      py={2}
      position="sticky"
      top={0}
      zIndex={99}
    >
      <Flex align="center" justify="space-between" maxW="1200px" mx="auto" flexWrap="wrap" gap={2}>
        <HStack spacing={2}>
          <Text fontSize="xl">🔔</Text>
          <Text fontSize="sm" fontWeight="medium">
            Enable push notifications to get task reminders directly in your browser.
          </Text>
        </HStack>
        <HStack spacing={2}>
          <Button
            size="xs"
            colorScheme="whiteAlpha"
            variant="solid"
            isLoading={isLoading}
            onClick={handleEnable}
          >
            Enable
          </Button>
          <CloseButton size="sm" onClick={handleDismiss} />
        </HStack>
      </Flex>
    </Box>
  );
};

export default PushNotificationBanner;
