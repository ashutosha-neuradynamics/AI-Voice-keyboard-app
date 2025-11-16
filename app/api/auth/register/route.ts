import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, validateEmail, validatePasswordStrength, validateName } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email, password, and name are required',
        },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    if (!validatePasswordStrength(password)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters',
        },
        { status: 400 }
      );
    }

    if (!validateName(name)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name must be between 2 and 255 characters',
        },
        { status: 400 }
      );
    }

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists',
        },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, passwordHash, name.trim()]
    );

    const user = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during registration',
      },
      { status: 500 }
    );
  }
}

