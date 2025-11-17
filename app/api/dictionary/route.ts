import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);

    const result = await query(
      'SELECT id, keyword, spelling, created_at, updated_at FROM dictionary WHERE user_id = $1 ORDER BY keyword ASC',
      [userId]
    );

    return NextResponse.json({
      success: true,
      entries: result.rows.map((row) => ({
        id: row.id,
        keyword: row.keyword,
        spelling: row.spelling,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching dictionary entries:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred while fetching dictionary entries',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const body = await request.json();
    const { keyword, spelling } = body;

    if (!keyword || !spelling) {
      return NextResponse.json(
        { success: false, error: 'Keyword and spelling are required' },
        { status: 400 }
      );
    }

    if (keyword.trim().length === 0 || spelling.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keyword and spelling cannot be empty' },
        { status: 400 }
      );
    }

    if (keyword.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Keyword must be 255 characters or less' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO dictionary (user_id, keyword, spelling) VALUES ($1, $2, $3) RETURNING id, keyword, spelling, created_at, updated_at',
      [userId, keyword.trim(), spelling.trim()]
    );

    return NextResponse.json({
      success: true,
      entry: result.rows[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating dictionary entry:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { success: false, error: 'A dictionary entry with this keyword already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred while creating dictionary entry',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const body = await request.json();
    const { id, keyword, spelling } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    if (!keyword || !spelling) {
      return NextResponse.json(
        { success: false, error: 'Keyword and spelling are required' },
        { status: 400 }
      );
    }

    if (keyword.trim().length === 0 || spelling.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keyword and spelling cannot be empty' },
        { status: 400 }
      );
    }

    if (keyword.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Keyword must be 255 characters or less' },
        { status: 400 }
      );
    }

    const checkResult = await query(
      'SELECT user_id FROM dictionary WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dictionary entry not found' },
        { status: 404 }
      );
    }

    if (checkResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const result = await query(
      'UPDATE dictionary SET keyword = $1, spelling = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING id, keyword, spelling, created_at, updated_at',
      [keyword.trim(), spelling.trim(), id, userId]
    );

    return NextResponse.json({
      success: true,
      entry: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating dictionary entry:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { success: false, error: 'A dictionary entry with this keyword already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred while updating dictionary entry',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const checkResult = await query(
      'SELECT user_id FROM dictionary WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dictionary entry not found' },
        { status: 404 }
      );
    }

    if (checkResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await query(
      'DELETE FROM dictionary WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Dictionary entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting dictionary entry:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred while deleting dictionary entry',
      },
      { status: 500 }
    );
  }
}

