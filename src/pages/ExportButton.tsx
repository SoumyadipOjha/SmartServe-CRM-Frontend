import React from 'react';
import { Button } from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';
import { Customer, Order } from '../types/models';

interface ExportButtonProps {
  customers: Customer[];
}

// This function formats orders for export (can be used elsewhere)
export const formatOrdersForExport = (orders: Order[]) => {
  const headers = [
    'Order ID',
    'Customer Name',
    'Date',
    'Amount',
    'Status',
    'Items'
  ];

  const rows = orders.map(order => [
    order._id,
    typeof order.customer === 'object' ? order.customer.name : 'Unknown Customer',
    new Date(order.orderDate).toLocaleDateString(),
    `$${order.amount.toFixed(2)}`,
    order.status,
    Array.isArray(order.products)
      ? order.products.map(item => `${item.name} (${item.quantity})`).join('; ')
      : ''
  ]);

  return [headers, ...rows];
};

// Customer export button
const ExportButton: React.FC<ExportButtonProps> = ({ customers }) => {
  const handleExport = () => {
    try {
      const headers = ['Name', 'Email', 'Phone', 'Total Spend', 'Visits', 'Last Activity'];
      const csvRows = [headers];

      customers.forEach(customer => {
        const row = [
          customer.name,
          customer.email,
          customer.phone || '',
          customer.totalSpend.toString(),
          customer.visits.toString(),
          new Date(customer.lastActivity).toLocaleDateString()
        ];
        csvRows.push(row);
      });

      const csvContent = csvRows
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `customers-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };


  

  return (
    <Button
      leftIcon={<FiDownload />}
      onClick={handleExport}
      colorScheme="blue"
    >
      Export Customers
    </Button>
  );
};

export default ExportButton;
