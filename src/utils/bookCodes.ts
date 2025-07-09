// Sample book codes for testing
export const SAMPLE_BOOK_CODES = [
  'WGW-SAMPLE-001',
  'WGW-SAMPLE-002', 
  'WGW-SAMPLE-003',
  'GOING-WELL-TEST',
  'GRATITUDE-2024',
  'BELL-METHOD-01',
  'DEMO-CODE-123'
];

export const validateBookCode = (code: string): boolean => {
  // In production, this would check against a real database
  // For now, accept any of the sample codes
  return SAMPLE_BOOK_CODES.includes(code.toUpperCase());
};

export const getBookCodeInfo = (code: string) => {
  if (validateBookCode(code)) {
    return {
      isValid: true,
      subscriptionTier: 'free_trial' as const,
      trialDays: 30
    };
  }
  return {
    isValid: false,
    subscriptionTier: null,
    trialDays: 0
  };
};