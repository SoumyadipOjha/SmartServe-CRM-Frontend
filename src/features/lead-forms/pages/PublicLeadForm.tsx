import React, { useEffect, useState } from 'react';
import {
  Box, Button, Flex, FormControl, FormLabel, Heading, Input, Spinner, Text,
  Textarea, VStack, useColorModeValue, useToast, Badge,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import LeadFormService, { LeadFormField } from '../services/lead-form.service';

interface PublicFormDef {
  name:          string;
  fields:        LeadFormField[];
  submitMessage: string;
}

function FieldInput({ field, value, onChange }: {
  field:    LeadFormField;
  value:    string;
  onChange: (val: string) => void;
}) {
  const props = {
    id:       field.fieldKey,
    value:    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    isRequired: field.required,
  };
  if (field.fieldType === 'textarea') return <Textarea {...props} rows={4} />;
  return (
    <Input
      {...props}
      type={field.fieldType === 'email' ? 'email' : field.fieldType === 'phone' ? 'tel' : 'text'}
    />
  );
}

const PublicLeadForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [formDef,    setFormDef]    = useState<PublicFormDef | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [values,     setValues]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const cardBg = useColorModeValue('white', 'gray.800');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const toast  = useToast();

  useEffect(() => {
    if (!token) return;
    LeadFormService.getPublicForm(token)
      .then(def => {
        setFormDef(def);
        const init: Record<string, string> = {};
        def.fields.forEach(f => { init[f.fieldKey] = ''; });
        setValues(init);
      })
      .catch(() => setError('This form is not available.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validate required fields
    const missing = formDef?.fields.filter(f => f.required && !values[f.fieldKey]?.trim());
    if (missing?.length) {
      toast({ title: `Please fill in: ${missing.map(f => f.label).join(', ')}`, status: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await LeadFormService.submitForm(token, values);
      setSubmitted(true);
    } catch {
      toast({ title: 'Submission failed. Please try again.', status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex minH="100vh" bg={pageBg} align="center" justify="center" p={4}>
      <Box w="100%" maxW="520px">
        {/* Branding */}
        <Text textAlign="center" fontSize="sm" color="teal.500" fontWeight="bold" mb={6} letterSpacing="wide">
          ⚡ Powered by Flayx
        </Text>

        <Box bg={cardBg} borderRadius="2xl" shadow="lg" p={[6, 8]}>
          {loading && (
            <Flex justify="center" py={10}><Spinner size="xl" color="teal.400" /></Flex>
          )}

          {!loading && error && (
            <Flex direction="column" align="center" py={10} gap={3}>
              <Text fontSize="3xl">😕</Text>
              <Text color="gray.500">{error}</Text>
            </Flex>
          )}

          {!loading && !error && submitted && (
            <Flex direction="column" align="center" py={10} gap={3}>
              <Text fontSize="4xl">✅</Text>
              <Heading size="md" textAlign="center">{formDef?.submitMessage}</Heading>
            </Flex>
          )}

          {!loading && !error && !submitted && formDef && (
            <>
              <Heading size="lg" mb={1}>{formDef.name}</Heading>
              <Text fontSize="sm" color="gray.500" mb={6}>
                Fill in the form below and we'll get back to you.
              </Text>
              <form onSubmit={handleSubmit}>
                <VStack align="stretch" spacing={4}>
                  {formDef.fields.map(field => (
                    <FormControl key={field.fieldKey} isRequired={field.required}>
                      <FormLabel fontSize="sm">
                        {field.label}
                        {field.required && <Badge ml={1} colorScheme="red" fontSize="0.6em">Required</Badge>}
                      </FormLabel>
                      <FieldInput
                        field={field}
                        value={values[field.fieldKey] || ''}
                        onChange={val => setValues(prev => ({ ...prev, [field.fieldKey]: val }))}
                      />
                    </FormControl>
                  ))}
                  <Button
                    type="submit"
                    colorScheme="teal"
                    size="lg"
                    isLoading={submitting}
                    loadingText="Submitting..."
                    mt={2}
                  >
                    Submit
                  </Button>
                </VStack>
              </form>
            </>
          )}
        </Box>
      </Box>
    </Flex>
  );
};

export default PublicLeadForm;
