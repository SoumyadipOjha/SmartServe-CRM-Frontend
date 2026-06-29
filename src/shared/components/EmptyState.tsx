import React from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, ctaLabel, onCta }) => (
  <Flex
    direction="column"
    align="center"
    justify="center"
    py={16}
    px={6}
  >
    <Box
      borderWidth={2}
      borderStyle="dashed"
      borderColor="gray.200"
      borderRadius="2xl"
      px={12}
      py={10}
      textAlign="center"
      maxW="360px"
      w="full"
    >
      <Text fontSize="3xl" mb={3}>{icon}</Text>
      <Text fontWeight="semibold" fontSize="md" color="gray.700" mb={1}>{title}</Text>
      <Text fontSize="sm" color="gray.400" mb={ctaLabel ? 5 : 0}>{description}</Text>
      {ctaLabel && onCta && (
        <Button colorScheme="teal" size="sm" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </Box>
  </Flex>
);

export default EmptyState;
