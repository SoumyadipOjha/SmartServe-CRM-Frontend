import React from 'react';
import { Button, Flex, HStack, IconButton, Text } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

const Pagination: React.FC<Props> = ({ page, totalPages, totalItems, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pageNums: number[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pageNums.push(i);
  } else {
    let lo = Math.max(1, page - 2);
    const hi = Math.min(totalPages, lo + 4);
    lo = Math.max(1, hi - 4);
    for (let i = lo; i <= hi; i++) pageNums.push(i);
  }

  return (
    <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={2}>
      <Text fontSize="sm" color="gray.500">
        Showing {start}–{end} of {totalItems}
      </Text>
      <HStack spacing={1}>
        <IconButton
          aria-label="Previous page"
          icon={<ChevronLeftIcon />}
          size="sm"
          isDisabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        />
        {pageNums.map(p => (
          <Button
            key={p}
            size="sm"
            colorScheme={p === page ? 'teal' : 'gray'}
            variant={p === page ? 'solid' : 'ghost'}
            onClick={() => onPageChange(p)}
            minW="8"
          >
            {p}
          </Button>
        ))}
        <IconButton
          aria-label="Next page"
          icon={<ChevronRightIcon />}
          size="sm"
          isDisabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </HStack>
    </Flex>
  );
};

export default Pagination;
