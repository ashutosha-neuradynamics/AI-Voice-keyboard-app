import { hashPassword, verifyPassword, validateEmail, validatePasswordStrength } from '@/lib/auth';

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should verify a correct password', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const password = 'TestPassword123!';
    const wrongPassword = 'WrongPassword123!';
    const hash = await hashPassword(password);
    
    const isValid = await verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  it('should produce different hashes for the same password', async () => {
    const password = 'TestPassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    
    expect(hash1).not.toBe(hash2);
    
    const isValid1 = await verifyPassword(password, hash1);
    const isValid2 = await verifyPassword(password, hash2);
    
    expect(isValid1).toBe(true);
    expect(isValid2).toBe(true);
  });
});

describe('Email Validation', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@example.co.uk')).toBe(true);
    expect(validateEmail('user+tag@example.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user@example')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});

describe('Password Strength Validation', () => {
  it('should accept strong passwords', () => {
    expect(validatePasswordStrength('StrongPass123!')).toBe(true);
    expect(validatePasswordStrength('MyP@ssw0rd')).toBe(true);
    expect(validatePasswordStrength('Test1234!@#$')).toBe(true);
  });

  it('should reject passwords that are too short', () => {
    expect(validatePasswordStrength('Short1!')).toBe(false);
    expect(validatePasswordStrength('Abc1!')).toBe(false);
  });

  it('should reject passwords without uppercase letters', () => {
    expect(validatePasswordStrength('lowercase123!')).toBe(false);
  });

  it('should reject passwords without lowercase letters', () => {
    expect(validatePasswordStrength('UPPERCASE123!')).toBe(false);
  });

  it('should reject passwords without numbers', () => {
    expect(validatePasswordStrength('NoNumbers!')).toBe(false);
  });

  it('should reject empty passwords', () => {
    expect(validatePasswordStrength('')).toBe(false);
  });
});

