import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/register/route';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

describe('User Registration API', () => {
  const testUser = {
    email: 'register-test@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
  };

  beforeEach(async () => {
    await query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  afterEach(async () => {
    await query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  it('should register a new user successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe(testUser.email);
    expect(data.user.name).toBe(testUser.name);
    expect(data.user.password_hash).toBeUndefined();
    expect(data.user.id).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    const request1 = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(request1);

    const request2 = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request2);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('email');
  });

  it('should reject missing email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        password: testUser.password,
        name: testUser.name,
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
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: testUser.password,
        name: testUser.name,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('email');
  });

  it('should reject weak password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: 'weak',
        name: testUser.name,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('password');
  });

  it('should reject missing name', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
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

  it('should hash password before storing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(request);

    const result = await query('SELECT password_hash FROM users WHERE email = $1', [testUser.email]);
    const storedHash = result.rows[0].password_hash;

    expect(storedHash).toBeDefined();
    expect(storedHash).not.toBe(testUser.password);
    expect(storedHash.length).toBeGreaterThan(0);
  });
});

