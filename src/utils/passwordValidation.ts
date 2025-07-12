export interface PasswordStrength {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  feedback: string[];
  requirements: PasswordRequirement[];
}

export interface PasswordRequirement {
  label: string;
  met: boolean;
  optional?: boolean;
}

// Common weak passwords to check against
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'letmein',
  'welcome', 'monkey', '111111', 'password123', 'admin', 'login',
  'welcome123', 'guest', 'master', 'hello', 'hello123', '123123'
];

// Patterns that make passwords predictable
const KEYBOARD_PATTERNS = [
  'qwerty', 'asdfgh', 'zxcvbn', 'qazwsx', '123456', '098765',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
];

export function validatePassword(password: string): PasswordStrength {
  const requirements: PasswordRequirement[] = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8,
      optional: false
    },
    {
      label: 'Contains uppercase letter',
      met: /[A-Z]/.test(password),
      optional: false
    },
    {
      label: 'Contains lowercase letter',
      met: /[a-z]/.test(password),
      optional: false
    },
    {
      label: 'Contains number',
      met: /\d/.test(password),
      optional: false
    },
    {
      label: 'Contains special character (!@#$%^&*)',
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      optional: true
    }
  ];

  const feedback: string[] = [];
  let score = 0;

  // Check length
  if (password.length === 0) {
    return {
      score: 0,
      label: 'Very Weak',
      color: '#FF3B30',
      feedback: ['Password is required'],
      requirements
    };
  }

  if (password.length < 6) {
    feedback.push('Password is too short');
  } else if (password.length < 8) {
    feedback.push('Password should be at least 8 characters');
    score += 0.5;
  } else if (password.length < 12) {
    score += 1;
  } else {
    score += 1.5;
  }

  // Check character variety
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUppercase) feedback.push('Add uppercase letters');
  if (!hasLowercase) feedback.push('Add lowercase letters');
  if (!hasNumbers) feedback.push('Add numbers');

  // Calculate variety score
  const varietyCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  score += varietyCount * 0.5;

  // Check for common passwords
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.includes(lowerPassword)) {
    score = Math.min(score, 1);
    feedback.push('This is a commonly used password');
  }

  // Check for keyboard patterns
  for (const pattern of KEYBOARD_PATTERNS) {
    if (lowerPassword.includes(pattern)) {
      score = Math.min(score, 1.5);
      feedback.push('Avoid keyboard patterns');
      break;
    }
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    feedback.push('Avoid repeated characters');
  }

  // Check for sequential characters
  if (hasSequentialChars(password)) {
    score -= 0.5;
    feedback.push('Avoid sequential characters');
  }

  // Bonus for mixing character types well
  if (varietyCount >= 3 && password.length >= 10) {
    score += 0.5;
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(4, score));

  // Determine strength label and color
  let label: PasswordStrength['label'];
  let color: string;

  if (score < 1) {
    label = 'Very Weak';
    color = '#FF3B30'; // Red
  } else if (score < 2) {
    label = 'Weak';
    color = '#FF9500'; // Orange
  } else if (score < 3) {
    label = 'Fair';
    color = '#FFCC00'; // Yellow
  } else if (score < 3.5) {
    label = 'Good';
    color = '#34C759'; // Green
  } else {
    label = 'Strong';
    color = '#00C851'; // Dark Green
  }

  // Add positive feedback for strong passwords
  if (score >= 3) {
    if (feedback.length === 0) {
      feedback.push('Great password!');
    }
  }

  return {
    score,
    label,
    color,
    feedback,
    requirements
  };
}

function hasSequentialChars(password: string): boolean {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789'
  ];

  const lowerPassword = password.toLowerCase();
  
  for (const seq of sequences) {
    for (let i = 0; i < lowerPassword.length - 2; i++) {
      const substring = lowerPassword.substring(i, i + 3);
      if (seq.includes(substring)) {
        return true;
      }
    }
  }
  
  return false;
}

export function generatePasswordSuggestion(): string {
  const adjectives = ['Swift', 'Bright', 'Cosmic', 'Crystal', 'Mystic', 'Thunder'];
  const nouns = ['Phoenix', 'Dragon', 'Falcon', 'Tiger', 'Eagle', 'Wolf'];
  const numbers = Math.floor(Math.random() * 900) + 100;
  const specialChars = ['!', '@', '#', '$', '*'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const special = specialChars[Math.floor(Math.random() * specialChars.length)];
  
  return `${adjective}${noun}${numbers}${special}`;
}

export function getPasswordRequirementsText(): string {
  return `Password must:
• Be at least 8 characters long
• Contain uppercase and lowercase letters
• Contain at least one number
• Avoid common passwords and patterns
• Special characters recommended (!@#$%^&*)`;
}