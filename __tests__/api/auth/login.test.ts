import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

describe('User Login API', () => {
  const testUser = {
    email: 'login-test@example.com',
    password: 'TestPassword123!',
    name: 'Login Test User',
  };

  beforeAll(async () => {
    await query('DELETE FROM users WHERE email = $1', [testUser.email]);
    const passwordHash = await hashPassword(testUser.password);
    await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)',
      [testUser.email, passwordHash, testUser.name]
    );
  });

  afterAll(async () => {
    await query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  it('should login with correct credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
    expect(data.user.name).toBe(testUser.name);
    expect(data.user.id).toBeDefined();
  });

  it('should reject incorrect password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: 'WrongPassword123!',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid');
  });

  it('should reject non-existent user', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid');
  });

  it('should reject missing email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        password: testUser.password,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should reject missing password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should reject invalid email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: testUser.password,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('email');
  });
});

