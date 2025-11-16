import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

export function validateEmail(email: string): boolean {
  if (!email || email.length === 0) {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePasswordStrength(password: string): boolean {
  if (!password || password.length < 8) {
    return false;
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasUpperCase && hasLowerCase && hasNumber;
}

export function validateName(name: string): boolean {
  if (!name || name.trim().length === 0) {
    return false;
  }
  if (name.trim().length < 2) {
    return false;
  }
  if (name.length > 255) {
    return false;
  }
  return true;
}

