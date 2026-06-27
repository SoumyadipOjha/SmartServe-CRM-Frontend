import React, { useRef } from 'react';
import { 
  Button, 
  Icon, 
  useToast, 
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';
import * as XLSX from 'xlsx';

interface BulkUploadButtonProps {
  onUploadSuccess: () => void;
}

const BulkUploadButton: React.FC<BulkUploadButtonProps> = ({ onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const data = await readExcelFile(file);
        
        // Basic validation before upload
        const invalidRows = data.filter(row => !row.name || !row.email);
        if (invalidRows.length > 0) {
            toast({
                title: 'Validation Error',
                description: `${invalidRows.length} rows are missing required fields (name or email)`,
                status: 'error',
                duration: 5000,
            });
            return;
        }

        const response = await uploadCustomers(data);

        toast({
            title: 'Upload Successful',
            description: `${response.count} customers imported successfully`,
            status: 'success',
            duration: 5000,
        });

        onUploadSuccess();
        onClose();
        
    } catch (error) {
        toast({
            title: 'Upload Failed',
            description: error instanceof Error ? error.message : 'Unknown error occurred',
            status: 'error',
            duration: 5000,
        });
    }
};
  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Failed to parse Excel file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const uploadCustomers = async (data: any[]): Promise<{ count: number }> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/customers/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ customers: data }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload customers');
    }

    return response.json();
  };

  return (
    <>
      <Button
        leftIcon={<Icon as={FiUpload} />}
        colorScheme="pink"
        onClick={onOpen}
      >
        Bulk Upload
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Customer Data</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              onChange={handleFileUpload}
              display="none"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              width="100%"
              height="100px"
              border="2px dashed"
              borderColor="gray.300"
              _hover={{ borderColor: 'pink.500' }}
            >
              Click to select Excel file
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default BulkUploadButton;