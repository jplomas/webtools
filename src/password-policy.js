// Password policy for the encrypted (v3) wallet export.
//
// The password here is the only thing standing between a lost or stolen
// wallet.json and the funds it controls, so the estimator's verdict has to be
// enforced, not merely displayed. `MINIMUM_PASSWORD_SCORE` is what connects
// the two: score 1 is the estimator's rejection band, and `validatePassword`
// refuses it.

// Common passwords to reject (lowercase for comparison).
export const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'password1234',
  'qwerty', 'qwerty123', 'qwertyuiop', 'qwerty1234',
  'letmein', 'welcome', 'welcome1', 'welcome123',
  'admin', 'admin123', 'administrator', 'login',
  'master', 'master123', 'root', 'toor',
  'dragon', 'monkey', 'shadow', 'sunshine', 'princess',
  'football', 'baseball', 'soccer', 'hockey',
  'superman', 'batman', 'trustno1', 'passw0rd',
  'iloveyou', 'secret', 'access', 'mustang',
  'michael', 'jennifer', 'thomas', 'charlie', 'andrew',
  'abcdef', 'abcdefg', 'abcdefgh', 'abcd1234',
  'abc123', 'abc1234', '1234abcd', 'pass1234',
  '12345678', '123456789', '1234567890', '87654321',
  '11111111', '00000000', '12341234', '11223344',
  'internet', 'computer', 'whatever', 'changeme',
]);

export const KEYBOARD_PATTERNS = [
  'qwerty', 'qwertz', 'azerty', 'asdfgh', 'zxcvbn',
  'qazwsx', '1qaz2wsx', 'qaswed', 'ytrewq', 'rewq',
  '123456', '654321', '987654', '456789', '567890',
];

export const MINIMUM_PASSWORD_LENGTH = 8;

// Lowest score `validatePassword` accepts. `estimatePasswordStrength` returns 0
// only for inputs already rejected on length, so a threshold of 1 would accept
// everything the estimator can flag.
export const MINIMUM_PASSWORD_SCORE = 2;

// A keyboard walk only makes a password weak when it *is* most of the password.
// Matching anywhere would reject a strong 20-character passphrase that merely
// contains "123456", so require the pattern to start the password or to cover
// at least half of it.
const KEYBOARD_PATTERN_COVERAGE = 0.5;

export function hasKeyboardPattern(password) {
  const lower = password.toLowerCase();
  return KEYBOARD_PATTERNS.some((pattern) => {
    const index = lower.indexOf(pattern);
    if (index === -1) return false;
    return index === 0 || pattern.length / lower.length >= KEYBOARD_PATTERN_COVERAGE;
  });
}

export function hasRepeatingPattern(password) {
  const len = password.length;
  for (let patternLen = 2; patternLen <= len / 2; patternLen += 1) {
    const pattern = password.slice(0, patternLen);
    if (pattern.repeat(Math.ceil(len / patternLen)).slice(0, len) === password) return true;
  }
  return /^(.)\1+$/.test(password);
}

// Returns { score: 0-3, feedback }. Score 0 means "too short or absent",
// 1 means "rejected", 2 and 3 are accepted.
export function estimatePasswordStrength(password) {
  if (!password) return { score: 0, feedback: 'Password is required' };

  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    return { score: 0, feedback: `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters` };
  }

  // Common passwords, ignoring trailing digits and symbols so that
  // "password123" is caught by the "password" entry.
  const lowerPassword = password.toLowerCase();
  const baseWord = lowerPassword.replace(/[0-9!@#$%^&*()]+$/g, '');
  if (COMMON_PASSWORDS.has(lowerPassword) || COMMON_PASSWORDS.has(baseWord)) {
    return { score: 1, feedback: 'This is a commonly used password' };
  }

  if (hasKeyboardPattern(password)) {
    return { score: 1, feedback: 'Avoid keyboard patterns' };
  }

  if (hasRepeatingPattern(password)) {
    return { score: 1, feedback: 'Avoid repeating patterns' };
  }

  const missing = [];
  if (!/[a-z]/.test(password)) missing.push('lowercase');
  if (!/[A-Z]/.test(password)) missing.push('uppercase');
  if (!/[0-9]/.test(password) && !/[^A-Za-z0-9]/.test(password)) missing.push('numbers or symbols');

  if (missing.length >= 2) return { score: 1, feedback: `Add ${missing.join(', ')}` };
  if (missing.length === 1) return { score: 2, feedback: `Add ${missing.join(', ')}` };
  if (password.length < 12) return { score: 2, feedback: 'Consider a longer password' };
  return { score: 3, feedback: 'Strong password' };
}

// Decides whether the encrypted-save control is enabled. Returns the strength
// alongside the verdict so the caller renders the same reason it enforced.
export function validatePassword(password, passwordConfirm) {
  const strength = estimatePasswordStrength(password);

  if (!password.length) {
    return { validated: false, error: 'A password is required', strength };
  }
  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    return { validated: false, error: strength.feedback, strength };
  }
  if (strength.score < MINIMUM_PASSWORD_SCORE) {
    return { validated: false, error: strength.feedback, strength };
  }
  if (password !== passwordConfirm) {
    return { validated: false, error: 'Passwords must match', strength };
  }
  return { validated: true, error: '', strength };
}

