import assert from 'node:assert/strict';
import test from 'node:test';
import {
  estimatePasswordStrength,
  validatePassword,
  hasKeyboardPattern,
  COMMON_PASSWORDS,
  MINIMUM_PASSWORD_SCORE,
} from '../src/password-policy.js';

// The 2026-08 review found that the gate compared against a score the
// estimator could never return, so `password` was accepted while the UI
// displayed "This is a commonly used password" in red beside an enabled Save
// button. These tests assert both directions of the gate.

const REJECTED = [
  'password',
  'password123',
  'password1234',
  'qwerty123',
  '12345678',
  '00000000',
  'iloveyou',
  'trustno1',
  'abc1234', // was 'a]bc1234' — a typo meant the intended entry was unblocked
  'letmein1',
  'aaaaaaaa', // repeating character
  'abcabcab', // repeating sequence
  'qwertyui', // keyboard walk
  'zxcvbnm1',
  'alllowercase', // missing uppercase AND numbers/symbols
  'ALLUPPERCASE',
];

for (const password of REJECTED) {
  test(`rejects ${JSON.stringify(password)}`, () => {
    const { validated, error } = validatePassword(password, password);
    assert.equal(validated, false, `${JSON.stringify(password)} was ACCEPTED`);
    assert.ok(error.length > 0, 'a rejection must carry a reason');
  });
}

const ACCEPTED = [
  'Tr0ub4dor&3',
  'Xk7#mQp2Lv9w',
  'CorrectHorse9Battery',
  'MyWallet2026!Secure',
];

for (const password of ACCEPTED) {
  test(`accepts ${JSON.stringify(password)}`, () => {
    const { validated } = validatePassword(password, password);
    assert.equal(validated, true, `${JSON.stringify(password)} was REJECTED`);
  });
}

test('the gate threshold is above the estimator rejection band', () => {
  // Guards the original defect directly: if MINIMUM_PASSWORD_SCORE drops to 1,
  // every weak-password verdict the estimator can produce becomes acceptable.
  assert.ok(MINIMUM_PASSWORD_SCORE >= 2);
  assert.equal(estimatePasswordStrength('password').score, 1);
  assert.ok(estimatePasswordStrength('password').score < MINIMUM_PASSWORD_SCORE);
});

test('every entry in the common-password list is actually rejected', () => {
  // A typo in the list means the intended password is not blocked. Only
  // entries of at least the minimum length are gated here; shorter ones are
  // already refused on length.
  for (const entry of COMMON_PASSWORDS) {
    if (entry.length < 8) continue;
    const { validated } = validatePassword(entry, entry);
    assert.equal(validated, false, `common password ${JSON.stringify(entry)} was accepted`);
  }
});

test('the common-password list has no duplicates', () => {
  // A Set silently swallows duplicates, so assert on size rather than trusting
  // the literal — a duplicate displaces an entry someone meant to add.
  assert.equal(COMMON_PASSWORDS.size, new Set([...COMMON_PASSWORDS]).size);
  assert.ok(COMMON_PASSWORDS.size >= 55);
});

test('a keyboard walk only counts when it is most of the password', () => {
  // Matching anywhere would reject strong passphrases; the fix must not swing
  // the other way and start refusing them.
  assert.equal(hasKeyboardPattern('qwertyui'), true, 'walk at the start must count');
  assert.equal(hasKeyboardPattern('123456ab'), true, 'walk at the start must count');
  assert.equal(
    hasKeyboardPattern('Vault123456Anchor!Deep'),
    false,
    'an incidental substring in a long passphrase must not count',
  );
  assert.equal(validatePassword('Vault123456Anchor!Deep', 'Vault123456Anchor!Deep').validated, true);
});

test('mismatched confirmation is refused', () => {
  const { validated, error } = validatePassword('Tr0ub4dor&3', 'Tr0ub4dor&4');
  assert.equal(validated, false);
  assert.equal(error, 'Passwords must match');
});

test('short and empty passwords are refused on length', () => {
  assert.equal(validatePassword('', '').validated, false);
  assert.equal(validatePassword('Ab1!', 'Ab1!').validated, false);
  assert.equal(estimatePasswordStrength('Ab1!').score, 0);
});

test('the rejection reason shown is the reason enforced', () => {
  const { error, strength } = validatePassword('password', 'password');
  assert.equal(error, strength.feedback);
  assert.equal(error, 'This is a commonly used password');
});

